package CarNova.carnova.api;

import CarNova.carnova.service.AccountService;
import CarNova.carnova.service.CurrentUser;
import jakarta.validation.Valid;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AccountController {
  private final AccountService accounts;
  private final CurrentUser current;

  public AccountController(AccountService accounts, CurrentUser current) {
    this.accounts = accounts;
    this.current = current;
  }

  @PostMapping("/forgot-password")
  @ResponseStatus(HttpStatus.ACCEPTED)
  public Map<String, String> forgot(@Valid @RequestBody Contracts.EmailRequest request) {
    accounts.requestReset(request.email());
    return Map.of("message", "Si un compte correspond à cette adresse, un lien de réinitialisation vous sera envoyé.");
  }

  @PostMapping("/reset-password")
  public Map<String, String> reset(@Valid @RequestBody Contracts.ResetPassword request) {
    accounts.resetPassword(request);
    return Map.of("message", "Votre mot de passe a été réinitialisé. Reconnectez-vous.");
  }

  @PostMapping("/verify-email")
  public Map<String, String> verify(@Valid @RequestBody Contracts.TokenRequest request) {
    accounts.verifyEmail(request.token());
    return Map.of("message", "Votre adresse e-mail est confirmée.");
  }

  @PostMapping("/verification-email")
  @ResponseStatus(HttpStatus.ACCEPTED)
  public Map<String, String> resend(Authentication auth) {
    accounts.requestVerification(current.get(auth).id);
    return Map.of("message", "Si votre adresse reste à confirmer, un nouveau lien vous sera envoyé.");
  }

  @PatchMapping("/me")
  public Contracts.Profile profile(Authentication auth, @Valid @RequestBody Contracts.ProfileInput request) {
    return accounts.updateProfile(current.get(auth).id, request);
  }

  @PostMapping("/change-password")
  public Map<String, String> password(Authentication auth, @Valid @RequestBody Contracts.ChangePassword request) {
    accounts.changePassword(current.get(auth).id, request);
    return Map.of("message", "Votre mot de passe a été modifié. Reconnectez-vous sur vos appareils.");
  }
}
