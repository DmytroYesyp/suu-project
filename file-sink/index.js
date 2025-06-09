const express = require('express');
const fs = require('fs');
const app = express();
const PORT = process.env.PORT || 8080;
app.use(express.json());
app.post('/', (req, res) => {
 // Save the received event to a file (append mode)
 fs.appendFileSync('/data/events.log', JSON.stringify(req.body) + '\n');
 res.status(200).send('Event saved');
});
app.listen(PORT, () => {
 console.log(`File sink service listening on port ${PORT}`);
});
