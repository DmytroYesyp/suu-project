const express = require('express');
const fs = require('fs');
const opentelemetry = require('@opentelemetry/api');
const tracer = opentelemetry.trace.getTracer('file-sink-service');
const app = express();
const PORT = process.env.PORT || 8080;
app.use(express.json());

app.post('/', (req, res) => {
  const span = tracer.startActiveSpan('POST /: Save Event');
  span.setAttribute('http.method', 'POST');
  span.setAttribute('http.target', '/');

  try {
    fs.appendFileSync('/data/events.log', JSON.stringify(req.body) + '\n');
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

app.listen(PORT, () => {
  console.log(`File sink service listening on port ${PORT}`);
});
