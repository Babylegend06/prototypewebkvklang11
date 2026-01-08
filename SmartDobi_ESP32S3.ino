/*
 * Smart Dobi ESP32 S3 Firmware - TIMER MASTER
 * 
 * Hardware per machine:
 * - 1x Button START (GPIO 16/17)
 * - 1x Relay (GPIO 18/21)
 * - 1x LED (GPIO 19/22)
 * 
 * LED States:
 * - OFF: Machine available (idle)
 * - BLINKING: Payment done, waiting for customer to masuk baju & tekan START
 * - SOLID ON: Machine running (washing)
 * - OFF: Complete (siap)
 * 
 * Timer Flow:
 * 1. Payment done → ESP32 detect → LED BLINK
 * 2. Customer masuk baju → Tekan START button
 * 3. ESP32 start timer (120s demo / 1800s production)
 * 4. ESP32 update timer to backend every 2 seconds
 * 5. Web ambil timer from backend every 2 seconds
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

// ==================== CONFIGURATION ====================

// WiFi Credentials
const char* WIFI_SSID = "YOUR_WIFI_SSID";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";

// Backend API Configuration
const char* BACKEND_URL = "https://dobi-alert.preview.emergentagent.com";
const char* API_BASE = "/api";

// Mode Selection: true = DEMO (120s), false = PRODUCTION (1800s)
const bool DEMO_MODE = true;
const unsigned long DEMO_CYCLE_SECONDS = 120;      // 2 minutes
const unsigned long PRODUCTION_CYCLE_SECONDS = 1800; // 30 minutes
const unsigned long REMINDER_TIME_DEMO = 60;       // 1 minute remaining (demo)
const unsigned long REMINDER_TIME_PROD = 1500;     // 5 minutes remaining (production)

// Pin Configuration
const int BUTTON_START_1 = 16;  // Button START Machine 1
const int RELAY_1 = 18;         // Relay Machine 1
const int LED_1 = 19;           // LED Machine 1

const int BUTTON_START_2 = 17;  // Button START Machine 2
const int RELAY_2 = 21;         // Relay Machine 2
const int LED_2 = 22;           // LED Machine 2

// ==================== MACHINE STATE ====================

struct MachineState {
  String machineId;
  String status;
  String whatsappNumber;
  
  // Hardware pins
  int buttonPin;
  int relayPin;
  int ledPin;
  
  // Timer (ESP32 is MASTER)
  unsigned long cycleSeconds;
  unsigned long reminderSeconds;
  unsigned long startTime;
  int timeRemaining;
  
  // Flags
  bool isRunning;
  bool isWaitingStart;      // Payment done, waiting for START button
  bool reminderSent;
  bool lastButtonState;
  
  // LED blink
  unsigned long lastBlinkTime;
  bool ledBlinkState;
};

MachineState machine1 = {
  "1", "available", "",
  BUTTON_START_1, RELAY_1, LED_1,
  0, 0, 0, 0,
  false, false, false, HIGH,
  0, false
};

MachineState machine2 = {
  "2", "available", "",
  BUTTON_START_2, RELAY_2, LED_2,
  0, 0, 0, 0,
  false, false, false, HIGH,
  0, false
};

unsigned long lastPollTime = 0;
unsigned long lastBackendUpdate = 0;
const unsigned long POLL_INTERVAL = 2000;        // Poll backend every 2s
const unsigned long BACKEND_UPDATE_INTERVAL = 2000; // Update backend every 2s
const unsigned long LED_BLINK_INTERVAL = 500;    // LED blink every 500ms

// ==================== SETUP ====================

void setup() {
  Serial.begin(115200);
  delay(1000);
  
  Serial.println("\n\n╔════════════════════════════════════════╗");
  Serial.println("║   SMART DOBI ESP32 S3 - TIMER MASTER  ║");
  Serial.println("╚════════════════════════════════════════╝\n");
  
  // Set cycle time based on mode
  unsigned long cycleTime = DEMO_MODE ? DEMO_CYCLE_SECONDS : PRODUCTION_CYCLE_SECONDS;
  unsigned long reminderTime = DEMO_MODE ? REMINDER_TIME_DEMO : REMINDER_TIME_PROD;
  
  machine1.cycleSeconds = cycleTime;
  machine1.reminderSeconds = reminderTime;
  machine2.cycleSeconds = cycleTime;
  machine2.reminderSeconds = reminderTime;
  
  Serial.printf("⚙️  Mode: %s\n", DEMO_MODE ? "DEMO (120s)" : "PRODUCTION (1800s)");
  Serial.printf("⏱️  Cycle time: %lu seconds\n", cycleTime);
  Serial.printf("🔔 Reminder at: %lu seconds elapsed\n\n", reminderTime);
  
  // Initialize pins
  initializeMachine(&machine1);
  initializeMachine(&machine2);
  
  // Connect to WiFi
  connectToWiFi();
  
  Serial.println("\n✅ Smart Dobi Ready!\n");
  Serial.println("════════════════════════════════════════\n");
}

void initializeMachine(MachineState* machine) {
  pinMode(machine->buttonPin, INPUT_PULLUP);
  pinMode(machine->relayPin, OUTPUT);
  pinMode(machine->ledPin, OUTPUT);
  
  digitalWrite(machine->relayPin, LOW);
  digitalWrite(machine->ledPin, LOW);
  
  Serial.printf("✓ Machine %s initialized\n", machine->machineId.c_str());
  Serial.printf("  Button: GPIO%d | Relay: GPIO%d | LED: GPIO%d\n", 
                machine->buttonPin, machine->relayPin, machine->ledPin);
}

// ==================== MAIN LOOP ====================

void loop() {
  // Check WiFi connection
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("⚠️  WiFi disconnected. Reconnecting...");
    connectToWiFi();
  }
  
  // Poll backend for status changes
  if (millis() - lastPollTime >= POLL_INTERVAL) {
    lastPollTime = millis();
    checkBackendStatus(&machine1);
    checkBackendStatus(&machine2);
  }
  
  // Check START buttons
  checkStartButton(&machine1);
  checkStartButton(&machine2);
  
  // Update machine cycles & timers
  updateMachineCycle(&machine1);
  updateMachineCycle(&machine2);
  
  // Update LED status
  updateLEDStatus(&machine1);
  updateLEDStatus(&machine2);
  
  // Send timer updates to backend
  if (millis() - lastBackendUpdate >= BACKEND_UPDATE_INTERVAL) {
    lastBackendUpdate = millis();
    sendTimerUpdate(&machine1);
    sendTimerUpdate(&machine2);
  }
  
  delay(50);
}

// ==================== WIFI CONNECTION ====================

void connectToWiFi() {
  Serial.print("📡 Connecting to WiFi: ");
  Serial.println(WIFI_SSID);
  
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 30) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n✅ WiFi Connected!");
    Serial.print("📍 IP Address: ");
    Serial.println(WiFi.localIP());
    Serial.print("📶 Signal: ");
    Serial.print(WiFi.RSSI());
    Serial.println(" dBm");
  } else {
    Serial.println("\n❌ WiFi Connection Failed!");
    Serial.println("⚠️  System will retry...");
  }
}

// ==================== BACKEND POLLING ====================

void checkBackendStatus(MachineState* machine) {
  if (WiFi.status() != WL_CONNECTED) return;
  
  HTTPClient http;
  String url = String(BACKEND_URL) + String(API_BASE) + "/machines/" + machine->machineId;
  
  http.begin(url);
  http.setTimeout(5000);
  int httpCode = http.GET();
  
  if (httpCode == 200) {
    String payload = http.getString();
    JsonDocument doc;
    DeserializationError error = deserializeJson(doc, payload);
    
    if (!error) {
      String newStatus = doc["status"] | "available";
      String newWhatsapp = doc["whatsapp_number"] | "";
      
      // Detect payment done (status changed to "washing")
      if (newStatus == "washing" && machine->status != "washing" && !machine->isWaitingStart) {
        Serial.printf("\n🔔 Machine %s - PAYMENT DETECTED!\n", machine->machineId.c_str());
        machine->status = newStatus;
        machine->whatsappNumber = newWhatsapp;
        machine->isWaitingStart = true;
        machine->isRunning = false;
        
        Serial.printf("💡 LED BLINK mode activated (signal customer)\n");
        Serial.printf("👉 Customer: Masuk baju & tekan START button\n\n");
      }
      
      // Update status from backend (e.g., owner set to broken)
      if (newStatus != "washing" && machine->status != newStatus) {
        Serial.printf("📝 Machine %s status updated: %s → %s\n", 
                     machine->machineId.c_str(), machine->status.c_str(), newStatus.c_str());
        machine->status = newStatus;
      }
    }
  } else if (httpCode > 0) {
    Serial.printf("⚠️  Machine %s poll error: HTTP %d\n", machine->machineId.c_str(), httpCode);
  }
  
  http.end();
}

// ==================== START BUTTON ====================

void checkStartButton(MachineState* machine) {
  bool currentButtonState = digitalRead(machine->buttonPin);
  
  // Button pressed (LOW because INPUT_PULLUP)
  if (currentButtonState == LOW && machine->lastButtonState == HIGH) {
    delay(50); // Debounce
    
    if (digitalRead(machine->buttonPin) == LOW && machine->isWaitingStart) {
      Serial.printf("\n🎯 START BUTTON PRESSED - Machine %s\n", machine->machineId.c_str());
      Serial.println("════════════════════════════════════════");
      
      // Start the cycle
      machine->isWaitingStart = false;
      machine->isRunning = true;
      machine->startTime = millis();
      machine->timeRemaining = machine->cycleSeconds;
      machine->reminderSent = false;
      
      // Turn ON relay
      digitalWrite(machine->relayPin, HIGH);
      Serial.printf("⚡ Relay %d activated (GPIO %d HIGH)\n", 
                   atoi(machine->machineId.c_str()), machine->relayPin);
      
      // LED solid ON
      digitalWrite(machine->ledPin, HIGH);
      Serial.printf("💡 LED %d solid ON (washing mode)\n", 
                   atoi(machine->machineId.c_str()));
      
      Serial.printf("⏱️  Timer started: %lu seconds\n", machine->cycleSeconds);
      Serial.println("════════════════════════════════════════\n");
    }
  }
  
  machine->lastButtonState = currentButtonState;
}

// ==================== MACHINE CYCLE ====================

void updateMachineCycle(MachineState* machine) {
  if (!machine->isRunning) return;
  
  unsigned long elapsedSeconds = (millis() - machine->startTime) / 1000;
  machine->timeRemaining = machine->cycleSeconds - elapsedSeconds;
  
  // Send reminder
  if (elapsedSeconds >= machine->reminderSeconds && !machine->reminderSent) {
    machine->reminderSent = true;
    int minutesRemaining = (machine->cycleSeconds - elapsedSeconds) / 60;
    
    Serial.printf("\n🔔 Machine %s - REMINDER TIME\n", machine->machineId.c_str());
    Serial.printf("⏰ %d minute(s) remaining\n", minutesRemaining);
    sendReminderToBackend(machine->machineId);
    Serial.println();
  }
  
  // Cycle complete
  if (elapsedSeconds >= machine->cycleSeconds) {
    Serial.printf("\n✅ Machine %s - CYCLE COMPLETE!\n", machine->machineId.c_str());
    Serial.println("════════════════════════════════════════");
    
    // Turn OFF relay
    digitalWrite(machine->relayPin, LOW);
    Serial.printf("⚡ Relay %d deactivated (GPIO %d LOW)\n", 
                 atoi(machine->machineId.c_str()), machine->relayPin);
    
    // Turn OFF LED
    digitalWrite(machine->ledPin, LOW);
    Serial.printf("💡 LED %d turned OFF (cycle complete)\n", 
                 atoi(machine->machineId.c_str()));
    
    // Update backend
    sendCompletionToBackend(machine);
    
    // Reset state
    machine->isRunning = false;
    machine->status = "available";
    machine->whatsappNumber = "";
    machine->timeRemaining = 0;
    machine->reminderSent = false;
    
    Serial.println("════════════════════════════════════════\n");
  }
}

// ==================== LED CONTROL ====================

void updateLEDStatus(MachineState* machine) {
  if (machine->isWaitingStart) {
    // BLINK mode - waiting for START button
    if (millis() - machine->lastBlinkTime >= LED_BLINK_INTERVAL) {
      machine->lastBlinkTime = millis();
      machine->ledBlinkState = !machine->ledBlinkState;
      digitalWrite(machine->ledPin, machine->ledBlinkState ? HIGH : LOW);
    }
  } else if (machine->isRunning) {
    // SOLID ON - machine running
    digitalWrite(machine->ledPin, HIGH);
  } else {
    // OFF - machine available
    digitalWrite(machine->ledPin, LOW);
  }
}

// ==================== BACKEND UPDATES ====================

void sendTimerUpdate(MachineState* machine) {
  if (!machine->isRunning) return;
  if (WiFi.status() != WL_CONNECTED) return;
  
  HTTPClient http;
  String url = String(BACKEND_URL) + String(API_BASE) + "/machines/" + machine->machineId + "/status";
  url += "?status=washing&time_remaining=" + String(machine->timeRemaining);
  
  http.begin(url);
  http.setTimeout(3000);
  int httpCode = http.sendRequest("PUT");
  
  if (httpCode == 200) {
    // Success - silent (too verbose)
  } else if (httpCode > 0) {
    Serial.printf("⚠️  Timer update failed: HTTP %d\n", httpCode);
  }
  
  http.end();
}

void sendReminderToBackend(String machineId) {
  if (WiFi.status() != WL_CONNECTED) return;
  
  HTTPClient http;
  String url = String(BACKEND_URL) + String(API_BASE) + "/machines/" + machineId + "/reminder";
  
  http.begin(url);
  http.setTimeout(5000);
  int httpCode = http.POST("");
  
  if (httpCode == 200) {
    Serial.println("📤 Reminder notification sent to backend");
  } else {
    Serial.printf("⚠️  Reminder send failed: HTTP %d\n", httpCode);
  }
  
  http.end();
}

void sendCompletionToBackend(MachineState* machine) {
  if (WiFi.status() != WL_CONNECTED) return;
  
  HTTPClient http;
  String url = String(BACKEND_URL) + String(API_BASE) + "/machines/" + machine->machineId + "/status";
  url += "?status=available&time_remaining=0";
  
  http.begin(url);
  http.setTimeout(5000);
  int httpCode = http.sendRequest("PUT");
  
  if (httpCode == 200) {
    Serial.println("📤 Completion notification sent to backend");
  } else {
    Serial.printf("⚠️  Completion send failed: HTTP %d\n", httpCode);
  }
  
  http.end();
}

/*
 * ╔════════════════════════════════════════════════════════════════╗
 * ║                     WIRING DIAGRAM                             ║
 * ╚════════════════════════════════════════════════════════════════╝
 * 
 * MACHINE 1:
 *   GPIO 16 → Button START 1 (other pin to GND)
 *   GPIO 18 → Relay 1 IN
 *   GPIO 19 → LED 1 Anode (+) → 220Ω resistor → GND
 * 
 * MACHINE 2:
 *   GPIO 17 → Button START 2 (other pin to GND)
 *   GPIO 21 → Relay 2 IN
 *   GPIO 22 → LED 2 Anode (+) → 220Ω resistor → GND
 * 
 * POWER:
 *   ESP32 5V   → Relay VCC
 *   ESP32 GND  → Relay GND, LED Cathodes, Button pins
 *   ESP32 USB-C → Power supply
 * 
 * ╔════════════════════════════════════════════════════════════════╗
 * ║                     LED BEHAVIOR                               ║
 * ╚════════════════════════════════════════════════════════════════╝
 * 
 * OFF:       Machine available (idle)
 * BLINKING:  Payment done, masuk baju & tekan START
 * SOLID ON:  Machine running (washing)
 * OFF:       Cycle complete (siap)
 * 
 * ╔════════════════════════════════════════════════════════════════╗
 * ║                     SERIAL MONITOR                             ║
 * ╚════════════════════════════════════════════════════════════════╝
 * 
 * Set baud rate to: 115200
 * 
 * Expected output:
 * - WiFi connection status
 * - Machine polling status
 * - Payment detection
 * - START button press
 * - Timer countdown
 * - Reminder notification
 * - Cycle completion
 */
