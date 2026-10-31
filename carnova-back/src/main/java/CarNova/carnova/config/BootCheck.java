package CarNova.carnova.config;

import CarNova.carnova.Repository.NewsItemRepository;
import org.slf4j.Logger; import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class BootCheck {
    private static final Logger log = LoggerFactory.getLogger(BootCheck.class);

    @Bean
    CommandLineRunner newsCountAtBoot(NewsItemRepository repo){
        return args -> log.info(">>> news_items count at boot = {}", repo.count());
    }
}
