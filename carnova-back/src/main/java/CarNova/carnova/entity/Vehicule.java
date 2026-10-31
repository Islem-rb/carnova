package CarNova.carnova.entity;
import jakarta.persistence.*;
@Entity
@Table(name="vehicules")
public class Vehicule {
 @Id @GeneratedValue(strategy=GenerationType.IDENTITY) public Long id;
 public String marque; public String modele; public int annee; public double prix; public String couleur;
}
