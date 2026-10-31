package CarNova.carnova.security;

import jakarta.servlet.*;
import jakarta.servlet.http.*;
import java.io.IOException;
import java.util.concurrent.ConcurrentHashMap;
import java.util.regex.Pattern;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
public class RateLimitFilter extends OncePerRequestFilter {
  private record Window(long minute, java.util.concurrent.atomic.AtomicInteger count) {}

  private static final Pattern IP = Pattern.compile("[0-9A-Fa-f:.]{2,45}");
  private final ConcurrentHashMap<String, Window> windows = new ConcurrentHashMap<>();
  private final String clientIpHeader;

  public RateLimitFilter() {
    this("");
  }

  /**
   * @param clientIpHeader a single header that the trusted proxy in front of the app overwrites
   *     with the visitor's address (e.g. X-Real-IP from the bundled Nginx, True-Client-IP on
   *     Render). Never a client-appendable list such as X-Forwarded-For. Empty means the socket
   *     address, which is only correct without a proxy.
   */
  @Autowired
  public RateLimitFilter(@Value("${app.client-ip-header:}") String clientIpHeader) {
    this.clientIpHeader = clientIpHeader == null ? "" : clientIpHeader.trim();
  }

  String clientIp(HttpServletRequest r) {
    if (!clientIpHeader.isEmpty()) {
      String value = r.getHeader(clientIpHeader);
      if (value != null && IP.matcher(value.trim()).matches()) return value.trim();
    }
    return r.getRemoteAddr();
  }

  @Override
  protected void doFilterInternal(HttpServletRequest r, HttpServletResponse s, FilterChain chain)
      throws ServletException, IOException {
    String p = r.getRequestURI();
    if ("POST".equals(r.getMethod())
        && (p.startsWith("/api/auth/")
            || p.equals("/api/contact")
            || p.equals("/api/assistant/chat")
            || p.equals("/api/uploads")
            || p.equals("/api/models/upload"))) {
      String client = clientIp(r);
      long minute = System.currentTimeMillis() / 60000;
      if (windows.size() > 10000) windows.entrySet().removeIf(e -> e.getValue().minute() < minute);
      if (windows.size() > 10000 && !windows.containsKey(client)) {
        s.setStatus(429);
        return;
      }
      var w =
          windows.compute(
              client,
              (k, old) ->
                  old == null || old.minute() != minute
                      ? new Window(minute, new java.util.concurrent.atomic.AtomicInteger())
                      : old);
      if (w.count().incrementAndGet() > 30) {
        s.setStatus(429);
        s.setContentType("application/json;charset=UTF-8");
        s.setHeader("Retry-After", "60");
        s.getWriter().write("{\"message\":\"Trop de demandes. Réessayez dans une minute.\"}");
        return;
      }
    }
    chain.doFilter(r, s);
  }
}
