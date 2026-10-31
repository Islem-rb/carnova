package CarNova.carnova.repository;

import CarNova.carnova.entity.Payment;

public interface PaymentRepository
    extends org.springframework.data.jpa.repository.JpaRepository<Payment, Long> {
  java.util.Optional<Payment> findByStripePaymentIntentId(String id);

  boolean existsByEmailAndStatus(String email, String status);
}
