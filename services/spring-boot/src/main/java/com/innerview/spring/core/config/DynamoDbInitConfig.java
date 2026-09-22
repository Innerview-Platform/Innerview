package com.innerview.spring.core.config;

import jakarta.annotation.PostConstruct;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import software.amazon.awssdk.services.dynamodb.DynamoDbClient;
import software.amazon.awssdk.services.dynamodb.model.*;

@Configuration
public class DynamoDbInitConfig {

    private static final Logger log = LoggerFactory.getLogger(DynamoDbInitConfig.class);
    private final DynamoDbClient dynamoDbClient;

    @Value("${notification.dynamo.inapp-table}")
    private String inAppTableName;

    public DynamoDbInitConfig(DynamoDbClient dynamoDbClient) {
        this.dynamoDbClient = dynamoDbClient;
    }

    @PostConstruct
    public void createTables() {
        // Run in background — never block Spring startup
        Thread.ofVirtual().name("dynamo-init").start(() -> {
            // interview-notification-outbox: PK eventId (S), SK channel (S) — see OutboxRepository
            ensureTable(
                    "interview-notification-outbox",
                    List.of(
                            AttributeDefinition.builder().attributeName("eventId").attributeType(ScalarAttributeType.S).build(),
                            AttributeDefinition.builder().attributeName("channel").attributeType(ScalarAttributeType.S).build()),
                    List.of(
                            KeySchemaElement.builder().attributeName("eventId").keyType(KeyType.HASH).build(),
                            KeySchemaElement.builder().attributeName("channel").keyType(KeyType.RANGE).build()));

            // In-app inbox: PK recipientId (S), SK sk (S, "<epochMs>#<eventId>") — see InAppNotificationRepository
            ensureTable(
                    inAppTableName,
                    List.of(
                            AttributeDefinition.builder().attributeName("recipientId").attributeType(ScalarAttributeType.S).build(),
                            AttributeDefinition.builder().attributeName("sk").attributeType(ScalarAttributeType.S).build()),
                    List.of(
                            KeySchemaElement.builder().attributeName("recipientId").keyType(KeyType.HASH).build(),
                            KeySchemaElement.builder().attributeName("sk").keyType(KeyType.RANGE).build()));
        });
    }

    private void ensureTable(
            String tableName,
            List<AttributeDefinition> attributeDefinitions,
            List<KeySchemaElement> keySchema) {
        int maxRetries = 5;

        for (int attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                dynamoDbClient.describeTable(DescribeTableRequest.builder()
                        .tableName(tableName)
                        .build());
                log.info("Table {} already exists.", tableName);
                return;

            } catch (ResourceNotFoundException e) {
                log.info("Table {} does not exist. Creating...", tableName);
                try {
                    dynamoDbClient.createTable(CreateTableRequest.builder()
                            .tableName(tableName)
                            .attributeDefinitions(attributeDefinitions)
                            .keySchema(keySchema)
                            .billingMode(BillingMode.PAY_PER_REQUEST)
                            .build());
                    log.info("Table {} created successfully.", tableName);
                } catch (ResourceInUseException already) {
                    log.info("Table {} was created concurrently — treating as ready.", tableName);
                }
                return;

            } catch (Exception e) {
                log.warn("DynamoDB init attempt {}/{} failed for table {}: {}", attempt, maxRetries, tableName, e.getMessage());
                try {
                    Thread.sleep(3000L * attempt); // back off: 3s, 6s, 9s...
                } catch (InterruptedException ie) {
                    Thread.currentThread().interrupt();
                    return;
                }
            }
        }
        log.error("DynamoDB init failed for table {} after {} attempts — app running without it.", tableName, maxRetries);
    }
}
