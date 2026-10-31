package CarNova.carnova.service;

import java.net.URI;
import java.util.*;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.*;
import org.springframework.core.task.AsyncTaskExecutor;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionalEventListener;
import org.springframework.web.client.RestClient;

/** Portfolio mail is captured locally by Mailpit; no external delivery is configured. */
@Component
public class AccountMail {
  public record Message(String email, String token, boolean verification) {
    @Override public String toString() { return "AccountMail.Message[redacted]"; }
  }
  private final RestClient client;
  private final AsyncTaskExecutor executor;
  private final String frontend, sender;

  @Autowired
  public AccountMail(@Value("${app.mailpit-url:http://localhost:8025}") String url,
      @Value("${app.frontend-url:http://localhost:8080}") String frontend,
      @Value("${app.mail-from:bonjour@carnova.test}") String sender,
      @Qualifier("applicationTaskExecutor") AsyncTaskExecutor executor) {
    this(client(url), frontend, sender, executor);
  }

  AccountMail(RestClient client, String frontend, String sender, AsyncTaskExecutor executor) {
    this.client = client;
    this.frontend = origin(frontend);
    this.sender = sender;
    this.executor = executor;
  }

  private static RestClient client(String url) {
    var factory = new SimpleClientHttpRequestFactory();
    factory.setConnectTimeout(2000);
    factory.setReadTimeout(5000);
    return RestClient.builder().baseUrl(origin(url)).requestFactory(factory).build();
  }

  @TransactionalEventListener
  public void committed(Message message) {
    // Submit only after commit, with no mailbox/network timing in the public reset response.
    try {
      executor.execute(() -> deliver(message));
    } catch (org.springframework.core.task.TaskRejectedException e) {
      failed();
    }
  }

  private void deliver(Message message) {
    String action = message.verification() ? "Confirmez votre adresse e-mail" : "Réinitialisez votre mot de passe";
    String route = message.verification() ? "/verifier-email" : "/reinitialiser-mot-de-passe";
    String duration = message.verification() ? "24 heures" : "30 minutes";
    // Fragments keep bearer links out of HTTP access logs and Referer headers.
    String link = frontend + route + "#token=" + message.token();
    String text = "Bonjour,\n\n" + action + " :\n" + link
        + "\n\nCe lien est personnel, utilisable une seule fois et expire dans " + duration
        + ". Si vous n’êtes pas à l’origine de cette demande, ignorez cet e-mail.\n\nL’équipe CarNova";
    try {
      client.post().uri("/api/v1/send").contentType(MediaType.APPLICATION_JSON)
          .body(Map.of("From", Map.of("Email", sender, "Name", "CarNova"),
              "To", List.of(Map.of("Email", message.email())), "Subject", action + " · CarNova", "Text", text))
          .retrieve().toBodilessEntity();
    } catch (org.springframework.web.client.RestClientException e) {
      failed();
    }
  }

  private void failed() {
    // Never log the address, bearer link, message body or remote exception text.
    LoggerFactory.getLogger(AccountMail.class).warn("Account email could not be delivered; request a new link.");
  }

  private static String origin(String value) {
    URI uri = URI.create(value);
    if (!("http".equals(uri.getScheme()) || "https".equals(uri.getScheme()))
        || uri.getHost() == null || uri.getUserInfo() != null || uri.getQuery() != null
        || uri.getFragment() != null || !(uri.getPath().isEmpty() || uri.getPath().equals("/")))
      throw new IllegalArgumentException("Account URLs must be absolute HTTP(S) origins");
    return value.replaceAll("/+$", "");
  }
}
