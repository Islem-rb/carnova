package CarNova.carnova.api;

import CarNova.carnova.entity.NewsItem;
import CarNova.carnova.repository.NewsItemRepository;
import CarNova.carnova.service.NewsService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.time.Instant;
import java.util.*;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/news")
@Validated
public class NewsController {
  private final NewsItemRepository repo;
  private final NewsService service;

  public NewsController(NewsItemRepository r, NewsService s) {
    repo = r;
    service = s;
  }

  @GetMapping
  public List<NewsItem> list(
      @RequestParam(defaultValue = "8760") @Min(1) @Max(87600) int sinceHours,
      @RequestParam(defaultValue = "50") @Min(1) @Max(100) int limit) {
    var after = Instant.now().minusSeconds(sinceHours * 3600L);
    return repo.findAllByOrderByPublishedAtDesc().stream()
        .filter(n -> n.publishedAt == null || n.publishedAt.isAfter(after))
        .limit(limit)
        .toList();
  }

  @GetMapping("/count")
  public Map<String, Long> count() {
    return Map.of("count", repo.count());
  }

  @PostMapping("/refresh")
  public Map<String, Object> refresh() {
    return Map.of("status", "ok", "inserted", service.refresh());
  }

  @PostMapping
  public NewsItem create(@Valid @RequestBody Contracts.NewsInput r) {
    var n = new NewsItem();
    n.title = r.title();
    n.summary = r.summary();
    n.imageUrl = r.imageUrl();
    n.sourceName = "CarNova Journal";
    n.sourceUrl = "/actualites";
    n.uniqueKey = n.id;
    return repo.save(n);
  }

  @PostMapping("/_seed")
  public Map<String, String> seed() {
    var n = new NewsItem();
    n.title = "Préparer son prochain achat";
    n.summary = "Comparez les annonces et vérifiez l'historique avant tout achat.";
    n.sourceName = "CarNova Journal";
    n.sourceUrl = "/actualites";
    n.uniqueKey = n.id;
    repo.save(n);
    return Map.of("status", "ok", "id", n.id);
  }

  @DeleteMapping("/{id}")
  public Map<String, String> delete(@PathVariable String id) {
    repo.deleteById(id);
    return Map.of("message", "Article supprimé.");
  }
}
