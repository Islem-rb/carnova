package CarNova.carnova;

import static org.assertj.core.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import CarNova.carnova.api.Contracts;
import CarNova.carnova.entity.User;
import CarNova.carnova.repository.UserRepository;
import CarNova.carnova.service.AccountService;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.EntityManager;
import java.time.Instant;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

/** Exercises V3 schema validation, real repository locks and token consumption in the Maven suite. */
@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class AccountPersistenceIntegrationTests {
  @Autowired UserRepository users;
  @Autowired AccountService accounts;
  @Autowired EntityManager entityManager;
  @Autowired MockMvc mvc;
  @Autowired ObjectMapper json;

  @Test void migratedAccountsPersistVerificationStateAndNullableUniqueHashes() throws Exception {
    accounts.register(new Contracts.Signup("Client", "Amine", "persist-one@example.test", "PasswordOriginal123!", null));
    accounts.register(new Contracts.Signup("Client", "Leila", "persist-two@example.test", "PasswordOriginal123!", null));
    entityManager.flush(); entityManager.clear();
    User user = users.findByEmailIgnoreCase("persist-one@example.test").orElseThrow();
    assertThat(user.emailVerified).isFalse(); assertThat(user.authVersion).isZero();
    assertThat(user.verificationTokenHash).hasSize(64); assertThat(user.resetTokenHash).isNull();
    String token = "v".repeat(43);
    user.verificationTokenHash = AccountService.hash(token); user.verificationExpiresAt = Instant.now().plusSeconds(120);
    users.saveAndFlush(user);
    mvc.perform(post("/api/auth/verify-email").contentType(MediaType.APPLICATION_JSON).content(json.writeValueAsString(new Contracts.TokenRequest(token))))
        .andExpect(status().isOk());
    entityManager.flush(); entityManager.clear();
    assertThat(users.findByEmailIgnoreCase(user.email).orElseThrow().emailVerified).isTrue();
    mvc.perform(post("/api/auth/verify-email").contentType(MediaType.APPLICATION_JSON).content(json.writeValueAsString(new Contracts.TokenRequest(token))))
        .andExpect(status().isBadRequest());
  }

  @Test void persistedResetRevokesJwtAndCannotConsumeTheHashTwice() throws Exception {
    String email = "persist-reset@example.test";
    accounts.register(new Contracts.Signup("Client", "Amine", email, "PasswordOriginal123!", null));
    var login = mvc.perform(post("/api/auth/signin").contentType(MediaType.APPLICATION_JSON)
        .content(json.writeValueAsString(new Contracts.Login(email, "PasswordOriginal123!"))))
        .andExpect(status().isOk()).andReturn();
    String jwt = json.readTree(login.getResponse().getContentAsString()).get("token").asText();
    User user = users.findByEmailIgnoreCase(email).orElseThrow();
    String token = "r".repeat(43); user.resetTokenHash = AccountService.hash(token); user.resetExpiresAt = Instant.now().plusSeconds(120);
    users.saveAndFlush(user);
    String body = json.writeValueAsString(new Contracts.ResetPassword(token, "PasswordRecovered123!"));
    mvc.perform(post("/api/auth/reset-password").contentType(MediaType.APPLICATION_JSON).content(body)).andExpect(status().isOk());
    entityManager.flush(); entityManager.clear();
    assertThat(users.findByEmailIgnoreCase(email).orElseThrow().authVersion).isEqualTo(1);
    mvc.perform(get("/api/auth/me").header("Authorization", "Bearer " + jwt)).andExpect(status().isUnauthorized());
    mvc.perform(post("/api/auth/reset-password").contentType(MediaType.APPLICATION_JSON).content(body)).andExpect(status().isBadRequest());
  }
}
