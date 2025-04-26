/*
 * ESP32-CAM for IoT Dashboard
 * 
 * This code sets up a web server on ESP32-CAM that captures images
 * and streams them to the Node.js server.
 * 
 * Libraries needed:
 * - WiFi.h (built-in)
 * - HTTPClient.h (built-in)
 * - esp_camera.h (ESP32 Camera Driver)
 * - Base64.h (by Densaugeo)
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <esp_camera.h>
#include <Base64.h>

// WiFi credentials
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";

// Server details
const char* serverUrl = "http://YOUR_SERVER_IP:3000/api/camera";

// Camera pins for ESP32-CAM
#define PWDN_GPIO_NUM     32
#define RESET_GPIO_NUM    -1
#define XCLK_GPIO_NUM      0
#define SIOD_GPIO_NUM     26
#define SIOC_GPIO_NUM     27
#define Y9_GPIO_NUM       35
#define Y8_GPIO_NUM       34
#define Y7_GPIO_NUM       39
#define Y6_GPIO_NUM       36
#define Y5_GPIO_NUM       21
#define Y4_GPIO_NUM       19
#define Y3_GPIO_NUM       18
#define Y2_GPIO_NUM        5
#define VSYNC_GPIO_NUM    25
#define HREF_GPIO_NUM     23
#define PCLK_GPIO_NUM     22

// Update interval (milliseconds)
const unsigned long updateInterval = 10000; // 10 seconds
unsigned long previousMillis = 0;

void setup() {
  Serial.begin(115200);
  
  // Initialize camera
  camera_config_t config;
  config.ledc_channel = LEDC_CHANNEL_0;
  config.ledc_timer = LEDC_TIMER_0;
  config.pin_d0 = Y2_GPIO_NUM;
  config.pin_d1 = Y3_GPIO_NUM;
  config.pin_d2 = Y4_GPIO_NUM;
  config.pin_d3 = Y5_GPIO_NUM;
  config.pin_d4 = Y6_GPIO_NUM;
  config.pin_d5 = Y7_GPIO_NUM;
  config.pin_d6 = Y8_GPIO_NUM;
  config.pin_d7 = Y9_GPIO_NUM;
  config.pin_xclk = XCLK_GPIO_NUM;
  config.pin_pclk = PCLK_GPIO_NUM;
  config.pin_vsync = VSYNC_GPIO_NUM;
  config.pin_href = HREF_GPIO_NUM;
  config.pin_sscb_sda = SIOD_GPIO_NUM;
  config.pin_sscb_scl = SIOC_GPIO_NUM;
  config.pin_pwdn = PWDN_GPIO_NUM;
  config.pin_reset = RESET_GPIO_NUM;
  config.xclk_freq_hz = 20000000;
  config.pixel_format = PIXFORMAT_JPEG;
  
  // Initialize with relatively low resolution for faster uploads
  config.frame_size = FRAMESIZE_VGA; // 640x480
  config.jpeg_quality = 10; // 0-63, lower number means higher quality
  config.fb_count = 1;
  
  // Camera initialization
  esp_err_t err = esp_camera_init(&config);
  if (err != ESP_OK) {
    Serial.printf("Camera init failed with error 0x%x", err);
    return;
  }
  
  // Connect to WiFi
  connectToWiFi();
}

void loop() {
  unsigned long currentMillis = millis();
  
  // Check WiFi connection
  if (WiFi.status() != WL_CONNECTED) {
    connectToWiFi();
  }
  
  // Take and send photo at regular intervals
  if (currentMillis - previousMillis >= updateInterval) {
    previousMillis = currentMillis;
    
    // Capture and send image
    captureAndSendImage();
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

void captureAndSendImage() {
  // Capture image
  camera_fb_t* fb = esp_camera_fb_get();
  if (!fb) {
    Serial.println("Camera capture failed");
    return;
  }
  
  // Process the image
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    http.begin(serverUrl);
    http.addHeader("Content-Type", "application/json");
    
    // Encode the image in base64
    // Note: For large images, you may need to split this into chunks
    size_t encoded_length = Base64.encodedLength(fb->len);
    char* encoded_buffer = (char*)malloc(encoded_length + 1);
    
    if (encoded_buffer) {
      Base64.encode(encoded_buffer, (char*)fb->buf, fb->len);
      encoded_buffer[encoded_length] = 0; // Null termination
      
      // Create JSON with base64 image
      String jsonData = "{\"image\":\"data:image/jpeg;base64,";
      jsonData += encoded_buffer;
      jsonData += "\"}";
      
      // Send POST request
      int httpResponseCode = http.POST(jsonData);
      
      if (httpResponseCode > 0) {
        String response = http.getString();
        Serial.println("HTTP Response code: " + String(httpResponseCode));
      } else {
        Serial.print("Error on sending POST: ");
        Serial.println(httpResponseCode);
      }
      
      free(encoded_buffer);
    } else {
      Serial.println("Failed to allocate memory for base64 encoding");
    }
    
    http.end();
  } else {
    Serial.println("WiFi not connected");
  }
  
  // Release the frame buffer
  esp_camera_fb_return(fb);
} 