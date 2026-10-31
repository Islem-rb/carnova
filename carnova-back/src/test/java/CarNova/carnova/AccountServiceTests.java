package CarNova.carnova;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

import CarNova.carnova.api.Contracts;
import CarNova.carnova.entity.User;
import CarNova.carnova.repository.UserRepository;
import CarNova.carnova.security.SessionAuthorities;
import CarNova.carnova.service.*;
import java.time.*;
import java.util.*;
import org.junit.jupiter.api.*;
import org.mockito.*;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.InvalidBearerTokenException;
import org.springframework.web.server.ResponseStatusException;

class AccountServiceTests {
  private UserRepository users;
  private ApplicationEventPublisher events;
  private AccountService service;
  private final BCryptPasswordEncoder passwords = new BCryptPasswordEncoder(4);
  private MutableClock clock;
  private User user;

  static class MutableClock extends Clock {
    Instant now = Instant.parse("2026-10-31T12:00:00Z");
    public ZoneId getZone() { return ZoneOffset.UTC; }
    public Clock withZone(ZoneId zone) { return this; }
    public Instant instant() { return now; }
  }

  @BeforeEach void setup() {
    users = mock(UserRepository.class, withSettings().mockMaker(MockMakers.PROXY));
    events = mock(ApplicationEventPublisher.class, withSettings().mockMaker(MockMakers.PROXY));
    clock = new MutableClock();
    service = new AccountService(users, passwords, events, clock);
    user = new User(); user.id = 1L; user.email = "client@example.com";
    user.nom = "Client"; user.prenom = "Amine"; user.role = "ROLE_USER";
    user.password = passwords.encode("OldPassword123!");
    when(users.lockById(1L)).thenReturn(Optional.of(user));
    when(users.lockByEmail(user.email)).thenReturn(Optional.of(user));
    when(users.findByEmailIgnoreCase(user.email)).thenReturn(Optional.of(user));
    when(users.findByResetTokenHash(anyString())).thenAnswer(i ->
        Objects.equals(i.getArgument(0), user.resetTokenHash) ? Optional.of(user) : Optional.empty());
    when(users.findByVerificationTokenHash(anyString())).thenAnswer(i ->
        Objects.equals(i.getArgument(0), user.verificationTokenHash) ? Optional.of(user) : Optional.empty());
  }

  private AccountMail.Message message() {
    var capture = ArgumentCaptor.forClass(AccountMail.Message.class);
    verify(events, atLeastOnce()).publishEvent(capture.capture());
    return capture.getValue();
  }
  private Jwt jwt(Object version) {
    var builder = Jwt.withTokenValue("test-token").header("alg", "HS256").subject(user.email)
        .issuedAt(clock.instant()).expiresAt(clock.instant().plusSeconds(3600));
    if (version != null) builder.claim("ver", version);
    return builder.build();
  }
  private void invalid(Runnable action) {
    assertThatThrownBy(action::run).isInstanceOf(ResponseStatusException.class)
        .hasMessageContaining("Ce lien est invalide ou a expiré");
  }

