package CarNova.carnova.config;

import CarNova.carnova.Service.NewsService;
import org.slf4j.Logger; import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class NewsScheduler {
    private static final Logger log = LoggerFactory.getLogger(NewsScheduler.class);
    private final NewsService newsService;
    public NewsScheduler(NewsService newsService){ this.newsService = newsService; }

    // Toutes les heures à xx:05
    @Scheduled(cron = "0 5 * * * *")
    public void refreshHourly() {
        try {
            int inserted = newsService.refreshFromSources();
            log.info("[Scheduler] News refresh -> inserted {}", inserted);
        } catch (Exception e) {
            log.warn("[Scheduler] refresh error: {}", e.toString());
        }
    }
}
