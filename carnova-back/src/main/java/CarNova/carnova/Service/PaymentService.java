package CarNova.carnova.Service;

import CarNova.carnova.Entity.Payment;
import CarNova.carnova.Repository.PaymentRepository;
import com.stripe.Stripe;
import com.stripe.exception.StripeException;
import com.stripe.model.PaymentIntent;
import com.stripe.param.PaymentIntentCreateParams;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.List;


@Service
public class PaymentService {

    @Value("${stripe.secret.key}")
    private String secretKey;

    private final PaymentRepository paymentRepository;

    public PaymentService(PaymentRepository paymentRepository) {
        this.paymentRepository = paymentRepository;
    }

    @PostConstruct
    public void init() {
        Stripe.apiKey = secretKey;
    }

    public String createPaymentIntent(String email, Double amount) throws StripeException {
        PaymentIntentCreateParams params = PaymentIntentCreateParams.builder()
                .setAmount((long) (amount * 100))
                .setCurrency("eur")
                .putMetadata("email", email)
                .setAutomaticPaymentMethods(
                        PaymentIntentCreateParams.AutomaticPaymentMethods.builder()
                                .setEnabled(true)
                                .build()
                )
                .build();

        PaymentIntent paymentIntent = PaymentIntent.create(params);
        System.out.println("✅ Client secret généré : " + paymentIntent.getClientSecret());

        Payment payment = new Payment();
        payment.setStripePaymentIntentId(paymentIntent.getId());
        payment.setEmail(email);
        payment.setAmount(amount);
        payment.setCurrency("eur");
        payment.setStatus("pending");
        paymentRepository.save(payment);

        return paymentIntent.getClientSecret();
    }

    public boolean hasUserPaid(String email) {
        List<Payment> payments = paymentRepository.findByEmailAndStatus(email, "succeeded");
        return !payments.isEmpty();
    }
    public void confirmPayment(String paymentIntentId) {
        paymentRepository.findByStripePaymentIntentId(paymentIntentId).ifPresent(payment -> {
            payment.setStatus("succeeded");
            paymentRepository.save(payment);
        });
    }
}