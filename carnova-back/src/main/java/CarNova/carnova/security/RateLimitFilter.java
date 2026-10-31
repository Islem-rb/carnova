package CarNova.carnova.security;
import jakarta.servlet.*;
import jakarta.servlet.http.*;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import java.io.IOException;
import java.util.concurrent.ConcurrentHashMap;
@Component
public class RateLimitFilter extends OncePerRequestFilter {
 private record Window(long minute,java.util.concurrent.atomic.AtomicInteger count) {}
 private final ConcurrentHashMap<String,Window> windows=new ConcurrentHashMap<>();
 @Override protected void doFilterInternal(HttpServletRequest r,HttpServletResponse s,FilterChain chain) throws ServletException,IOException {
  String p=r.getRequestURI();
  if("POST".equals(r.getMethod()) && (p.startsWith("/api/auth/") || p.equals("/api/contact") || p.equals("/api/assistant/chat"))) {
   long minute=System.currentTimeMillis()/60000;
   if(windows.size()>10000) windows.entrySet().removeIf(e->e.getValue().minute()<minute);
   if(windows.size()>10000 && !windows.containsKey(r.getRemoteAddr())) {s.setStatus(429);return;}
   var w=windows.compute(r.getRemoteAddr(),(k,old)->old==null||old.minute()!=minute?new Window(minute,new java.util.concurrent.atomic.AtomicInteger()):old);
   if(w.count().incrementAndGet()>30) { s.setStatus(429);s.setContentType("application/json;charset=UTF-8");s.setHeader("Retry-After","60");s.getWriter().write("{\"message\":\"Trop de demandes. Réessayez dans une minute.\"}");return; }
  }
  chain.doFilter(r,s);
 }
}
