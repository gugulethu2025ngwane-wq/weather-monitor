const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const PORT = process.env.PORT || 3000;
const KEY = process.env.PICO_KEY || process.env.ESP_KEY || 'change-me';

const app = express();
const server = http.createServer(app);
const io = new Server(server);
let last = null;

app.use(express.json());
app.use(express.static('public'));

// The Pico W posts its readings here:
// POST https://your-site/data?key=YOUR_SECRET
app.post('/data', (req, res) => {
  if (req.query.key !== KEY) return res.status(401).json({ error: 'bad key' });
  last = { ...last, ...req.body };   // keeps old values for sensors not sent
  console.log('[Pico W data]:', req.body);
  io.emit('sensor-update', last);
  res.json({ ok: true });
});

// New visitors instantly get the latest reading
io.on('connection', s => { if (last) s.emit('sensor-update', last); });

server.listen(PORT, '0.0.0.0', () => console.log('Running on port ' + PORT));
