const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { WebSocketServer } = require('ws');

const PORT = process.env.PORT || 3000;
const KEY = process.env.ESP_KEY || 'change-me';

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const wss = new WebSocketServer({ noServer: true });
let last = null;

app.use(express.json());              // lets the server read JSON posts
app.use(express.static('public'));

// The Pico W posts its readings here:
// POST https://your-site/data?key=YOUR_SECRET
app.post('/data', (req, res) => {
  if (req.query.key !== KEY) return res.status(401).json({ error: 'bad key' });
  last = { ...last, ...req.body };    // keeps old values for sensors not sent
  console.log('[HTTP Data]:', req.body);
  io.emit('sensor-update', last);
  res.json({ ok: true });
});

// ESP32 connects to wss://your-site/esp32?key=YOUR_SECRET
server.on('upgrade', (req, socket, head) => {
  const url = new URL(req.url, 'http://x');
  if (url.pathname === '/esp32') {
    if (url.searchParams.get('key') !== KEY) {
      socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
      return socket.destroy();
    }
    wss.handleUpgrade(req, socket, head, ws => wss.emit('connection', ws));
  }
});

wss.on('connection', ws => {
  console.log('ESP32 connected');
  ws.on('message', msg => {
    try {
      last = JSON.parse(msg.toString());
      io.emit('sensor-update', last);
    } catch {
      console.log('Bad JSON');
    }
  });
  ws.on('close', () => console.log('ESP32 disconnected'));
});

// New visitors instantly get the latest reading
io.on('connection', s => { if (last) s.emit('sensor-update', last); });

server.listen(PORT, '0.0.0.0', () => console.log('Running on port ' + PORT));
