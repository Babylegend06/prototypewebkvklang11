/*
 * Smart Dobi ESP32 S3 Firmware
 * 
 * Hardware:
 * - ESP32 S3 DevKit
 * - 2x Relay Modules (connected to GPIO pins)
 * - 2x Status LEDs
 * 
 * Features:
 * - WiFi connectivity
 * - Real-time Firebase status polling via REST API
 * - Auto-triggered machine control
 * - WhatsApp notifications via WasapBot.my API
 * - 3-minute wash cycle with 2-minute reminder
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

// WiFi Credentials
const char* WIFI_SSID = "YOUR_WIFI_SSID";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";

// Backend API Configuration
const char* BACKEND_URL = "YOUR_BACKEND_URL";  // Example: https://your-app.emergentagent.com
const char* API_BASE = "/api";

// WasapBot.my Configuration
const char* WASAPBOT_URL = "https://dash.wasapbot.my/api/send";
const char* WASAPBOT_INSTANCE_ID = "609ACF283XXXX";
const char* WASAPBOT_ACCESS_TOKEN = "695df3770b34a";

// Pin Configuration for Machine 1
const int RELAY_1 = 18;
const int LED_1 = 19;

// Pin Configuration for Machine 2
const int RELAY_2 = 21;
const int LED_2 = 22;

// Machine States
struct MachineState {
  String machineId;
  String status;
  String whatsappNumber;
  int timeRemaining;
  int relayPin;
  int ledPin;
  bool isRunning;
  unsigned long startTime;
  bool reminderSent;
};

MachineState machine1 = {"1", "available", "", 0, RELAY_1, LED_1, false, 0, false};
MachineState machine2 = {"2", "available", "", 0, RELAY_2, LED_2, false, 0, false};

unsigned long lastPollTime = 0;
const unsigned long POLL_INTERVAL = 2000; // Poll every 2 seconds

void setup() {
  Serial.begin(115200);
  Serial.println("\n\n=== Smart Dobi ESP32 S3 Startup ===");
  
  // Initialize relay and LED pins
  pinMode(RELAY_1, OUTPUT);
  pinMode(LED_1, OUTPUT);
  pinMode(RELAY_2, OUTPUT);
  pinMode(LED_2, OUTPUT);
  
  // Set all relays OFF and LEDs blinking (ready state)
  digitalWrite(RELAY_1, LOW);
  digitalWrite(RELAY_2, LOW);
  
  // Connect to WiFi
  connectToWiFi();
  
  Serial.println("Smart Dobi Ready!");
  Serial.println("================================\n");
}

void loop() {
  // Check WiFi connection
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi disconnected. Reconnecting...");
    connectToWiFi();
  }
  
  // Poll backend every 2 seconds
  if (millis() - lastPollTime >= POLL_INTERVAL) {
    lastPollTime = millis();
    checkMachineStatus(&machine1);
    checkMachineStatus(&machine2);
  }
  
  // Update machine cycles
  updateMachineCycle(&machine1);
  updateMachineCycle(&machine2);
  
  // Update LED status
  updateLEDStatus(&machine1);
  updateLEDStatus(&machine2);
  
  delay(100);
}

void connectToWiFi() {
  Serial.print("Connecting to WiFi: ");
  Serial.println(WIFI_SSID);
  
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\nWiFi Connected!");
    Serial.print("IP Address: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("\nWiFi Connection Failed!");
  }
}

void checkMachineStatus(MachineState* machine) {
  if (WiFi.status() != WL_CONNECTED) return;
  
  HTTPClient http;
  String url = String(BACKEND_URL) + String(API_BASE) + "/machines/" + machine->machineId;
  
  http.begin(url);
  int httpCode = http.GET();
  
  if (httpCode == 200) {
    String payload = http.getString();
    DynamicJsonDocument doc(1024);
    deserializeJson(doc, payload);
    
    String newStatus = doc["status"].as<String>();
    String newWhatsapp = doc["whatsapp_number"].as<String>();
    
    // Detect status change to "washing"
    if (newStatus == "washing" && machine->status != "washing") {
      Serial.println("Machine " + machine->machineId + " - Starting wash cycle!");
      machine->status = newStatus;
      machine->whatsappNumber = newWhatsapp;
      machine->isRunning = true;
      machine->startTime = millis();
      machine->reminderSent = false;
      machine->timeRemaining = 180; // 3 minutes in seconds
      
      // Turn ON relay (start machine)
      digitalWrite(machine->relayPin, HIGH);
      Serial.println("Relay " + String(machine->relayPin) + " activated");
    } else {
      machine->status = newStatus;
    }
  } else {
    Serial.println("Error polling machine " + machine->machineId + ": HTTP " + String(httpCode));
  }
  
  http.end();
}

void updateMachineCycle(MachineState* machine) {
  if (!machine->isRunning) return;
  
  unsigned long elapsedSeconds = (millis() - machine->startTime) / 1000;
  machine->timeRemaining = 180 - elapsedSeconds;
  
  // Send 2-minute reminder (at 120 seconds elapsed)
  if (elapsedSeconds >= 120 && !machine->reminderSent) {
    machine->reminderSent = true;
    sendWhatsAppNotification(
      machine->whatsappNumber,
      "Smart Dobi: Lagi 1 minit mesin " + machine->machineId + " nak siap! \u23f3"
    );
    Serial.println("Machine " + machine->machineId + " - 2-minute reminder sent");
  }
  
  // Complete cycle at 3 minutes (180 seconds)
  if (elapsedSeconds >= 180) {
    Serial.println("Machine " + machine->machineId + " - Wash cycle complete!");
    
    // Turn OFF relay (stop machine)
    digitalWrite(machine->relayPin, LOW);
    Serial.println("Relay " + String(machine->relayPin) + " deactivated");
    
    // Send completion notification
    sendWhatsAppNotification(
      machine->whatsappNumber,
      "Smart Dobi: Mesin " + machine->machineId + " telah selesai! Sila ambil pakaian anda. Terima kasih! \ud83e\uddfa"
    );
    
    // Update backend status to "available"
    updateBackendStatus(machine->machineId, "available", 0);
    
    // Reset machine state
    machine->isRunning = false;
    machine->status = "available";
    machine->whatsappNumber = "";
    machine->timeRemaining = 0;
    machine->reminderSent = false;
  }
}

void updateLEDStatus(MachineState* machine) {
  if (machine->status == "washing") {
    // Solid LED when washing
    digitalWrite(machine->ledPin, HIGH);
  } else {
    // Blinking LED when available (ready state)
    int blinkState = (millis() / 500) % 2; // Blink every 500ms
    digitalWrite(machine->ledPin, blinkState);
  }
}

void sendWhatsAppNotification(String phoneNumber, String message) {
  if (WiFi.status() != WL_CONNECTED || phoneNumber.length() == 0) return;
  
  HTTPClient http;
  
  // Build URL with query parameters
  String url = String(WASAPBOT_URL) + 
               "?number=" + urlEncode(phoneNumber) +
               "&type=text" +
               "&message=" + urlEncode(message) +
               "&instance_id=" + String(WASAPBOT_INSTANCE_ID) +
               "&access_token=" + String(WASAPBOT_ACCESS_TOKEN);
  
  http.begin(url);
  int httpCode = http.GET();
  
  if (httpCode == 200) {
    Serial.println("WhatsApp notification sent to " + phoneNumber);
  } else {
    Serial.println("WhatsApp send failed: HTTP " + String(httpCode));
  }
  
  http.end();
}

void updateBackendStatus(String machineId, String status, int timeRemaining) {
  if (WiFi.status() != WL_CONNECTED) return;
  
  HTTPClient http;
  String url = String(BACKEND_URL) + String(API_BASE) + "/machines/" + machineId + "/status" +
               "?status=" + status + "&time_remaining=" + String(timeRemaining);
  
  http.begin(url);
  int httpCode = http.sendRequest("PUT");
  
  if (httpCode == 200) {
    Serial.println("Backend status updated: Machine " + machineId + " -> " + status);
  } else {
    Serial.println("Backend update failed: HTTP " + String(httpCode));
  }
  
  http.end();
}

String urlEncode(String str) {
  String encoded = "";
  char c;
  for (int i = 0; i < str.length(); i++) {
    c = str.charAt(i);
    if (c == ' ') {
      encoded += '+';
    } else if (isalnum(c)) {
      encoded += c;
    } else {
      encoded += '%';
      if (c < 16) encoded += '0';
      encoded += String(c, HEX);
    }
  }
  return encoded;
}

/*
 * HARDWARE WIRING GUIDE:
 * 
 * ESP32 S3 -> Relay Module 1:
 * - GPIO 18 -> IN1 (Relay control)
 * - 3.3V -> VCC
 * - GND -> GND
 * 
 * ESP32 S3 -> Relay Module 2:
 * - GPIO 21 -> IN1 (Relay control)
 * - 3.3V -> VCC
 * - GND -> GND
 * 
 * ESP32 S3 -> LED 1:
 * - GPIO 19 -> LED Anode (through 220Ω resistor)
 * - GND -> LED Cathode
 * 
 * ESP32 S3 -> LED 2:
 * - GPIO 22 -> LED Anode (through 220Ω resistor)
 * - GND -> LED Cathode
 * 
 * CONFIGURATION STEPS:
 * 1. Update WiFi credentials (WIFI_SSID and WIFI_PASSWORD)
 * 2. Update BACKEND_URL with your deployed app URL
 * 3. Update WasapBot credentials if different
 * 4. Upload to ESP32 S3
 * 5. Open Serial Monitor (115200 baud) to see logs
 */
