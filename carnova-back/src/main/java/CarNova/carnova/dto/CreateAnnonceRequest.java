package CarNova.carnova.dto;

import CarNova.carnova.Entity.BoiteVitesse;
import CarNova.carnova.Entity.Carburant;
import CarNova.carnova.Entity.TypeAnnonce;
import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class CreateAnnonceRequest {

    @NotBlank(message = "Le titre est obligatoire")
    private String titre;

    @NotBlank(message = "La description est obligatoire")
    @Size(max = 2000, message = "La description ne doit pas dépasser 2000 caractères")
    private String description;

    @NotNull(message = "Le type d’annonce est obligatoire")
    private TypeAnnonce typeAnnonce;

    private String imageUrl;
    private String model3dUrl;

    @NotBlank(message = "La marque est obligatoire")
    private String marque;

    @NotBlank(message = "Le modèle est obligatoire")
    private String modele;

    @Min(value = 1900, message = "L’année doit être valide")
    private int annee;

    @NotNull(message = "Le type de carburant est obligatoire")
    private Carburant carburant;

    @NotNull(message = "Le type de boîte de vitesse est obligatoire")
    private BoiteVitesse boiteVitesse;

    @Min(value = 0, message = "Le kilométrage ne peut pas être négatif")
    private int kilometrage;

    @NotBlank(message = "La couleur est obligatoire")
    private String couleur;

    @Min(value = 2, message = "Le nombre de portes doit être au moins 2")
    private int nombrePortes;

    @Positive(message = "Le prix doit être positif")
    private double prix;

    private boolean disponible = true;
}