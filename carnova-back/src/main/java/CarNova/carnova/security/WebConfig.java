package CarNova.carnova.security;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.*;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Value("${carnova.cors.allowed-origins:http://localhost:4200}")
    private String allowedOrigins;

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/news/**")
                .allowedOrigins(allowedOrigins.split(","))
                .allowedMethods("GET","OPTIONS")
                .allowCredentials(false);
    }
}
