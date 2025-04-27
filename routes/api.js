const express = require('express');
const router = express.Router();

// Demo data - in a real application, this would be from a database or external source
let sensorData = {
  temperature: 25,
  humidity: 60,
  distance: 0,
  motion: false,
  noise: 40,
  irObjectTemp: 36.5,
  irAmbientTemp: 25.0,
  lastUpdated: new Date().toISOString()
};

// Store the latest camera image
let latestCameraImage = null;

// Get all sensor data
router.get('/data', (req, res) => {
  res.json({
    success: true,
    data: sensorData
  });
});

// Get latest camera image
router.get('/camera', (req, res) => {
  if (latestCameraImage) {
    res.writeHead(200, {
      'Content-Type': 'image/jpeg',
      'Content-Length': latestCameraImage.length
    });
    res.end(latestCameraImage);
  } else {
    res.status(404).json({
      success: false,
      message: 'No camera image available'
    });
  }
});

// Camera stream endpoint
router.get('/camera/stream', (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'multipart/x-mixed-replace; boundary=frame',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive'
  });

  // Store the connection for cleanup
  const clients = req.app.get('streamClients') || new Set();
  clients.add(res);
  req.app.set('streamClients', clients);

  req.on('close', () => {
    clients.delete(res);
  });
});

// Update sensor data (for testing or manual updates)
router.post('/data', (req, res) => {
  const { sensor, value } = req.body;
  
  if (sensor && value !== undefined) {
    sensorData[sensor] = value;
    sensorData.lastUpdated = new Date().toISOString();
    
    res.json({
      success: true,
      message: `Updated ${sensor} to ${value}`,
      data: sensorData
    });
  } else {
    res.status(400).json({
      success: false,
      message: 'Invalid request. Please provide sensor and value.'
    });
  }
});

// ESP32 data endpoint
router.post('/esp32', (req, res) => {
  const data = req.body;
  
  if (data) {
    // Update relevant fields
    if (data.temperature !== undefined) sensorData.temperature = data.temperature;
    if (data.humidity !== undefined) sensorData.humidity = data.humidity;
    if (data.distance !== undefined) sensorData.distance = data.distance;
    if (data.motion !== undefined) sensorData.motion = data.motion;
    if (data.noise !== undefined) sensorData.noise = data.noise;
    if (data.irObjectTemp !== undefined) sensorData.irObjectTemp = data.irObjectTemp;
    if (data.irAmbientTemp !== undefined) sensorData.irAmbientTemp = data.irAmbientTemp;
    
    sensorData.lastUpdated = new Date().toISOString();
    
    // Broadcast to Socket.IO clients would happen in the main app
    const io = req.app.get('io');
    if (io) {
      io.emit('sensor-update', sensorData);
    }
    
    res.json({
      success: true,
      message: 'Data updated successfully'
    });
  } else {
    res.status(400).json({
      success: false,
      message: 'Invalid data format'
    });
  }
});

// ESP32-CAM endpoint
router.post('/camera', (req, res) => {
  if (!req.body || !req.body.image) {
    return res.status(400).json({
      success: false,
      message: 'No image data received'
    });
  }

  try {
    // Convert base64 to buffer if it's base64 encoded
    const imageData = req.body.image.startsWith('data:image') 
      ? Buffer.from(req.body.image.split(',')[1], 'base64')
      : Buffer.from(req.body.image, 'base64');

    // Store the latest image
    latestCameraImage = imageData;

    // Send to all connected stream clients
    const clients = req.app.get('streamClients');
    if (clients) {
      clients.forEach(client => {
        client.write('--frame\r\n');
        client.write('Content-Type: image/jpeg\r\n');
        client.write(`Content-Length: ${imageData.length}\r\n\r\n`);
        client.write(imageData);
        client.write('\r\n');
      });
    }

    // Broadcast to Socket.IO clients
    const io = req.app.get('io');
    if (io) {
      io.emit('camera-update', { image: req.body.image });
    }

    res.json({
      success: true,
      message: 'Camera image updated successfully'
    });
  } catch (error) {
    console.error('Error processing camera image:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing camera image'
    });
  }
});

module.exports = router; 