  @Test void registrationNormalizesNamesAndEmailAndCannotGrantAdmin() {
    service.register(new Contracts.Signup(" Client ", " Amine ", " CLIENT@example.com ", "NewPassword123!", "ROLE_ADMIN"));
    var capture = ArgumentCaptor.forClass(User.class);
    verify(users, atLeastOnce()).save(capture.capture());
    var saved = capture.getValue();
    assertThat(saved.email).isEqualTo("client@example.com");
    assertThat(saved.prenom).isEqualTo("Amine"); assertThat(saved.nom).isEqualTo("Client");
    assertThat(saved.role).isEqualTo("ROLE_USER"); assertThat(saved.emailVerified).isFalse();
    assertThat(passwords.matches("NewPassword123!", saved.password)).isTrue();
    assertThat(message().verification()).isTrue();
    assertThat(saved.verificationTokenHash).isEqualTo(AccountService.hash(message().token()));
    assertThat(saved.verificationTokenHash).doesNotContain(message().token());
  }
  @Test void duplicateRegistrationDoesNotIssueMail() {
    when(users.existsByEmailIgnoreCase(user.email)).thenReturn(true);
    assertThatThrownBy(() -> service.register(new Contracts.Signup("C", "A", user.email, "NewPassword123!", null)))
        .isInstanceOf(ResponseStatusException.class).hasMessageContaining("409");
    verifyNoInteractions(events);
  }
  @Test void resetRequestStoresOnlyHashWithThirtyMinuteExpiry() {
    service.requestReset(" client@example.com ");
    assertThat(message().token()).matches("[A-Za-z0-9_-]{43}");
    assertThat(message().verification()).isFalse();
    assertThat(user.resetTokenHash).isEqualTo(AccountService.hash(message().token()));
    assertThat(user.resetExpiresAt).isEqualTo(clock.instant().plusSeconds(1800));
    assertThat(message().toString()).doesNotContain(message().token(), user.email);
  }
  @Test void unknownResetAddressIssuesNoMail() {
    service.requestReset("missing@example.com");
    verifyNoInteractions(events);
  }
  @Test void resetCooldownDoesNotInvalidateExistingLinkOrSendAgain() {
    service.requestReset(user.email); String hash = user.resetTokenHash;
    clock.now = clock.now.plusSeconds(59); service.requestReset(user.email);
    assertThat(user.resetTokenHash).isEqualTo(hash);
    verify(events, times(1)).publishEvent(any(Object.class));
  }
  @Test void replacementResetLinkInvalidatesPreviousLink() {
    service.requestReset(user.email); String old = message().token();
    clock.now = clock.now.plusSeconds(61); service.requestReset(user.email);
    assertThat(message().token()).isNotEqualTo(old);
    invalid(() -> service.resetPassword(new Contracts.ResetPassword(old, "NewPassword123!")));
  }
  @Test void validResetChangesHashRevokesSessionsAndCannotBeReplayed() {
    service.requestReset(user.email); String token = message().token();
    service.resetPassword(new Contracts.ResetPassword(token, "NewPassword123!"));
    assertThat(passwords.matches("NewPassword123!", user.password)).isTrue();
    assertThat(passwords.matches("OldPassword123!", user.password)).isFalse();
    assertThat(user.authVersion).isEqualTo(1); assertThat(user.resetTokenHash).isNull();
    assertThat(user.resetExpiresAt).isNull(); assertThat(user.emailVerified).isFalse();
    invalid(() -> service.resetPassword(new Contracts.ResetPassword(token, "OtherPassword123!")));
  }
  @Test void resetAtExactExpiryAndTamperedLinksAreRejected() {
    service.requestReset(user.email); String token = message().token();
    clock.now = clock.now.plusSeconds(1800);
    invalid(() -> service.resetPassword(new Contracts.ResetPassword(token, "NewPassword123!")));
    invalid(() -> service.resetPassword(new Contracts.ResetPassword("x".repeat(43), "NewPassword123!")));
    assertThat(user.authVersion).isZero();
  }
  @Test void wrongCurrentPasswordDoesNotChangeStateOrRevokeSessions() {
    assertThatThrownBy(() -> service.changePassword(1L, new Contracts.ChangePassword("WrongPassword123!", "NewPassword123!")))
        .isInstanceOf(ResponseStatusException.class).hasMessageContaining("actuel est incorrect");
    assertThat(user.authVersion).isZero();
    assertThat(passwords.matches("OldPassword123!", user.password)).isTrue();
  }
  @Test void unchangedPasswordIsRejected() {
    assertThatThrownBy(() -> service.changePassword(1L, new Contracts.ChangePassword("OldPassword123!", "OldPassword123!")))
        .isInstanceOf(ResponseStatusException.class).hasMessageContaining("différent");
    assertThat(user.authVersion).isZero();
  }
  @Test void passwordChangeAlsoRevokesOutstandingResetLinks() {
    service.requestReset(user.email); String token = message().token();
    service.changePassword(1L, new Contracts.ChangePassword("OldPassword123!", "NewPassword123!"));
    assertThat(user.authVersion).isEqualTo(1);
    invalid(() -> service.resetPassword(new Contracts.ResetPassword(token, "OtherPassword123!")));
  }
  @Test void verificationIsSingleUseAndHasSeparatePurpose() {
    service.requestVerification(1L); String token = message().token();
    assertThat(user.verificationExpiresAt).isEqualTo(clock.instant().plusSeconds(86400));
    invalid(() -> service.resetPassword(new Contracts.ResetPassword(token, "NewPassword123!")));
    service.verifyEmail(token);
    assertThat(user.emailVerified).isTrue(); assertThat(user.verificationTokenHash).isNull();
    assertThat(user.authVersion).isZero(); invalid(() -> service.verifyEmail(token));
  }
  @Test void expiredVerificationCannotConfirmAccount() {
    service.requestVerification(1L); String token = message().token();
    clock.now = clock.now.plusSeconds(86400); invalid(() -> service.verifyEmail(token));
    assertThat(user.emailVerified).isFalse();
  }
  @Test void verificationResendEnforcesCooldownAndReplacesOldLink() {
    service.requestVerification(1L); String old = message().token();
    assertThatThrownBy(() -> service.requestVerification(1L)).isInstanceOf(ResponseStatusException.class).hasMessageContaining("429");
    clock.now = clock.now.plusSeconds(60); service.requestVerification(1L);
    invalid(() -> service.verifyEmail(old)); service.verifyEmail(message().token());
    assertThat(user.emailVerified).isTrue();
  }
  @Test void verifiedUserDoesNotReceiveAnotherVerificationLink() {
    user.emailVerified = true; service.requestVerification(1L); verifyNoInteractions(events);
  }
  @Test void profileUpdateOnlyChangesNames() {
    var profile = service.updateProfile(1L, new Contracts.ProfileInput(" Amine ", " Ben Ali "));
    assertThat(profile.name()).isEqualTo("Amine Ben Ali");
    assertThat(profile.email()).isEqualTo(user.email); assertThat(profile.roles()).containsExactly("ROLE_USER");
    assertThat(user.authVersion).isZero(); assertThat(user.emailVerified).isFalse();
    verifyNoInteractions(events);
  }
  @Test void currentAndLegacySessionsAreRejectedAfterPasswordUpdate() {
    var converter = new SessionAuthorities(users);
    var legacy = jwt(null); var current = jwt(0L);
    assertThat(converter.convert(legacy)).hasSize(1); assertThat(converter.convert(current)).hasSize(1);
    service.changePassword(1L, new Contracts.ChangePassword("OldPassword123!", "NewPassword123!"));
    assertThatThrownBy(() -> converter.convert(legacy)).isInstanceOf(InvalidBearerTokenException.class);
    assertThatThrownBy(() -> converter.convert(current)).isInstanceOf(InvalidBearerTokenException.class);
    assertThat(converter.convert(jwt(1L))).hasSize(1);
  }
  @Test void deletedAccountAndMalformedSessionVersionAreRejected() {
    var converter = new SessionAuthorities(users);
    assertThatThrownBy(() -> converter.convert(jwt("0"))).isInstanceOf(InvalidBearerTokenException.class);
    when(users.findByEmailIgnoreCase(user.email)).thenReturn(Optional.empty());
    assertThatThrownBy(() -> converter.convert(jwt(0L))).isInstanceOf(InvalidBearerTokenException.class);
  }
}
