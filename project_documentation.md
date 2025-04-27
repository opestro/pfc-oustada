# ESP32 IoT Sensor Monitoring System

## Project Overview

This project implements a comprehensive IoT monitoring system using an ESP32 microcontroller to collect data from multiple sensors and display it on a real-time web dashboard. The system is designed to monitor environmental conditions and provide instant visualization of sensor data.

![ESP32 IoT System Architecture](https://pfcn12.cscclub.space/images/architecture.png)

## System Components

### Hardware Components

- **ESP32 Development Board**: Main microcontroller for collecting sensor data and transmitting to server
- **DHT22 Sensor**: Temperature and humidity sensor
- **MLX90614 Sensor**: Non-contact infrared temperature sensor
- **HC-SR04 Sensor**: Ultrasonic distance sensor
- **Sound Sensor Module**: For noise level detection

### Software Stack

- **ESP32 Arduino Code**: For sensor data collection and transmission
- **Node.js Backend**: RESTful API server for receiving sensor data
- **Socket.IO**: For real-time data communication
- **HTML/CSS/JavaScript**: Frontend dashboard with Tailwind CSS
- **Chart.js**: Real-time data visualization

## System Architecture

The system follows a three-layer architecture:

1. **Sensor Layer**: ESP32 with connected sensors
2. **Server Layer**: Node.js application receiving and processing data
3. **Presentation Layer**: Web dashboard for visualization

Data flows from the sensors to the ESP32, which processes and sends it via HTTP to the Node.js server. The server then broadcasts the data using Socket.IO to all connected clients, ensuring real-time updates on the dashboard.

## Sensor Implementation Details

### DHT22 Temperature and Humidity Sensor

The DHT22 sensor provides accurate temperature and humidity readings with a resolution of 0.1°C and 0.1% respectively. It is connected to GPIO pin 5 on the ESP32.

**Technical Specifications:**
- Operating Voltage: 3.3-5V
- Temperature Range: -40°C to 80°C
- Humidity Range: 0-100% RH
- Sampling Rate: ~0.5 Hz

### MLX90614 Infrared Temperature Sensor

The MLX90614 is a non-contact infrared temperature sensor that can measure object temperature without physical contact. This sensor is particularly useful for measuring the temperature of objects that are moving or difficult to reach.

**Technical Specifications:**
- Operating Voltage: 3.3V-5V
- Object Temperature Range: -70°C to 382.2°C
- Ambient Temperature Range: -40°C to 125°C
- Accuracy: ±0.5°C around room temperature
- Field of View: 90°
- Communication: I2C interface

### HC-SR04 Ultrasonic Distance Sensor

The HC-SR04 ultrasonic sensor measures distance by emitting ultrasonic waves and detecting their reflection. The sensor is connected to GPIO pins 4 (TRIG) and 2 (ECHO).

**Technical Specifications:**
- Operating Voltage: 5V
- Range: 2cm to 400cm
- Resolution: 0.3cm
- Measuring Angle: 15°

### Sound Sensor Module

The sound sensor module detects ambient noise levels. It is connected to GPIO pin 34 on the ESP32, which is configured as an analog input.

**Technical Specifications:**
- Operating Voltage: 3.3-5V
- Output: Analog signal
- Sensitivity: Adjustable via potentiometer

## Software Implementation

### ESP32 Firmware

The ESP32 firmware is written in Arduino C++. It performs the following functions:

1. Initialize all sensors
2. Connect to WiFi network
3. Read data from all sensors at regular intervals
4. Format data into JSON
5. Send HTTP POST requests to the server
6. Display readings on Serial Monitor for debugging

Key features of the ESP32 firmware:
- WiFi connection with auto-reconnect
- JSON data formatting using ArduinoJson library
- Configurable update interval (default: 5 seconds)
- Error detection and handling for sensor failures

### Backend Server

The Node.js backend provides:

1. RESTful API endpoints for receiving and retrieving sensor data
2. Socket.IO integration for real-time data broadcasting
3. Basic data validation and processing

### Web Dashboard

The web dashboard features a responsive design built with Tailwind CSS and includes:

1. Real-time sensor data cards
2. Line charts for historical data visualization
3. System status indicators
4. Mobile-responsive layout

## Installation & Setup Instructions

### ESP32 Setup

1. **Required Libraries:**
   - WiFi.h
   - HTTPClient.h
   - ArduinoJson.h
   - DHT.h
   - Wire.h
   - Adafruit_MLX90614.h

2. **Hardware Connections:**
   ```
   DHT22:
   - VCC → 3.3V
   - GND → GND
   - DATA → GPIO 5

   MLX90614:
   - VCC → 3.3V
   - GND → GND
   - SDA → GPIO 21
   - SCL → GPIO 22

   HC-SR04:
   - VCC → 5V
   - GND → GND
   - TRIG → GPIO 4
   - ECHO → GPIO 2

   Sound Sensor:
   - VCC → 3.3V
   - GND → GND
   - OUT → GPIO 34
   ```

3. **Configuration:**
   - Update WiFi credentials
   - Set server URL to your Node.js server address

### Server Setup

1. Clone repository
2. Install dependencies: `npm install`
3. Start server: `node app.js`
4. Access dashboard at: `http://localhost:3000`

## Future Enhancements

1. **Data Storage**: Implement database storage for historical data analysis
2. **User Authentication**: Add login system for secure access
3. **Alert System**: Configure email/SMS alerts for threshold values
4. **Additional Sensors**: Support for air quality, pressure, light sensors
5. **Mobile App**: Develop dedicated mobile application

## Conclusion

This IoT monitoring system demonstrates the integration of hardware sensors with web technologies to create a comprehensive environmental monitoring solution. The real-time dashboard provides an intuitive interface for monitoring sensor data, making it suitable for various applications including home automation, environmental monitoring, and industrial sensing.

## Appendix: Technical Reference

### ESP32 Code Structure

```
esp32_sensor_code.ino
├── Libraries & Includes
├── Configuration Variables
├── Sensor Setup
├── Network Connection
├── Main Loop
└── Helper Functions
    ├── connectToWiFi()
    ├── readUltrasonicDistance()
    ├── readNoiseLevel()
    └── sendSensorData()
```

### API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/data` | GET | Retrieve latest sensor data |
| `/api/esp32` | POST | Receive data from ESP32 |
| `/api/data` | POST | Manual data update (testing) |
| `/api/camera` | POST | Receive camera data |

### Socket.IO Events

| Event | Description |
|-------|-------------|
| `connect` | Client connection established |
| `disconnect` | Client disconnected |
| `sensor-update` | New sensor data available |
| `camera-update` | New camera image available |

---

*Created by: [Your Name]*  
*Date: [Current Date]*  
*Version: 1.0* 