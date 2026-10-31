package CarNova.carnova.Repository;

import CarNova.carnova.Entity.NewsItemEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.Instant; import java.util.*;

public interface NewsItemRepository extends JpaRepository<NewsItemEntity, String> {
    Optional<NewsItemEntity> findByUniqueKey(String uniqueKey);
    List<NewsItemEntity> findByPublishedAtAfterOrderByPublishedAtDesc(Instant after);
    List<NewsItemEntity> findAllByOrderByPublishedAtDesc();
}
