FROM maven:3.9.11-eclipse-temurin-17 AS build
WORKDIR /workspace
COPY pom.xml .
RUN --mount=type=cache,target=/root/.m2 mvn -B -ntp dependency:go-offline
COPY src ./src
RUN --mount=type=cache,target=/root/.m2 mvn -B -ntp verify

FROM eclipse-temurin:17-jre-alpine
RUN addgroup -S -g 10001 carnova && adduser -S -u 10001 -G carnova carnova && mkdir -p /app /data/uploads /data/models && chown -R carnova:carnova /app /data
WORKDIR /app
COPY --from=build --chown=carnova:carnova /workspace/target/carnova-2.0.0.jar app.jar
COPY --chown=carnova:carnova models/ /data/models/
USER 10001:10001
EXPOSE 8081
ENTRYPOINT ["java","-jar","app.jar"]
