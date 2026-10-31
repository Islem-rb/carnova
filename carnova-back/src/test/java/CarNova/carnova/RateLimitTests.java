package CarNova.carnova;

import static org.assertj.core.api.Assertions.*;

import CarNova.carnova.security.RateLimitFilter;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.*;

class RateLimitTests {
  @Test
  void publicExpensiveEndpointsAreBoundedPerClient() throws Exception {
    var filter = new RateLimitFilter();
    var reached = new java.util.concurrent.atomic.AtomicInteger();
    for (int i = 0; i < 31; i++) {
      var request = new MockHttpServletRequest("POST", "/api/assistant/chat");
      var response = new MockHttpServletResponse();
      filter.doFilter(request, response, (r, s) -> reached.incrementAndGet());
      if (i == 30) {
        assertThat(response.getStatus()).isEqualTo(429);
        assertThat(response.getHeader("Retry-After")).isEqualTo("60");
      }
    }
    assertThat(reached).hasValue(30);
  }

  @Test
  void behindAProxyEachVisitorGetsTheirOwnBudget() throws Exception {
    // All requests arrive from the same proxy socket address; only the proxy-set header differs.
    var filter = new RateLimitFilter("X-Real-IP");
    for (int i = 0; i < 30; i++) assertThat(send(filter, "203.0.113.7")).isEqualTo(200);
    assertThat(send(filter, "203.0.113.7")).isEqualTo(429);
    assertThat(send(filter, "198.51.100.4")).isEqualTo(200);
  }

  @Test
  void malformedOrMissingClientHeaderFallsBackToTheSocketAddress() throws Exception {
    var filter = new RateLimitFilter("X-Real-IP");
    for (int i = 0; i < 15; i++) send(filter, null);
    for (int i = 0; i < 15; i++) send(filter, "not-an-ip, 1.2.3.4");
    assertThat(send(filter, null)).isEqualTo(429);
  }

  private static int send(RateLimitFilter filter, String clientIp) throws Exception {
    var request = new MockHttpServletRequest("POST", "/api/auth/signin");
    request.setRemoteAddr("10.0.0.2");
    if (clientIp != null) request.addHeader("X-Real-IP", clientIp);
    var response = new MockHttpServletResponse();
    filter.doFilter(request, response, (r, s) -> {});
    return response.getStatus();
  }
}
