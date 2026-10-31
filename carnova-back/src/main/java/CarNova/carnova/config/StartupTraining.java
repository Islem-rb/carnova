package CarNova.carnova.config;

import org.springframework.boot.autoconfigure.flyway.FlywayMigrationStrategy;
import org.springframework.context.annotation.*;

/**
 * The single-service image records a Class Data Sharing archive at build time by starting the
 * context once without any database (root Dockerfile, -Dcarnova.cds-training=true). Ahead-of-time
 * processing fixes the Flyway bean at build time, so skip only the migration call in that run.
 * The property is never set at runtime, where migrations always run.
 */
@Configuration
public class StartupTraining {
  static final boolean TRAINING = Boolean.getBoolean("carnova.cds-training");

  @Bean
  FlywayMigrationStrategy flywayMigrationStrategy() {
    return flyway -> {
      if (!TRAINING) flyway.migrate();
    };
  }
}
