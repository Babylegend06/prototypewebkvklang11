# 🔌 ESP32 S3 - ARDUINO IDE SETUP GUIDE

## ✅ PERKAKASAN YANG DIPERLUKAN

- **ESP32-S3-DevKitC-1** (atau ESP32 S3 Dev Module)
- **2x Relay Module** (5V)
- **2x LED** (warna apa-apa)
- **2x Resistor 220Ω** (untuk LED)
- **2x Button** (push button)
- **Jumper wires**
- **USB-C cable** (untuk program ESP32)

---

## 📥 STEP 1: INSTALL ARDUINO IDE

### Download Arduino IDE
1. Pergi ke: https://www.arduino.cc/en/software
2. Download **Arduino IDE 2.x** (latest version)
3. Install seperti biasa

---

## ⚙️ STEP 2: SETUP ESP32 S3 BOARD DI ARDUINO IDE

### 2.1 Tambah ESP32 Board Manager URL

1. Buka Arduino IDE
2. Pergi ke: **File** → **Preferences**
3. Di "Additional boards manager URLs", tambah:
   ```
   https://espressif.github.io/arduino-esp32/package_esp32_index.json
   ```
4. Click **OK**

### 2.2 Install ESP32 Board

1. Pergi ke: **Tools** → **Board** → **Boards Manager**
2. Search: `esp32`
3. Install: **esp32 by Espressif Systems** (version 3.x atau latest)
4. Tunggu installation complete (5-10 minit)

### 2.3 Select ESP32 S3 Board

1. Pergi ke: **Tools** → **Board** → **esp32** → **ESP32S3 Dev Module**
2. Configuration:
   - **USB CDC On Boot**: Enabled
   - **USB DFU On Boot**: Disabled
   - **USB Mode**: Hardware CDC and JTAG
   - **Upload Mode**: UART0 / Hardware CDC
   - **CPU Frequency**: 240MHz
   - **Flash Mode**: QIO
   - **Flash Size**: 4MB (atau ikut board anda)
   - **Partition Scheme**: Default 4MB
   - **PSRAM**: QSPI PSRAM (atau OPI jika board support)

---

## 📚 STEP 3: INSTALL LIBRARIES

### 3.1 Install ArduinoJson Library

1. Pergi ke: **Tools** → **Manage Libraries** (atau Ctrl+Shift+I)
2. Search: `ArduinoJson`
3. Install: **ArduinoJson by Benoit Blanchon** (version 7.x)
4. Click **Install**

### 3.2 Built-in Libraries (sudah ada)

ESP32 sudah include:
- **WiFi.h** - untuk WiFi connection
- **HTTPClient.h** - untuk API calls

---

## 🔌 STEP 4: WIRING DIAGRAM

### Machine 1:
```
ESP32 S3              Component
─────────            ──────────
GPIO 16     ──►      Button START 1 (satu kaki ke GND)
GPIO 18     ──►      Relay 1 IN
GPIO 19     ──►      LED 1 Anode (+) ──► 220Ω ──► GND

Relay Module:
  VCC ──► 5V (ESP32)
  GND ──► GND (ESP32)
  IN  ──► GPIO 18
```

### Machine 2:
```
ESP32 S3              Component
─────────            ──────────
GPIO 17     ──►      Button START 2 (satu kaki ke GND)
GPIO 21     ──►      Relay 2 IN
GPIO 22     ──►      LED 2 Anode (+) ──► 220Ω ──► GND

Relay Module:
  VCC ──► 5V (ESP32)
  GND ──► GND (ESP32)
  IN  ──► GPIO 21
```

### Power Supply:
```
ESP32 S3 ──► USB-C (untuk development)
ESP32 S3 ──► 5V Power Adapter (untuk production)
```

---

## 💻 STEP 5: UPLOAD CODE KE ESP32

### 5.1 Open Firmware File

1. Buka Arduino IDE
2. **File** → **Open**
3. Navigate ke: `/app/SmartDobi_ESP32S3.ino`
4. File akan terbuka

### 5.2 Configure Credentials

Edit bahagian ini dalam code:

