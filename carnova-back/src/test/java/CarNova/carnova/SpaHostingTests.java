package CarNova.carnova;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;

/** The test classpath packages a static/index.html, as the single-service Render image does. */
@SpringBootTest
@AutoConfigureMockMvc
class SpaHostingTests {
  @Autowired MockMvc mvc;

  @Test
  void clientRoutesRenderTheAngularShellWithoutLogin() throws Exception {
    for (String route : new String[] {"/", "/studio", "/annonces/12", "/espace/parametres"})
      mvc.perform(get(route)).andExpect(status().isOk()).andExpect(forwardedUrl("/index.html"));
  }

  @Test
  void entryPageIsRevalidatedAndCarriesTheSecurityHeaders() throws Exception {
    mvc.perform(get("/index.html"))
        .andExpect(status().isOk())
        .andExpect(content().string(containsString("spa-shell")))
        .andExpect(header().string("Cache-Control", containsString("no-cache")))
        .andExpect(header().string("Content-Security-Policy", containsString("script-src 'self' https://js.stripe.com;")))
        .andExpect(header().string("Referrer-Policy", "strict-origin-when-cross-origin"))
        .andExpect(header().string("Permissions-Policy", "camera=(), microphone=(), geolocation=()"))
        .andExpect(header().string("X-Frame-Options", "DENY"));
  }

  @Test
  void missingFilesStay404InsteadOfReturningTheShell() throws Exception {
    mvc.perform(get("/assets/missing.webp")).andExpect(status().isNotFound());
  }

  @Test
  void apiAndActuatorAreNeverOpenedOrRewrittenByThePageRules() throws Exception {
    mvc.perform(get("/api/annonces/my-annonces")).andExpect(status().isUnauthorized());
    mvc.perform(get("/api/does-not-exist")).andExpect(status().isUnauthorized());
    mvc.perform(get("/actuator/info")).andExpect(status().isUnauthorized());
    mvc.perform(post("/studio")).andExpect(status().isUnauthorized());
    mvc.perform(get("/api/meta")).andExpect(status().isOk()).andExpect(jsonPath("$.mail").value(true));
  }

  @Test
  void encodedSpellingsOfServerPathsAreNotTreatedAsPublicPages() throws Exception {
    // Security matches the decoded path (/actuator/info, /api/auth/me), like the MVC router does.
    for (String raw : new String[] {"/%61ctuator/info", "/%61pi/auth/me", "/api/%61dmin/overview"})
      mvc.perform(get(java.net.URI.create(raw))).andExpect(status().isUnauthorized());
  }
}
