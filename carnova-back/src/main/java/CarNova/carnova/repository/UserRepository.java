package CarNova.carnova.repository;

import CarNova.carnova.entity.User;
import jakarta.persistence.LockModeType;
import java.util.Optional;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;

public interface UserRepository extends JpaRepository<User, Long> {
  Optional<User> findByEmailIgnoreCase(String email);
  boolean existsByEmailIgnoreCase(String email);

  @Lock(LockModeType.PESSIMISTIC_WRITE)
  @Query("select u from User u where u.id = :id")
  Optional<User> lockById(@Param("id") Long id);

  @Lock(LockModeType.PESSIMISTIC_WRITE)
  @Query("select u from User u where lower(u.email) = lower(:email)")
  Optional<User> lockByEmail(@Param("email") String email);

  @Lock(LockModeType.PESSIMISTIC_WRITE)
  Optional<User> findByResetTokenHash(String hash);

  @Lock(LockModeType.PESSIMISTIC_WRITE)
  Optional<User> findByVerificationTokenHash(String hash);
}
