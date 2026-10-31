package CarNova.carnova.Repository;

import CarNova.carnova.Entity.Payment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PaymentRepository extends JpaRepository<Payment, Long> {
    Optional<Payment> findByStripePaymentIntentId(String paymentIntentId);
    List<Payment> findByEmailAndStatus(String email, String status);
}