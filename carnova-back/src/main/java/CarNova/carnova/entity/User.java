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
  public boolean emailVerified;
  @com.fasterxml.jackson.annotation.JsonIgnore public long authVersion;
  @Column(length = 64) @com.fasterxml.jackson.annotation.JsonIgnore public String resetTokenHash;
  @com.fasterxml.jackson.annotation.JsonIgnore public java.time.Instant resetExpiresAt;
  @com.fasterxml.jackson.annotation.JsonIgnore public java.time.Instant resetRequestedAt;
  @Column(length = 64) @com.fasterxml.jackson.annotation.JsonIgnore public String verificationTokenHash;
  @com.fasterxml.jackson.annotation.JsonIgnore public java.time.Instant verificationExpiresAt;
  @com.fasterxml.jackson.annotation.JsonIgnore public java.time.Instant verificationRequestedAt;

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
