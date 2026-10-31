# Single-service image for free hosting (Render): Spring Boot serves the API and the Angular build
# from one origin, so the CSP, cookies-free JWT auth and relative /api calls work unchanged.
# Local development keeps using docker-compose.yml (Nginx + backend + Postgres + Mailpit).

FROM node:22-alpine AS web
WORKDIR /workspace
COPY carnova-front/package.json carnova-front/package-lock.json ./
RUN --mount=type=cache,target=/root/.npm npm ci
COPY carnova-front/angular.json carnova-front/tsconfig.json carnova-front/tsconfig.app.json carnova-front/.postcssrc.json ./
COPY carnova-front/src ./src
COPY carnova-front/public ./public
RUN npm run build

FROM maven:3.9.11-eclipse-temurin-17 AS api
WORKDIR /workspace
COPY carnova-back/pom.xml .
RUN --mount=type=cache,target=/root/.m2 mvn -B -ntp dependency:go-offline
COPY carnova-back/src ./src
COPY --from=web /workspace/dist/carnova-front/browser ./src/main/resources/static
# Tests run in CI (and Render deploys only after CI passes), so the image build skips them.
RUN --mount=type=cache,target=/root/.m2 mvn -B -ntp package -Paot -Dmaven.test.skip=true

FROM eclipse-temurin:17-jre-alpine
RUN addgroup -S -g 10001 carnova && adduser -S -u 10001 -G carnova carnova \
  && mkdir -p /app /data/uploads /data/models && chown -R carnova:carnova /app /data
WORKDIR /app
COPY --from=api --chown=carnova:carnova /workspace/target/carnova-2.0.0.jar /tmp/app.jar
COPY --chown=carnova:carnova carnova-back/models/ /data/models/
# Sized for a 512 MB free instance: bounded heap, small thread stacks, quick C1-only JIT.
ENV UPLOADS_DIR=/data/uploads \
    MODELS_DIR=/data/models \
    JAVA_TOOL_OPTIONS="-XX:MaxRAMPercentage=65 -XX:+UseSerialGC -XX:TieredStopAtLevel=1 -Xss512k -XX:+ExitOnOutOfMemoryError"
USER 10001:10001
# Class Data Sharing: a training run records the classes Spring loads, so a cold start on a
# 0.1 CPU instance skips most class parsing. The training run must not reach a database: it
# stops after context refresh, with migrations, schema validation and JDBC metadata disabled.
RUN java -Djarmode=tools -jar /tmp/app.jar extract --destination /app \
  && java -XX:ArchiveClassesAtExit=/app/app.jsa -Dspring.aot.enabled=true -Dspring.context.exit=onRefresh \
     -Dcarnova.cds-training=true -Dspring.jpa.hibernate.ddl-auto=none \
     -Dspring.jpa.properties.hibernate.boot.allow_jdbc_metadata_access=false \
     -Dspring.jpa.database-platform=org.hibernate.dialect.PostgreSQLDialect \
     -Dapp.jwt-secret=cds-training-only-not-a-runtime-secret-0000 -Dapp.demo-data=false \
     -Dlogging.level.root=WARN -jar /app/app.jar
EXPOSE 8081
ENTRYPOINT ["java","-XX:SharedArchiveFile=/app/app.jsa","-Dspring.aot.enabled=true","-jar","/app/app.jar"]
