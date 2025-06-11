// index.js
'use strict';

const cors = require('cors');
const express = require('express');
const { HTTP, CloudEvent } = require('cloudevents');
const { Pool } = require('pg');
const expressWs = require('express-ws');
const client = require('prom-client');
const opentelemetry = require('@opentelemetry/api'); // Import OpenTelemetry API

// Get a tracer instance for your application.
const tracer = opentelemetry.trace.getTracer('node-server'); // Use 'node-server' as service name

const app = express();
const port = 8000;

const register = new client.Registry();
client.collectDefaultMetrics({ register });

const httpRequestCounter = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'code'],
  registers: [register],
});

const dbQueryDurationHistogram = new client.Histogram({
  name: 'db_query_duration_seconds',
  help: 'Duration of database queries in seconds',
  labelNames: ['query_type', 'status'],
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
  registers: [register],
});

// Middleware to parse JSON bodies
app.use(express.json());
app.use(cors());
expressWs(app);

// Configure the PostgreSQL connection pool
const pool = new Pool({
  host: 'postgresql.default.svc.cluster.local',
  port: 5432,
  database: 'mydatabase',
  user: 'myuser',
  password: 'mypassword',
});

app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

app.ws('/comments', (ws, req) => {
  console.log('WebSocket connection established on /comments');

  const sendComments = async () => {
    // Manually create a root span for this WebSocket operation
    const parentSpan = tracer.startSpan('WebSocket: Fetch Comments');
    // Set this span as the active context for subsequent operations
    const ctx = opentelemetry.trace.set     
    Span(opentelemetry.context.active(), parentSpan);

    const end = dbQueryDurationHistogram.startTimer({ query_type: 'select_comments' });
    
    // Ensure the database query span is created within the active context
    opentelemetry.context.with(ctx, async () => {
      const dbSpan = tracer.startSpan('PostgreSQL Query: SELECT book_reviews'); // Child span
      dbSpan.setAttribute('db.statement', 'SELECT * FROM book_reviews ORDER BY post_time DESC;');
      dbSpan.setAttribute('db.system', 'postgresql');

      try {
        const { rows } = await pool.query('SELECT * FROM book_reviews ORDER BY post_time DESC;');
        const data = JSON.stringify(rows);
        if (ws.readyState === ws.OPEN) {
          ws.send(data);
        }
        end({ status: 'success' });
        dbSpan.setAttribute('db.response_row_count', rows.length);
        dbSpan.setStatus({ code: opentelemetry.SpanStatusCode.OK });
      } catch (err) {
        console.error('Error executing query', err.stack);
        if (ws.readyState === ws.OPEN) {
          ws.send(JSON.stringify({ error: 'Failed to retrieve comments' }));
        }
        end({ status: 'error' });
        dbSpan.setStatus({ code: opentelemetry.SpanStatusCode.ERROR, message: err.message });
        dbSpan.recordException(err);
      } finally {
        dbSpan.end(); // End the span for the database query
      }
    });
    parentSpan.end(); // End the parent span for the WebSocket operation
  };

  sendComments();
  const interval = setInterval(sendComments, 1000);

  ws.on('close', () => {
    console.log('WebSocket connection on /comments closed');
    clearInterval(interval);
  });

  ws.on('error', error => {
    console.error('WebSocket error on /comments:', error);
  });
});

app.post('/insert', async (req, res) => {
  // Use `startActiveSpan` and ensure its callback completes
  // This approach ensures the span is active for operations within its callback
  await tracer.startActiveSpan('POST /insert: Process Review Insertion', async (span) => {
    span.setAttribute('http.method', req.method);
    span.setAttribute('http.route', '/insert');

    const end = dbQueryDurationHistogram.startTimer({ query_type: 'insert_review' });
    try {
      const receivedEvent = HTTP.toEvent({ headers: req.headers, body: req.body });
      const reviewText = receivedEvent.data.reviewText;
      const sentimentResult = receivedEvent.data.sentimentResult;
      const postTime = new Date().toISOString().replace('T', ' ').replace('Z', '');

      // Add a child span for the database query, explicitly linked to the active context
      await tracer.startActiveSpan('PostgreSQL Query: INSERT book_reviews', async (dbSpan) => {
        dbSpan.setAttribute('db.statement', 'INSERT INTO book_reviews (post_time,content, sentiment) VALUES ($1, $2, $3)');
        dbSpan.setAttribute('db.system', 'postgresql');
        try {
          await pool.query('INSERT INTO book_reviews (post_time,content, sentiment) VALUES ($1, $2, $3)', [postTime, reviewText, sentimentResult]);
          dbSpan.setStatus({ code: opentelemetry.SpanStatusCode.OK });
        } catch (dbError) {
          dbSpan.setStatus({ code: opentelemetry.SpanStatusCode.ERROR, message: dbError.message });
          dbSpan.recordException(dbError);
          throw dbError; // Re-throw to be caught by the parent span's catch block
        } finally {
          dbSpan.end();
        }
      });

      end({ status: 'success' });
      console.log('Review inserted:', reviewText);

      const event = new CloudEvent({
        type: "com.example.reviews.inserted",
        source: "/api/reviews",
        data: {
          success: true,
          message: "Review inserted successfully"
        }
      });
      const serializedEvent = HTTP.binary(event);

      res.writeHead(200, serializedEvent.headers);
      res.end(JSON.stringify(serializedEvent.body));
      httpRequestCounter.inc({ method: req.method, route: '/insert', code: 200 });

      span.setStatus({ code: openteentelmetry.SpanStatusCode.OK });
    } catch (error) {
      console.error('Error processing request:', error);
      end({ status: 'error' });
      httpRequestCounter.inc({ method: req.method, route: '/insert', code: 500 });
      
      span.setStatus({ code: opentelemetry.SpanStatusCode.ERROR, message: error.message });
      span.recordException(error);
      return res.status(500).json({ error: 'Internal server error' });
    } finally {
      span.end();
    }
  });
});

