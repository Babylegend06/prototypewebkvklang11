# 📊 KANDUNGAN SLIDE PROJEK SMART DOBI
## Projek Tahun Akhir (FYP) - IoT Self-Service Laundry System

---

## 🎯 SLIDE 1: TAJUK

### SMART DOBI
**An IoT-Integrated, WhatsApp-Notified, Self-Service Laundry System with Real-Time Firebase Sync & ESP32 Control**

- Nama Pelajar: [NAMA ANDA]
- No. Matrik: [NO MATRIK]
- Penyelia: [NAMA PENYELIA]
- Sesi: 2024/2025

---

## 📌 SLIDE 2: PENGENALAN

### Latar Belakang Masalah
- Kedai dobi tradisional memerlukan kehadiran pekerja
- Pelanggan perlu menunggu di premis tanpa tahu bila siap
- Tiada sistem pemantauan real-time untuk pemilik
- Pembaziran masa dan tenaga manusia

### Objektif Projek
1. Membangunkan sistem dobi layan diri berasaskan IoT
2. Mencipta antara muka web responsif untuk pelanggan dan pemilik
3. Mengintegrasikan notifikasi WhatsApp automatik
4. Melaksanakan pemantauan real-time melalui Firebase

---

## 🛠️ SLIDE 3: TEKNOLOGI YANG DIGUNAKAN

### Frontend (Web)
| Teknologi | Kegunaan |
|-----------|----------|
| HTML5 | Struktur halaman |
| CSS3 | Glass morphism design |
| JavaScript ES6+ | Logic & Firebase SDK |
| Firebase v10 | Realtime Database |

### Backend (IoT)
| Teknologi | Kegunaan |
|-----------|----------|
| ESP32-S3 | Mikrokontroler utama |
| Firebase RTDB | Cloud database |
| WasapBot API | WhatsApp notifications |

### Cloud Services
| Perkhidmatan | Fungsi |
|--------------|--------|
| Firebase Realtime Database | Data synchronization |
| Firebase Authentication | Google OAuth login |
| WasapBot.my | WhatsApp API |

---

## 📐 SLIDE 4: SENIBINA SISTEM

```
┌─────────────────────────────────────────────────────────────┐
│                        CLOUD LAYER                          │
│  ┌───────────────────┐    ┌───────────────────┐            │
│  │ Firebase Realtime │    │   WasapBot API    │            │
│  │     Database      │    │   (WhatsApp)      │            │
│  └─────────┬─────────┘    └─────────┬─────────┘            │
└────────────┼────────────────────────┼──────────────────────┘
             │                        │
             │    REAL-TIME SYNC      │
             ▼                        ▼
┌─────────────────────────────────────────────────────────────┐
│                     APPLICATION LAYER                        │
│  ┌───────────────────┐    ┌───────────────────┐            │
│  │   Web Kiosk       │    │  Owner Dashboard  │            │
│  │   (Pelanggan)     │    │    (Pemilik)      │            │
│  └───────────────────┘    └───────────────────┘            │
└─────────────────────────────────────────────────────────────┘
             │
             │    FIREBASE CONNECTION
             ▼
┌─────────────────────────────────────────────────────────────┐
│                      HARDWARE LAYER                          │
│  ┌───────────────────┐    ┌───────────────────┐            │
│  │     ESP32-S3      │    │     ESP32-S3      │            │
│  │    (Mesin 1)      │    │    (Mesin 2)      │            │
│  │  ┌─────────────┐  │    │  ┌─────────────┐  │            │
│  │  │ Relay       │  │    │  │ Relay       │  │            │
│  │  │ LED         │  │    │  │ LED         │  │            │
│  │  │ Button      │  │    │  │ Button      │  │            │
│  │  └─────────────┘  │    │  └─────────────┘  │            │
│  └───────────────────┘    └───────────────────┘            │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔄 SLIDE 5: CARTA ALIR SISTEM

### Aliran Pelanggan
```
Pelanggan buka web
       │
       ▼
