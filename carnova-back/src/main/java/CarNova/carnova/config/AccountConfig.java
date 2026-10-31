package CarNova.carnova.config;

import java.time.Clock;
import org.springframework.context.annotation.*;

@Configuration
public class AccountConfig {
  @Bean
  Clock accountClock() {
    return Clock.systemUTC();
  }
}
