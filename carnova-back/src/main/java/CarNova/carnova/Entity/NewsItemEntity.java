package CarNova.carnova.Entity;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "news_items",
        indexes = {
                @Index(name = "idx_news_published", columnList = "publishedAt DESC"),
                @Index(name = "idx_news_uniqueKey", columnList = "uniqueKey", unique = true)
        })
public class NewsItemEntity {
    @Id @Column(nullable=false, updatable=false)
    private String id = UUID.randomUUID().toString();

    @Column(nullable=false, length=300) private String title;
    @Column(columnDefinition="text") private String summary;
    @Column(length=600) private String imageUrl;
    @Column(nullable=false, length=100) private String sourceName;
    @Column(nullable=false, length=600) private String sourceUrl;
    private Instant publishedAt;
    @Column(nullable=false, length=120) private String uniqueKey;

    // getters/setters
    public String getId(){return id;}
    public String getTitle(){return title;} public void setTitle(String v){title=v;}
    public String getSummary(){return summary;} public void setSummary(String v){summary=v;}
    public String getImageUrl(){return imageUrl;} public void setImageUrl(String v){imageUrl=v;}
    public String getSourceName(){return sourceName;} public void setSourceName(String v){sourceName=v;}
    public String getSourceUrl(){return sourceUrl;} public void setSourceUrl(String v){sourceUrl=v;}
    public Instant getPublishedAt(){return publishedAt;} public void setPublishedAt(Instant v){publishedAt=v;}
    public String getUniqueKey(){return uniqueKey;} public void setUniqueKey(String v){uniqueKey=v;}
}