┌──────────────┐
│ Pilih Mesin  │ ──→ Status: TERSEDIA
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ Bayar (QR)   │ ──→ Masukkan WhatsApp (optional)
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ Firebase:    │ ──→ Status: RESERVED
│ reserved     │     LED: BERKELIP
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ Tekan START  │ ──→ Button fizikal di mesin
│ di mesin     │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ Firebase:    │ ──→ Status: WASHING
│ washing      │     LED: SOLID
│ Timer start  │     Timer dikira ESP32
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ Selesai      │ ──→ WhatsApp notification
│              │     Status: AVAILABLE
└──────────────┘
```

---

## 💻 SLIDE 6: ANTARA MUKA WEB - KIOSK

### Ciri-ciri Utama:
- **Design**: iOS Glass Morphism
- **Optimized**: Tablet Portrait Mode
- **Real-time**: Status mesin dikemaskini automatik
- **Responsive**: Sesuai untuk pelbagai saiz skrin

### Halaman:
1. **index.html** - Paparan semua mesin
2. **payment.html** - Pembayaran & input WhatsApp
3. **waiting.html** - Real-time timer dari ESP32
4. **dashboard.html** - Panel kawalan pemilik

---

## ⏱️ SLIDE 7: REAL-TIME TIMER

### Mekanisme:
1. ESP32 adalah **MASTER** untuk timer
2. ESP32 menulis `time_remaining` ke Firebase setiap 2 saat
3. Web membaca nilai dari Firebase dan paparkan
4. **Tiada timer di web** - semua dari ESP32

### Code Flow:
```
ESP32:
while (washing) {
    time_remaining--;
    firebase.update("time_remaining", time_remaining);
    delay(1000);
}

Web (listening):
onValue(machineRef, (snapshot) => {
    timerDisplay.textContent = formatTime(snapshot.val().time_remaining);
});
```

### Kelebihan:
- Timer tidak boleh dimanipulasi dari web
- Konsisten antara semua pengguna
- ESP32 kawal masa sebenar mesin

---

## 📱 SLIDE 8: NOTIFIKASI WHATSAPP

### Bila Dihantar:
| Peristiwa | Mesej |
|-----------|-------|
| Pembayaran diterima | "Mesin X ditempah. Sila tekan START." |
| Mula basuh | "Mesin X mula beroperasi. 30 minit." |
| 5 minit lagi | "Mesin X akan siap dalam 5 minit!" |
| Selesai | "Mesin X siap! Sila ambil pakaian." |

### Teknologi:
- **API**: WasapBot.my
- **Triggered by**: ESP32
- **Format**: WhatsApp Business API

---

## 🎛️ SLIDE 9: DASHBOARD PEMILIK

### Fungsi:
1. **Login**: Google OAuth
2. **Statistik**: Mesin tersedia, beroperasi, hasil harian
3. **Kawalan**: Edit status setiap mesin
4. **Reset**: Set mesin ke "Tersedia"
5. **Monitoring**: Lihat online/offline status

### Data Displayed:
- Status setiap mesin (real-time)
- Timer untuk mesin yang sedang basuh
- Nombor WhatsApp pelanggan
- Jenis mesin (Real ESP32 / Demo)

---

## 🔌 SLIDE 10: PERKAKASAN (HARDWARE)

### Komponen:
| Item | Kuantiti | Fungsi |
|------|----------|--------|
| ESP32-S3 DevKit | 2 | Mikrokontroler |
| Relay Module 5V | 2 | Kawalan motor |
| LED (Kuning/Biru) | 2 | Status indicator |
| Push Button | 2 | START button |
| Jumper Wires | - | Sambungan |
| Breadboard | 2 | Prototyping |

### Wiring Diagram:
```
ESP32-S3
   │
   ├── GPIO 4 ──→ Relay IN (kawalan motor)
   │
   ├── GPIO 5 ──→ LED + (status indicator)
   │
   ├── GPIO 6 ──→ Button (START) ──→ GND
   │
   ├── 3.3V ────→ Relay VCC
   │
   └── GND ─────→ Relay GND, LED -, Button
