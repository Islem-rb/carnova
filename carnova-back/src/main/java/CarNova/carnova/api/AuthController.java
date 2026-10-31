package CarNova.carnova.api;

import CarNova.carnova.repository.UserRepository;
import CarNova.carnova.service.CurrentUser;
import CarNova.carnova.service.AccountService;
import jakarta.validation.Valid;
import java.time.Instant;
import java.util.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
  private final UserRepository users;
  private final PasswordEncoder passwords;
  private final JwtEncoder encoder;
  private final CurrentUser current;
  private final long expiry;
  private final String dummy;
  private final AccountService accounts;

  public AuthController(
      UserRepository users,
      PasswordEncoder passwords,
      JwtEncoder encoder,
      CurrentUser current,
      AccountService accounts,
      @Value("${app.jwt-expiration}") long expiry) {
    this.users = users;
    this.passwords = passwords;
    this.encoder = encoder;
    this.current = current;
    this.accounts = accounts;
    this.expiry = expiry;
    this.dummy = passwords.encode(UUID.randomUUID().toString());
  }

  @PostMapping("/signup")
  @ResponseStatus(HttpStatus.CREATED)
  public Map<String, String> signup(@Valid @RequestBody Contracts.Signup r) {
    accounts.register(r);
    return Map.of("message", "Votre compte est créé. Vous pouvez vous connecter.");
  }

  @PostMapping("/signin")
  public Contracts.Session signin(@Valid @RequestBody Contracts.Login r) {
    var user = users.findByEmailIgnoreCase(r.email().strip());
    boolean valid = passwords.matches(r.password(), user.map(u -> u.getPassword()).orElse(dummy));
    if (user.isEmpty() || !valid)
      throw new ResponseStatusException(
          HttpStatus.UNAUTHORIZED, "E-mail ou mot de passe incorrect.");
    var u = user.get();
    var now = Instant.now();
    var claims =
        JwtClaimsSet.builder()
            .issuer("carnova")
            .subject(u.getEmail())
            .issuedAt(now)
            .expiresAt(now.plusSeconds(expiry))
            .claim("uid", u.getId())
            .claim("ver", u.authVersion)
            .build();
    String token =
        encoder
            .encode(JwtEncoderParameters.from(JwsHeader.with(MacAlgorithm.HS256).build(), claims))
            .getTokenValue();
    return new Contracts.Session(
        token,
        "Bearer",
        u.getId(),
        u.getEmail(),
        u.getPrenom() + " " + u.getNom(),
        List.of(u.getRole()),
        expiry);
  }

  @GetMapping("/me")
  public Contracts.Profile me(Authentication auth) {
    return Contracts.Profile.of(current.get(auth));
  }

  @GetMapping("/test")
  public Map<String, String> test() {
    return Map.of("message", "Accès autorisé");
  }
}
