package CarNova.carnova.security;

import CarNova.carnova.repository.UserRepository;
import com.nimbusds.jose.jwk.source.ImmutableSecret;
import java.nio.charset.StandardCharsets;
import java.util.*;
import javax.crypto.spec.SecretKeySpec;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.*;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.*;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.servlet.util.matcher.PathPatternRequestMatcher;
import org.springframework.web.cors.*;

@Configuration
public class SecurityConfig {
  /** Same policy as carnova-front/nginx.conf; keep both in sync. */
  static final String CSP =
      "default-src 'self'; script-src 'self' https://js.stripe.com; style-src 'self'"
          + " 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self'"
          + " blob: data: https://api.stripe.com https://*.stripe.com; frame-src"
          + " https://js.stripe.com https://hooks.stripe.com; worker-src 'self' blob:; object-src"
          + " 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'";

  /**
   * Server paths, matched like every other rule here: on the decoded, normalised path, so an
   * encoded spelling such as /%61pi/… or /%61ctuator/… cannot pass for a frontend page.
   */
  public static final org.springframework.security.web.util.matcher.RequestMatcher SERVER_PATHS =
      new org.springframework.security.web.util.matcher.OrRequestMatcher(
          PathPatternRequestMatcher.withDefaults().matcher("/api/**"),
          PathPatternRequestMatcher.withDefaults().matcher("/actuator/**"));

  /** Frontend files and client-side routes, only when the Angular build is packaged in the jar. */
  static boolean publicPage(jakarta.servlet.http.HttpServletRequest r) {
    return CarNova.carnova.config.SpaHosting.PACKAGED
        && ("GET".equals(r.getMethod()) || "HEAD".equals(r.getMethod()))
        && !SERVER_PATHS.matches(r);
  }

  @Bean
  PasswordEncoder passwordEncoder() {
    return new BCryptPasswordEncoder(12);
  }

  @Bean
  SecretKeySpec key(@Value("${app.jwt-secret}") String secret) {
    if (secret.getBytes(StandardCharsets.UTF_8).length < 32)
      throw new IllegalStateException("JWT_SECRET must contain at least 32 bytes");
    return new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
  }

  @Bean
  JwtEncoder encoder(SecretKeySpec key) {
    return new NimbusJwtEncoder(new ImmutableSecret<>(key));
  }

  @Bean
  JwtDecoder decoder(SecretKeySpec key) {
    var d = NimbusJwtDecoder.withSecretKey(key).macAlgorithm(MacAlgorithm.HS256).build();
    d.setJwtValidator(JwtValidators.createDefaultWithIssuer("carnova"));
    return d;
  }

  @Bean
  SecurityFilterChain chain(
      HttpSecurity http, UserRepository users, @Value("${app.cors-origins}") String origins)
      throws Exception {
    var cors = new CorsConfiguration();
    cors.setAllowedOrigins(Arrays.asList(origins.split(",")));
    cors.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
    cors.setAllowedHeaders(List.of("Authorization", "Content-Type"));
    cors.setAllowCredentials(false);
    var source = new UrlBasedCorsConfigurationSource();
    source.registerCorsConfiguration("/**", cors);
    var converter = new JwtAuthenticationConverter();
    // Read role and session version from the database for every authenticated request.
    converter.setJwtGrantedAuthoritiesConverter(new SessionAuthorities(users));
    http.csrf(c -> c.disable())
        .cors(c -> c.configurationSource(source))
        .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
        .headers(h ->
            h.contentSecurityPolicy(c -> c.policyDirectives(CSP))
                .referrerPolicy(r ->
                    r.policy(
                        org.springframework.security.web.header.writers.ReferrerPolicyHeaderWriter
                            .ReferrerPolicy.STRICT_ORIGIN_WHEN_CROSS_ORIGIN))
                .addHeaderWriter(
                    new org.springframework.security.web.header.writers.StaticHeadersWriter(
                        "Permissions-Policy", "camera=(), microphone=(), geolocation=()")))
        .authorizeHttpRequests(a ->
            a.requestMatchers(HttpMethod.OPTIONS, "/**")
                .permitAll()
                .requestMatchers(
                    "/api/meta",
                    "/error",
                    "/actuator/health",
                    "/v3/api-docs/**",
                    "/swagger-ui/**",
                    "/swagger-ui.html")
                .permitAll()
                .requestMatchers(
                    HttpMethod.POST,
                    "/api/auth/signin",
                    "/api/auth/signup",
                    "/api/auth/forgot-password",
                    "/api/auth/reset-password",
                    "/api/auth/verify-email",
                    "/api/assistant/chat",
                    "/api/contact")
                .permitAll()
                .requestMatchers("/api/admin/**")
                .hasRole("ADMIN")
                .requestMatchers("/api/news/debug/**")
                .denyAll()
                .requestMatchers(HttpMethod.POST, "/api/news/**")
                .hasRole("ADMIN")
                .requestMatchers(HttpMethod.DELETE, "/api/news/**")
                .hasRole("ADMIN")
                .requestMatchers(
                    "/api/annonces/my-annonces",
                    "/api/showrooms/me",
                    "/api/auth/me",
                    "/api/auth/test")
                .authenticated()
                .requestMatchers(
                    HttpMethod.GET,
                    "/api/annonces/**",
                    "/api/showrooms/**",
                    "/api/models/**",
                    "/uploads/**",
                    "/api/news/**",
                    "/api/payments/config")
                .permitAll()
                .requestMatchers(SecurityConfig::publicPage)
                .permitAll()
                .anyRequest()
                .authenticated())
        .oauth2ResourceServer(o ->
            o.jwt(j -> j.jwtAuthenticationConverter(converter))
                .authenticationEntryPoint((r, s, e) -> json(s, 401, "Connexion requise")))
        .exceptionHandling(e ->
            e.authenticationEntryPoint((r, s, x) -> json(s, 401, "Connexion requise"))
                .accessDeniedHandler((r, s, x) -> json(s, 403, "Accès refusé")));
    return http.build();
  }

  private static void json(jakarta.servlet.http.HttpServletResponse r, int status, String message)
      throws java.io.IOException {
    r.setStatus(status);
    r.setContentType("application/json;charset=UTF-8");
    r.getWriter().write("{\"message\":\"" + message + "\"}");
  }
}
