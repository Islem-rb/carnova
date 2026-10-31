package CarNova.carnova.repository;
import CarNova.carnova.entity.NewsItem;
public interface NewsItemRepository extends org.springframework.data.jpa.repository.JpaRepository<NewsItem,String> { boolean existsByUniqueKey(String key); java.util.List<NewsItem> findAllByOrderByPublishedAtDesc(); }
