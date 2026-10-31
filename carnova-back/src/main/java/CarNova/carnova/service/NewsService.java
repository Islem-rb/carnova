package CarNova.carnova.service;
import CarNova.carnova.entity.NewsItem;
import CarNova.carnova.repository.NewsItemRepository;
import com.rometools.rome.io.*;
import org.jsoup.Jsoup;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.net.*;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.*;
@Service
public class NewsService {
 private final NewsItemRepository repo;
 public NewsService(NewsItemRepository r){repo=r;}
 @Transactional public int refresh(){
  // Fixed source only: no caller-supplied fetch URL or redirect to private networks.
  try {
   var c=(HttpURLConnection)new URI("https://news.google.com/rss/search?q=automobile%20Tunisie&hl=fr&gl=TN&ceid=TN:fr").toURL().openConnection();c.setConnectTimeout(4000);c.setReadTimeout(6000);c.setInstanceFollowRedirects(false);c.setRequestProperty("User-Agent","CarNova/2.0");
   try(var input=c.getInputStream();var reader=new XmlReader(new java.io.ByteArrayInputStream(input.readNBytes(2000000)))) {
    var feed=new SyndFeedInput().build(reader);int inserted=0;
    for(var e:feed.getEntries().stream().limit(30).toList()){
     if(e.getLink()==null||!e.getLink().startsWith("https://")||e.getTitle()==null)continue;
     String key=UUID.nameUUIDFromBytes(e.getLink().getBytes(StandardCharsets.UTF_8)).toString();if(repo.existsByUniqueKey(key))continue;
     var n=new NewsItem();n.uniqueKey=key;n.title=trim(Jsoup.parse(e.getTitle()).text(),300);n.summary=e.getDescription()==null?"":trim(Jsoup.parse(e.getDescription().getValue()).text(),3000);n.sourceName="Google News · Tunisie";n.sourceUrl=trim(e.getLink(),600);n.publishedAt=e.getPublishedDate()==null?Instant.now():e.getPublishedDate().toInstant();repo.save(n);inserted++;
    }
    return inserted;
   } finally {c.disconnect();}
  }catch(Exception e){throw new org.springframework.web.server.ResponseStatusException(org.springframework.http.HttpStatus.BAD_GATEWAY,"La source d'actualités est temporairement indisponible.");}
 }
 private String trim(String s,int max){return s.substring(0,Math.min(s.length(),max));}
}
