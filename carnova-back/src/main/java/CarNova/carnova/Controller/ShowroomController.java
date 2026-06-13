package CarNova.carnova.Controller;

import CarNova.carnova.Entity.Showroom;
import CarNova.carnova.Entity.User;
import CarNova.carnova.Repository.UserRepository;
import CarNova.carnova.Service.ShowroomService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/showrooms")
public class ShowroomController {
    @Autowired
    private ShowroomService showroomService;
    @Autowired
    private UserRepository userRepository;

    @PostMapping
    public ResponseEntity<?> createShowroom(@RequestBody Showroom showroom, Authentication authentication, HttpServletRequest request) {
        String headerAuth = request.getHeader("Authorization");
        System.out.println("[DEBUG] Header Authorization: " + headerAuth);
        System.out.println("[DEBUG] Authentication: " + authentication);
        System.out.println("[DEBUG] Name from authentication: " + (authentication != null ? authentication.getName() : "null"));
        String email = authentication != null ? authentication.getName() : null;
        User user = (email != null) ? userRepository.findByEmail(email).orElse(null) : null;
        if (user == null) {
            System.out.println("[DEBUG] Utilisateur non trouvé pour email: " + email);
            return ResponseEntity.status(404).body("Utilisateur non trouvé");
        }
        showroom.setUser(user);
        Showroom saved = showroomService.saveShowroom(showroom);
        return ResponseEntity.ok(saved);
    }

    @GetMapping("/me")
    public ResponseEntity<?> getMyShowrooms(Authentication authentication) {
        String email = authentication.getName();
        User user = userRepository.findByEmail(email).orElse(null);
        if (user == null) {
            return ResponseEntity.status(404).body("Utilisateur non trouvé");
        }
        List<Showroom> showrooms = showroomService.getShowroomsByUser(user);
        return ResponseEntity.ok(showrooms);
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getShowroomById(@PathVariable Long id) {
        Optional<Showroom> showroom = showroomService.getShowroomById(id);
        return showroom.<ResponseEntity<?>>map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.status(404).body("Showroom non trouvé"));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteShowroom(@PathVariable Long id) {
        showroomService.deleteShowroom(id);
        return ResponseEntity.ok("Showroom supprimé");
    }
}