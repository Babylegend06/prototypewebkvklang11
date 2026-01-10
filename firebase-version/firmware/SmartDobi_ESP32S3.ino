/*
 * ============================================
 * SMART DOBI - ESP32 S3 FIRMWARE v2.0
 * ============================================
 * 
 * Real-time Timer Master untuk Web Display
 * Firebase Realtime Database Integration
 * WasapBot WhatsApp Notifications
 * 
 * PENTING: ESP32 adalah MASTER untuk timer!
 * Web hanya membaca time_remaining dari Firebase.
 * 
 * Hardware Connections:
 * - GPIO 4: Relay (Active LOW)
 * - GPIO 5: LED Status
 * - GPIO 6: Push Button START (INPUT_PULLUP)
 * 
 * Author: Smart Dobi FYP
 * Version: 2.0.0
 */

#include <WiFi.h>
#include <Firebase_ESP_Client.h>
#include <HTTPClient.h>
#include <addons/TokenHelper.h>
#include <addons/RTDBHelper.h>

// ==================== CONFIGURATION ====================
// !!! TUKAR NILAI-NILAI INI !!!

// WiFi Settings
#define WIFI_SSID "NAMA_WIFI_ANDA"
#define WIFI_PASSWORD "PASSWORD_WIFI_ANDA"

// Firebase Settings
#define FIREBASE_API_KEY "AIzaSyBPaObgmHZBQR8-0aX3pTUOFeMOxIsn0Lc"
#define FIREBASE_DATABASE_URL "https://smart-dobi-system-fyp-default-rtdb.asia-southeast1.firebasedatabase.app"

// WasapBot Settings
#define WASAPBOT_API_URL "https://dash.wasapbot.my/whatsapp_api"
#define WASAPBOT_INSTANCE_ID "YOUR_INSTANCE_ID"
#define WASAPBOT_ACCESS_TOKEN "YOUR_ACCESS_TOKEN"

// Machine Settings
#define MACHINE_ID "1"              // "1" atau "2" sahaja (real machines)
#define WASH_DURATION_SEC 1800      // 30 minit = 1800 saat
#define REMINDER_TIME_SEC 300       // Peringatan 5 minit sebelum siap
#define PRICE_PER_WASH 5            // RM 5

// Hardware Pins
#define PIN_RELAY 4
#define PIN_LED 5
#define PIN_BUTTON 6

// Timing Constants
#define FIREBASE_UPDATE_MS 2000     // Update Firebase setiap 2 saat
#define HEARTBEAT_MS 10000          // Heartbeat setiap 10 saat
#define LED_BLINK_MS 500            // LED blink interval
#define BUTTON_DEBOUNCE_MS 50       // Button debounce

// ==================== OBJECTS ====================
FirebaseData fbdo;
FirebaseAuth auth;
FirebaseConfig config;

// ==================== STATE ====================
enum State {
    IDLE,       // Menunggu pelanggan
    RESERVED,   // Ditempah, menunggu START
    WASHING,    // Sedang basuh
    COMPLETED   // Selesai
};

State currentState = IDLE;
String customerWhatsApp = "";

// Timer Variables
unsigned long washStartTime = 0;
int timeRemaining = 0;
bool reminderSent = false;

// Timing Variables
unsigned long lastFirebaseUpdate = 0;
unsigned long lastHeartbeat = 0;
unsigned long lastLedToggle = 0;
unsigned long lastButtonCheck = 0;

// LED & Button State
bool ledState = false;
bool lastButtonState = HIGH;

