package CarNova.carnova.repository;
import CarNova.carnova.entity.Annonce;
public interface AnnonceRepository extends org.springframework.data.jpa.repository.JpaRepository<Annonce,Long>, org.springframework.data.jpa.repository.JpaSpecificationExecutor<Annonce> { java.util.List<Annonce> findByUserIdOrderByCreatedAtDesc(Long id); }
