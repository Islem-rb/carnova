package CarNova.carnova.Repository;

import CarNova.carnova.Entity.Vehicule;
import org.springframework.data.jpa.repository.JpaRepository;
 
public interface VehiculeRepository extends JpaRepository<Vehicule, Long> {
} 