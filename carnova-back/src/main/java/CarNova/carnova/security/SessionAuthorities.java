package CarNova.carnova.security;

import CarNova.carnova.repository.UserRepository;
import java.util.*;
import org.springframework.core.convert.converter.Converter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.InvalidBearerTokenException;

public class SessionAuthorities implements Converter<Jwt, Collection<GrantedAuthority>> {
  private final UserRepository users;

  public SessionAuthorities(UserRepository users) {
    this.users = users;
  }

  @Override
  public Collection<GrantedAuthority> convert(Jwt jwt) {
    var user = users.findByEmailIgnoreCase(jwt.getSubject())
        .orElseThrow(() -> new InvalidBearerTokenException("Session invalidée"));
    Object version = jwt.getClaim("ver");
    // Previously issued tokens have no version and are valid only until the first password update.
    if ((version == null && user.authVersion != 0)
        || (version != null && (!(version instanceof Number) || ((Number) version).longValue() != user.authVersion)))
      throw new InvalidBearerTokenException("Session invalidée");
    return List.of(new SimpleGrantedAuthority(user.role));
  }
}
