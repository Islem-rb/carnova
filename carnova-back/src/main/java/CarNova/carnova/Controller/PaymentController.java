package CarNova.carnova.Controller;

import CarNova.carnova.Service.PaymentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/payments")
public class PaymentController {

    @Autowired
    private PaymentService paymentService;

    @PostMapping("/create-payment-intent")
    public ResponseEntity<?> createPaymentIntent(Authentication auth, @RequestBody Map<String, Double> body) {
        try {
            String email = auth.getName();
            double amount = body.get("amount");
            System.out.println("📩 Création paiement pour : " + email + " | Montant : " + amount);
            String clientSecret = paymentService.createPaymentIntent(email, amount);
            return ResponseEntity.ok(Map.of("clientSecret", clientSecret));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }







    @PostMapping("/confirm")
    public ResponseEntity<?> confirmPayment(@RequestBody Map<String, String> body) {
        String paymentIntentId = body.get("paymentIntentId");
        paymentService.confirmPayment(paymentIntentId);
        return ResponseEntity.ok(Map.of("message", "Paiement confirmé"));
    }
}