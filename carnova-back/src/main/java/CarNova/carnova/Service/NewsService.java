package CarNova.carnova.Service;

import CarNova.carnova.dto.NewsItemDto;
import CarNova.carnova.Entity.NewsItemEntity;
import CarNova.carnova.Repository.NewsItemRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.net.URL;
import java.time.Instant;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;

@Service
public class NewsService {

    private static final Logger log = LoggerFactory.getLogger(NewsService.class);

    private final NewsItemRepository repo;
    private final RssIngestService rss;

    public NewsService(NewsItemRepository repo, RssIngestService rss) {
        this.repo = repo;
        this.rss  = rss;
    }

    /** Ingestion RSS -> insert si pas déjà présent (dédup par uniqueKey) */
    @Transactional
    public int refreshFromSources() {
        var items = rss.fetchAll();
        int inserted = 0;
        for (var i : items) {
            if (repo.findByUniqueKey(i.uniqueKey()).isPresent()) continue;

            var e = new NewsItemEntity();
            e.setTitle(i.title());
            e.setSummary(i.summary());
            e.setImageUrl(i.imageUrl());
            e.setSourceName(i.sourceName());
            e.setSourceUrl(i.sourceUrl());
            e.setPublishedAt(i.publishedAt());
            e.setUniqueKey(i.uniqueKey());
            repo.save(e);
            inserted++;
        }
        log.info("News refresh: {} inserted ({} fetched)", inserted, items.size());
        return inserted;
    }

    /** 👉 Méthode manquante : liste des articles récents (pour ton GET /api/news) */
    @Transactional(readOnly = true)
    @Cacheable(value = "newsCache", key = "'list_'+#sinceHours+'_'+#limit")
    public List<NewsItemDto> listRecent(int sinceHours, int limit) {
        int lim = Math.max(1, Math.min(limit, 100));
        Instant after = Instant.now().minusSeconds((long) sinceHours * 3600L);

        var list = repo.findByPublishedAtAfterOrderByPublishedAtDesc(after);
        if (list.isEmpty()) list = repo.findAllByOrderByPublishedAtDesc(); // fallback

        return list.stream()
                .sorted(Comparator.comparing(NewsItemEntity::getPublishedAt,
                        Comparator.nullsLast(Comparator.reverseOrder())))
                .limit(lim)
                .map(NewsItemDto::from)
                .toList();
    }

    /** Utilitaire: compter tous les enregistrements */
    @Transactional(readOnly = true)
    public long countAll() { return repo.count(); }

    /** Utilitaire: seed pour tester DB/JPA */
    @Transactional
    public String seedOne() {
        var e = new NewsItemEntity();
        e.setTitle("Article de test (seed)");
        e.setSummary("Insertion manuelle pour valider DB/JPA.");
        e.setImageUrl("https://example.com/test.jpg");
        e.setSourceName("SEED");
        e.setSourceUrl("https://example.com/");
        e.setPublishedAt(Instant.now());
        e.setUniqueKey("SEED|Article de test");
        repo.save(e);
        return e.getId();
    }


    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public boolean isTunisiaEntity(CarNova.carnova.Entity.NewsItemEntity e){
        String host = domain(e.getSourceUrl());
        String text = ((e.getTitle()==null?"":e.getTitle()) + " " + (e.getSummary()==null?"":e.getSummary())).toLowerCase(Locale.ROOT);
        if (host.endsWith(".tn")) return true;
        if (text.contains("tunisie") || text.contains("tunis") || text.contains("تونس")) return true;
        String[] cities = {"tunis","sfax","sousse","nabeul","bizerte","gabes","gafsa","medenine","monastir","mahdia","kasserine","kairouan","beja","kef","siliana","jendouba","zaghouan","tozeur","tatouine","ben arous","manouba","jerba","djerba"};
        for (String c : cities) if (text.contains(c)) return true;
        return false;
    }

    private static String domain(String url){
        try { return new URL(url).getHost().toLowerCase(); } catch(Exception ex){ return ""; }
    }

    @org.springframework.transaction.annotation.Transactional
    public long purgeNonTunisia(){
        var all = repo.findAll();
        long removed = 0;
        for (var e : all) {
            if (!isTunisiaEntity(e)) { repo.delete(e); removed++; }
        }
        return removed;
    }
}
