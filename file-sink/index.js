const express = require('express');
const fs = require('fs');
const opentelemetry = require('@opentelemetry/api');
const tracer = opentelemetry.trace.getTracer('file-sink-service');

const promClient = require('prom-client');

// Create a Registry to store metrics
const register = new promClient.Registry();

// Create metrics
const eventsProcessed = new promClient.Counter({
  name: 'file_sink_events_processed_total',
  help: 'Total number of events processed by file-sink'
});

const eventSize = new promClient.Histogram({
  name: 'file_sink_event_size_bytes',
  help: 'Size of processed events in bytes',
  buckets: [10, 100, 1000, 10000]
});

// Register metrics
register.registerMetric(eventsProcessed);
register.registerMetric(eventSize);

const app = express();
const PORT = process.env.PORT || 8080;

app.use(express.json());

app.post('/', (req, res) => {
  
  const eventData = JSON.stringify(req.body) + '\n';
  
  // Record metrics
  eventsProcessed.inc();
  eventSize.observe(Buffer.byteLength(eventData));
  
  
    const span = tracer.startActiveSpan('POST /: Save Event');
  span.setAttribute('http.method', 'POST');
  span.setAttribute('http.target', '/');

  try {
    fs.appendFileSync('/data/events.log', eventData);
    res.status(200).send('Event saved');
    span.setStatus({ code: opentelemetry.SpanStatusCode.OK });
  } catch (error) {
    console.error('Error saving event:', error);
    res.status(500).send('Error saving event');
    span.setStatus({ code: opentelemetry.SpanStatusCode.ERROR, message: error.message });
    span.recordException(error);
  } finally {
    span.end();
  }
});

app.get('/metrics', async (req, res) => {
  console.log('Metrics endpoint hit');
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});


app.listen(PORT, () => {
  console.log(`File sink service listening on port ${PORT}`);
});
