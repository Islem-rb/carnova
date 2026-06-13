package CarNova.carnova;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class CarnovaApplication {

	public static void main(String[] args) {
		SpringApplication.run(CarnovaApplication.class, args);
	}

}
