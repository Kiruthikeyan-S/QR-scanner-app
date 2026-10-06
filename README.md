# QR Smart – QR Scanner & Generator 📱⚡

Production-ready mobile application and backend designed with the **Optical Clarity** design system.

Built with **React Native + Expo (TypeScript)** and **Python FastAPI**.

---

## 🌟 Key Features

- **100% Offline-First Engine**: QR scanning, generation, and history persist directly on-device without requiring an internet connection.
- **High-Accuracy QR Scanner**: Fast camera scanning with duplicate scan debouncing, flashlight/torch toggle, and photo library picker.
- **8 QR Code Generator Formats**:
  - 🌐 **Website URL** (with safe URL normalization and explicit user open action)
  - 📶 **Wi-Fi Network** (WPA/WPA2, WEP, Open with masked passwords)
  - 👤 **Contact Card** (vCard 3.0 standard)
  - ✉️ **Email** (prefilled recipient, subject, and body)
  - 💬 **SMS** (phone number and message)
  - 📞 **Phone Number** (direct call link)
  - 📍 **Geo Location** (latitude/longitude with Google & Apple Maps integration)
  - 📝 **Plain Text**
- **Optical Clarity UI**: Modern light & dark theme, emerald primary accents, indigo secondary accents, and JetBrains Mono monospace code formatting.
- **Local Persistence & Sync-Ready**: Offline storage via `@react-native-async-storage` with optional REST synchronization to FastAPI.
- **Python FastAPI Backend**: Clean architecture with SQLite default, PostgreSQL production-ready schemas, and interactive Swagger UI.

---

## 📁 Project Architecture

```
QR-scanner-app/
├── frontend/             # React Native + Expo mobile application
│   ├── src/
│   │   ├── api/          # Configurable API client & sync services
│   │   ├── components/   # Reusable Optical Clarity UI components
│   │   ├── constants/    # QR metadata & color configs
│   │   ├── navigation/   # Stack & Bottom Tabs navigators
│   │   ├── screens/      # Home, Scanner, Result, Generator, History, Saved, Settings
│   │   ├── storage/      # Local offline persistence modules
│   │   ├── theme/        # Light & Dark theme tokens
│   │   ├── types/        # TypeScript schemas
│   │   └── utils/        # QR parser, formatter, and action handlers
│   └── App.tsx
│
└── backend/              # Python FastAPI REST API
    ├── app/
    │   ├── api/          # Endpoints (/health, /api/v1/scans, /api/v1/qr/saved)
    │   ├── core/         # Settings & CORS
    │   ├── database/     # SQLAlchemy engine & session
    │   ├── models/       # Database tables
    │   ├── schemas/      # Pydantic v2 schemas
    │   └── services/     # CRUD business logic
    └── requirements.txt
```

---

## 🚀 Getting Started

### 1. Frontend (Expo / React Native)
```bash
cd frontend
npm install
npm start
```
- Open **Expo Go** on your physical phone (Android / iOS) and scan the QR code, or enter `exp://<your-ip>:8081`.
- Press `w` to run on web in your browser.

### 2. Backend (FastAPI)
```bash
cd backend
python -m pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
- Swagger API Docs: `http://localhost:8000/docs`
- Health Check: `http://localhost:8000/health`

---

## 🔒 Security & Privacy

- **Never Auto-Opens URLs**: Scanned URLs always require explicit user confirmation.
- **Masked Wi-Fi Passwords**: Passwords in QR previews and scan history are concealed by default.
- **100% On-Device**: Camera feed is analyzed purely locally in real-time.
