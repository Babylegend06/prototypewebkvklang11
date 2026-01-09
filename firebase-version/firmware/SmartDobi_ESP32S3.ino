/*
 * ============================================
 * SMART DOBI - ESP32 S3 FIRMWARE
 * ============================================
 * 
 * Sistem Kawalan Mesin Dobi IoT
 * - Sambungan WiFi & Firebase
 * - Kawalan Relay & LED
 * - Butang START fizikal
 * - Notifikasi WhatsApp via WasapBot
 * - Heartbeat monitoring
 * 
 * Hardware:
 * - ESP32 S3 DevKit
 * - Relay Module (Active LOW)
 * - LED Indicator
 * - Push Button (START)
 * 
 * Author: Smart Dobi FYP
 * Version: 1.0.0
 */

#include <WiFi.h>
#include <Firebase_ESP_Client.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

// ==================== KONFIGURASI ====================

// WiFi Configuration
#define WIFI_SSID "YOUR_WIFI_SSID"          // Tukar ke WiFi anda
#define WIFI_PASSWORD "YOUR_WIFI_PASSWORD"   // Tukar ke password WiFi

// Firebase Configuration
#define FIREBASE_API_KEY "AIzaSyBPaObgmHZBQR8-0aX3pTUOFeMOxIsn0Lc"
#define FIREBASE_DATABASE_URL "https://smart-dobi-system-fyp-default-rtdb.asia-southeast1.firebasedatabase.app"

// WasapBot Configuration
#define WASAPBOT_API_URL "https://dash.wasapbot.my/whatsapp_api"
#define WASAPBOT_INSTANCE_ID "609ACF283XXXX"  // Ganti dengan instance ID anda
#define WASAPBOT_ACCESS_TOKEN "695df3770b34a" // Ganti dengan access token anda

// Machine Configuration
#define MACHINE_ID "1"                       // ID mesin ini (1, 2, 3, dll)
#define WASH_TIME_SECONDS 1800               // 30 minit = 1800 saat
#define REMINDER_TIME_SECONDS 300            // Peringatan 5 minit sebelum siap

// Pin Configuration
#define PIN_RELAY 4          // GPIO untuk Relay
#define PIN_LED 5            // GPIO untuk LED
#define PIN_BUTTON 6         // GPIO untuk Button START

// ==================== OBJECTS ====================

FirebaseData fbdo;
FirebaseAuth fbAuth;
FirebaseConfig fbConfig;

// ==================== VARIABLES ====================

// Machine State
enum MachineState {
    STATE_IDLE,         // Mesin sedia (available)
    STATE_RESERVED,     // Ditempah, menunggu START
    STATE_WASHING,      // Sedang basuh
    STATE_COMPLETED     // Siap
};

MachineState currentState = STATE_IDLE;
String currentWhatsApp = "";
unsigned long washStartTime = 0;
int timeRemaining = 0;
bool reminderSent = false;

// Timing
unsigned long lastFirebaseUpdate = 0;
unsigned long lastHeartbeat = 0;
unsigned long lastButtonCheck = 0;
unsigned long lastLedToggle = 0;

const unsigned long FIREBASE_UPDATE_INTERVAL = 2000;   // 2 saat
const unsigned long HEARTBEAT_INTERVAL = 10000;        // 10 saat
const unsigned long BUTTON_DEBOUNCE = 50;              // 50ms
const unsigned long LED_BLINK_INTERVAL = 500;          // 500ms untuk blink

// LED State
bool ledState = false;

// Button State
bool lastButtonState = HIGH;
bool buttonPressed = false;

// ==================== SETUP ====================

void setup() {
    Serial.begin(115200);
    Serial.println("\n");
    Serial.println("==========================================");
    Serial.println("   SMART DOBI - ESP32 S3 FIRMWARE");
    Serial.println("==========================================");
    Serial.println("Machine ID: " + String(MACHINE_ID));
    
    // Initialize Pins
    pinMode(PIN_RELAY, OUTPUT);
    pinMode(PIN_LED, OUTPUT);
    pinMode(PIN_BUTTON, INPUT_PULLUP);
    
    // Initial State - OFF
    digitalWrite(PIN_RELAY, HIGH);  // Relay OFF (Active LOW)
    digitalWrite(PIN_LED, LOW);     // LED OFF
    
    // Connect WiFi
    connectWiFi();
    
    // Initialize Firebase
    initFirebase();
    
    // Set initial state in Firebase
    setMachineOnline(true);
    updateMachineStatus("available", 0);
    
    Serial.println("Setup complete!");
    Serial.println("==========================================\n");
}

