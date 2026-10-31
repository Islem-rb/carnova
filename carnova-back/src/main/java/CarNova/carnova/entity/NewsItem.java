package CarNova.carnova.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "news_items")
public class NewsItem {
  @Id public String id = java.util.UUID.randomUUID().toString();

  @Column(length = 300, nullable = false)
  public String title;

  @Column(columnDefinition = "text")
  public String summary;

  @Column(length = 600)
  public String imageUrl;

  @Column(length = 100, nullable = false)
  public String sourceName;

  @Column(length = 600, nullable = false)
  public String sourceUrl;

  public java.time.Instant publishedAt = java.time.Instant.now();

  @Column(length = 120, nullable = false, unique = true)
  public String uniqueKey;
}
