package CarNova.carnova.Service;



import CarNova.carnova.Entity.User; // L'import correct !
import CarNova.carnova.Repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
@Service
public class UserDetailsServiceImpl implements UserDetailsService {

    @Autowired
    UserRepository userRepository;

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> {
                    System.err.println("DEBUG: Email non trouvé - " + email);
                    return new UsernameNotFoundException("User not found");
                });

        System.out.println("DEBUG: Utilisateur trouvé - " + user.getEmail());
        System.out.println("DEBUG: Mot de passe stocké - " + user.getPassword());

        return UserDetailsImpl.build(user);
    }
}