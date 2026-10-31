package CarNova.carnova.repository;

import CarNova.carnova.entity.User;

public interface UserRepository
    extends org.springframework.data.jpa.repository.JpaRepository<User, Long> {
  java.util.Optional<User> findByEmailIgnoreCase(String email);

  boolean existsByEmailIgnoreCase(String email);
}
