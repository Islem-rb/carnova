package CarNova.carnova.Controller;

import CarNova.carnova.Service.HttpProbeService;
import CarNova.carnova.Service.RssIngestService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/news/debug")
public class NewsDebugController {

    private final HttpProbeService probe;
    public NewsDebugController(HttpProbeService probe) { this.probe = probe; }

    /** Teste une URL arbitraire (connectivité/proxy/SSL) */
    @GetMapping("/ping")
    public ResponseEntity<?> ping(@RequestParam String url) {
        var res = probe.probe(url, 800);
        return ResponseEntity.ok(Map.of(
                "url", res.url(),
                "status", res.status(),
                "contentType", res.contentType(),
                "headSample", res.head(),
                "error", res.error()
        ));
    }

    /** Ping rapide de 3 URLs connues (1 RSS auto, 1 RSS news générique, 1 simple page) */
    @GetMapping("/quickcheck")
    public ResponseEntity<?> quickcheck() {
        List<String> urls = List.of(
                "https://www.motor1.com/rss/news.xml",                 // RSS auto
                "https://www.motorauthority.com/rss-feeds/index.rss",  // RSS auto
                "https://feeds.bbci.co.uk/news/technology/rss.xml",    // RSS générique
                "https://example.com/"                                 // page simple
        );
        var list = new ArrayList<>();
        for (String u : urls) {
            var r = probe.probe(u, 500);
            list.add(Map.of(
                    "url", r.url(),
                    "status", r.status(),
                    "contentType", r.contentType(),
                    "headSample", r.head(),
                    "error", r.error()
            ));
        }
        return ResponseEntity.ok(list);
    }
}
