const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Middleware to parse JSON bodies from the Pico W
app.use(express.json());

// Serve static frontend files (assumes your HTML file is named index.html in a 'public' folder)
app.use(express.static(path.join(__dirname, 'public')));

// API Key configured on your Pico W
const API_KEY = "20002004040623";

// ==========================================
// RECEIVE DATA FROM PICO W
// ==========================================
app.post('/data', (req, res) => {
  const clientKey = req.query.key;

  // Validate API key
  if (clientKey !== API_KEY) {
    console.log("Unauthorized attempt with key:", clientKey);
    return res.status(403).json({ error: "Invalid API key" });
  }

  const sensorData = req.body;
  console.log("Received sensor data from Pico W:", sensorData);

  // Broadcast the data to all connected browser dashboards via Socket.io
  io.emit('sensor-update', sensorData);

  // Send success response back to Pico W
  res.json({ ok: true });
});

// Start server on Render's assigned port or fallback to 3000 locally
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Weather monitor server running on port ${PORT}`);
});
