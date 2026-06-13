package CarNova.carnova.Entity;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Data
@Table(name = "payments")
public class Payment {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true)
    private String stripePaymentIntentId;

    private String email;
    private Double amount;
    private String currency;
    private String status;
}