```

---

## 📊 SLIDE 11: STRUKTUR DATABASE

### Firebase Realtime Database:
```json
{
  "machines": {
    "1": {
      "status": "washing",
      "is_online": true,
      "is_real": true,
      "whatsapp": "60123456789",
      "time_remaining": 1234,
      "reserved_at": "2025-01-09T10:30:00Z"
    },
    "2": {
      "status": "available",
      "is_online": true,
      "is_real": true,
      "whatsapp": null,
      "time_remaining": 0
    }
  },
  "daily_records": {
    "2025-01-09": {
      "cycles": 15,
      "revenue": 75
    }
  }
}
```

---

## 🎨 SLIDE 12: DESIGN SYSTEM

### Color Palette:
| Warna | Hex | Kegunaan |
|-------|-----|----------|
| Primary Blue | #007AFF | Buttons, links |
| Success Green | #34C759 | Available, success |
| Warning Orange | #FF9500 | Reserved, alerts |
| Danger Red | #FF3B30 | Broken, errors |
| Purple | #AF52DE | Accents |

### Typography:
- **Font**: SF Pro Display / System fonts
- **Headings**: 700 weight
- **Body**: 400-500 weight

### Glass Effect:
```css
background: rgba(255, 255, 255, 0.72);
backdrop-filter: blur(40px) saturate(180%);
border-radius: 24px;
border: 1px solid rgba(255, 255, 255, 0.5);
```

---

## 🧪 SLIDE 13: PENGUJIAN

### Unit Testing:
| Komponen | Ujian | Hasil |
|----------|-------|-------|
| Firebase Connection | Data write/read | ✅ Pass |
| Google Auth | Login/logout | ✅ Pass |
| Timer Sync | ESP32 → Web | ✅ Pass |
| WhatsApp API | Send message | ✅ Pass |

### Integration Testing:
| Flow | Langkah | Hasil |
|------|---------|-------|
| Customer Flow | Select → Pay → Wait → Complete | ✅ Pass |
| Owner Flow | Login → View → Edit → Logout | ✅ Pass |
| ESP32 Flow | Connect → Listen → Control → Update | ✅ Pass |

### User Acceptance Testing:
- 5 pengguna menguji sistem
- Maklum balas positif
- UI mudah difahami

---

## 📈 SLIDE 14: KELEBIHAN SISTEM

### Untuk Pelanggan:
- ✅ Tidak perlu menunggu di premis
- ✅ Notifikasi WhatsApp automatik
- ✅ Lihat status mesin real-time
- ✅ Proses bayaran mudah

### Untuk Pemilik:
- ✅ Pantau semua mesin dari jauh
- ✅ Tiada pekerja diperlukan
- ✅ Statistik hasil harian
- ✅ Kawalan penuh melalui dashboard

### Teknikal:
- ✅ Real-time sync (< 2 saat)
- ✅ Kos rendah (Firebase free tier)
- ✅ Scalable (boleh tambah mesin)
- ✅ Reliable (cloud-based)

---

## 🔮 SLIDE 15: PENAMBAHBAIKAN MASA DEPAN

### Short-term:
1. Tambah payment gateway sebenar (Stripe/Toyyibpay)
2. Integrasi dengan RFID card
3. Mobile app (React Native)

### Long-term:
1. Machine learning untuk predictive maintenance
2. Multi-branch management
3. Loyalty program integration
4. Smart pricing (peak hours)

---

## 🏁 SLIDE 16: KESIMPULAN

### Objektif Dicapai:
- ✅ Sistem dobi layan diri IoT berfungsi
- ✅ Web interface untuk pelanggan & pemilik
- ✅ Real-time timer synchronization
- ✅ Notifikasi WhatsApp automatik

### Sumbangan:
- Mengurangkan keperluan tenaga manusia
- Meningkatkan kecekapan operasi dobi
- Menyediakan pengalaman pelanggan yang lebih baik
- Model boleh direplikasi untuk kedai lain

### Pembelajaran:
- Firebase Realtime Database
- ESP32 programming
- Full-stack web development
- IoT system integration

---

## 📚 SLIDE 17: RUJUKAN

1. Firebase Documentation - https://firebase.google.com/docs
2. ESP32 Arduino Core - https://github.com/espressif/arduino-esp32
3. WasapBot API Documentation - https://wasapbot.my/docs
4. MDN Web Docs - https://developer.mozilla.org
5. IoT Design Patterns - O'Reilly Media

---

## ❓ SLIDE 18: Q&A

### Soalan?

**Terima Kasih! 🙏**

---

## 📎 LAMPIRAN

### Demo URL:
```
https://[your-domain]/dobi/index.html
```

### GitHub Repository:
```
https://github.com/[username]/smart-dobi
```

### Contact:
- Email: [your-email]
- WhatsApp: [your-number]

---
