# Smart Dobi - AI-Powered Self-Service Laundry System

## 🎯 Overview

Smart Dobi adalah sistem laundry self-service yang mengintegrasikan IoT (ESP32 S3), notifikasi WhatsApp real-time, dan dashboard analitik untuk pemilik. Sistem ini membolehkan pelanggan memilih mesin, membuat pembayaran simulasi, dan menerima notifikasi WhatsApp tentang status basuhan mereka.

## ✨ Features

### Kiosk Interface (Pelanggan)
- **Real-time Machine Status**: Paparan status mesin secara langsung (Tersedia/Sedang Basuh/Rosak)
- **Glassmorphism UI**: Antara muka bergaya glassmorphism yang moden dan menarik
- **QR Payment Simulation**: Simulasi pembayaran menggunakan QR code
- **WhatsApp Integration**: Notifikasi automatik melalui WhatsApp:
  - Pengesahan permulaan basuhan
  - Peringatan 1 minit sebelum siap
  - Notifikasi apabila basuhan selesai

### Owner Dashboard
- **Google OAuth Authentication**: Login selamat menggunakan akaun Google
- **Real-time Analytics**: 
  - Jumlah mesin aktif
  - Pendapatan keseluruhan dan hari ini
  - Jumlah kitaran basuhan
- **Revenue Charts**: Graf trend pendapatan menggunakan Recharts
- **Transaction History**: Log transaksi lengkap dengan timestamps
- **Machine Monitoring**: Pantau status semua mesin secara real-time

### ESP32 S3 Integration
- **Auto-triggered Control**: Mesin bermula automatik tanpa butang fizikal
- **Relay Control**: Kawalan relay untuk 2 mesin basuh
- **LED Status Indicators**: 
  - Berkelip: Mesin tersedia
  - Solid: Mesin sedang beroperasi
- **3-Minute Wash Cycle**: Kitaran basuhan 3 minit dengan peringatan pada minit ke-2
- **WiFi Connectivity**: Sambungan WiFi untuk polling status dari backend

## 🛠 Tech Stack

### Frontend
- React 19, Tailwind CSS, Framer Motion, Recharts, Lucide React

### Backend
- FastAPI, MongoDB, Motor, HTTPX, Pydantic

### Hardware
- ESP32 S3 DevKit, 2x Relay Modules, 2x LEDs, ArduinoJson

### External APIs
- WasapBot.my (WhatsApp), Emergent Auth (Google OAuth)

## 📡 Key API Endpoints

- `GET /api/machines` - Get all machines
- `POST /api/machines/{id}/start` - Start washing cycle
- `GET /api/dashboard/stats` - Dashboard statistics (protected)
- `GET /api/transactions` - Transaction history (protected)

## 🔌 Hardware Wiring

**Machine 1:** GPIO 18 (Relay), GPIO 19 (LED)  
**Machine 2:** GPIO 21 (Relay), GPIO 22 (LED)

## 🚀 Setup

1. Backend: `pip install -r requirements.txt`
2. Frontend: `yarn install`
3. Update `.env` files with credentials
4. Upload ESP32 firmware via Arduino IDE
5. Access kiosk at root URL, owner dashboard at `/login`

---

**Built with ❤️ using Emergent AI**
