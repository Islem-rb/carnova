package CarNova.carnova;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import CarNova.carnova.api.*;
import CarNova.carnova.entity.User;
import CarNova.carnova.repository.UserRepository;
import CarNova.carnova.service.*;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.Clock;
import java.util.Optional;
import org.junit.jupiter.api.*;
import org.mockito.MockMakers;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.TestingAuthenticationToken;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.test.web.servlet.*;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

class AccountControllerTests {
  private MockMvc mvc;
  private UserRepository users;
  private User user;
  @BeforeEach void setup() {
    users = mock(UserRepository.class, withSettings().mockMaker(MockMakers.PROXY));
    var events = mock(ApplicationEventPublisher.class, withSettings().mockMaker(MockMakers.PROXY));
    var passwords = new BCryptPasswordEncoder(4);
    user = new User(); user.id = 1L; user.email = "client@example.com";
    user.prenom = "Amine"; user.nom = "Client"; user.role = "ROLE_USER";
    user.password = passwords.encode("OldPassword123!");
    when(users.findByEmailIgnoreCase(user.email)).thenReturn(Optional.of(user));
    when(users.lockByEmail(user.email)).thenReturn(Optional.of(user));
    when(users.lockById(1L)).thenReturn(Optional.of(user));
    var controller = new AccountController(new AccountService(users, passwords, events, Clock.systemUTC()), new CurrentUser(users));
    mvc = MockMvcBuilders.standaloneSetup(controller).setControllerAdvice(new ApiErrors()).build();
  }
  @Test void resetRequestHasSameResponseForExistingAndUnknownAddresses() throws Exception {
    String known = mvc.perform(post("/api/auth/forgot-password").contentType(MediaType.APPLICATION_JSON)
        .content("{\"email\":\"client@example.com\"}")).andExpect(status().isAccepted()).andReturn().getResponse().getContentAsString();
    String unknown = mvc.perform(post("/api/auth/forgot-password").contentType(MediaType.APPLICATION_JSON)
        .content("{\"email\":\"missing@example.com\"}")).andExpect(status().isAccepted()).andReturn().getResponse().getContentAsString();
    assertThat(known).isEqualTo(unknown);
  }
  @Test void invalidAddressesAndTokensReturnStructuredValidationErrors() throws Exception {
    mvc.perform(post("/api/auth/forgot-password").contentType(MediaType.APPLICATION_JSON).content("{\"email\":\"invalid\"}"))
        .andExpect(status().isBadRequest()).andExpect(jsonPath("$.fields.email").exists());
    mvc.perform(post("/api/auth/verify-email").contentType(MediaType.APPLICATION_JSON).content("{\"token\":\"short\"}"))
        .andExpect(status().isBadRequest()).andExpect(jsonPath("$.fields.token").exists());
  }
  @Test void unicodePasswordsOverBcryptByteLimitReturn400() throws Exception {
    String body = new ObjectMapper().writeValueAsString(new Contracts.ResetPassword("x".repeat(43), "é".repeat(40)));
    mvc.perform(post("/api/auth/reset-password").contentType(MediaType.APPLICATION_JSON).content(body))
        .andExpect(status().isBadRequest()).andExpect(jsonPath("$.fields.newPassword").exists());
  }
  @Test void profileRejectsBlankNamesAndDoesNotAcceptEmailOrRoleChanges() throws Exception {
    var auth = new TestingAuthenticationToken(user.email, "", "ROLE_USER");
    mvc.perform(patch("/api/auth/me").principal(auth).contentType(MediaType.APPLICATION_JSON)
        .content("{\"prenom\":\"   \",\"nom\":\"Client\"}"))
        .andExpect(status().isBadRequest()).andExpect(jsonPath("$.fields.prenom").exists());
    mvc.perform(patch("/api/auth/me").principal(auth).contentType(MediaType.APPLICATION_JSON)
        .content("{\"prenom\":\"Amine\",\"nom\":\"Updated\",\"email\":\"other@example.com\",\"role\":\"ROLE_ADMIN\"}"))
        .andExpect(status().isOk()).andExpect(jsonPath("$.email").value(user.email))
        .andExpect(jsonPath("$.roles[0]").value("ROLE_USER"))
        .andExpect(jsonPath("$.password").doesNotExist()).andExpect(jsonPath("$.resetTokenHash").doesNotExist());
  }
  @Test void wrongCurrentPasswordIsA400AndDoesNotInvalidateSession() throws Exception {
    mvc.perform(post("/api/auth/change-password").principal(new TestingAuthenticationToken(user.email, "", "ROLE_USER"))
        .contentType(MediaType.APPLICATION_JSON).content("{\"currentPassword\":\"WrongPassword123!\",\"newPassword\":\"NewPassword123!\"}"))
        .andExpect(status().isBadRequest());
    assertThat(user.authVersion).isZero();
  }
  @Test void unauthenticatedProfileMutationIsRejected() throws Exception {
    mvc.perform(patch("/api/auth/me").contentType(MediaType.APPLICATION_JSON).content("{\"prenom\":\"Amine\",\"nom\":\"Client\"}"))
        .andExpect(status().isUnauthorized());
  }
}
