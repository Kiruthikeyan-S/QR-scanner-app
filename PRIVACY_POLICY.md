# Privacy Policy for Qrinova

**Effective Date:** October 21, 2026  
**App Name:** Qrinova  
**Package Name:** `com.kiruthikeyan.scanner`  
**Developer:** Kiruthikeyan S  

---

## 1. Introduction
Welcome to **Qrinova** ("we," "our," or "us"). Qrinova is a privacy-first QR code and barcode scanner, generator, and URL safety verification app. This Privacy Policy explains how we handle information when you use our mobile application.

---

## 2. Permissions We Request & Why

### a) Camera Permission (`android.permission.CAMERA`)
- **Purpose:** Used strictly to scan QR codes and barcodes in real time.
- **Data Handling:** Camera video frames are processed locally on your device in real time to detect QR codes and barcodes. We **never** record, store, or transmit live camera video streams to any server.

### b) Photo Library / File Selection (`READ_EXTERNAL_STORAGE` / Media Picker)
- **Purpose:** Used only when you explicitly choose to:
  1. Scan a QR code from an existing image in your gallery, or
  2. Upload a photo or PDF document to generate a shareable **Photo QR** or **File QR** code.
- **Data Handling:** We only access the specific image or file you select.

### c) Internet Access (`android.permission.INTERNET`)
- **Purpose:** Used to:
  1. Perform real-time URL safety and phishing checks on scanned web links, and
  2. Upload user-selected photos or PDF files to cloud storage (Supabase Storage) when you explicitly create a Photo QR or PDF QR code.

---

## 3. Information Stored Locally on Your Device
- **Scan History & Saved QR Codes:** Your scan history, generated QR codes, and app preferences (such as dark/light theme) are stored locally on your device using local storage (`AsyncStorage`).
- **Control:** You can clear your scan history or delete saved QR codes at any time directly inside the app. Uninstalling the app permanently removes all locally stored data.

---

## 4. User-Uploaded Files (Photo QR & PDF QR)
- When you voluntarily use the **Photo QR** or **PDF / File QR** generator feature, the selected image or document is uploaded to our cloud storage bucket (powered by Supabase) so that anyone scanning your generated QR code can view the file via its unique public URL.
- Do not upload sensitive, confidential, or private personal documents to the Photo/File QR generator if you do not wish them to be accessible via the generated QR link.

---

## 5. Data Sharing & Third Parties
- We **do not sell, rent, or trade** any personal data to third parties.
- We do not use third-party advertising SDKs or behavioral tracking analytics.
- Cloud file hosting for Photo/PDF QR codes is provided via **Supabase** using encrypted HTTPS connections.

---

## 6. Children's Privacy
Qrinova does not knowingly collect personal information from children under the age of 13.

---

## 7. Changes to This Privacy Policy
We may update this Privacy Policy from time to time. Any changes will be posted on this page with an updated effective date.

---

## 8. Contact Us
If you have any questions or concerns about this Privacy Policy or wish to request deletion of an uploaded Photo/PDF QR file, please contact us at:  
- **GitHub:** [https://github.com/Kiruthikeyan-S/QR-scanner-app](https://github.com/Kiruthikeyan-S/QR-scanner-app)
