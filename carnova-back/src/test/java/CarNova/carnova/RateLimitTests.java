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
}
