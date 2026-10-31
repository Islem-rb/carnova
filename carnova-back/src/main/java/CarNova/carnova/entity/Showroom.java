package CarNova.carnova.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "showrooms")
public class Showroom {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  public Long id;

  public String nom;

  @Column(length = 4000)
  public String description;

  public String ville;
  public String telephone;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "user_id")
  public User user;

  @OneToMany(cascade = CascadeType.ALL, orphanRemoval = true)
  @JoinColumn(name = "showroom_id")
  public java.util.List<Vehicule> voitures = new java.util.ArrayList<>();

  @ElementCollection
  @CollectionTable(name = "showroom_images", joinColumns = @JoinColumn(name = "showroom_id"))
  @Column(name = "image_data", columnDefinition = "text")
  public java.util.List<String> images = new java.util.ArrayList<>();
}