// ==================== MAIN LOOP ====================

void loop() {
    unsigned long currentMillis = millis();
    
    // Check WiFi connection
    if (WiFi.status() != WL_CONNECTED) {
        Serial.println("WiFi disconnected! Reconnecting...");
        connectWiFi();
    }
    
    // Handle button press
    handleButton(currentMillis);
    
    // Handle LED based on state
    handleLED(currentMillis);
    
    // Handle washing timer
    if (currentState == STATE_WASHING) {
        handleWashing(currentMillis);
    }
    
    // Check Firebase for status changes
    if (currentMillis - lastFirebaseUpdate >= FIREBASE_UPDATE_INTERVAL) {
        lastFirebaseUpdate = currentMillis;
        checkFirebaseStatus();
    }
    
    // Send heartbeat
    if (currentMillis - lastHeartbeat >= HEARTBEAT_INTERVAL) {
        lastHeartbeat = currentMillis;
        sendHeartbeat();
    }
}

// ==================== WiFi FUNCTIONS ====================

void connectWiFi() {
    Serial.print("Connecting to WiFi: ");
    Serial.println(WIFI_SSID);
    
    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
    
    int attempts = 0;
    while (WiFi.status() != WL_CONNECTED && attempts < 30) {
        delay(500);
        Serial.print(".");
        attempts++;
    }
    
    if (WiFi.status() == WL_CONNECTED) {
        Serial.println("\nWiFi connected!");
        Serial.print("IP Address: ");
        Serial.println(WiFi.localIP());
    } else {
        Serial.println("\nFailed to connect to WiFi!");
    }
}

// ==================== FIREBASE FUNCTIONS ====================

void initFirebase() {
    Serial.println("Initializing Firebase...");
    
    fbConfig.api_key = FIREBASE_API_KEY;
    fbConfig.database_url = FIREBASE_DATABASE_URL;
    
    // Anonymous authentication
    fbAuth.user.email = "";
    fbAuth.user.password = "";
    
    Firebase.begin(&fbConfig, &fbAuth);
    Firebase.reconnectWiFi(true);
    
    // Set database read timeout
    fbConfig.timeout.serverResponse = 10 * 1000;
    
    Serial.println("Firebase initialized!");
}

void setMachineOnline(bool online) {
    String path = "/machines/" + String(MACHINE_ID) + "/is_online";
    
    if (Firebase.RTDB.setBool(&fbdo, path, online)) {
        Serial.println("Online status set: " + String(online ? "true" : "false"));
    } else {
        Serial.println("Failed to set online status: " + fbdo.errorReason());
    }
}

void updateMachineStatus(String status, int timeLeft) {
    String basePath = "/machines/" + String(MACHINE_ID);
    
    // Update status
    if (Firebase.RTDB.setString(&fbdo, basePath + "/status", status)) {
        Serial.println("Status updated: " + status);
    }
    
    // Update time remaining
    if (Firebase.RTDB.setInt(&fbdo, basePath + "/time_remaining", timeLeft)) {
        Serial.println("Time remaining: " + String(timeLeft) + "s");
    }
}

void checkFirebaseStatus() {
    String path = "/machines/" + String(MACHINE_ID);
    
    if (Firebase.RTDB.getJSON(&fbdo, path)) {
        FirebaseJson &json = fbdo.jsonObject();
        FirebaseJsonData jsonData;
        
        // Get status
        if (json.get(jsonData, "status")) {
            String status = jsonData.stringValue;
            
            // Check for state transitions
            if (currentState == STATE_IDLE && status == "reserved") {
                // Payment confirmed, waiting for START
                currentState = STATE_RESERVED;
                reminderSent = false;
                
                // Get WhatsApp number
                if (json.get(jsonData, "whatsapp")) {
                    currentWhatsApp = jsonData.stringValue;
                }
                
                Serial.println(">> RESERVED - Waiting for START button");
                Serial.println("WhatsApp: " + currentWhatsApp);
                
                // Send WhatsApp notification
                if (currentWhatsApp.length() > 0) {
                    sendWhatsAppMessage(currentWhatsApp, 
                        "🧺 *SMART DOBI*\n\n"
                        "Pembayaran diterima! ✅\n\n"
                        "Mesin " + String(MACHINE_ID) + " telah ditempah.\n"
                        "Sila masukkan pakaian dan tekan butang START pada mesin.\n\n"
                        "LED berkelip menunjukkan mesin anda."
                    );
                }
            }
            else if (status == "available" && currentState != STATE_IDLE) {
                // Reset by owner or completed
                currentState = STATE_IDLE;
                stopMachine();
                Serial.println(">> RESET to IDLE");
            }
        }
    } else {
        Serial.println("Firebase read error: " + fbdo.errorReason());
    }
}

