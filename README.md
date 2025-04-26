# IoT Dashboard for ESP32

A real-time dashboard for monitoring ESP32 sensor data using Node.js, Express, Socket.IO, and Tailwind CSS.

## Features

- Real-time data display with Socket.IO
- Responsive dashboard with Tailwind CSS
- Support for multiple sensors:
  - Temperature and humidity (DHT22)
  - Distance sensor (Ultrasonic HC-SR04)
  - Motion detection (IR/PIR sensor)
  - Sound/noise level sensor
  - ESP32-CAM integration

## Prerequisites

- Node.js (v14+)
- npm
- ESP32 development board
- ESP32-CAM (optional)
- Various sensors (DHT22, ultrasonic, PIR/IR, sound module)

## Installation

1. Clone this repository:
   ```
   git clone https://github.com/your-username/pfc-oustada.git
   cd pfc-oustada
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the server:
   ```
   npm start
   ```

   For development with auto-restart:
   ```
   npm run dev
   ```

4. Open your browser and navigate to `http://localhost:3000`

## ESP32 Setup

1. Open the `esp32_sensor_code.ino` file in the Arduino IDE
2. Install the required libraries:
   - DHT sensor library by Adafruit
   - ArduinoJson
3. Update the WiFi credentials and server IP address
4. Upload the code to your ESP32

## ESP32-CAM Setup (Optional)

1. Open the `esp32_cam_code.ino` file in the Arduino IDE
2. Install the required libraries:
   - ESP32 Arduino Core
   - ArduinoJson
   - Base64 by Densaugeo
3. Update the WiFi credentials and server IP address
4. Upload the code to your ESP32-CAM

## API Endpoints

- `GET /api/data` - Get all sensor data
- `POST /api/data` - Update a specific sensor value
- `POST /api/esp32` - Endpoint for ESP32 to send sensor data
- `GET /api/camera` - Get the latest camera image
- `POST /api/camera` - Upload a new camera image

## License

ISC

## Acknowledgements

- [Express.js](https://expressjs.com/)
- [Socket.IO](https://socket.io/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Chart.js](https://www.chartjs.org/) 