package CarNova.carnova.Controller;

import CarNova.carnova.Service.NewsService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController @RequestMapping("/api/news")
public class NewsAdminController {
    private final NewsService newsService;
    public NewsAdminController(NewsService newsService){ this.newsService=newsService; }

    @PostMapping("/_seed") public ResponseEntity<?> seed(){
        return ResponseEntity.ok(Map.of("status","ok","id", newsService.seedOne()));
    }
    @PostMapping("/refresh") public ResponseEntity<?> refresh(){
        return ResponseEntity.ok(Map.of("status","ok","inserted", newsService.refreshFromSources()));
    }
    @GetMapping("/count") public ResponseEntity<?> count(){
        return ResponseEntity.ok(Map.of("count", newsService.countAll()));
    }
    @DeleteMapping("/purge-non-tn")
    public ResponseEntity<?> purgeNonTunisian() {
        long n = newsService.purgeNonTunisia();
        return ResponseEntity.ok(Map.of("deleted", n));
    }
}
