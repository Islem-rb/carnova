package CarNova.carnova.api;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;
import java.lang.annotation.*;

@Target({ElementType.FIELD, ElementType.PARAMETER, ElementType.RECORD_COMPONENT})
@Retention(RetentionPolicy.RUNTIME)
@Constraint(validatedBy = PasswordBytesValidator.class)
public @interface PasswordBytes {
  String message() default "Le mot de passe ne doit pas dépasser 72 octets UTF-8.";
  Class<?>[] groups() default {};
  Class<? extends Payload>[] payload() default {};
}