```cpp
// WiFi Credentials
const char* WIFI_SSID = "YOUR_WIFI_SSID";          // ← Tukar dengan WiFi name anda
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";  // ← Tukar dengan WiFi password

// Backend API Configuration
const char* BACKEND_URL = "https://dobi-alert.preview.emergentagent.com";  // ← URL web anda

// WasapBot.my Configuration  
const char* WASAPBOT_INSTANCE_ID = "YOUR_INSTANCE_ID";    // ← Dari dashboard WasapBot.my
const char* WASAPBOT_ACCESS_TOKEN = "YOUR_ACCESS_TOKEN";  // ← Dari dashboard WasapBot.my
```

### 5.3 Connect ESP32 to Computer

1. Sambung ESP32 S3 ke computer guna USB-C cable
2. **PENTING**: Tekan dan tahan **BOOT button** pada ESP32
3. Tekan **RESET button** sekali (sambil hold BOOT)
4. Lepaskan BOOT button
5. ESP32 sekarang dalam "download mode"

### 5.4 Select Port

1. Pergi ke: **Tools** → **Port**
2. Pilih port ESP32 (contoh: COM3, COM4, atau /dev/ttyUSB0)
   - Windows: COMx
   - Mac: /dev/cu.usbserial-xxxxx
   - Linux: /dev/ttyUSB0

### 5.5 Upload Code

1. Click **Upload button** (atau Ctrl+U)
2. Tunggu compilation (30-60 saat)
3. Upload akan start automatically
4. Progress bar akan muncul
5. Tunggu "Done uploading" message

**Troubleshooting Upload:**
- Jika stuck "Connecting....": Repeat step 5.3 (BOOT + RESET)
- Jika "Port not found": Install CP210x USB Driver
- Jika error: Pastikan board selection correct

---

## 🔍 STEP 6: MONITOR SERIAL OUTPUT

### 6.1 Open Serial Monitor

1. Click **Serial Monitor** icon (top right)
2. Atau: **Tools** → **Serial Monitor** (Ctrl+Shift+M)

### 6.2 Configure Serial Monitor

1. Set baud rate: **115200**
2. Line ending: **Both NL & CR**

### 6.3 Reset ESP32

1. Tekan **RESET button** pada ESP32
2. Serial monitor akan show:

```
=== Smart Dobi ESP32 S3 Startup ===
Connecting to WiFi: YourWiFiName
....
WiFi Connected!
IP Address: 192.168.1.100
Smart Dobi Ready!
================================
```

### 6.4 Check Logs

Anda akan nampak:
```
✓ Polling Machine 1 - Status: available
✓ Polling Machine 2 - Status: available
✓ WiFi signal: -45 dBm (excellent)
```

---

## 🧪 STEP 7: TEST ESP32 FUNCTIONALITY

### Test 1: WiFi Connection
```
Serial Monitor should show:
"WiFi Connected!"
"IP Address: xxx.xxx.xxx.xxx"
```

### Test 2: API Polling
```
Serial Monitor should show every 2 seconds:
"Polling Machine 1 - Status: available"
```

### Test 3: Start Machine dari Web

1. Buka web: https://dobi-alert.preview.emergentagent.com/
2. Click Mesin 1
3. Masuk WhatsApp number
4. Click "Sahkan Pembayaran"
5. Check Serial Monitor:

```
✓ Machine 1 - Status changed: available → washing
✓ Starting LED BLINK mode (customer signal)
```

### Test 4: Button START

1. LED akan berkelip (signal customer)
2. Tekan button START pada ESP32 (GPIO 16)
3. Serial Monitor:

```
✓ START button pressed for Machine 1
✓ Starting 120-second timer
✓ Relay 1 activated (GPIO 18 HIGH)
✓ LED 1 solid ON
```

### Test 5: Timer Countdown

```
Serial Monitor akan show setiap 2 saat:
✓ Machine 1 - Timer: 118 seconds remaining
✓ Updating backend with time_remaining=118
✓ Machine 1 - Timer: 116 seconds remaining
...
```

### Test 6: Reminder (25 min / 5 min remaining)

```
✓ Machine 1 - 5 minutes remaining
✓ Sending reminder to backend
✓ Reminder WhatsApp sent
```

### Test 7: Complete Cycle

```
✓ Machine 1 - Timer: 0 seconds
✓ Wash cycle complete!
✓ Relay 1 deactivated (GPIO 18 LOW)
✓ LED 1 turned OFF
✓ Updating backend: status=available
✓ Completion WhatsApp sent
```

