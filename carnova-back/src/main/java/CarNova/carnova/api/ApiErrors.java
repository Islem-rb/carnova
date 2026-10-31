package CarNova.carnova.api;

import java.util.*;
import org.springframework.http.*;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestControllerAdvice
public class ApiErrors {
  @ExceptionHandler(ResponseStatusException.class)
  ResponseEntity<?> status(ResponseStatusException e) {
    return ResponseEntity.status(e.getStatusCode())
        .body(Map.of("message", Objects.requireNonNullElse(e.getReason(), "Demande refusée")));
  }

  @ExceptionHandler(MethodArgumentNotValidException.class)
  ResponseEntity<?> validation(MethodArgumentNotValidException e) {
    var errors = new TreeMap<String, String>();
    e.getBindingResult()
        .getFieldErrors()
        .forEach(f ->
            errors.putIfAbsent(
                f.getField(),
                Objects.requireNonNullElse(f.getDefaultMessage(), "Valeur invalide")));
    return ResponseEntity.badRequest()
        .body(Map.of("message", "Vérifiez les champs du formulaire.", "fields", errors));
  }

  @ExceptionHandler(org.springframework.dao.DataIntegrityViolationException.class)
  ResponseEntity<?> conflict() {
    return ResponseEntity.status(409)
        .body(Map.of("message", "Cette opération entre en conflit avec des données existantes."));
  }

  @ExceptionHandler({
    IllegalArgumentException.class,
    org.springframework.http.converter.HttpMessageNotReadableException.class,
    org.springframework.web.method.annotation.MethodArgumentTypeMismatchException.class,
    jakarta.validation.ConstraintViolationException.class
  })
  ResponseEntity<?> invalid() {
    return ResponseEntity.badRequest().body(Map.of("message", "Données invalides."));
  }

  @ExceptionHandler(org.springframework.web.multipart.MaxUploadSizeExceededException.class)
  ResponseEntity<?> large() {
    return ResponseEntity.status(413).body(Map.of("message", "Fichier trop volumineux."));
  }

  @ExceptionHandler(Exception.class)
  ResponseEntity<?> failure(Exception e) {
    org.slf4j.LoggerFactory.getLogger(ApiErrors.class)
        .error("Request failed: {}", e.getClass().getSimpleName());
    return ResponseEntity.status(500)
        .body(Map.of("message", "Le service est temporairement indisponible."));
  }
}
