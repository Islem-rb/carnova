package CarNova.carnova.dto;

import CarNova.carnova.Entity.NewsItemEntity;
import java.time.Instant;

public record NewsItemDto(
        String id,
        String title,
        String summary,
        String imageUrl,
        String sourceName,
        String sourceUrl,
        Instant publishedAt
) {
    public static NewsItemDto from(NewsItemEntity e) {
        return new NewsItemDto(
                e.getId(), e.getTitle(), e.getSummary(), e.getImageUrl(),
                e.getSourceName(), e.getSourceUrl(), e.getPublishedAt()
        );
    }
}
