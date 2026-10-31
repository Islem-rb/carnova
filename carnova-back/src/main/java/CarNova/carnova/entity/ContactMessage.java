package CarNova.carnova.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "contact_messages")
public class ContactMessage {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  public Long id;

  public String name;
  public String email;

  @Column(length = 3000)
  public String message;

  public java.time.Instant createdAt = java.time.Instant.now();
}
