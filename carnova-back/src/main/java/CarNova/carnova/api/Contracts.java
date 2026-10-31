package CarNova.carnova.api;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
public final class Contracts {
 private Contracts() {}
 public record Signup(@NotBlank @Size(max=80) String nom,@NotBlank @Size(max=80) String prenom,@NotBlank @Email @Size(max=254) String email,@NotBlank @Size(min=10,max=72) String password,String role) {}
 public record Login(@NotBlank @Email @Size(max=254) String email,@NotBlank @Size(max=72) String password) {}
 public record Session(String token,String type,Long id,String email,String name,List<String> roles,long expiresIn) {}
 public record Seller(Long id,String name) {}
 public record ListingInput(
  @NotBlank @Size(max=150) String titre,@NotBlank @Size(min=10,max=4000) String description,
  @Pattern(regexp="VENTE|LOCATION|ACHAT") String typeAnnonce,
  @NotBlank @Size(max=50) String marque,@NotBlank @Size(max=80) String modele,
  @NotNull @Min(1900) @Max(2028) Integer annee,@NotNull @DecimalMin("1") @DecimalMax("100000000") BigDecimal prix,
  @NotNull @Min(0) @Max(3000000) Integer kilometrage,
  @NotBlank @Pattern(regexp="ESSENCE|DIESEL|ELECTRIQUE|HYBRIDE|GPL") String carburant,
  @NotBlank @Pattern(regexp="MANUELLE|AUTOMATIQUE") String boiteVitesse,
  @Size(max=40) String couleur,@NotBlank @Size(max=80) String ville,
  @Pattern(regexp="CITADINE|SUV|BERLINE|COUPE|PICKUP|CAMION|MOTO") String typeVehicule,
  @NotBlank @Pattern(regexp="[+0-9 ()-]{8,25}") String telephone,
  @Size(max=8) List<@Pattern(regexp="/uploads/[a-zA-Z0-9_.-]+") String> images,
  @Pattern(regexp="(?:/api/models/[a-zA-Z0-9_.-]+|/assets/models/[a-zA-Z0-9_.-]+)") String model3dUrl) {}
 public record Listing(Long id,String titre,String description,String typeAnnonce,String statut,String imageUrl,String model3dUrl,Seller user,String marque,String modele,Integer annee,BigDecimal prix,Integer kilometrage,String carburant,String boiteVitesse,String couleur,String ville,String typeVehicule,String telephone,Instant createdAt,List<String> images) {}
 public record ListingPage(List<Listing> items,long total,int page,int pages) {}
 public record Vehicle(@NotBlank @Size(max=50) String marque,@NotBlank @Size(max=80) String modele,@Min(1900) @Max(2028) int annee,@Positive double prix,@Size(max=40) String couleur) {}
 public record ShowroomInput(@NotBlank @Size(max=120) String nom,@NotBlank @Size(max=4000) String description,@NotBlank @Size(max=80) String ville,@NotBlank @Pattern(regexp="[+0-9 ()-]{8,25}") String telephone,@Size(max=8) List<@Pattern(regexp="/uploads/[a-zA-Z0-9_.-]+") String> images,@Size(max=50) List<@jakarta.validation.Valid Vehicle> voitures) {}
 public record ShowroomView(Long id,String nom,String description,String ville,String telephone,Seller user,List<String> images,List<Vehicle> voitures) {}
 public record Contact(@NotBlank @Size(max=100) String name,@NotBlank @Email @Size(max=254) String email,@NotBlank @Size(min=10,max=3000) String message) {}
 public record Chat(@NotBlank @Size(max=2000) String message,Long annonceId,java.util.Map<String,Object> context,String locale) {}
 public record NewsInput(@NotBlank @Size(max=300) String title,@NotBlank @Size(max=3000) String summary,@Pattern(regexp="/assets/market/[a-zA-Z0-9_.-]+") String imageUrl) {}
}
