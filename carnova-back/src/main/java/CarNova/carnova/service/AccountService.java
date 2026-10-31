package CarNova.carnova.service;

import CarNova.carnova.api.Contracts;
import CarNova.carnova.entity.User;
import CarNova.carnova.repository.UserRepository;
import java.nio.charset.StandardCharsets;
import java.security.*;
import java.time.*;
import java.util.*;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@Transactional
public class AccountService {
  private final UserRepository users;
  private final PasswordEncoder passwords;
  private final ApplicationEventPublisher events;
  private final Clock clock;
  private final SecureRandom random = new SecureRandom();

  public AccountService(UserRepository users, PasswordEncoder passwords,
      ApplicationEventPublisher events, Clock clock) {
    this.users = users;
    this.passwords = passwords;
    this.events = events;
    this.clock = clock;
  }

  public void register(Contracts.Signup request) {
    String email = request.email().strip().toLowerCase(Locale.ROOT);
    if (users.existsByEmailIgnoreCase(email))
      throw new ResponseStatusException(HttpStatus.CONFLICT, "Cette adresse e-mail est déjà utilisée.");
    var user = new User();
    user.prenom = request.prenom().strip();
    user.nom = request.nom().strip();
    user.email = email;
    user.password = passwords.encode(request.password());
    user.role = "ROLE_USER";
    users.save(user);
    issueVerification(user);
  }

  public Contracts.Profile updateProfile(Long id, Contracts.ProfileInput request) {
    var user = locked(id);
    user.prenom = request.prenom().strip();
    user.nom = request.nom().strip();
    users.save(user);
    return Contracts.Profile.of(user);
  }

  public void requestReset(String email) {
    users.lockByEmail(email.strip()).ifPresent(user -> {
      Instant now = clock.instant();
      if (recent(user.resetRequestedAt, now)) return;
      String token = token();
      user.resetTokenHash = hash(token);
      user.resetExpiresAt = now.plus(Duration.ofMinutes(30));
      user.resetRequestedAt = now;
      users.save(user);
      events.publishEvent(new AccountMail.Message(user.email, token, false));
    });
  }

  public void resetPassword(Contracts.ResetPassword request) {
    var user = users.findByResetTokenHash(hash(request.token())).orElseThrow(this::invalidLink);
    if (user.resetExpiresAt == null || !user.resetExpiresAt.isAfter(clock.instant()))
      throw invalidLink();
    replacePassword(user, request.newPassword());
  }

  public void changePassword(Long id, Contracts.ChangePassword request) {
    var user = locked(id);
    if (!passwords.matches(request.currentPassword(), user.password))
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Le mot de passe actuel est incorrect.");
    replacePassword(user, request.newPassword());
  }

  public void requestVerification(Long id) {
    var user = locked(id);
    if (user.emailVerified) return;
    if (recent(user.verificationRequestedAt, clock.instant()))
      throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS,
          "Patientez une minute avant de demander un autre lien.");
    issueVerification(user);
  }

  public void verifyEmail(String token) {
    var user = users.findByVerificationTokenHash(hash(token)).orElseThrow(this::invalidLink);
    if (user.verificationExpiresAt == null || !user.verificationExpiresAt.isAfter(clock.instant()))
      throw invalidLink();
    user.emailVerified = true;
    user.verificationTokenHash = null;
    user.verificationExpiresAt = null;
    users.save(user);
  }

  private void replacePassword(User user, String value) {
    if (passwords.matches(value, user.password))
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
          "Choisissez un mot de passe différent de l’actuel.");
    user.password = passwords.encode(value);
    user.authVersion = Math.addExact(user.authVersion, 1);
    user.resetTokenHash = null;
    user.resetExpiresAt = null;
    users.save(user);
  }

  private void issueVerification(User user) {
    String token = token();
    user.verificationTokenHash = hash(token);
    user.verificationExpiresAt = clock.instant().plus(Duration.ofHours(24));
    user.verificationRequestedAt = clock.instant();
    users.save(user);
    events.publishEvent(new AccountMail.Message(user.email, token, true));
  }

  private User locked(Long id) {
    return users.lockById(id).orElseThrow(() ->
        new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Connexion requise"));
  }

  private boolean recent(Instant requested, Instant now) {
    return requested != null && requested.plusSeconds(60).isAfter(now);
  }

  private String token() {
    byte[] bytes = new byte[32];
    random.nextBytes(bytes);
    return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
  }

  public static String hash(String token) {
    try {
      return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256")
          .digest(token.getBytes(StandardCharsets.UTF_8)));
    } catch (NoSuchAlgorithmException e) {
      throw new IllegalStateException("SHA-256 unavailable", e);
    }
  }

  private ResponseStatusException invalidLink() {
    return new ResponseStatusException(HttpStatus.BAD_REQUEST,
        "Ce lien est invalide ou a expiré. Demandez un nouveau lien.");
  }
}
