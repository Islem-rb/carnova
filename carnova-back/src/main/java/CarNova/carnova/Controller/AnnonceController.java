package CarNova.carnova.Controller;

import CarNova.carnova.Entity.*;
import CarNova.carnova.Repository.*;
import CarNova.carnova.Service.*;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.*;
import java.util.*;

@RestController
@RequestMapping("/api/annonces")
public class AnnonceController {

    @Autowired
    private AnnonceRepository annonceRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PaymentService paymentService;

    @Autowired
    private ImageProcessingService imageProcessingService;

    // ✅ Créer une annonce avec image sans fond
    @PostMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> createAnnonce(
            @RequestParam("titre") String titre,
            @RequestParam("description") String description,
            @RequestParam("typeAnnonce") String typeAnnonce,
            @RequestParam(value = "image", required = false) MultipartFile image,
            Authentication authentication) {

        try {
            if (!(authentication.getPrincipal() instanceof UserDetailsImpl userDetails)) {
                return ResponseEntity.status(401).body(Map.of("error", "Authentification requise"));
            }

            User user = userRepository.findById(userDetails.getId()).orElse(null);
            if (user == null) return ResponseEntity.status(404).body(Map.of("error", "Utilisateur non trouvé"));

            if (!paymentService.hasUserPaid(user.getEmail())) {
                return ResponseEntity.status(402).body(Map.of("error", "Paiement requis"));
            }

            TypeAnnonce typeAnnonceEnum = TypeAnnonce.valueOf(typeAnnonce.toUpperCase());

            Annonce annonce = new Annonce();
            annonce.setTitre(titre);
            annonce.setDescription(description);
            annonce.setTypeAnnonce(typeAnnonceEnum);
            annonce.setStatut(StatutAnnonce.DISPONIBLE);
            annonce.setUser(user);

            if (image != null && !image.isEmpty()) {
                byte[] processedImage = imageProcessingService.removeBackground(image.getBytes());

                String uploadsDir = System.getProperty("user.dir") + File.separator + "uploads";
                Files.createDirectories(Paths.get(uploadsDir));

                String filename = System.currentTimeMillis() + "_nobg.png";
                Path path = Paths.get(uploadsDir, filename);
                Files.write(path, processedImage);

                annonce.setImageUrl("/uploads/" + filename);
            }

            Annonce saved = annonceRepository.save(annonce);
            return ResponseEntity.status(201).body(saved);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "Erreur serveur"));
        }
    }

    // ✅ Liste toutes les annonces
    @GetMapping
    @PreAuthorize("permitAll()")
    public List<Annonce> getAllAnnonces() {
        return annonceRepository.findAll();
    }

    // ✅ Liste mes annonces
    @GetMapping("/my-annonces")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> getMyAnnonces(Authentication authentication) {
        if (!(authentication.getPrincipal() instanceof UserDetailsImpl userDetails)) {
            return ResponseEntity.status(401).body(Map.of("error", "Authentification requise"));
        }
        User user = userRepository.findById(userDetails.getId()).orElse(null);
        if (user == null) return ResponseEntity.status(404).body(Map.of("error", "Utilisateur non trouvé"));
        return ResponseEntity.ok(annonceRepository.findByUserId(user.getId()));
    }

    // ✅ Supprimer une annonce
    @DeleteMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> deleteAnnonce(@PathVariable Long id, Authentication authentication) {
        if (!(authentication.getPrincipal() instanceof UserDetailsImpl userDetails)) {
            return ResponseEntity.status(401).body(Map.of("error", "Authentification requise"));
        }
        User user = userRepository.findById(userDetails.getId()).orElse(null);
        if (user == null) return ResponseEntity.status(404).body(Map.of("error", "Utilisateur non trouvé"));

        Annonce annonce = annonceRepository.findById(id).orElse(null);
        if (annonce == null || !annonce.getUser().getId().equals(user.getId())) {
            return ResponseEntity.status(403).body(Map.of("error", "Non autorisé"));
        }

        annonceRepository.delete(annonce);
        return ResponseEntity.ok(Map.of("message", "Annonce supprimée avec succès"));
    }

    // ✅ Servir les images statiques
    @GetMapping("/uploads/{filename:.+}")
    public ResponseEntity<Resource> getImage(@PathVariable String filename) {
        try {
            Path file = Paths.get(System.getProperty("user.dir"), "uploads", filename);
            Resource resource = new UrlResource(file.toUri());
            if (!resource.exists() || !resource.isReadable()) {
                return ResponseEntity.notFound().build();
            }

            String contentType = Files.probeContentType(file);
            if (contentType == null) contentType = "image/png";

            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(contentType))
                    .header(HttpHeaders.CONTENT_DISPOSITION, "inline")
                    .body(resource);
        } catch (Exception e) {
            return ResponseEntity.status(500).build();
        }
    }
}
