package CarNova.carnova.api;

import CarNova.carnova.entity.*;
import CarNova.carnova.repository.ShowroomRepository;
import CarNova.carnova.service.CurrentUser;
import jakarta.validation.Valid;
import java.util.*;
import org.springframework.http.*;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/showrooms")
@Transactional
public class ShowroomController {
  private final ShowroomRepository repo;
  private final CurrentUser current;

  public ShowroomController(ShowroomRepository r, CurrentUser c) {
    repo = r;
    current = c;
  }

  @GetMapping
  public List<Contracts.ShowroomView> all() {
    return repo.findAll(org.springframework.data.domain.PageRequest.of(0, 100)).stream()
        .map(Views::showroom)
        .toList();
  }

  @GetMapping("/me")
  public List<Contracts.ShowroomView> mine(Authentication a) {
    return repo.findByUserId(current.get(a).getId()).stream().map(Views::showroom).toList();
  }

  @GetMapping("/{id}")
  public Contracts.ShowroomView detail(@PathVariable Long id) {
    return Views.showroom(find(id));
  }

  @PostMapping
  @ResponseStatus(HttpStatus.CREATED)
  public Contracts.ShowroomView create(
      @Valid @RequestBody Contracts.ShowroomInput r, Authentication a) {
    var s = new Showroom();
    s.user = current.get(a);
    apply(s, r);
    return Views.showroom(repo.save(s));
  }

  @PutMapping("/{id}")
  public Contracts.ShowroomView update(
      @PathVariable Long id, @Valid @RequestBody Contracts.ShowroomInput r, Authentication a) {
    var s = find(id);
    current.owner(s.user.getId(), current.get(a));
    apply(s, r);
    return Views.showroom(repo.save(s));
  }

  @DeleteMapping("/{id}")
  public Map<String, String> delete(@PathVariable Long id, Authentication a) {
    var s = find(id);
    current.owner(s.user.getId(), current.get(a));
    repo.delete(s);
    return Map.of("message", "Showroom supprimé.");
  }

  private Showroom find(Long id) {
    return repo.findById(id)
        .orElseThrow(
            () -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Showroom introuvable."));
  }

  private void apply(Showroom s, Contracts.ShowroomInput r) {
    s.nom = r.nom();
    s.description = r.description();
    s.ville = r.ville();
    s.telephone = r.telephone();
    s.images.clear();
    if (r.images() != null) s.images.addAll(r.images());
    s.voitures.clear();
    if (r.voitures() != null)
      for (var x : r.voitures()) {
        var v = new Vehicule();
        v.marque = x.marque();
        v.modele = x.modele();
        v.annee = x.annee();
        v.prix = x.prix();
        v.couleur = x.couleur();
        s.voitures.add(v);
      }
  }
}
