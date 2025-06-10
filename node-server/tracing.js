// tracing.js
'use strict';

const { NodeSDK } = require('@opentelemetry/sdk-node');
const { OTLPTraceExporter } = require('@opentelemetry/exporter-trace-otlp-grpc');
const { getNodeAutoInstrumentations } = require('@opentelemetry/auto-instrumentations-node');
const { Resource } = require('@opentelemetry/resources');
const { SemanticResourceAttributes } = require('@opentelemetry/semantic-conventions');

// Ініціалізація експортера, що відправлятиме дані на OpenTelemetry Collector
const otlpExporter = new OTLPTraceExporter({
  url: 'http://192.168.58.2:30007', // ВИКОРИСТОВУЙТЕ HTTP! OTLP gRPC іноді вимагає https за замовчуванням
  // АБО спробуйте url: 'grpc://<minikube-ip>:30007' якщо gRPC URL схема потрібна
});

// Створення SDK
const sdk = new NodeSDK({
  // Додаємо ресурс з ім'ям сервісу. Це ім'я буде видно в Jaeger.
  resource: new Resource({
    [SemanticResourceAttributes.SERVICE_NAME]: 'node-server',
  }),
  traceExporter: otlpExporter,
  // Використовуємо автоматичні інструментації для популярних бібліотек (Express, PostgreSQL, HTTP)
  instrumentations: [getNodeAutoInstrumentations()],
});

// Запуск SDK та ініціалізація трасування
sdk.start();
console.log('Tracing initialized with NodeSDK');

// Обробка коректного завершення роботи, щоб всі трейси встигли відправитись
process.on('SIGTERM', () => {
  sdk.shutdown()
    .then(() => console.log('Tracing terminated'))
    .catch((error) => console.error('Error terminating tracing', error))
    .finally(() => process.exit(0));
});