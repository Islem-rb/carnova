package CarNova.carnova.api;
import CarNova.carnova.entity.*;
import java.util.List;
public final class Views {
 private Views() {}
 public static Contracts.Seller seller(User u) { return new Contracts.Seller(u.id,u.prenom+" "+u.nom); }
 public static Contracts.Listing listing(Annonce a) { return new Contracts.Listing(a.id,a.titre,a.description,a.typeAnnonce,a.statut,a.imageUrl,a.model3dUrl,seller(a.user),a.marque,a.modele,a.annee,a.prix,a.kilometrage,a.carburant,a.boiteVitesse,a.couleur,a.ville,a.typeVehicule,a.telephone,a.createdAt,List.copyOf(a.images)); }
 public static Contracts.ShowroomView showroom(Showroom s) { return new Contracts.ShowroomView(s.id,s.nom,s.description,s.ville,s.telephone,seller(s.user),List.copyOf(s.images),s.voitures.stream().map(v->new Contracts.Vehicle(v.marque,v.modele,v.annee,v.prix,v.couleur)).toList()); }
}
