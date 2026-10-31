package CarNova.carnova;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import CarNova.carnova.api.*;
import CarNova.carnova.entity.User;
import CarNova.carnova.repository.UserRepository;
import CarNova.carnova.security.SecurityConfig;
import CarNova.carnova.service.*;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.Clock;
import java.util.*;
import org.junit.jupiter.api.*;
import org.mockito.MockMakers;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.context.annotation.*;
import org.springframework.http.MediaType;
import org.springframework.mock.env.MockEnvironment;
import org.springframework.mock.web.MockServletContext;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.web.FilterChainProxy;
import org.springframework.test.web.servlet.*;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.support.AnnotationConfigWebApplicationContext;
import org.springframework.web.servlet.config.annotation.EnableWebMvc;

/** Real JWT encoding, decoding and authorization; persistence is isolated with a repository double. */
class AccountSecurityTests {
  @org.springframework.boot.test.context.TestConfiguration
  @EnableWebMvc
  @EnableWebSecurity
  @Import({SecurityConfig.class, ApiErrors.class})
  static class Config {
    @Bean UserRepository users() {
      return mock(UserRepository.class, withSettings().mockMaker(MockMakers.PROXY));
    }
    @Bean CurrentUser current(UserRepository users) { return new CurrentUser(users); }
    @Bean AccountService accounts(UserRepository users, PasswordEncoder passwords, ApplicationEventPublisher events) {
      return new AccountService(users, passwords, events, Clock.systemUTC());
    }
    @Bean AuthController auth(UserRepository users, PasswordEncoder passwords, JwtEncoder encoder, CurrentUser current, AccountService accounts) {
      return new AuthController(users, passwords, encoder, current, accounts, 3600);
    }
    @Bean AccountController account(AccountService accounts, CurrentUser current) { return new AccountController(accounts, current); }
  }
  private AnnotationConfigWebApplicationContext context;
  private MockMvc mvc;
  private User user;
  private final ObjectMapper json = new ObjectMapper();

  @BeforeEach void setup() {
    context = new AnnotationConfigWebApplicationContext();
    context.setEnvironment(new MockEnvironment()
        .withProperty("app.jwt-secret", "account-security-test-only-key-0123456789")
        .withProperty("app.cors-origins", "http://localhost:4200"));
    context.setServletContext(new MockServletContext()); context.register(Config.class); context.refresh();
    var users = context.getBean(UserRepository.class);
    user = new User(); user.id = 1L; user.email = "security@example.com";
    user.prenom = "Amine"; user.nom = "Client"; user.role = "ROLE_USER";
    user.password = new org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder(4).encode("OldPassword123!");
    when(users.findByEmailIgnoreCase(user.email)).thenReturn(Optional.of(user));
    when(users.lockById(1L)).thenReturn(Optional.of(user));
    when(users.lockByEmail(user.email)).thenReturn(Optional.of(user));
    when(users.findByResetTokenHash(anyString())).thenAnswer(i -> Objects.equals(user.resetTokenHash, i.getArgument(0)) ? Optional.of(user) : Optional.empty());
    mvc = MockMvcBuilders.webAppContextSetup(context).addFilters(context.getBean(FilterChainProxy.class)).build();
  }
  @AfterEach void cleanup() { SecurityContextHolder.clearContext(); if (context != null) context.close(); }
  private String login(String password) throws Exception {
    var result = mvc.perform(post("/api/auth/signin").contentType(MediaType.APPLICATION_JSON)
        .content(json.writeValueAsString(new Contracts.Login(user.email, password))))
        .andExpect(status().isOk()).andReturn();
    return json.readTree(result.getResponse().getContentAsString()).get("token").asText();
  }
  @Test void passwordChangeRevokesAllOldJwtSessionsAndFreshLoginWorks() throws Exception {
    String first = login("OldPassword123!"); String second = login("OldPassword123!");
    mvc.perform(post("/api/auth/change-password").header("Authorization", "Bearer " + first)
        .contentType(MediaType.APPLICATION_JSON)
        .content(json.writeValueAsString(new Contracts.ChangePassword("OldPassword123!", "NewPassword123!"))))
        .andExpect(status().isOk());
    for (String token : List.of(first, second)) mvc.perform(get("/api/auth/me").header("Authorization", "Bearer " + token)).andExpect(status().isUnauthorized());
    mvc.perform(post("/api/auth/signin").contentType(MediaType.APPLICATION_JSON)
        .content(json.writeValueAsString(new Contracts.Login(user.email, "OldPassword123!")))).andExpect(status().isUnauthorized());
    String fresh = login("NewPassword123!");
    mvc.perform(get("/api/auth/me").header("Authorization", "Bearer " + fresh)).andExpect(status().isOk()).andExpect(jsonPath("$.emailVerified").value(false));
  }
  @Test void anonymousResetRevokesAnExistingJwtAndTheLinkCannotBeReplayed() throws Exception {
    String session = login("OldPassword123!"); String token = "r".repeat(43);
    user.resetTokenHash = AccountService.hash(token); user.resetExpiresAt = java.time.Instant.now().plusSeconds(60);
    var body = json.writeValueAsString(new Contracts.ResetPassword(token, "NewPassword123!"));
    mvc.perform(post("/api/auth/reset-password").contentType(MediaType.APPLICATION_JSON).content(body)).andExpect(status().isOk());
    mvc.perform(get("/api/auth/me").header("Authorization", "Bearer " + session)).andExpect(status().isUnauthorized());
    mvc.perform(post("/api/auth/reset-password").contentType(MediaType.APPLICATION_JSON).content(body)).andExpect(status().isBadRequest());
    login("NewPassword123!");
  }
  @Test void profileAndResendRequireAuthenticationAndAdminAccessIsNotGranted() throws Exception {
    mvc.perform(get("/api/auth/me")).andExpect(status().isUnauthorized());
    mvc.perform(patch("/api/auth/me").contentType(MediaType.APPLICATION_JSON).content("{\"prenom\":\"Amine\",\"nom\":\"Client\"}")).andExpect(status().isUnauthorized());
    mvc.perform(post("/api/auth/verification-email").contentType(MediaType.APPLICATION_JSON).content("{}")).andExpect(status().isUnauthorized());
    String token = login("OldPassword123!");
    mvc.perform(get("/api/admin/overview").header("Authorization", "Bearer " + token)).andExpect(status().isForbidden());
  }
  @Test void incorrectCurrentPasswordPreservesTheAuthenticatedSession() throws Exception {
    String token = login("OldPassword123!");
    mvc.perform(post("/api/auth/change-password").header("Authorization", "Bearer " + token).contentType(MediaType.APPLICATION_JSON)
        .content(json.writeValueAsString(new Contracts.ChangePassword("WrongPassword123!", "NewPassword123!"))))
        .andExpect(status().isBadRequest());
    mvc.perform(get("/api/auth/me").header("Authorization", "Bearer " + token)).andExpect(status().isOk());
    assertThat(user.authVersion).isZero();
  }
  @Test void resetRequestIsPublicAndDoesNotExposeAccountExistence() throws Exception {
    mvc.perform(post("/api/auth/forgot-password").contentType(MediaType.APPLICATION_JSON).content("{\"email\":\"missing@example.com\"}"))
        .andExpect(status().isAccepted()).andExpect(jsonPath("$.token").doesNotExist());
    mvc.perform(post("/api/auth/verify-email").contentType(MediaType.APPLICATION_JSON).content("{\"token\":\"short\"}"))
        .andExpect(status().isBadRequest());
  }
}
