package CarNova.carnova.Repository;

import CarNova.carnova.Entity.Showroom;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ShowroomRepository extends JpaRepository<Showroom, Long> {
    List<Showroom> findByUserId(Long userId);
} 