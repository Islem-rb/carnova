package CarNova.carnova.Controller;

import CarNova.carnova.Entity.Annonce;
import CarNova.carnova.Repository.AnnonceRepository;
import CarNova.carnova.Service.Model3DService;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.nio.file.Path;
import java.util.Map;

@RestController
@RequestMapping("/api/models")
public class Model3DController {

    private final Model3DService model3DService;
    private final AnnonceRepository annonceRepository;

    public Model3DController(Model3DService model3DService, AnnonceRepository annonceRepository) {
        this.model3DService = model3DService;
        this.annonceRepository = annonceRepository;
    }

    @PostMapping("/upload")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> uploadModelGlb(
            @RequestParam("glb") MultipartFile glb,
            @RequestParam(value = "annonceId", required = false) Long annonceId,
            Authentication authentication) {

        try {
            String url = model3DService.saveGlb(glb);

            if (annonceId != null) {
                Annonce annonce = annonceRepository.findById(annonceId)
                        .orElseThrow(() -> new IllegalArgumentException("Annonce non trouvée"));
                annonce.setModel3dUrl(url);
                annonceRepository.save(annonce);
            }

            return ResponseEntity.ok(Map.of("model3dUrl", url));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/{filename:.+}")
    @PreAuthorize("permitAll()")
    public ResponseEntity<Resource> serveModel(@PathVariable String filename) {
        try {
            Path filePath = model3DService.resolve(filename);
            Resource resource = new UrlResource(filePath.toUri());

            if (!resource.exists() || !resource.isReadable()) {
                return ResponseEntity.notFound().build();
            }

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.parseMediaType("model/gltf-binary"));
            headers.setContentDisposition(ContentDisposition.inline().build());

            return new ResponseEntity<>(resource, headers, HttpStatus.OK);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}