void sendHeartbeat() {
    String path = "/machines/" + String(MACHINE_ID) + "/last_heartbeat";
    
    if (Firebase.RTDB.setInt(&fbdo, path, millis())) {
        Serial.println("Heartbeat sent");
    }
    
    // Also update online status
    setMachineOnline(true);
}

// ==================== BUTTON HANDLING ====================

void handleButton(unsigned long currentMillis) {
    if (currentMillis - lastButtonCheck < BUTTON_DEBOUNCE) {
        return;
    }
    lastButtonCheck = currentMillis;
    
    bool buttonState = digitalRead(PIN_BUTTON);
    
    // Button pressed (LOW because of INPUT_PULLUP)
    if (buttonState == LOW && lastButtonState == HIGH) {
        buttonPressed = true;
        Serial.println("Button pressed!");
        
        // Only start if in RESERVED state
        if (currentState == STATE_RESERVED) {
            startWashing();
        } else {
            Serial.println("Cannot start - not in RESERVED state");
        }
    }
    
    lastButtonState = buttonState;
}

// ==================== LED HANDLING ====================

void handleLED(unsigned long currentMillis) {
    switch (currentState) {
        case STATE_IDLE:
            // LED OFF
            digitalWrite(PIN_LED, LOW);
            break;
            
        case STATE_RESERVED:
            // LED BLINK
            if (currentMillis - lastLedToggle >= LED_BLINK_INTERVAL) {
                lastLedToggle = currentMillis;
                ledState = !ledState;
                digitalWrite(PIN_LED, ledState ? HIGH : LOW);
            }
            break;
            
        case STATE_WASHING:
            // LED SOLID ON
            digitalWrite(PIN_LED, HIGH);
            break;
            
        case STATE_COMPLETED:
            // LED OFF
            digitalWrite(PIN_LED, LOW);
            break;
    }
}

// ==================== WASHING FUNCTIONS ====================

void startWashing() {
    Serial.println("==========================================");
    Serial.println(">> STARTING WASH CYCLE");
    Serial.println("==========================================");
    
    currentState = STATE_WASHING;
    washStartTime = millis();
    timeRemaining = WASH_TIME_SECONDS;
    
    // Turn ON relay
    digitalWrite(PIN_RELAY, LOW);  // Active LOW
    Serial.println("Relay ON - Machine running");
    
    // Update Firebase
    updateMachineStatus("washing", timeRemaining);
    
    // Send WhatsApp notification
    if (currentWhatsApp.length() > 0) {
        sendWhatsAppMessage(currentWhatsApp,
            "🧺 *SMART DOBI*\n\n"
            "Mesin " + String(MACHINE_ID) + " telah bermula! 🔄\n\n"
            "Masa basuhan: 30 minit\n"
            "Anda akan dimaklumkan bila hampir siap.\n\n"
            "Terima kasih! 😊"
        );
    }
    
    // Record transaction
    recordTransaction();
}

void handleWashing(unsigned long currentMillis) {
    // Calculate time remaining
    unsigned long elapsedSeconds = (currentMillis - washStartTime) / 1000;
    timeRemaining = WASH_TIME_SECONDS - elapsedSeconds;
    
    if (timeRemaining < 0) timeRemaining = 0;
    
    // Update Firebase every 2 seconds
    updateMachineStatus("washing", timeRemaining);
    
    // Send reminder at 5 minutes remaining
    if (!reminderSent && timeRemaining <= REMINDER_TIME_SECONDS && timeRemaining > 0) {
        reminderSent = true;
        Serial.println(">> Sending 5-minute reminder");
        
        if (currentWhatsApp.length() > 0) {
            sendWhatsAppMessage(currentWhatsApp,
                "🧺 *SMART DOBI*\n\n"
                "⏰ *PERINGATAN*\n\n"
                "Mesin " + String(MACHINE_ID) + " akan siap dalam 5 minit!\n\n"
                "Sila bersiap untuk mengambil pakaian anda. 👕"
            );
        }
    }
    
    // Check if completed
    if (timeRemaining <= 0) {
        completeWashing();
    }
}

