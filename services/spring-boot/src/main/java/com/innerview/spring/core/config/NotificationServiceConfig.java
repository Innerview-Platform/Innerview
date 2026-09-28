package com.innerview.spring.core.config;

import com.innerview.spring.entity.ScheduleNotification;
import com.innerview.spring.repository.InAppNotificationRepository;
import com.innerview.spring.repository.OutboxRepository;
import com.innerview.spring.service.GoogleApiService;
import com.innerview.spring.service.notification.EmailNotificationWorker;
import com.innerview.spring.service.notification.InAppNotificationWorker;
import com.innerview.spring.service.notification.SseEmitterRegistry;
import java.net.URI;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.LinkedBlockingQueue;
import java.util.function.Supplier;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.mail.javamail.JavaMailSender;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.dynamodb.DynamoDbClient;

/**
 * Spring configuration that wires the full notification pipeline.
 *
 * <p>Dependency graph:
 *
 * <p>inAppQueue ──► inAppExecutor (virtual-thread workers) ──► InAppNotificationWorker emailQueue
 * ──► emailExecutor (virtual-thread workers) ──► EmailNotificationWorker ├── OutboxRepository
 * (DynamoDB) └── JavaMailSender / SES
 *
 * <p>NotificationPublisher.publishEvent() ├── routes IN_APP ──► inAppQueue └── routes EMAIL ──►
 * emailQueue
 *
 * <p>Worker counts are intentionally NOT derived from CPU core count. Every worker spends nearly
 * all of its life blocked on {@code queue.take()} or on network I/O (DynamoDB, SMTP, SSE), so it
 * costs close to zero CPU while idle — cores aren't the limiting resource here. What actually
 * caps safe throughput is how much concurrent load the downstream systems can take: Gmail SMTP
 * throttles/blocks accounts that open too many concurrent connections, and the DynamoDB SDK's
 * HTTP client has its own connection-pool ceiling. Each worker count is therefore a small,
 * explicit, externally-tunable value ({@code notification.workers.*}), sized to those external
 * limits rather than to {@code Runtime.availableProcessors()}.
 */
@Configuration
public class NotificationServiceConfig {

  private static final Logger log = LoggerFactory.getLogger(NotificationServiceConfig.class);

  // Queue buffer size to absorb sudden traffic spikes safely
  private static final int QUEUE_CAPACITY = 500;

  @Value("${notification.workers.in-app:8}")
  private int inAppWorkerCount;

  @Value("${notification.workers.email:5}")
  private int emailWorkerCount;

  // ── Queues ────────────────────────────────────────────────────────────────

  /** Dedicated queue for in-app (SSE) notifications. */
  @Bean
  public LinkedBlockingQueue<ScheduleNotification> inAppQueue() {
    return new LinkedBlockingQueue<>(QUEUE_CAPACITY);
  }

  /** Dedicated queue for email notifications. */
  @Bean
  public LinkedBlockingQueue<ScheduleNotification> emailQueue() {
    return new LinkedBlockingQueue<>(QUEUE_CAPACITY);
  }

  // ── Worker pools ──────────────────────────────────────────────────────────

  /**
   * In-app (SSE) delivery workers, one virtual thread per worker. Count is controlled via {@code
   * notification.workers.in-app} — raise it if DynamoDB / SSE fan-out can sustain more
   * concurrency, not because the box has more cores.
   */
  @Bean(destroyMethod = "shutdownNow")
  public ExecutorService inAppExecutor(
      LinkedBlockingQueue<ScheduleNotification> inAppQueue,
      OutboxRepository outboxRepository,
      InAppNotificationRepository inAppNotificationRepository,
      SseEmitterRegistry sseEmitterRegistry) {

    return startWorkerPool(
        "InApp",
        inAppWorkerCount,
        () ->
            new InAppNotificationWorker(
                outboxRepository, inAppNotificationRepository, sseEmitterRegistry, inAppQueue));
  }

  /**
   * Email delivery workers, one virtual thread per worker. Count is controlled via {@code
   * notification.workers.email} — keep this at or below what the SMTP relay allows concurrently;
   * Gmail in particular throttles/blocks accounts that open too many connections at once.
   */
  @Bean(destroyMethod = "shutdownNow")
  public ExecutorService emailExecutor(
      OutboxRepository outboxRepository,
      JavaMailSender mailSender,
      GoogleApiService googleApiService,
      LinkedBlockingQueue<ScheduleNotification> emailQueue) {

    return startWorkerPool(
        "Email",
        emailWorkerCount,
        () ->
            new EmailNotificationWorker(
                outboxRepository, googleApiService, mailSender, emailQueue));
  }

  // ── Infrastructure beans ──────────────────────────────────────────────────

  @Bean
  public OutboxRepository outboxRepository(DynamoDbClient dynamoDbClient) {
    return new OutboxRepository(dynamoDbClient);
  }

  @Value("${aws.dynamodb.endpoint}")
  private String dynamoEndpoint;

  @Bean
  public DynamoDbClient dynamoDbClient() {
    log.info(">>> DynamoDB endpoint value: '{}'", dynamoEndpoint);
    return DynamoDbClient.builder()
        .endpointOverride(URI.create(dynamoEndpoint))
        .region(Region.US_EAST_1)
        .credentialsProvider(
            StaticCredentialsProvider.create(AwsBasicCredentials.create("dummy", "dummy")))
        .build();
  }

  // ── Factory ───────────────────────────────────────────────────────────────

  /**
   * Starts {@code count} permanently-running virtual-thread workers, each executing one instance
   * from {@code workerFactory} (an infinite loop pulling off a shared blocking queue). Virtual
   * threads replace the previous platform-thread {@code ThreadPoolExecutor} because these workers
   * are blocked on I/O almost all the time — there's no CPU-driven ceiling to size against, and no
   * per-task submission overhead to amortize since each worker runs forever rather than being
   * reused across many short tasks.
   */
  private ExecutorService startWorkerPool(
      String namePrefix, int count, Supplier<Runnable> workerFactory) {
    ExecutorService executor =
        Executors.newThreadPerTaskExecutor(
            Thread.ofVirtual().name(namePrefix + "-Worker-", 0).factory());

    for (int i = 0; i < count; i++) {
      executor.submit(workerFactory.get());
    }

    log.info("Started {} virtual-thread workers for '{}'", count, namePrefix);
    return executor;
  }
}
