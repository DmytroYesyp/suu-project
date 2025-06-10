# Dockerfile file-sink-service
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install \
    express \
    @opentelemetry/api@^1.8.0 \
    @opentelemetry/sdk-node@^0.51.0 \
    @opentelemetry/exporter-trace-otlp-http@^0.51.0 \
    @opentelemetry/auto-instrumentations-node@^0.47.0 \
    @opentelemetry/resources@^1.25.0 \
    @opentelemetry/semantic-conventions@^1.25.0 \
    && npm cache clean --force

COPY . . 

VOLUME ["/data"]

EXPOSE 8080

CMD ["node", "-r", "./file-sink-tracing.js", "index.js"]
