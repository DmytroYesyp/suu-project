const express = require('express');
const fs = require('fs');
const app = express();
const PORT = process.env.PORT || 8080;
app.use(express.json());
app.post('/', (req, res) => {
 // Save the received event to a file (append mode)
 fs.appendFileSync('/data/events.log', JSON.stringify(req.body) + '\n');
 res.status(200).send('Dead letter event logged');
});
app.listen(PORT, () => {
 console.log(`dead letter logger service listening on port ${PORT}`);
});
