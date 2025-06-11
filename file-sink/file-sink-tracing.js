// file-sink-tracing.js
'use strict';

const { NodeSDK } = require('@opentelemetry/sdk-node');
const { OTLPTraceExporter } = require('@opentelemetry/exporter-trace-otlp-grpc');
const { getNodeAutoInstrumentations } = require('@opentelemetry/auto-instrumentations-node');
const { Resource } = require('@opentelemetry/resources');
const { SemanticResourceAttributes } = require('@opentelemetry/semantic-conventions');

const otlpExporter = new OTLPTraceExporter({
  url: 'http://192.168.58.2:30007', // костиль але так тому і бути 
});

const sdk = new NodeSDK({
  resource: new Resource({
    [SemanticResourceAttributes.SERVICE_NAME]: 'file-sink-service',
  }),
  traceExporter: otlpExporter,
  instrumentations: [getNodeAutoInstrumentations()],
});

sdk.start();
console.log('Tracing initialized with NodeSDK for file-sink-service (HTTP Exporter)');

process.on('SIGTERM', () => {
  sdk.shutdown()
    .then(() => console.log('file-sink-service tracing terminated'))
    .catch((error) => console.error('Error terminating file-sink-service tracing', error))
    .finally(() => process.exit(0));
});
