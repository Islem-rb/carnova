package CarNova.carnova.api;
import CarNova.carnova.entity.User;
import CarNova.carnova.repository.UserRepository;
import CarNova.carnova.service.CurrentUser;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jwt.*;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import java.time.Instant;
import java.util.*;
@RestController @RequestMapping("/api/auth")
public class AuthController {
 private final UserRepository users; private final PasswordEncoder passwords; private final JwtEncoder encoder; private final CurrentUser current; private final long expiry;
 private final String dummy;
 public AuthController(UserRepository users,PasswordEncoder passwords,JwtEncoder encoder,CurrentUser current,@Value("${app.jwt-expiration}") long expiry) {this.users=users;this.passwords=passwords;this.encoder=encoder;this.current=current;this.expiry=expiry;this.dummy=passwords.encode(UUID.randomUUID().toString());}
 @PostMapping("/signup") @ResponseStatus(HttpStatus.CREATED)
 public Map<String,String> signup(@Valid @RequestBody Contracts.Signup r) {
  if(users.existsByEmailIgnoreCase(r.email().strip())) throw new ResponseStatusException(HttpStatus.CONFLICT,"Cette adresse e-mail est déjà utilisée.");
  User u=new User();u.nom=r.nom().strip();u.prenom=r.prenom().strip();u.email=r.email().strip().toLowerCase(Locale.ROOT);u.password=passwords.encode(r.password());u.role="ROLE_USER";users.save(u);
  return Map.of("message","Votre compte est créé. Vous pouvez vous connecter.");
 }
 @PostMapping("/signin") public Contracts.Session signin(@Valid @RequestBody Contracts.Login r) {
  var user=users.findByEmailIgnoreCase(r.email().strip());
  boolean valid=passwords.matches(r.password(),user.map(u->u.password).orElse(dummy));
  if(user.isEmpty()||!valid) throw new ResponseStatusException(HttpStatus.UNAUTHORIZED,"E-mail ou mot de passe incorrect.");
  var u=user.get(); var now=Instant.now();
  var claims=JwtClaimsSet.builder().issuer("carnova").subject(u.email).issuedAt(now).expiresAt(now.plusSeconds(expiry)).claim("uid",u.id).build();
  String token=encoder.encode(JwtEncoderParameters.from(JwsHeader.with(MacAlgorithm.HS256).build(),claims)).getTokenValue();
  return new Contracts.Session(token,"Bearer",u.id,u.email,u.prenom+" "+u.nom,List.of(u.role),expiry);
 }
 @GetMapping("/me") public Map<String,Object> me(Authentication a) {var u=current.get(a);return Map.of("id",u.id,"email",u.email,"name",u.prenom+" "+u.nom,"roles",List.of(u.role));}
 @GetMapping("/test") public Map<String,String> test() {return Map.of("message","Accès autorisé");}
}
