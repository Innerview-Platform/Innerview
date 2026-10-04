# ──────────────────────────────────────────────
# Stage 1: Build the Spring Boot fat JAR
# ──────────────────────────────────────────────
FROM eclipse-temurin:21-jdk AS build

WORKDIR /app

# Copy Maven wrapper and project descriptor first (layer cache for dependencies)
COPY .mvn/ .mvn/
COPY mvnw pom.xml ./

# Download dependencies (cached unless pom.xml changes)
RUN chmod +x mvnw && ./mvnw dependency:go-offline -B

# Copy the rest of the source and build
COPY src/ src/
RUN ./mvnw package -DskipTests -B

# ──────────────────────────────────────────────
# Stage 2: Run the application
# ──────────────────────────────────────────────
FROM eclipse-temurin:21-jre

WORKDIR /app

# Copy the fat JAR from the build stage
COPY --from=build /app/target/*.jar app.jar

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]
