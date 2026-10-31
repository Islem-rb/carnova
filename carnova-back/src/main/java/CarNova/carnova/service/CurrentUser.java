package CarNova.carnova.service;
import CarNova.carnova.entity.User;
import CarNova.carnova.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.security.core.Authentication;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;
@Service
public class CurrentUser {
 private final UserRepository users;
 public CurrentUser(UserRepository users) {this.users=users;}
 public User get(Authentication auth) { if(auth==null) throw new ResponseStatusException(HttpStatus.UNAUTHORIZED,"Connexion requise");return users.findByEmailIgnoreCase(auth.getName()).orElseThrow(()->new ResponseStatusException(HttpStatus.UNAUTHORIZED,"Connexion requise")); }
 public void owner(Long id,User user) {if(!id.equals(user.id)) throw new ResponseStatusException(HttpStatus.FORBIDDEN,"Cette ressource ne vous appartient pas.");}
}
