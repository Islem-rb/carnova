package CarNova.carnova;

import static org.assertj.core.api.Assertions.*;

import CarNova.carnova.repository.*;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.test.context.SpringBootTest;

/** Own in-memory database, so the seeded rows never leak into the other test classes. */
@SpringBootTest(
    properties = {
      "app.demo-data=true",
      "DEMO_ADMIN_PASSWORD=demo-tests-admin-password",
      "spring.datasource.url=jdbc:h2:mem:carnova-demo;MODE=PostgreSQL;DB_CLOSE_DELAY=-1"
    })
class DemoDataTests {
  @Autowired UserRepository users;
  @Autowired AnnonceRepository listings;
  @Autowired CommandLineRunner seed;

  @Test
  void enabledDemoSeedsAnAdminAndListingsOnceOnly() throws Exception {
    assertThat(users.findAll())
        .anySatisfy(u -> {
          assertThat(u.email).isEqualTo("admin@carnova.local");
          assertThat(u.role).isEqualTo("ROLE_ADMIN");
        });
    long userCount = users.count(), listingCount = listings.count();
    assertThat(listingCount).isPositive();
    seed.run(); // a later boot against the same database must not duplicate anything
    assertThat(users.count()).isEqualTo(userCount);
    assertThat(listings.count()).isEqualTo(listingCount);
  }
}
