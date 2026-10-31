package CarNova.carnova.service;
import CarNova.carnova.entity.*;
import CarNova.carnova.repository.PaymentRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.web.client.RestClient;
import org.springframework.web.server.ResponseStatusException;
import java.util.*;
@Service @Transactional
public class Billing {
 public static final long FEE_CENTS=500;
 private final PaymentRepository repo;private final String mode,key,publicKey;private final RestClient client;
 public Billing(PaymentRepository repo,@Value("${app.payments-mode}") String mode,@Value("${app.stripe-secret}") String key,@Value("${app.stripe-public}") String publicKey){
  this.repo=repo;this.mode=mode;this.key=key;this.publicKey=publicKey;
  if(!Set.of("mock","test").contains(mode)) throw new IllegalStateException("PAYMENTS_MODE must be mock or test");
  if(mode.equals("test")&&(!key.startsWith("sk_test_")||!publicKey.startsWith("pk_test_"))) throw new IllegalStateException("Only Stripe TEST keys are accepted");
  var factory=new org.springframework.http.client.SimpleClientHttpRequestFactory();factory.setConnectTimeout(5000);factory.setReadTimeout(10000);
  client=RestClient.builder().baseUrl("https://api.stripe.com/v1").requestFactory(factory).defaultHeaders(h->h.setBasicAuth(key,"")).build();
 }
 public Map<String,Object> config(){return Map.of("mode",mode,"amount",FEE_CENTS,"currency","eur","publishableKey",publicKey);}
 public Map<String,Object> create(User user){
  var p=new Payment();p.email=user.email;p.amount=FEE_CENTS/100.0;p.currency="eur";p.status="pending";
  String secret;
  if(mode.equals("mock")){p.stripePaymentIntentId="mock_"+UUID.randomUUID();secret="mock";}
  else {
   var form=new LinkedMultiValueMap<String,String>();form.add("amount",String.valueOf(FEE_CENTS));form.add("currency","eur");form.add("metadata[email]",user.email);form.add("automatic_payment_methods[enabled]","true");
   try {var result=client.post().uri("/payment_intents").contentType(MediaType.APPLICATION_FORM_URLENCODED).body(form).retrieve().body(com.fasterxml.jackson.databind.JsonNode.class);p.stripePaymentIntentId=result.path("id").asText();secret=result.path("client_secret").asText();}catch(Exception e){throw new ResponseStatusException(HttpStatus.BAD_GATEWAY,"Stripe test est temporairement indisponible.");}
  }
  repo.save(p);return Map.of("paymentIntentId",p.stripePaymentIntentId,"clientSecret",secret,"mode",mode,"amount",FEE_CENTS);
 }
 public void confirm(String id,User user){
  var p=repo.findByStripePaymentIntentId(id).orElseThrow(()->new ResponseStatusException(HttpStatus.NOT_FOUND,"Paiement introuvable."));
  if(!p.email.equals(user.email)) throw new ResponseStatusException(HttpStatus.FORBIDDEN,"Accès refusé.");
  if(mode.equals("mock")){if(!id.startsWith("mock_")) throw new IllegalArgumentException();}
  else {
   try {var result=client.get().uri("/payment_intents/{id}",id).retrieve().body(com.fasterxml.jackson.databind.JsonNode.class);
    if(!result.path("status").asText().equals("succeeded")||result.path("amount_received").asLong()!=FEE_CENTS||!result.path("currency").asText().equals("eur")||!result.path("metadata").path("email").asText().equals(user.email)) throw new ResponseStatusException(HttpStatus.CONFLICT,"Le paiement n'est pas encore confirmé par Stripe.");
   }catch(ResponseStatusException e){throw e;}catch(Exception e){throw new ResponseStatusException(HttpStatus.BAD_GATEWAY,"Vérification Stripe indisponible.");}
  }
  p.status="succeeded";repo.save(p);
 }
 public void requirePublishing(User u){if(mode.equals("test")&&!repo.existsByEmailAndStatus(u.email,"succeeded")) throw new ResponseStatusException(HttpStatus.PAYMENT_REQUIRED,"Validez le paiement test avant de publier.");}
}
