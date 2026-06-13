package CarNova.carnova.Entity;

import jakarta.persistence.*;
import lombok.*;
import java.util.List;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "showrooms")
public class Showroom {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String nom;
    private String description;

    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user;

    @OneToMany(cascade = CascadeType.ALL)
    @JoinColumn(name = "showroom_id")
    private List<Vehicule> voitures;

    // ✅ FIX : permet de stocker des base64 longs
    @ElementCollection
    @CollectionTable(name = "showroom_images", joinColumns = @JoinColumn(name = "showroom_id"))
    @Column(name = "image_data", columnDefinition = "TEXT")
    private List<String> images;
}