package CarNova.carnova.security;
import CarNova.carnova.repository.UserRepository;
import com.nimbusds.jose.jwk.source.ImmutableSecret;
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
import org.springframework.web.cors.*;
import java.nio.charset.StandardCharsets;
import java.util.*;
@Configuration
public class SecurityConfig {
 @Bean PasswordEncoder passwordEncoder() { return new BCryptPasswordEncoder(12); }
 @Bean SecretKeySpec key(@Value("${app.jwt-secret}") String secret) {
  if(secret.getBytes(StandardCharsets.UTF_8).length<32) throw new IllegalStateException("JWT_SECRET must contain at least 32 bytes");
  return new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8),"HmacSHA256");
 }
 @Bean JwtEncoder encoder(SecretKeySpec key) { return new NimbusJwtEncoder(new ImmutableSecret<>(key)); }
 @Bean JwtDecoder decoder(SecretKeySpec key) {
  var d=NimbusJwtDecoder.withSecretKey(key).macAlgorithm(MacAlgorithm.HS256).build();
  d.setJwtValidator(JwtValidators.createDefaultWithIssuer("carnova")); return d;
 }
 @Bean SecurityFilterChain chain(HttpSecurity http,UserRepository users,@Value("${app.cors-origins}") String origins) throws Exception {
  var cors=new CorsConfiguration(); cors.setAllowedOrigins(Arrays.asList(origins.split(","))); cors.setAllowedMethods(List.of("GET","POST","PUT","PATCH","DELETE","OPTIONS")); cors.setAllowedHeaders(List.of("Authorization","Content-Type")); cors.setAllowCredentials(false);
  var source=new UrlBasedCorsConfigurationSource(); source.registerCorsConfiguration("/**",cors);
  var converter=new JwtAuthenticationConverter();
  // Role is looked up from the database; stale or forged role claims cannot grant access.
  converter.setJwtGrantedAuthoritiesConverter(jwt->users.findByEmailIgnoreCase(jwt.getSubject()).map(u->List.<org.springframework.security.core.GrantedAuthority>of(new org.springframework.security.core.authority.SimpleGrantedAuthority(u.role))).orElse(List.of()));
  http.csrf(c->c.disable()).cors(c->c.configurationSource(source)).sessionManagement(s->s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
   .headers(h->h.contentSecurityPolicy(c->c.policyDirectives("default-src 'none'; frame-ancestors 'none'")))
   .authorizeHttpRequests(a->a
    .requestMatchers(HttpMethod.OPTIONS,"/**").permitAll()
    .requestMatchers("/api/meta","/actuator/health","/v3/api-docs/**","/swagger-ui/**","/swagger-ui.html").permitAll()
    .requestMatchers(HttpMethod.POST,"/api/auth/signin","/api/auth/signup","/api/assistant/chat","/api/contact").permitAll()
    .requestMatchers("/api/admin/**").hasRole("ADMIN")
    .requestMatchers("/api/news/debug/**").denyAll()
    .requestMatchers(HttpMethod.POST,"/api/news/**").hasRole("ADMIN")
    .requestMatchers(HttpMethod.DELETE,"/api/news/**").hasRole("ADMIN")
    .requestMatchers("/api/annonces/my-annonces","/api/showrooms/me","/api/auth/me","/api/auth/test").authenticated()
    .requestMatchers(HttpMethod.GET,"/api/annonces/**","/api/showrooms/**","/api/models/**","/uploads/**","/api/news/**","/api/payments/config").permitAll()
    .anyRequest().authenticated())
   .oauth2ResourceServer(o->o.jwt(j->j.jwtAuthenticationConverter(converter)).authenticationEntryPoint((r,s,e)->json(s,401,"Connexion requise")))
   .exceptionHandling(e->e.authenticationEntryPoint((r,s,x)->json(s,401,"Connexion requise")).accessDeniedHandler((r,s,x)->json(s,403,"Accès refusé")));
  return http.build();
 }
 private static void json(jakarta.servlet.http.HttpServletResponse r,int status,String message) throws java.io.IOException { r.setStatus(status);r.setContentType("application/json;charset=UTF-8");r.getWriter().write("{\"message\":\""+message+"\"}"); }
}
