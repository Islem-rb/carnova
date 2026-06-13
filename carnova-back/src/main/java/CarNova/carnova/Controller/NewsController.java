package CarNova.carnova.Controller;

import CarNova.carnova.dto.NewsItemDto;
import CarNova.carnova.Service.NewsService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/news")
public class NewsController {

    private final NewsService service;
    public NewsController(NewsService service) { this.service = service; }

    // GET /api/news?sinceHours=24&limit=50
    @GetMapping
    public List<NewsItemDto> list(
            @RequestParam(defaultValue = "24") int sinceHours,
            @RequestParam(defaultValue = "50") int limit
    ) {
        return service.listRecent(sinceHours, limit);
    }
}
