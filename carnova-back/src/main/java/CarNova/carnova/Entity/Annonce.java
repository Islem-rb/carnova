package CarNova.carnova.Entity;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Data
@Table(name = "annonces")
public class Annonce {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String titre;
    private String description;

    @Enumerated(EnumType.STRING)
    private TypeAnnonce typeAnnonce;

    @Enumerated(EnumType.STRING)
    private StatutAnnonce statut;

    private String imageUrl;

    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user;
    private String model3dUrl;  // <-- Ajout du champ ici


    @OneToOne
    @JoinColumn(name = "payment_id")
    private Payment payment;
    // Getters et Setters
    public String getModel3dUrl() {
        return model3dUrl;
    }

    public void setModel3dUrl(String model3dUrl) {
        this.model3dUrl = model3dUrl;
    }

    // Getters
    public Long getId() {
        return id;
    }

    public String getTitre() {
        return titre;
    }

    public String getDescription() {
        return description;
    }

    public TypeAnnonce getTypeAnnonce() {
        return typeAnnonce;
    }

    public StatutAnnonce getStatut() {
        return statut;
    }

    public String getImageUrl() {
        return imageUrl;
    }

    public User getUser() {
        return user;
    }

    // Setters
    public void setId(Long id) {
        this.id = id;
    }

    public void setTitre(String titre) {
        this.titre = titre;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public void setTypeAnnonce(TypeAnnonce typeAnnonce) {
        this.typeAnnonce = typeAnnonce;
    }

    public void setStatut(StatutAnnonce statut) {
        this.statut = statut;
    }

    public void setImageUrl(String imageUrl) {
        this.imageUrl = imageUrl;
    }

    public void setUser(User user) {
        this.user = user;
    }

}