---

## ❗ TROUBLESHOOTING

### Problem 1: WiFi tidak connect
```
Serial: "WiFi Connection Failed!"

Solution:
- Check SSID & password betul
- WiFi 2.4GHz (bukan 5GHz)
- ESP32 dekat dengan router
```

### Problem 2: API calls failed
```
Serial: "Error polling machine: HTTP 404"

Solution:
- Check BACKEND_URL correct
- Pastikan web backend running
- Test: curl https://your-url.com/api/machines
```

### Problem 3: Button tidak respond
```
Serial: Nothing when button pressed

Solution:
- Check wiring: Button to GPIO & GND
- Button sambung betul (normally open)
- Test dengan Serial: digitalRead(BUTTON_PIN)
```

### Problem 4: Relay tidak activate
```
Serial: "Relay activated" tapi relay tak ON

Solution:
- Check relay VCC dapat 5V (bukan 3.3V)
- Check relay GND sambung ESP32 GND
- Test: Manual set digitalWrite(RELAY_PIN, HIGH)
```

### Problem 5: LED tidak menyala
```
Serial: "LED ON" tapi tak nampak

Solution:
- Check LED polarity (Anode to GPIO, Cathode to GND)
- Check resistor 220Ω ada
- Test: digitalWrite(LED_PIN, HIGH)
```

---

## 📊 EXPECTED SERIAL OUTPUT (Full Cycle)

```
=== Smart Dobi ESP32 S3 Startup ===
Connecting to WiFi: MyWiFi
....
WiFi Connected!
IP Address: 192.168.1.100
Smart Dobi Ready!
================================

[00:00] Polling Machine 1 - Status: available
[00:02] Polling Machine 1 - Status: available
[00:04] Polling Machine 1 - Status: washing  ← Payment done dari web
[00:04] Machine 1 - Starting LED BLINK mode
[00:06] LED BLINK... waiting for START button
[00:08] START button pressed for Machine 1!  ← Customer tekan button
[00:08] Starting 120-second wash cycle
[00:08] Relay 1 activated (GPIO 18)
[00:08] LED 1 solid ON
[00:10] Updating backend: time_remaining=118
[00:12] Updating backend: time_remaining=116
...
[01:40] Timer: 60 seconds remaining
[01:50] Timer: 50 seconds remaining
[01:55] 5 minutes remaining - Sending reminder  ← Reminder sent
[01:55] Reminder WhatsApp API: Success
...
[02:00] Timer: 0 seconds - Cycle complete!
[02:00] Relay 1 deactivated
[02:00] LED 1 turned OFF
[02:00] Updating backend: status=available
[02:00] Completion WhatsApp sent
[02:02] Polling Machine 1 - Status: available
```

---

## 🎓 TIPS & BEST PRACTICES

1. **Serial Monitor always ON** - Untuk debug
2. **Test each component separately** - LED, Relay, Button satu-satu
3. **Check voltage levels** - Relay perlu 5V, ESP32 logic 3.3V
4. **Use good power supply** - USB power mungkin tak cukup untuk relay
5. **Ground sharing** - Semua GND mesti sambung sama

---

## 📂 PROJECT LOCATION

Anda boleh tengok project di:

1. **Web Application**: https://dobi-alert.preview.emergentagent.com/
2. **Arduino Firmware**: `/app/SmartDobi_ESP32S3.ino`
3. **Backend Code**: `/app/backend/server.py`
4. **System Flow**: `/app/SYSTEM_FLOW.md`

---

## ✅ CHECKLIST BEFORE DEPLOYMENT

- [ ] WiFi credentials updated
- [ ] Backend URL correct
- [ ] WasapBot credentials dari dashboard
- [ ] All wiring checked (LED, Relay, Button)
- [ ] Power supply adequate (5V for relay)
- [ ] Serial monitor shows successful connection
- [ ] Test 1 complete cycle end-to-end
- [ ] WhatsApp notifications received
- [ ] Web shows correct timer from ESP32

---

## 🆘 NEED HELP?

1. Check Serial Monitor output
2. Check `/app/SYSTEM_FLOW.md` untuk understand flow
3. Test components individually
4. Check wiring diagram
5. Verify backend API working: `curl https://your-url.com/api/machines`
