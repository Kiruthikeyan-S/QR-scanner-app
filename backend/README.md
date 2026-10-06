# QR Smart - FastAPI Backend

Production-ready, lightweight REST API for **QR Smart – QR Scanner & Generator**.

## Features
- **FastAPI** with automatic interactive Swagger docs at `/docs`
- **SQLite** database by default for easy local development, zero-config setup
- Easily configurable for **PostgreSQL** in production via `DATABASE_URL`
- **Pydantic v2** validation and serialization
- Complete CRUD operations for Scans History and Saved QR Codes
- CORS enabled for cross-platform mobile access
- Health check endpoints

## Setup & Running

1. **Create and activate a virtual environment (optional but recommended):**
   ```bash
   python -m venv venv
   # On Windows:
   .\venv\Scripts\activate
   # On macOS/Linux:
   source venv/bin/activate
   ```

2. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

3. **Run the server:**
   ```bash
   uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
   ```

4. **Access the API:**
   - Swagger Documentation: `http://localhost:8000/docs`
   - Redoc: `http://localhost:8000/redoc`
   - Health check: `http://localhost:8000/health`
   - Scans API: `http://localhost:8000/api/v1/scans`
   - Saved QR API: `http://localhost:8000/api/v1/qr/saved`
