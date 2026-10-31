package CarNova.carnova.config;

import jakarta.servlet.*;
import jakarta.servlet.http.*;
import java.io.IOException;
import java.time.Duration;
import java.util.stream.Stream;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.ClassPathResource;
import org.springframework.http.CacheControl;
import org.springframework.security.web.servlet.util.matcher.PathPatternRequestMatcher;
import org.springframework.security.web.util.matcher.*;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import org.springframework.web.servlet.config.annotation.*;

/**
 * Serves the Angular build when it is packaged into the jar (single-service hosting such as
 * Render). In the Compose stack Nginx serves the frontend, no index.html is packaged and all of
 * this is inert.
 */
@Configuration
public class SpaHosting implements WebMvcConfigurer {
  public static final boolean PACKAGED = new ClassPathResource("static/index.html").exists();
  // Decoded, normalised path matching (same as Spring Security), never the raw request URI.
  private static final RequestMatcher SERVER_PATHS =
      new OrRequestMatcher(
          Stream.of("/api/**", "/uploads/**", "/actuator/**", "/v3/api-docs/**", "/swagger-ui/**", "/error")
              .map(p -> (RequestMatcher) PathPatternRequestMatcher.withDefaults().matcher(p))
              .toList());

  @Override
  public void addResourceHandlers(ResourceHandlerRegistry registry) {
    if (!PACKAGED) return;
    // The entry page must always be revalidated so a deploy is picked up immediately.
    registry
        .addResourceHandler("/index.html")
        .addResourceLocations("classpath:/static/")
        .setCacheControl(CacheControl.noCache());
    // Bundles are content-hashed; assets (images, fonts, models) change rarely.
    registry
        .addResourceHandler("/**")
        .addResourceLocations("classpath:/static/")
        .setCacheControl(CacheControl.maxAge(Duration.ofDays(7)).cachePublic());
  }

  /** Client-side routes (/studio, /annonces/12…) all render index.html, like Nginx try_files. */
  @Component
  public static class Fallback extends OncePerRequestFilter {
    @Override
    protected boolean shouldNotFilter(HttpServletRequest r) {
      String method = r.getMethod();
      if (!PACKAGED || !("GET".equals(method) || "HEAD".equals(method))) return true;
      if (SERVER_PATHS.matches(r) || r.getRequestURI().contains("%")) return true;
      // Files keep their real response, including 404 for a missing asset.
      String path = r.getRequestURI();
      return path.substring(path.lastIndexOf('/') + 1).contains(".");
    }

    @Override
    protected void doFilterInternal(HttpServletRequest r, HttpServletResponse s, FilterChain chain)
        throws ServletException, IOException {
      r.getRequestDispatcher("/index.html").forward(r, s);
    }
  }
}
