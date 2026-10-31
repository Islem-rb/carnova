package CarNova.carnova.repository;

import CarNova.carnova.entity.Showroom;

public interface ShowroomRepository
    extends org.springframework.data.jpa.repository.JpaRepository<Showroom, Long> {
  java.util.List<Showroom> findByUserId(Long id);
}
