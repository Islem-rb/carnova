package CarNova.carnova.api;
import CarNova.carnova.repository.AnnonceRepository;
import CarNova.carnova.service.*;
import org.springframework.core.io.*;
import org.springframework.http.*;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;
import java.io.IOException;
import java.nio.file.*;
import java.util.Map;
@RestController
public class FileController {
 private final FileStorage files;private final AnnonceRepository listings;private final CurrentUser current;
 public FileController(FileStorage f,AnnonceRepository a,CurrentUser c){files=f;listings=a;current=c;}
 @PostMapping("/api/uploads") public Map<String,String> image(@RequestParam MultipartFile image) throws IOException {return Map.of("url",files.image(image));}
 @PostMapping("/api/models/upload") @Transactional public Map<String,String> model(@RequestParam MultipartFile glb,@RequestParam(required=false) Long annonceId,Authentication auth) throws IOException {
  var user=current.get(auth);var listing=annonceId==null?null:listings.findById(annonceId).orElseThrow(()->new ResponseStatusException(HttpStatus.NOT_FOUND,"Annonce introuvable."));
  if(listing!=null) current.owner(listing.user.id,user);
  String url=files.model(glb);if(listing!=null){listing.model3dUrl=url;listings.save(listing);}return Map.of("model3dUrl",url);
 }
 @GetMapping({"/uploads/{name:.+}","/api/annonces/uploads/{name:.+}"}) public ResponseEntity<Resource> image(@PathVariable String name) throws IOException {return serve(name,false);}
 @GetMapping("/api/models/{name:.+}") public ResponseEntity<Resource> model(@PathVariable String name) throws IOException {return serve(name,true);}
 private ResponseEntity<Resource> serve(String name,boolean model) throws IOException {
  var p=files.resolve(name,model);String type=model?"model/gltf-binary":Files.probeContentType(p);
  return ResponseEntity.ok().cacheControl(CacheControl.maxAge(java.time.Duration.ofDays(30))).header("X-Content-Type-Options","nosniff").contentType(MediaType.parseMediaType(type==null?"application/octet-stream":type)).body(new FileSystemResource(p));
 }
}
