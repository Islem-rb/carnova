package CarNova.carnova.api;
import CarNova.carnova.entity.ContactMessage;
import CarNova.carnova.repository.*;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import java.time.*;
import java.util.*;
@RestController
public class PlatformController {
 private final UserRepository users;private final AnnonceRepository listings;private final ShowroomRepository showrooms;private final ContactMessageRepository contacts;private final NewsItemRepository news;private final boolean demo;
 public PlatformController(UserRepository u,AnnonceRepository a,ShowroomRepository s,ContactMessageRepository c,NewsItemRepository n,@Value("${app.demo-data}") boolean demo){users=u;listings=a;showrooms=s;contacts=c;news=n;this.demo=demo;}
 @GetMapping("/api/meta") public Map<String,Object> meta(){return Map.of("demo",demo,"version","2.0.0");}
 @PostMapping("/api/contact") @ResponseStatus(HttpStatus.CREATED) public Map<String,String> contact(@Valid @RequestBody Contracts.Contact r){var c=new ContactMessage();c.name=r.name();c.email=r.email();c.message=r.message();contacts.save(c);return Map.of("message","Votre message a été enregistré. Merci de nous avoir contactés.");}
 @GetMapping("/api/admin/overview") @Transactional(readOnly=true) public Map<String,Object> overview(){
  var all=listings.findAll();var months=new ArrayList<Map<String,Object>>();
  for(int i=5;i>=0;i--){var m=YearMonth.now(ZoneOffset.UTC).minusMonths(i);long count=all.stream().filter(a->a.createdAt!=null&&YearMonth.from(a.createdAt.atZone(ZoneOffset.UTC)).equals(m)).count();months.add(Map.of("month",m.toString(),"count",count));}
  return Map.of("users",users.count(),"listings",listings.count(),"showrooms",showrooms.count(),"news",news.count(),"months",months,"recentListings",all.stream().sorted(Comparator.comparing((CarNova.carnova.entity.Annonce a)->a.id).reversed()).limit(8).map(Views::listing).toList(),"messages",contacts.findTop50ByOrderByCreatedAtDesc());
 }
}