// ==================== SETUP ====================
void setup() {
    Serial.begin(115200);
    delay(1000);
    
    Serial.println("\n========================================");
    Serial.println("    SMART DOBI ESP32 - v2.0");
    Serial.println("========================================");
    Serial.println("Machine ID: " + String(MACHINE_ID));
    Serial.println("Wash Duration: " + String(WASH_DURATION_SEC) + " seconds");
    Serial.println("----------------------------------------");
    
    // Initialize Pins
    pinMode(PIN_RELAY, OUTPUT);
    pinMode(PIN_LED, OUTPUT);
    pinMode(PIN_BUTTON, INPUT_PULLUP);
    
    // Initial State - All OFF
    digitalWrite(PIN_RELAY, HIGH);  // Relay OFF (Active LOW)
    digitalWrite(PIN_LED, LOW);
    
    // Connect to WiFi
    connectWiFi();
    
    // Initialize Firebase
    initFirebase();
    
    // Set machine as online and available
    updateMachineOnline(true);
    updateMachineStatus("available", 0);
    
    Serial.println("========================================");
    Serial.println("Setup Complete! Ready to operate.");
    Serial.println("========================================\n");
}

// ==================== MAIN LOOP ====================
void loop() {
    unsigned long now = millis();
    
    // Check WiFi
    if (WiFi.status() != WL_CONNECTED) {
        Serial.println("⚠️ WiFi Lost! Reconnecting...");
        connectWiFi();
    }
    
    // Handle Button
    handleButton(now);
    
    // Handle LED based on state
    handleLED(now);
    
    // Handle Washing Timer
    if (currentState == WASHING) {
        handleWashingTimer(now);
    }
    
    // Check Firebase for status changes (from web/dashboard)
    if (now - lastFirebaseUpdate >= FIREBASE_UPDATE_MS) {
        lastFirebaseUpdate = now;
        checkFirebaseStatus();
    }
    
    // Send Heartbeat
    if (now - lastHeartbeat >= HEARTBEAT_MS) {
        lastHeartbeat = now;
        sendHeartbeat();
    }
}

// ==================== WIFI ====================
void connectWiFi() {
    Serial.print("📶 Connecting to WiFi: ");
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
        Serial.print("   IP: ");
        Serial.println(WiFi.localIP());
    } else {
        Serial.println("\n❌ WiFi Connection Failed!");
    }
}

// ==================== FIREBASE ====================
void initFirebase() {
    Serial.println("🔥 Initializing Firebase...");
    
    config.api_key = FIREBASE_API_KEY;
    config.database_url = FIREBASE_DATABASE_URL;
    
    // Anonymous sign in
    auth.user.email = "";
    auth.user.password = "";
    
    Firebase.begin(&config, &auth);
    Firebase.reconnectWiFi(true);
    
    config.timeout.serverResponse = 10000;
    
    Serial.println("✅ Firebase Initialized!");
}

void updateMachineOnline(bool online) {
    String path = "/machines/" + String(MACHINE_ID) + "/is_online";
    
    if (Firebase.RTDB.setBool(&fbdo, path, online)) {
        Serial.println(online ? "🟢 Online" : "🔴 Offline");
    }
}

void updateMachineStatus(String status, int timeLeft) {
    String basePath = "/machines/" + String(MACHINE_ID);
    
    FirebaseJson json;
    json.set("status", status);
    json.set("time_remaining", timeLeft);
    
    if (status == "available") {
        json.set("whatsapp", "");
    }
    
    if (Firebase.RTDB.updateNode(&fbdo, basePath, &json)) {
        Serial.println("📝 Status: " + status + " | Timer: " + String(timeLeft) + "s");
    }
}

void checkFirebaseStatus() {
    String path = "/machines/" + String(MACHINE_ID);
    
    if (Firebase.RTDB.getJSON(&fbdo, path)) {
        FirebaseJson &json = fbdo.jsonObject();
        FirebaseJsonData data;
        
        // Get current status from Firebase
        if (json.get(data, "status")) {
            String status = data.stringValue;
            
            // Detect state changes from web
            if (currentState == IDLE && status == "reserved") {
                // Payment confirmed from web!
                currentState = RESERVED;
                reminderSent = false;
                
                // Get WhatsApp number
                if (json.get(data, "whatsapp")) {
                    customerWhatsApp = data.stringValue;
                }
                
                Serial.println("\n🔔 ========== NEW RESERVATION ==========");
                Serial.println("   WhatsApp: " + customerWhatsApp);
                Serial.println("   Waiting for START button...");
                Serial.println("   =====================================\n");
                
                // Send WhatsApp notification
                if (customerWhatsApp.length() > 0) {
                    sendWhatsApp(customerWhatsApp,
                        "🧺 *SMART DOBI*\n\n"
                        "✅ Pembayaran diterima!\n\n"
                        "Mesin " + String(MACHINE_ID) + " telah ditempah untuk anda.\n\n"
                        "📍 Sila pergi ke mesin\n"
                        "💡 LED berkelip kuning\n"
                        "👆 Tekan butang START\n\n"
                        "Terima kasih! 🙏"
                    );
                }
            }
            else if (status == "available" && currentState != IDLE) {
                // Reset from dashboard
                resetMachine();
                Serial.println("🔄 Reset from Dashboard");
            }
        }
    }
}

