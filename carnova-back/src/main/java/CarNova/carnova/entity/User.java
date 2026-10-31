package CarNova.carnova.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "users")
public class User {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  public Long id;

  public String nom;
  public String prenom;

  @Column(unique = true)
  public String email;

  @com.fasterxml.jackson.annotation.JsonIgnore public String password;
  public String role;

  public Long getId() {
    return id;
  }

  public String getNom() {
    return nom;
  }

  public String getPrenom() {
    return prenom;
  }

  public String getEmail() {
    return email;
  }

  public String getPassword() {
    return password;
  }

  public String getRole() {
    return role;
  }
}
