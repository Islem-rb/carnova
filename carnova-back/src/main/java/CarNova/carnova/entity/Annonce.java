package CarNova.carnova.entity;
import jakarta.persistence.*;
@Entity
@Table(name="annonces")
public class Annonce {
 @Id @GeneratedValue(strategy=GenerationType.IDENTITY) public Long id;
 public String titre;
 @Column(length=4000) public String description;
 public String typeAnnonce="VENTE"; public String statut="DISPONIBLE";
 public String imageUrl; public String model3dUrl;
 @ManyToOne(fetch=FetchType.LAZY) @JoinColumn(name="user_id") public User user;
 @OneToOne(fetch=FetchType.LAZY) @JoinColumn(name="payment_id") public Payment payment;
 public String marque; public String modele; public Integer annee;
 public java.math.BigDecimal prix; public Integer kilometrage;
 public String carburant; public String boiteVitesse; public String couleur;
 public String ville; public String typeVehicule; public String telephone;
 public java.time.Instant createdAt=java.time.Instant.now();
 @ElementCollection @CollectionTable(name="annonce_images",joinColumns=@JoinColumn(name="annonce_id")) @Column(name="url")
 public java.util.List<String> images=new java.util.ArrayList<>();
}
