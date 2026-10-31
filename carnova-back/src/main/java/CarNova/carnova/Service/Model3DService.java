package CarNova.carnova.Service;

import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

@Service
public class Model3DService {

    private final Path modelsDir;

    public Model3DService() {
        this.modelsDir = Paths.get(System.getProperty("user.dir"), "models");
        initializeDirectory();
    }

    private void initializeDirectory() {
        try {
            if (!Files.exists(modelsDir)) {
                Files.createDirectories(modelsDir);
            }
        } catch (IOException e) {
            throw new RuntimeException("Échec de la création du répertoire models", e);
        }
    }

    public String saveGlb(MultipartFile glb) throws IOException {
        validateFile(glb);

        String originalFilename = glb.getOriginalFilename();
        String safeFilename = generateSafeFilename(originalFilename);
        Path targetLocation = modelsDir.resolve(safeFilename);

        Files.copy(glb.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);

        return "/api/models/" + safeFilename;
    }

    private void validateFile(MultipartFile file) throws IllegalArgumentException {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Fichier non fourni");
        }

        if (!file.getContentType().equals("model/gltf-binary")) {
            throw new IllegalArgumentException("Format de fichier non supporté (seul .glb)");
        }
    }

    private String generateSafeFilename(String originalFilename) {
        String uuid = UUID.randomUUID().toString();
        String extension = ".glb";
        return System.currentTimeMillis() + "_" + uuid + extension;
    }

    public Path resolve(String filename) {
        return modelsDir.resolve(filename);
    }

    // Pour future implémentation de reconstruction 3D
    public String reconstructFromPhotos(MultipartFile[] photos) {
        throw new UnsupportedOperationException("Reconstruction 3D non implémentée");
    }

}