void sendHeartbeat() {
    String path = "/machines/" + String(MACHINE_ID) + "/last_heartbeat";
    Firebase.RTDB.setInt(&fbdo, path, millis());
    updateMachineOnline(true);
}

// ==================== BUTTON ====================
void handleButton(unsigned long now) {
    if (now - lastButtonCheck < BUTTON_DEBOUNCE_MS) return;
    lastButtonCheck = now;
    
    bool buttonState = digitalRead(PIN_BUTTON);
    
    // Button pressed (LOW due to INPUT_PULLUP)
    if (buttonState == LOW && lastButtonState == HIGH) {
        Serial.println("🔘 Button Pressed!");
        
        if (currentState == RESERVED) {
            startWashing();
        } else {
            Serial.println("   (Ignored - not in RESERVED state)");
        }
    }
    
    lastButtonState = buttonState;
}

// ==================== LED ====================
void handleLED(unsigned long now) {
    switch (currentState) {
        case IDLE:
            // LED OFF
            digitalWrite(PIN_LED, LOW);
            break;
            
        case RESERVED:
            // LED BLINK (waiting for START)
            if (now - lastLedToggle >= LED_BLINK_MS) {
                lastLedToggle = now;
                ledState = !ledState;
                digitalWrite(PIN_LED, ledState);
            }
            break;
            
        case WASHING:
            // LED SOLID ON
            digitalWrite(PIN_LED, HIGH);
            break;
            
        case COMPLETED:
            // LED OFF
            digitalWrite(PIN_LED, LOW);
            break;
    }
}

// ==================== WASHING ====================
void startWashing() {
    Serial.println("\n🚀 ========== STARTING WASH CYCLE ==========");
    
    currentState = WASHING;
    washStartTime = millis();
    timeRemaining = WASH_DURATION_SEC;
    reminderSent = false;
    
    // Turn ON Relay
    digitalWrite(PIN_RELAY, LOW);  // Active LOW
    Serial.println("   ⚡ Relay ON - Machine Running");
    
    // Update Firebase
    updateMachineStatus("washing", timeRemaining);
    
    // Record transaction
    recordTransaction();
    
    // Send WhatsApp
    if (customerWhatsApp.length() > 0) {
        sendWhatsApp(customerWhatsApp,
            "🧺 *SMART DOBI*\n\n"
            "🔄 Mesin " + String(MACHINE_ID) + " mula beroperasi!\n\n"
            "⏱️ Masa: 30 minit\n\n"
            "Anda akan dimaklumkan bila hampir siap.\n"
            "Terima kasih! 😊"
        );
    }
    
    Serial.println("   ============================================\n");
}

