package CarNova.carnova.config;

import CarNova.carnova.entity.*;
import CarNova.carnova.repository.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.*;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;

@Configuration
@org.springframework.boot.autoconfigure.condition.ConditionalOnProperty(
    name = "app.demo-data",
    havingValue = "true")
public class DemoData {
  @Bean
  @Transactional
  CommandLineRunner seed(
      UserRepository users,
      AnnonceRepository listings,
      ShowroomRepository showrooms,
      NewsItemRepository news,
      PasswordEncoder passwords,
      @Value("${DEMO_ADMIN_PASSWORD:}") String adminPassword) {
    return args -> {
      // Seed a fresh, isolated portfolio database only. Never overwrite existing accounts or
      // listings.
      if (users.count() > 0) return;
      var owner = new User();
      owner.nom = "Studio";
      owner.prenom = "CarNova";
      owner.email = "studio@carnova.local";
      owner.password = passwords.encode(UUID.randomUUID().toString());
      owner.role = "ROLE_USER";
      users.save(owner);
      if (!adminPassword.isBlank()) {
        var admin = new User();
        admin.nom = "Portfolio";
        admin.prenom = "Admin";
        admin.email = "admin@carnova.local";
        admin.password = passwords.encode(adminPassword);
        admin.role = "ROLE_ADMIN";
        users.save(admin);
      }
      String[][] cars = {
        {
          "BMW i8",
          "BMW",
          "Coupé hybride",
          "2020",
          "285000",
          "32000",
          "HYBRIDE",
          "COUPE",
          "Tunis",
          "bmw",
          "Bleu"
        },
        {
          "Porsche Taycan",
          "Porsche",
          "Performance électrique",
          "2022",
          "385000",
          "18000",
          "ELECTRIQUE",
          "BERLINE",
          "La Marsa",
          "porsche",
          "Argent"
        },
        {
          "Maserati GranCabrio",
          "Maserati",
          "4.7 V8",
          "2019",
          "265000",
          "21500",
          "ESSENCE",
          "COUPE",
          "Sousse",
          "mercedes",
          "Noir"
        },
        {
          "Audi e-tron GT",
          "Audi",
          "quattro",
          "2022",
          "330000",
          "42000",
          "ELECTRIQUE",
          "BERLINE",
          "Tunis",
          "audi",
          "Gris"
        },
        {
          "Tesla Model 3",
          "Tesla",
          "Grande Autonomie",
          "2023",
          "155000",
          "24000",
          "ELECTRIQUE",
          "BERLINE",
          "Sfax",
          "tesla",
          "Blanc"
        },
        {
          "Range Rover Sport",
          "Land Rover",
          "D300 HSE",
          "2021",
          "295000",
          "57000",
          "DIESEL",
          "SUV",
          "Hammamet",
          "range",
          "Noir"
        }
      };
      int i = 0;
      for (var c : cars) {
        var a = new Annonce();
        a.user = owner;
        a.titre = c[0];
        a.marque = c[1];
        a.modele = c[2];
        a.annee = Integer.valueOf(c[3]);
        a.prix = new BigDecimal(c[4]);
        a.kilometrage = Integer.valueOf(c[5]);
        a.carburant = c[6];
        a.typeVehicule = c[7];
        a.ville = c[8];
        a.imageUrl = "/assets/market/" + c[9] + ".webp";
        a.images.add(a.imageUrl);
        a.couleur = c[10];
        a.boiteVitesse = "AUTOMATIQUE";
        a.telephone = "+216 71 000 000";
        a.description =
            "Véhicule de présentation pour le portfolio CarNova. Configuration "
                + c[2]
                + ", entretien suivi et finition soignée. Cette annonce illustre le parcours"
                + " d'achat ; elle ne constitue pas une offre réelle de vente. Prenez le temps de"
                + " comparer les équipements et préparez votre essai avec notre guide.";
        a.createdAt = Instant.now().minusSeconds(i++ * 86400L);
        if (c[1].equals("BMW")) a.model3dUrl = "/api/models/bmw.glb";
        if (c[1].equals("Mercedes-Benz")) a.model3dUrl = "/api/models/mercedes.glb";
        listings.save(a);
      }
      var s = new Showroom();
      s.user = owner;
      s.nom = "CarNova Collection";
      s.description =
          "Un espace de démonstration pour découvrir une sélection automobile, explorer les modèles"
              + " en 3D et préparer votre prochain achat.";
      s.ville = "Les Berges du Lac, Tunis";
      s.telephone = "+216 71 000 000";
      s.images.add("/assets/market/showroom.webp");
      for (var c : cars) {
        var v = new Vehicule();
        v.marque = c[1];
        v.modele = c[2];
        v.annee = Integer.parseInt(c[3]);
        v.prix = Double.parseDouble(c[4]);
        v.couleur = c[10];
        s.voitures.add(v);
      }
      showrooms.save(s);
      String[][] articles = {
        {
          "Le bon réflexe avant de prendre la route",
          "Un achat serein commence par les bonnes questions. Historique, essai et inspection :"
              + " notre méthode pour avancer avec confiance.",
          "porsche"
        },
        {
          "Électrique : penser au-delà de l'autonomie",
          "Recharge à domicile, trajets quotidiens et état de la batterie : les points à comparer"
              + " pour choisir une électrique adaptée à votre vie.",
          "tesla"
        },
        {
          "Une annonce qui fait la différence",
          "Des photos claires, un historique documenté et une description honnête. Les essentiels"
              + " pour présenter votre voiture sous son meilleur jour.",
          "bmw"
        }
      };
      for (var x : articles) {
        var n = new NewsItem();
        n.title = x[0];
        n.summary = x[1];
        n.imageUrl = "/assets/market/" + x[2] + ".webp";
        n.sourceName = "CarNova Journal";
        n.sourceUrl = "/guide";
        n.uniqueKey = n.id;
        news.save(n);
      }
    };
  }
}
