package CarNova.carnova.Repository;


import CarNova.carnova.Entity.Annonce;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface AnnonceRepository extends JpaRepository<Annonce, Long> {
    List<Annonce> findByUserId(Long userId);
}