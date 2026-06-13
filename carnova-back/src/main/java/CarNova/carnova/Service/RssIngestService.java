package CarNova.carnova.Service;

import com.rometools.rome.feed.synd.*;
import com.rometools.rome.io.SyndFeedInput;
import com.rometools.rome.io.XmlReader;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.slf4j.Logger; import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.time.Instant;
import java.util.*;

@Service
public class RssIngestService {
    private static final Logger log = LoggerFactory.getLogger(RssIngestService.class);

    /**
     * 🇹🇳 Flux centrés Tunisie via Google News RSS (FR + AR) filtrés "auto".
     * (on reste sur Google News car fiable; on filtre ensuite .tn & mots-clés)
     */
    private static final List<Source> SOURCES = List.of(
            new Source("GoogleNews TN FR Auto",
                    "https://news.google.com/rss/search?q=(voiture%20OR%20automobile%20OR%20auto%20OR%20v%C3%A9hicule%20OR%20moto)%20site:tn&hl=fr&gl=TN&ceid=TN:fr"),
            new Source("GoogleNews TN AR Auto",
                    "https://news.google.com/rss/search?q=%D8%B3%D9%8A%D8%A7%D8%B1%D8%A9%20OR%20%D8%B3%D9%8A%D8%A7%D8%B1%D8%A7%D8%AA%20OR%20%D9%85%D8%B1%D9%83%D8%A8%D8%A7%D8%AA%20OR%20%D8%AF%D8%B1%D8%A7%D8%AC%D8%A9%20site:tn&hl=ar&gl=TN&ceid=TN:ar")
    );

    // Mots-clés auto (FR + AR) pour filtrer les résultats
    private static final String[] KW_FR = {
            "voiture","automobile","auto","véhicule","moto","motocyc","trafic","route",
            "immatriculation","carburant","essence","diesel","électrique","hybride",
            "wallyscar","stafim","artes","renault","peugeot","kia","hyundai","citroën",
            "nissan","toyota","ford","fiat","honda"
    };
    private static final String[] KW_AR = {
            "سيارة","سيارات","مركبة","مركبات","دراجة","مرور","طريق","بنزين","ديزل",
            "كهربائية","هجينة","وَاليسكار","واليسكار","ستافيم","آرتس","رينو","بيجو","كيا","هيونداي","تويوتا"
    };

    public record Item(
            String title, String summary, String imageUrl,
            String sourceName, String sourceUrl, Instant publishedAt,
            String uniqueKey
    ) {}
    private record Source(String name, String url) {}

    /** Récupère et normalise + filtre “Tunisie & Auto”. */
    public List<Item> fetchAll() {
        List<Item> out = new ArrayList<>();
        for (Source s : SOURCES) {
            try {
                RawResp res = openWithUA(s.url());
                if (res.code < 200 || res.code >= 300 || res.stream == null) {
                    log.warn("RSS FAIL (HTTP {}): {} (ct={})", res.code, s.url(), res.contentType);
                    continue;
                }
                SyndFeed feed = new SyndFeedInput().build(new XmlReader(res.stream));
                log.info("RSS OK: {} ({} items)", s.name(), feed.getEntries().size());

                for (SyndEntry e : feed.getEntries()) {
                    String title = safe(e.getTitle());
                    if (title == null || title.isBlank()) continue;

                    String link = e.getLink();
                    String summary = null;
                    if (e.getDescription() != null) summary = e.getDescription().getValue();
                    if (summary == null && !e.getContents().isEmpty()) {
                        summary = e.getContents().get(0).getValue();
                    }

                    Instant pub = (e.getPublishedDate() != null) ? e.getPublishedDate().toInstant() : null;
                    String image = extractImage(e, summary);

                    Item item = new Item(
                            title, summary, image, s.name(), link, pub,
                            uniqueKey(s.name(), title)
                    );

                    // ✅ filtre Tunisie + Automobile
                    if (isTunisia(item) && isAutomotive(item)) {
                        out.add(item);
                    }
                }
            } catch (Exception ex) {
                log.warn("RSS FAIL: {} -> {}", s.name(), ex.toString());
            }
        }
        log.info("After TN+AUTO filter -> {} items", out.size());
        return out;
    }

