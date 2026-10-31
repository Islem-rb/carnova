package CarNova.carnova.api;
import CarNova.carnova.service.*;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.Map;
@RestController @RequestMapping("/api/payments")
public class PaymentController {
 private final Billing billing;private final CurrentUser current;
 public PaymentController(Billing b,CurrentUser c){billing=b;current=c;}
 @GetMapping("/config") public Map<String,Object> config(){return billing.config();}
 @PostMapping("/create-payment-intent") public Map<String,Object> create(Authentication a){return billing.create(current.get(a));}
 @PostMapping("/confirm") public Map<String,String> confirm(@RequestBody Map<String,String> r,Authentication a){billing.confirm(r.getOrDefault("paymentIntentId",""),current.get(a));return Map.of("message","Paiement test confirmé.");}
}