void handleWashingTimer(unsigned long now) {
    // Calculate remaining time
    unsigned long elapsed = (now - washStartTime) / 1000;
    timeRemaining = WASH_DURATION_SEC - elapsed;
    
    if (timeRemaining < 0) timeRemaining = 0;
    
    // Update Firebase with current time (THIS IS THE MASTER TIMER!)
    updateMachineStatus("washing", timeRemaining);
    
    // Send reminder at 5 minutes
    if (!reminderSent && timeRemaining <= REMINDER_TIME_SEC && timeRemaining > 0) {
        reminderSent = true;
        Serial.println("⏰ Sending 5-minute reminder...");
        
        if (customerWhatsApp.length() > 0) {
            sendWhatsApp(customerWhatsApp,
                "🧺 *SMART DOBI*\n\n"
                "⏰ *PERINGATAN!*\n\n"
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
    Serial.println("\n✅ ========== WASH COMPLETE ==========");
    
    currentState = COMPLETED;
    
    // Turn OFF Relay
    digitalWrite(PIN_RELAY, HIGH);
    Serial.println("   ⚡ Relay OFF - Machine Stopped");
    
    // Update Firebase
    updateMachineStatus("available", 0);
    
    // Send completion WhatsApp
    if (customerWhatsApp.length() > 0) {
        sendWhatsApp(customerWhatsApp,
            "🧺 *SMART DOBI*\n\n"
            "✅ *BASUHAN SIAP!*\n\n"
            "Mesin " + String(MACHINE_ID) + " telah selesai.\n\n"
            "📍 Sila ambil pakaian anda sekarang.\n\n"
            "Terima kasih kerana menggunakan Smart Dobi! 🙏"
        );
    }
    
    // Reset state
    resetMachine();
    
    Serial.println("   ======================================\n");
}

void resetMachine() {
    currentState = IDLE;
    customerWhatsApp = "";
    washStartTime = 0;
    timeRemaining = 0;
    reminderSent = false;
    
    digitalWrite(PIN_RELAY, HIGH);
    digitalWrite(PIN_LED, LOW);
}

// ==================== WHATSAPP ====================
void sendWhatsApp(String number, String message) {
    if (WiFi.status() != WL_CONNECTED) {
        Serial.println("❌ Cannot send WhatsApp - No WiFi");
        return;
    }
    
    Serial.println("📱 Sending WhatsApp to: " + number);
    
    HTTPClient http;
    http.begin(WASAPBOT_API_URL);
    http.addHeader("Content-Type", "application/x-www-form-urlencoded");
    
    String postData = "instance_id=" + String(WASAPBOT_INSTANCE_ID);
    postData += "&access_token=" + String(WASAPBOT_ACCESS_TOKEN);
    postData += "&number=" + number;
    postData += "&message=" + urlEncode(message);
    
    int httpCode = http.POST(postData);
    
    if (httpCode > 0) {
        Serial.println("   Response: " + http.getString());
    } else {
        Serial.println("   Error: " + http.errorToString(httpCode));
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
        } else if (isalnum(c) || c == '-' || c == '_' || c == '.' || c == '~') {
            encoded += c;
        } else {
            char buf[4];
            sprintf(buf, "%%%02X", (unsigned char)c);
            encoded += buf;
        }
    }
    
    return encoded;
}

// ==================== TRANSACTION ====================
void recordTransaction() {
    // Get today's date (simplified - use NTP for production)
    String today = "2025-01-09";  // TODO: Get from NTP server
    
    String path = "/daily_records/" + today;
    
    if (Firebase.RTDB.getJSON(&fbdo, path)) {
        FirebaseJson &json = fbdo.jsonObject();
        FirebaseJsonData data;
        
        int cycles = 0;
        int revenue = 0;
        
        if (json.get(data, "cycles")) cycles = data.intValue;
        if (json.get(data, "revenue")) revenue = data.intValue;
        
        cycles++;
        revenue += PRICE_PER_WASH;
        
        FirebaseJson updateJson;
        updateJson.set("cycles", cycles);
        updateJson.set("revenue", revenue);
        
        Firebase.RTDB.setJSON(&fbdo, path, &updateJson);
        
        Serial.println("💰 Transaction recorded - Cycles: " + String(cycles) + ", Revenue: RM" + String(revenue));
    } else {
        // First transaction of the day
        FirebaseJson updateJson;
        updateJson.set("cycles", 1);
        updateJson.set("revenue", PRICE_PER_WASH);
        
        Firebase.RTDB.setJSON(&fbdo, path, &updateJson);
        Serial.println("💰 First transaction of the day recorded");
    }
}
