# 🔥 PANDUAN SETUP FIREBASE UNTUK SMART DOBI

## 📋 Langkah 1: Cipta Firebase Project

### 1.1 Pergi ke Firebase Console
1. Buka https://console.firebase.google.com/
2. Log masuk dengan Google Account
3. Klik **"Create a project"** atau **"Add project"**

### 1.2 Setup Project
1. **Nama Project**: `smart-dobi-system-fyp` (atau nama pilihan anda)
2. Disable Google Analytics (tidak perlu untuk projek ini)
3. Klik **Create Project**
4. Tunggu sehingga selesai, klik **Continue**

---

## 📊 Langkah 2: Setup Realtime Database

### 2.1 Aktifkan Database
1. Di sidebar kiri, klik **Build** > **Realtime Database**
2. Klik **Create Database**
3. Pilih location: **Singapore (asia-southeast1)** - paling dekat dengan Malaysia
4. Pilih **Start in test mode** (untuk development)
5. Klik **Enable**

### 2.2 Database URL
Selepas create, anda akan dapat URL seperti:
```
https://smart-dobi-system-fyp-default-rtdb.asia-southeast1.firebasedatabase.app
```
**SIMPAN URL INI** - akan guna dalam kod.

### 2.3 Setup Security Rules
Pergi ke tab **Rules** dan ganti dengan:

```json
{
  "rules": {
    "machines": {
      ".read": true,
      ".write": true
    },
    "daily_records": {
      ".read": true,
      ".write": true
    },
    "settings": {
      ".read": true,
      ".write": "auth != null"
    }
  }
}
```
Klik **Publish**

---

## 🔐 Langkah 3: Setup Authentication

### 3.1 Aktifkan Google Sign-In
1. Di sidebar, klik **Build** > **Authentication**
2. Klik **Get started**
3. Pergi ke tab **Sign-in method**
4. Klik **Google**
5. Toggle **Enable**
6. Pilih **Project support email**: (email anda)
7. Klik **Save**

---

## ⚙️ Langkah 4: Dapatkan Firebase Config

### 4.1 Add Web App
1. Pergi ke **Project Settings** (gear icon di sidebar)
2. Scroll ke **Your apps**
3. Klik icon **</>** (Web)
4. **App nickname**: `Smart Dobi Web`
5. ❌ Jangan tick "Firebase Hosting"
6. Klik **Register app**

### 4.2 Copy Config
Anda akan dapat config seperti ini:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyBxxxxxxxxxxxxxxxxxxxxxxxx",
  authDomain: "smart-dobi-system-fyp.firebaseapp.com",
  databaseURL: "https://smart-dobi-system-fyp-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "smart-dobi-system-fyp",
  storageBucket: "smart-dobi-system-fyp.firebasestorage.app",
  messagingSenderId: "377544234994",
  appId: "1:377544234994:web:xxxxxxxxxxxxxxxxx"
};
```

**GANTI nilai ini dalam semua fail HTML projek!**

---

## 📁 Langkah 5: Struktur Database

Database akan auto-create dengan struktur ini:

```json
{
  "machines": {
    "1": {
      "status": "available",
      "is_online": true,
      "is_real": true,
      "whatsapp": null,
      "time_remaining": 0
    },
    "2": {
      "status": "washing",
      "is_online": true,
      "is_real": true,
      "whatsapp": "60123456789",
      "time_remaining": 1500
    }
  },
  "daily_records": {
    "2025-01-09": {
      "cycles": 5,
      "revenue": 25
    }
  }
}
```

### Field Explanation:
| Field | Jenis | Keterangan |
|-------|-------|------------|
| `status` | string | `available`, `reserved`, `washing`, `broken` |
| `is_online` | boolean | ESP32 online status |
| `is_real` | boolean | `true` = connect ke ESP32, `false` = dummy |
| `whatsapp` | string | Nombor telefon pelanggan |
| `time_remaining` | number | Baki masa dalam saat (dari ESP32) |

---

## 🔌 Langkah 6: Setup ESP32

### 6.1 Install Library di Arduino IDE
1. Buka Arduino IDE
2. Pergi ke **Sketch** > **Include Library** > **Manage Libraries**
3. Cari dan install:
   - `Firebase ESP Client` by mobizt
   - `ArduinoJson` by Benoit Blanchon
   - `WiFi` (built-in untuk ESP32)

### 6.2 Update Credentials dalam kod ESP32:
```cpp
// WiFi
#define WIFI_SSID "NamaWiFi_Anda"
#define WIFI_PASSWORD "PasswordWiFi"

// Firebase
#define FIREBASE_API_KEY "AIzaSyBxxxxxxxxxxxxxxxxxxxxxxxx"
#define FIREBASE_DATABASE_URL "https://smart-dobi-system-fyp-default-rtdb.asia-southeast1.firebasedatabase.app"

// Machine ID (1 atau 2 - real machines sahaja)
#define MACHINE_ID "1"
```

### 6.3 Wiring ESP32:
```
ESP32 Pin    ->    Component
---------         -----------
GPIO 4       ->    Relay IN
GPIO 5       ->    LED +
GPIO 6       ->    Button (to GND)
GND          ->    Relay GND, LED -, Button
3.3V         ->    Relay VCC
```

---

## 🧪 Langkah 7: Testing

### 7.1 Test Web
1. Buka `index.html` di browser
2. Pastikan mesin-mesin dipaparkan
3. Cuba klik PILIH, bayar, dan lihat status berubah

### 7.2 Test Firebase Console
1. Buka Firebase Console > Realtime Database
2. Lihat data berubah secara real-time

### 7.3 Test ESP32
1. Upload kod ke ESP32
2. Buka Serial Monitor (115200 baud)
3. Pastikan:
   - WiFi connected
   - Firebase connected
   - Status updated

---

## ⚠️ Troubleshooting

### Problem: Data tidak keluar di web
**Solution**: 
- Pastikan `databaseURL` betul
- Check browser console untuk error

### Problem: ESP32 tidak connect Firebase
**Solution**:
- Pastikan WiFi credentials betul
- Pastikan API Key betul
- Check firewall tidak block

### Problem: Google Login tidak berfungsi
**Solution**:
- Pastikan domain ditambah dalam Firebase Console
- Authentication > Settings > Authorized domains
- Tambah domain web anda

---

## 📱 Quick Reference

### Firebase Console URL:
```
https://console.firebase.google.com/project/smart-dobi-system-fyp
```

### Database URL:
```
https://smart-dobi-system-fyp-default-rtdb.asia-southeast1.firebasedatabase.app
```

### Project Files:
```
/app/firebase-version/
├── index.html        # Halaman utama kiosk
├── payment.html      # Halaman pembayaran
├── waiting.html      # Halaman menunggu (real-time timer)
├── dashboard.html    # Dashboard pemilik
├── css/              # Stylesheets
├── js/               # (embedded dalam HTML)
└── firmware/         # Kod ESP32
```

---

**Selesai! 🎉**

Projek Smart Dobi kini ready untuk digunakan dengan Firebase!