void completeWashing() {
    Serial.println("==========================================");
    Serial.println(">> WASH CYCLE COMPLETED");
    Serial.println("==========================================");
    
    currentState = STATE_COMPLETED;
    
    // Turn OFF relay
    digitalWrite(PIN_RELAY, HIGH);  // Active LOW - OFF
    Serial.println("Relay OFF - Machine stopped");
    
    // Update Firebase
    updateMachineStatus("available", 0);
    
    // Clear WhatsApp
    String path = "/machines/" + String(MACHINE_ID) + "/whatsapp";
    Firebase.RTDB.setString(&fbdo, path, "");
    
    // Send completion notification
    if (currentWhatsApp.length() > 0) {
        sendWhatsAppMessage(currentWhatsApp,
            "🧺 *SMART DOBI*\n\n"
            "✅ *BASUHAN SIAP!*\n\n"
            "Mesin " + String(MACHINE_ID) + " telah selesai.\n\n"
            "Sila ambil pakaian anda sekarang.\n"
            "Terima kasih kerana menggunakan Smart Dobi! 🙏"
        );
    }
    
    // Reset
    currentWhatsApp = "";
    currentState = STATE_IDLE;
}

void stopMachine() {
    // Turn OFF relay
    digitalWrite(PIN_RELAY, HIGH);
    
    // Reset variables
    washStartTime = 0;
    timeRemaining = 0;
    currentWhatsApp = "";
    reminderSent = false;
    
    Serial.println("Machine stopped and reset");
}

// ==================== WHATSAPP FUNCTIONS ====================

void sendWhatsAppMessage(String phoneNumber, String message) {
    if (WiFi.status() != WL_CONNECTED) {
        Serial.println("Cannot send WhatsApp - WiFi not connected");
        return;
    }
    
    Serial.println("Sending WhatsApp to: " + phoneNumber);
    
    HTTPClient http;
    http.begin(WASAPBOT_API_URL);
    http.addHeader("Content-Type", "application/x-www-form-urlencoded");
    
    // Prepare POST data
    String postData = "instance_id=" + String(WASAPBOT_INSTANCE_ID);
    postData += "&access_token=" + String(WASAPBOT_ACCESS_TOKEN);
    postData += "&number=" + phoneNumber;
    postData += "&message=" + urlEncode(message);
    
    int httpCode = http.POST(postData);
    
    if (httpCode > 0) {
        String response = http.getString();
        Serial.println("WhatsApp API Response: " + response);
        
        if (httpCode == 200) {
            Serial.println("WhatsApp sent successfully!");
        } else {
            Serial.println("WhatsApp API error code: " + String(httpCode));
        }
    } else {
        Serial.println("HTTP error: " + http.errorToString(httpCode));
    }
    
    http.end();
}

String urlEncode(String str) {
    String encodedString = "";
    char c;
    char code0;
    char code1;
    
    for (int i = 0; i < str.length(); i++) {
        c = str.charAt(i);
        
        if (c == ' ') {
            encodedString += '+';
        } else if (isalnum(c)) {
            encodedString += c;
        } else {
            code1 = (c & 0xf) + '0';
            if ((c & 0xf) > 9) code1 = (c & 0xf) - 10 + 'A';
            c = (c >> 4) & 0xf;
            code0 = c + '0';
            if (c > 9) code0 = c - 10 + 'A';
            encodedString += '%';
            encodedString += code0;
            encodedString += code1;
        }
    }
    
    return encodedString;
}

// ==================== TRANSACTION RECORDING ====================

void recordTransaction() {
    // Get today's date (simplified - use NTP for production)
    String today = "2025-01-09";  // In production, get from NTP server
    
    String path = "/daily_records/" + today;
    
    // Increment cycles and revenue
    if (Firebase.RTDB.getJSON(&fbdo, path)) {
        FirebaseJson &json = fbdo.jsonObject();
        FirebaseJsonData jsonData;
        
        int cycles = 0;
        int revenue = 0;
        
        if (json.get(jsonData, "cycles")) {
            cycles = jsonData.intValue;
        }
        if (json.get(jsonData, "revenue")) {
            revenue = jsonData.intValue;
        }
        
        cycles++;
        revenue += 5;  // RM 5 per cycle
        
        FirebaseJson updateJson;
        updateJson.set("cycles", cycles);
        updateJson.set("revenue", revenue);
        
        Firebase.RTDB.setJSON(&fbdo, path, &updateJson);
        
        Serial.println("Transaction recorded - Cycles: " + String(cycles) + ", Revenue: RM" + String(revenue));
    } else {
        // First transaction of the day
        FirebaseJson updateJson;
        updateJson.set("cycles", 1);
        updateJson.set("revenue", 5);
        
        Firebase.RTDB.setJSON(&fbdo, path, &updateJson);
        
        Serial.println("First transaction of the day recorded");
    }
}

// ==================== END ====================