    // ---------- Filtres ----------
    private static boolean isTunisia(Item it) {
        String host = domain(it.sourceUrl());
        String text = (it.title() + " " + (it.summary()==null?"":it.summary()))
                .toLowerCase();

        // 1) domaine .tn (prioritaire)
        if (host.endsWith(".tn")) return true;

        // 2) mentions explicites
        if (text.contains("tunisie") || text.contains("tunis") || text.contains("tn ")
                || text.contains("tn:") || text.contains("tn-") || text.contains(" توني") || text.contains("تونس")) {
            return true;
        }

        // 3) fallback: Google News TN renvoie parfois des domaines non-.tn, on accepte si le titre contient une ville connue
        String[] cities = {"tunis","sfax","sousse","nabeul","bizerte","gabes","gafsa","medenine","monastir","mahdia","kasserine","kairouan","beja","kef","siliana","jendouba","zaghouan","tozeur","tatouine","ben arous","manouba","arad","jerba","djerba"};
        for (String c : cities) if (text.contains(c)) return true;

        return false;
    }

    private static boolean isAutomotive(Item it) {
        String t = normalize((it.title()==null?"":it.title()) + " " + (it.summary()==null?"":it.summary()));
        for (String k : KW_FR) if (t.contains(normalize(k))) return true;
        for (String k : KW_AR) if (t.contains(k)) return true; // arabe sans normalisation
        return false;
    }

    // ---------- util ----------
    private static class RawResp {
        final int code; final String contentType; final InputStream stream;
        RawResp(int c, String ct, InputStream s){ code=c; contentType=ct; stream=s; }
    }
    private static RawResp openWithUA(String urlStr) throws Exception {
        HttpURLConnection c = (HttpURLConnection) new URL(urlStr).openConnection();
        c.setRequestMethod("GET");
        c.setConnectTimeout(10000);
        c.setReadTimeout(15000);
        c.setInstanceFollowRedirects(true);
        c.setRequestProperty("User-Agent","Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117 Safari/537.36");
        c.setRequestProperty("Accept","application/rss+xml, application/xml, text/xml, */*;q=0.8");
        int code = c.getResponseCode();
        String ct = c.getContentType();
        InputStream is = (code >= 200 && code < 300) ? c.getInputStream() : null;
        return new RawResp(code, ct, is);
    }
    private static String safe(String s){ return (s==null)?null:s.trim(); }

    private static String extractImage(SyndEntry e, String html) {
        if (e.getEnclosures()!=null && !e.getEnclosures().isEmpty()) {
            for (SyndEnclosure enc : e.getEnclosures()) {
                if (enc.getUrl()!=null && enc.getType()!=null && enc.getType().startsWith("image")) {
                    return enc.getUrl();
                }
            }
            if (e.getEnclosures().get(0).getUrl()!=null) return e.getEnclosures().get(0).getUrl();
        }
        if (e.getForeignMarkup()!=null) {
            var fm = e.getForeignMarkup();
            for (var el : fm) {
                if ("content".equalsIgnoreCase(el.getName()) && el.getAttribute("url")!=null) {
                    return el.getAttribute("url").getValue();
                }
            }
        }
        if (html!=null) {
            Document doc = Jsoup.parse(html);
            Element img = doc.selectFirst("img[src]");
            if (img!=null) return img.attr("src");
        }
        return null;
    }

    public static String uniqueKey(String source, String title) {
        try {
            var md = java.security.MessageDigest.getInstance("SHA-256");
            byte[] h = md.digest((source + "|" + title).getBytes(java.nio.charset.StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder();
            for (int i = 0; i < 12; i++) sb.append(String.format("%02x", h[i]));
            return sb.toString();
        } catch (Exception e) {
            return java.util.UUID.randomUUID().toString().substring(0, 24);
        }
    }

    private static String domain(String url){
        try { return new URL(url).getHost().toLowerCase(); } catch(Exception e){ return ""; }
    }

    private static String normalize(String s){
        String out = s.toLowerCase(Locale.ROOT);
        out = java.text.Normalizer.normalize(out, java.text.Normalizer.Form.NFD)
                .replaceAll("\\p{M}+", ""); // supprime accents
        return out;
    }
}
