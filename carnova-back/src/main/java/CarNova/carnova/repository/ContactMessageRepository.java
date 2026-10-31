package CarNova.carnova.repository;

import CarNova.carnova.entity.ContactMessage;

public interface ContactMessageRepository
    extends org.springframework.data.jpa.repository.JpaRepository<ContactMessage, Long> {
  java.util.List<ContactMessage> findTop50ByOrderByCreatedAtDesc();
}
