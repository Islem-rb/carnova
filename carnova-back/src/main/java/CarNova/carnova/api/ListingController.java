package CarNova.carnova.api;

import CarNova.carnova.entity.*;
import CarNova.carnova.repository.AnnonceRepository;
import CarNova.carnova.service.*;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.util.*;
import org.springframework.data.domain.*;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.*;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/annonces")
@Transactional
@Validated
public class ListingController {
  private final AnnonceRepository listings;
  private final CurrentUser current;
  private final FileStorage files;
  private final Billing billing;

  public ListingController(AnnonceRepository a, CurrentUser c, FileStorage f, Billing b) {
    listings = a;
    current = c;
    files = f;
    billing = b;
  }

  @GetMapping
  public List<Contracts.Listing> all() {
    return listings
        .findAll(PageRequest.of(0, 100, Sort.by("createdAt").descending()))
        .map(Views::listing)
        .getContent();
  }

  @GetMapping("/search")
  public Contracts.ListingPage search(
      @RequestParam(defaultValue = "") @Size(max = 100) String q,
      @RequestParam(defaultValue = "") String marque,
      @RequestParam(defaultValue = "") String carburant,
      @RequestParam(defaultValue = "") String typeVehicule,
      @RequestParam(defaultValue = "") String ville,
      @RequestParam(defaultValue = "") String typeAnnonce,
      @RequestParam(required = false) BigDecimal maxPrice,
      @RequestParam(required = false) @Min(1900) @Max(2028) Integer minYear,
      @RequestParam(required = false) @Min(0) Integer maxKm,
      @RequestParam(defaultValue = "recent") String sort,
      @RequestParam(defaultValue = "0") @Min(0) @Max(10000) int page,
      @RequestParam(defaultValue = "12") @Min(1) @Max(50) int size) {
    Specification<Annonce> spec = (root, query, b) -> b.conjunction();
    spec = spec.and((r, query, b) -> b.equal(r.get("statut"), "DISPONIBLE"));
    if (!q.isBlank()) {
      String escaped =
          q.toLowerCase(Locale.ROOT).replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_");
      spec = spec.and((r, query, b) -> b.like(b.lower(r.get("titre")), "%" + escaped + "%", '\\'));
    }
    for (var entry :
        Map.of(
                "marque",
                marque,
                "carburant",
                carburant,
                "typeVehicule",
                typeVehicule,
                "ville",
                ville,
                "typeAnnonce",
                typeAnnonce)
            .entrySet())
      if (!entry.getValue().isBlank())
        spec =
            spec.and((r, query, b) ->
                b.equal(b.lower(r.get(entry.getKey())), entry.getValue().toLowerCase(Locale.ROOT)));
    if (maxPrice != null)
      spec = spec.and((r, query, b) -> b.lessThanOrEqualTo(r.get("prix"), maxPrice));
    if (minYear != null)
      spec = spec.and((r, query, b) -> b.greaterThanOrEqualTo(r.get("annee"), minYear));
    if (maxKm != null)
      spec = spec.and((r, query, b) -> b.lessThanOrEqualTo(r.get("kilometrage"), maxKm));
    Sort order =
        switch (sort) {
          case "price-asc" -> Sort.by("prix").ascending();
          case "price-desc" -> Sort.by("prix").descending();
          case "year" -> Sort.by("annee").descending();
          default -> Sort.by("createdAt").descending();
        };
    var result =
        listings.findAll(spec, PageRequest.of(page, size, order.and(Sort.by("id").descending())));
    return new Contracts.ListingPage(
        result.map(Views::listing).getContent(),
        result.getTotalElements(),
        page,
        result.getTotalPages());
  }

  @GetMapping("/{id}")
  public Contracts.Listing detail(@PathVariable Long id) {
    return Views.listing(find(id));
  }

  @GetMapping("/my-annonces")
  public List<Contracts.Listing> mine(Authentication auth) {
    return listings.findByUserIdOrderByCreatedAtDesc(current.get(auth).getId()).stream()
        .map(Views::listing)
        .toList();
  }

  @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE)
  @ResponseStatus(HttpStatus.CREATED)
  public Contracts.Listing create(
      @Valid @RequestBody Contracts.ListingInput r, Authentication auth) {
    var u = current.get(auth);
    billing.requirePublishing(u);
    Annonce a = new Annonce();
    a.user = u;
    apply(a, r);
    return Views.listing(listings.save(a));
  }

  @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
  @ResponseStatus(HttpStatus.CREATED)
  public Contracts.Listing legacy(
      @RequestParam @Size(min = 3, max = 150) String titre,
      @RequestParam @Size(min = 10, max = 4000) String description,
      @RequestParam @Pattern(regexp = "VENTE|LOCATION|ACHAT") String typeAnnonce,
      @RequestParam(required = false) MultipartFile image,
      Authentication auth)
      throws java.io.IOException {
    var u = current.get(auth);
    billing.requirePublishing(u);
    Annonce a = new Annonce();
    a.user = u;
    a.titre = titre;
    a.description = description;
    a.typeAnnonce = typeAnnonce;
    if (image != null && !image.isEmpty()) {
      a.imageUrl = files.image(image);
      a.images.add(a.imageUrl);
    }
    return Views.listing(listings.save(a));
  }

  @PutMapping("/{id}")
  public Contracts.Listing edit(
      @PathVariable Long id, @Valid @RequestBody Contracts.ListingInput r, Authentication auth) {
    var a = find(id);
    current.owner(a.user.getId(), current.get(auth));
    apply(a, r);
    return Views.listing(listings.save(a));
  }

  @PatchMapping("/{id}/status")
  public Contracts.Listing status(
      @PathVariable Long id, @RequestBody Map<String, String> r, Authentication auth) {
    var a = find(id);
    current.owner(a.user.getId(), current.get(auth));
    if (!Set.of("DISPONIBLE", "RESERVE", "VENDU").contains(r.getOrDefault("statut", "")))
      throw new IllegalArgumentException();
    a.statut = r.get("statut");
    return Views.listing(listings.save(a));
  }

  @DeleteMapping("/{id}")
  public Map<String, String> delete(@PathVariable Long id, Authentication auth) {
    var a = find(id);
    current.owner(a.user.getId(), current.get(auth));
    listings.delete(a);
    return Map.of("message", "Annonce supprimée.");
  }

  private Annonce find(Long id) {
    return listings
        .findById(id)
        .orElseThrow(
            () -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Annonce introuvable."));
  }

  private void apply(Annonce a, Contracts.ListingInput r) {
    a.titre = r.titre().strip();
    a.description = r.description().strip();
    a.typeAnnonce = r.typeAnnonce() == null ? "VENTE" : r.typeAnnonce();
    a.marque = r.marque();
    a.modele = r.modele();
    a.annee = r.annee();
    a.prix = r.prix();
    a.kilometrage = r.kilometrage();
    a.carburant = r.carburant();
    a.boiteVitesse = r.boiteVitesse();
    a.couleur = r.couleur();
    a.ville = r.ville();
    a.typeVehicule = r.typeVehicule() == null ? "BERLINE" : r.typeVehicule();
    a.telephone = r.telephone();
    a.images.clear();
    if (r.images() != null) a.images.addAll(r.images());
    a.imageUrl = a.images.isEmpty() ? null : a.images.get(0);
    a.model3dUrl = r.model3dUrl();
  }
}
