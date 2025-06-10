const express = require('express');
const fs = require('fs');
const app = express();
const PORT = process.env.PORT || 8080;
app.use(express.json());
app.post('/', (req, res) => {
 // Save the received event to a file (append mode)
 fs.appendFileSync('/data/events.log', JSON.stringify(req.body) + '\n');
 if (Math.random() < 0.5) {
   fs.appendFileSync('/data/events.log', 'error simulated\n');
   return res.status(500).send('Internal Server Error');
 }
 // Respond with a success message
 res.status(200).send('Event saved');
});
app.listen(PORT, () => {
 console.log(`File sink service listening on port ${PORT}`);
});
