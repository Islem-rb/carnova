package CarNova.carnova.service;

import static org.assertj.core.api.Assertions.*;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.*;
import static org.springframework.test.web.client.response.MockRestResponseCreators.*;

import org.junit.jupiter.api.*;
import org.springframework.core.task.support.TaskExecutorAdapter;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;

class AccountMailTests {
  @Test void sendsDocumentedMailpitPayloadWithFragmentLinkAndRealLineBreaks() {
    var builder = RestClient.builder().baseUrl("http://mailpit:8025");
    var server = MockRestServiceServer.bindTo(builder).build();
    var mail = new AccountMail(builder.build(), "http://localhost:8080", "bonjour@carnova.test", new TaskExecutorAdapter(Runnable::run));
    String token = "x".repeat(43);
    server.expect(requestTo("http://mailpit:8025/api/v1/send")).andExpect(method(HttpMethod.POST))
        .andExpect(jsonPath("$.From.Email").value("bonjour@carnova.test"))
        .andExpect(jsonPath("$.To[0].Email").value("client@example.com"))
        .andExpect(jsonPath("$.Text").value(org.hamcrest.Matchers.containsString("\n\n")))
        .andExpect(jsonPath("$.Text").value(org.hamcrest.Matchers.containsString("http://localhost:8080/verifier-email#token=" + token)))
        .andRespond(withSuccess());
    mail.committed(new AccountMail.Message("client@example.com", token, true));
    server.verify();
  }
  @Test void mailFailureDoesNotEscapeOrRevealAccountExistence() {
    var builder = RestClient.builder().baseUrl("http://mailpit:8025");
    var server = MockRestServiceServer.bindTo(builder).build();
    var mail = new AccountMail(builder.build(), "http://localhost:8080", "bonjour@carnova.test", new TaskExecutorAdapter(Runnable::run));
    server.expect(requestTo("http://mailpit:8025/api/v1/send")).andRespond(withStatus(HttpStatus.SERVICE_UNAVAILABLE));
    assertThatCode(() -> mail.committed(new AccountMail.Message("client@example.com", "x".repeat(43), false))).doesNotThrowAnyException();
    server.verify();
  }
  @Test void dispatchesOnlyAfterCommitAndDoesNotSendRolledBackEvents() {
    var builder = RestClient.builder().baseUrl("http://mailpit:8025");
    var server = MockRestServiceServer.bindTo(builder).build();
    var tasks = new java.util.ArrayList<Runnable>();
    var mail = new AccountMail(builder.build(), "http://localhost:8080", "bonjour@carnova.test", new TaskExecutorAdapter(tasks::add));
    var manager = new org.springframework.transaction.support.AbstractPlatformTransactionManager() {
      protected Object doGetTransaction() { return new Object(); }
      protected void doBegin(Object transaction, org.springframework.transaction.TransactionDefinition definition) {}
      protected void doCommit(org.springframework.transaction.support.DefaultTransactionStatus status) {}
      protected void doRollback(org.springframework.transaction.support.DefaultTransactionStatus status) {}
    };
    try (var context = new org.springframework.context.annotation.AnnotationConfigApplicationContext()) {
      context.registerBean(org.springframework.transaction.event.TransactionalEventListenerFactory.class);
      context.registerBean(AccountMail.class, () -> mail);
      context.refresh();
      var transaction = new org.springframework.transaction.support.TransactionTemplate(manager);
      var message = new AccountMail.Message("client@example.com", "x".repeat(43), false);
      transaction.executeWithoutResult(status -> {
        context.publishEvent(message); assertThat(tasks).isEmpty(); status.setRollbackOnly();
      });
      assertThat(tasks).isEmpty();
      transaction.executeWithoutResult(status -> {
        context.publishEvent(message); assertThat(tasks).isEmpty();
      });
      assertThat(tasks).hasSize(1);
      server.expect(requestTo("http://mailpit:8025/api/v1/send"))
          .andExpect(jsonPath("$.Text").value(org.hamcrest.Matchers.containsString("/reinitialiser-mot-de-passe#token=")))
          .andRespond(withSuccess());
      tasks.get(0).run(); server.verify();
    }
  }

  @Test void bootProvidesTheNamedBoundedMailExecutor() {
    try (var context = new org.springframework.context.annotation.AnnotationConfigApplicationContext()) {
      context.getEnvironment().getPropertySources().addFirst(new org.springframework.core.env.MapPropertySource("account-test", java.util.Map.of(
          "spring.task.execution.pool.core-size", "2", "spring.task.execution.pool.max-size", "4", "spring.task.execution.pool.queue-capacity", "100")));
      context.register(org.springframework.boot.autoconfigure.task.TaskExecutionAutoConfiguration.class, AccountMail.class);
      context.refresh();
      assertThat(context.getBean(AccountMail.class)).isNotNull();
      var executor = context.getBean("applicationTaskExecutor", org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor.class);
      assertThat(executor.getCorePoolSize()).isEqualTo(2);
      assertThat(executor.getMaxPoolSize()).isEqualTo(4);
      assertThat(executor.getThreadPoolExecutor().getQueue().remainingCapacity()).isEqualTo(100);
    }
  }

  @Test void invalidFrontendOriginsAreRejected() {
    assertThatThrownBy(() -> new AccountMail(RestClient.create(), "https://evil.example/path?next=x", "bonjour@carnova.test", new TaskExecutorAdapter(Runnable::run)))
        .isInstanceOf(IllegalArgumentException.class);
  }
}
