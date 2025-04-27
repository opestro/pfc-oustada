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
let lastImageUpdate = null;

// Get all sensor data
router.get('/data', (req, res) => {
  res.json({
    success: true,
    data: sensorData
  });
});

// Get latest camera image
router.get('/camera', (req, res) => {
  res.json({
    success: true,
    image: latestCameraImage || null,
    lastUpdate: lastImageUpdate
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
  const data = req.body;
  
  if (data && data.image) {
    try {
      // Store the latest image
      latestCameraImage = data.image;
      lastImageUpdate = new Date().toISOString();
      
      console.log(`Received camera image: ${data.image.substring(0, 50)}... (${data.image.length} bytes)`);
      
      // Broadcast to Socket.IO clients
      const io = req.app.get('io');
      if (io) {
        io.emit('camera-update', { 
          image: data.image,
          timestamp: lastImageUpdate
        });
      }
      
      res.json({
        success: true,
        message: 'Camera image updated successfully'
      });
    } catch (error) {
      console.error('Error processing camera image:', error);
      res.status(500).json({
        success: false,
        message: 'Error processing image data'
      });
    }
  } else {
    res.status(400).json({
      success: false,
      message: 'Invalid image data'
    });
  }
});

module.exports = router; 