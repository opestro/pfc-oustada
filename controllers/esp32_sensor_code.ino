/*
 * ESP32 IoT Dashboard Sensor Data Sender
 * 
 * This code reads data from multiple sensors and sends it to a Node.js server.
 * 
 * Hardware:
 * - ESP32 development board
 * - DHT22 temperature and humidity sensor
 * - HC-SR04 ultrasonic distance sensor
 * - Sound sensor module
 * - MLX90614 infrared temperature sensor
 * 
 * Libraries needed:
 * - WiFi.h (built-in)
 * - HTTPClient.h (built-in)
 * - ArduinoJson.h (install via Library Manager)
 * - DHT.h (DHT sensor library by Adafruit)
 * - Adafruit_MLX90614.h (Adafruit MLX90614 library)
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <DHT.h>
#include <Wire.h>
#include <Adafruit_MLX90614.h>

// WiFi credentials
const char* ssid = "OnePlus 11R 5G";
const char* password = "qwerty123.";

// Server details
const char* serverUrl = "http://192.168.1.13:3000/api/esp32";  // Update this to your server's IP address

// DHT22 sensor setup
#define DHTPIN 5      // Digital pin connected to the DHT sensor
#define DHTTYPE DHT22 // DHT 22 (AM2302)
DHT dht(DHTPIN, DHTTYPE);

// Ultrasonic sensor pins
#define TRIG_PIN 4
#define ECHO_PIN 2

// Sound sensor pin
#define SOUND_PIN 34  // Using pin 34 for analog input (ADC)

// Initialize MLX90614 sensor
Adafruit_MLX90614 mlx = Adafruit_MLX90614();

// Update interval (milliseconds)
const unsigned long updateInterval = 5000;
unsigned long previousMillis = 0;

void setup() {
  Serial.begin(115200);
  Serial.println("\nESP32 Sensor Monitor Starting...");
  
  // Initialize I2C for MLX90614
  Wire.begin();
  
  // Initialize pins
  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);
  pinMode(SOUND_PIN, INPUT);
  
  // Initialize DHT sensor
  dht.begin();
  Serial.println("DHT22 sensor initialized");
  
  // Initialize MLX90614 sensor
  if (!mlx.begin()) {
    Serial.println("Error connecting to MLX sensor. Check wiring.");
  } else {
    Serial.println("MLX90614 IR sensor initialized");
  }
  
  // Connect to WiFi
  connectToWiFi();
  
  Serial.println("Sensor setup complete");
}

void loop() {
  unsigned long currentMillis = millis();
  
  // Check WiFi connection
  if (WiFi.status() != WL_CONNECTED) {
    connectToWiFi();
  }
  
  // Send sensor data at regular intervals
  if (currentMillis - previousMillis >= updateInterval) {
    previousMillis = currentMillis;
    
    // Read sensor data
    float temperature = dht.readTemperature();
    float humidity = dht.readHumidity();
    float distance = readUltrasonicDistance();
    bool motion = false; // No motion sensor connected, using false as default
    int noiseLevel = readNoiseLevel();
    
    // Read IR temperature from MLX90614
    float objectTemp = mlx.readObjectTempC();
    float ambientTemp = mlx.readAmbientTempC();
    
    // Check if any reads failed
    if (isnan(temperature) || isnan(humidity)) {
      Serial.println("Failed to read from DHT sensor!");
      temperature = 0;
      humidity = 0;
    }
    
    // Print sensor values to Serial Monitor
    Serial.println("\n----- Sensor Readings -----");
    Serial.print("Temperature (DHT22): ");
    Serial.print(temperature);
    Serial.println(" °C");
    
    Serial.print("Humidity: ");
    Serial.print(humidity);
    Serial.println(" %");
    
    Serial.print("IR Object Temperature: ");
    Serial.print(objectTemp);
    Serial.println(" °C");
    
    Serial.print("IR Ambient Temperature: ");
    Serial.print(ambientTemp);
    Serial.println(" °C");
    
    Serial.print("Distance: ");
    Serial.print(distance);
    Serial.println(" cm");
    
    Serial.print("Noise Level: ");
    Serial.print(noiseLevel);
    Serial.println(" dB");
    
    Serial.println("---------------------------");
    
    // Send data to server
    sendSensorData(temperature, humidity, distance, motion, noiseLevel, objectTemp, ambientTemp);
  }
}

void connectToWiFi() {
  Serial.println("Connecting to WiFi...");
  WiFi.begin(ssid, password);
  
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\nWiFi connected");
    Serial.print("IP address: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("\nFailed to connect to WiFi");
  }
}

float readUltrasonicDistance() {
  // Clear the TRIG_PIN
  digitalWrite(TRIG_PIN, LOW);
  delayMicroseconds(2);
  
  // Trigger the sensor by setting the TRIG_PIN high for 10 microseconds
  digitalWrite(TRIG_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);
  
  // Read the ECHO_PIN, returns the sound wave travel time in microseconds
  long duration = pulseIn(ECHO_PIN, HIGH);
  
  // Calculate the distance
  float distance = duration * 0.034 / 2; // Speed of sound wave divided by 2 (go and back)
  
  return distance;
}

int readNoiseLevel() {
  // Read the analog value from the sound sensor - average several readings for stability
  int soundValue = 0;
  int samples = 10;
  
  for(int i = 0; i < samples; i++) {
    soundValue += analogRead(SOUND_PIN);
    delay(1);
  }
  
  soundValue = soundValue / samples;
  
  // Map the analog value to a dB range (approximate)
  // This is just a rough estimation, calibration needed for accuracy
  int dbValue = map(soundValue, 0, 4095, 30, 90);
  
  return dbValue;
}

void sendSensorData(float temperature, float humidity, float distance, bool motion, int noiseLevel, float objectTemp, float ambientTemp) {
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    http.begin(serverUrl);
    http.addHeader("Content-Type", "application/json");
    
    // Create JSON document
    StaticJsonDocument<256> doc;
    doc["temperature"] = temperature;
    doc["humidity"] = humidity;
    doc["distance"] = distance;
    doc["motion"] = motion;
    doc["noise"] = noiseLevel;
    doc["irObjectTemp"] = objectTemp;
    doc["irAmbientTemp"] = ambientTemp;
    
    String jsonData;
    serializeJson(doc, jsonData);
    
    // Send POST request
    int httpResponseCode = http.POST(jsonData);
    
    if (httpResponseCode > 0) {
      String response = http.getString();
      Serial.println("HTTP Response code: " + String(httpResponseCode));
      Serial.println("Response: " + response);
    } else {
      Serial.print("Error on sending POST: ");
      Serial.println(httpResponseCode);
    }
    
    http.end();
  } else {
    Serial.println("WiFi not connected");
  }
} 