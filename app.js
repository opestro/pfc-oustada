const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Routes
const apiRoutes = require('./routes/api');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' })); // Increased limit for image uploads
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Set io instance for routes to use
app.set('io', io);

// Routes
app.use('/api', apiRoutes);

// Serve the main dashboard
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'dashboard.html'));
});

// Socket.IO connection
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);
  
  // Handle incoming sensor data
  socket.on('sensor-data', (data) => {
    console.log('Received sensor data:', data);
    // Broadcast to all connected clients
    io.emit('sensor-update', data);
  });
  
  // Handle camera data
  socket.on('camera-data', (data) => {
    io.emit('camera-update', data);
  });
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Export for testing
module.exports = { app, server, io }; 