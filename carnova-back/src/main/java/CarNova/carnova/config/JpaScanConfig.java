package CarNova.carnova.config;

import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

@Configuration
@ComponentScan(basePackages = {
        "CarNova.carnova"              // <-- scanne tous tes @Service/@Controller
})
@EnableJpaRepositories(basePackages = {
        "CarNova.carnova.Repository"   // <-- tes interfaces JpaRepository
})
@EntityScan(basePackages = {
        "CarNova.carnova.Entity"       // <-- tes @Entity
})
public class JpaScanConfig { }
