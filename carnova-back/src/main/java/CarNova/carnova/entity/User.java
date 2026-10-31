package CarNova.carnova.entity;
import jakarta.persistence.*;
@Entity
@Table(name="users")
public class User {
 @Id @GeneratedValue(strategy=GenerationType.IDENTITY) public Long id;
 public String nom; public String prenom;
 @Column(unique=true) public String email;
 @com.fasterxml.jackson.annotation.JsonIgnore public String password;
 public String role;
}