app.post('/add', async (req, res) => {
  await tracer.startActiveSpan('POST /add: Forward Event', async (span) => {
    span.setAttribute('http.method', req.method);
    span.setAttribute('http.route', '/add');

    try {
      const receivedEvent = HTTP.toEvent({ headers: req.headers, body: req.body });
      const brokerURI = process.env.K_SINK;

      if (receivedEvent.type === 'new-review-comment') {
        await tracer.startActiveSpan('Fetch: Forward to K_SINK', async (fetchSpan) => {
          fetchSpan.setAttribute('http.url', brokerURI);
          fetchSpan.setAttribute('http.method', 'POST');
          
          try {
            const response = await fetch(brokerURI, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'ce-specversion': '1.0',
                'ce-type': 'new-review-comment',
                'ce-source': 'bookstore-eda',
                'ce-id': receivedEvent.id,
              },
              body: JSON.stringify(receivedEvent.data),
            });

            if (!response.ok) {
              const errorMessage = `Failed to forward event: ${response.status} ${response.statusText}`;
              console.error(errorMessage);
              httpRequestCounter.inc({ method: req.method, route: '/add', code: 500 });
              
              fetchSpan.setStatus({ code: opentelemetry.SpanStatusCode.ERROR, message: errorMessage });
              throw new Error(errorMessage); // Throw to be caught by parent span
            }

            fetchSpan.setStatus({ code: opentelemetry.SpanStatusCode.OK });
            console.log('Event forwarded successfully:', receivedEvent);
            console.log('brokerURI :', brokerURI);
            httpRequestCounter.inc({ method: req.method, route: '/add', code: 200 });
            span.setStatus({ code: opentelemetry.SpanStatusCode.OK });
            return res.status(200).json({ success: true, message: 'Event forwarded successfully' });
          } catch (fetchError) {
            fetchSpan.setStatus({ code: opentelemetry.SpanStatusCode.ERROR, message: fetchError.message });
            fetchSpan.recordException(fetchError);
            throw fetchError; // Re-throw to be caught by the parent span
          } finally {
            fetchSpan.end();
          }
        }); // End of fetch span callback
      } else {
        console.warn('Unexpected event type:', receivedEvent.type);
        httpRequestCounter.inc({ method: req.method, route: '/add', code: 400 });
        span.setStatus({ code: opentelemetry.SpanStatusCode.ERROR, message: `Unexpected event type: ${receivedEvent.type}` });
        return res.status(400).json({ error: 'Unexpected event type' });
      }
    } catch (error) {
      console.error('Error processing request:', error);
      httpRequestCounter.inc({ method: req.method, route: '/add', code: 500 });
      span.setStatus({ code: opentelemetry.SpanStatusCode.ERROR, message: error.message });
      span.recordException(error);
      return res.status(500).json({ error: 'Internal server error' });
    } finally {
      span.end();
    }
  });
});

app.get('/', (req, res) => {
  // `startActiveSpan` for HTTP requests usually done by auto-instrumentation.
  // If you want to add custom spans nested under the auto-instrumented one:
  tracer.startActiveSpan('GET /: Hello World Logic', (span) => { // This will be a child of the auto-instrumented span
    span.setAttribute('http.method', req.method);
    span.setAttribute('http.route', '/');

    res.send('Hello, world!');
    httpRequestCounter.inc({ method: req.method, route: '/', code: 200 });

    span.setStatus({ code: opentelemetry.SpanStatusCode.OK });
    span.end();
  });
});

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
