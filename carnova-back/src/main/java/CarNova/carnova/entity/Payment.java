package CarNova.carnova.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "payments")
public class Payment {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  public Long id;

  @Column(unique = true)
  public String stripePaymentIntentId;

  public String email;
  public Double amount;
  public String currency;
  public String status;
}
