const cors = require('cors');
const express = require('express');
const {HTTP, CloudEvent} = require('cloudevents');
const {Pool} = require('pg');
const expressWs = require('express-ws');
const client = require('prom-client');

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
        const end = dbQueryDurationHistogram.startTimer({ query_type: 'select_comments' });
        try {
            const {rows} = await pool.query('SELECT * FROM book_reviews ORDER BY post_time DESC;');
            const data = JSON.stringify(rows);
            if (ws.readyState === ws.OPEN) {
                ws.send(data);
            }
            end({ status: 'success' });
        } catch (err) {
            console.error('Error executing query', err.stack);
            if (ws.readyState === ws.OPEN) {
                ws.send(JSON.stringify({error: 'Failed to retrieve comments'}));
            }
            end({ status: 'error' });
        }
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
    const end = dbQueryDurationHistogram.startTimer({ query_type: 'insert_review' });
    try {
        const receivedEvent = HTTP.toEvent({headers: req.headers, body: req.body});
        const reviewText = receivedEvent.data.reviewText;
        const sentimentResult = receivedEvent.data.sentimentResult;
        const postTime = new Date().toISOString().replace('T', ' ').replace('Z', '');

        await pool.query('INSERT INTO book_reviews (post_time,content, sentiment) VALUES ($1, $2, $3)', [postTime, reviewText, sentimentResult]);
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
    } catch (error) {
        console.error('Error processing request:', error);
        end({ status: 'error' });
        httpRequestCounter.inc({ method: req.method, route: '/insert', code: 500 });
        return res.status(500).json({error: 'Internal server error'});
    }
});

app.post('/add', async (req, res) => {
    try {
        const receivedEvent = HTTP.toEvent({headers: req.headers, body: req.body});
        const brokerURI = process.env.K_SINK;

        if (receivedEvent.type === 'new-review-comment') {
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
                console.error('Failed to forward event:', receivedEvent);
                httpRequestCounter.inc({ method: req.method, route: '/add', code: 500 });
                return res.status(500).json({error: 'Failed to forward event'});
            }

            console.log('Event forwarded successfully:', receivedEvent);
            httpRequestCounter.inc({ method: req.method, route: '/add', code: 200 });
            return res.status(200).json({success: true, message: 'Event forwarded successfully'});
        } else {
            console.warn('Unexpected event type:', receivedEvent.type);
            httpRequestCounter.inc({ method: req.method, route: '/add', code: 400 });
            return res.status(400).json({error: 'Unexpected event type'});
        }
    } catch (error) {
        console.error('Error processing request:', error);
        httpRequestCounter.inc({ method: req.method, route: '/add', code: 500 });
        return res.status(500).json({error: 'Internal server error'});
    }
});

app.get('/', (req, res) => {
    res.send('Hello, world!');
    httpRequestCounter.inc({ method: req.method, route: '/', code: 200 });
});

app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});