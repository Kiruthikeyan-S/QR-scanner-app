import os
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable, KeepTogether
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.pdfgen import canvas

class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super().showPage()
        super().save()

    def draw_page_decorations(self, page_count):
        self.saveState()
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#64748b"))
        
        # Header (pages > 1)
        if self._pageNumber > 1:
            self.drawString(54, 750, "QRINOVA (QR SMART) — Comprehensive Project Specification & Documentation")
            self.setStrokeColor(colors.HexColor("#e2e8f0"))
            self.setLineWidth(0.5)
            self.line(54, 742, 558, 742)
            
        # Footer
        self.setStrokeColor(colors.HexColor("#e2e8f0"))
        self.setLineWidth(0.5)
        self.line(54, 45, 558, 45)
        self.drawString(54, 32, "Confidential & Project Engineering Documentation | Google Play Approved")
        page_text = f"Page {self._pageNumber} of {page_count}"
        self.drawRightString(558, 32, page_text)
        self.restoreState()

def create_project_pdf():
    pdf_path = r"F:\QR\Qrinova_Project_Documentation.pdf"
    doc = SimpleDocTemplate(
        pdf_path,
        pagesize=letter,
        leftMargin=54,
        rightMargin=54,
        topMargin=54,
        bottomMargin=54
    )

    styles = getSampleStyleSheet()

    # Custom styles
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=24,
        leading=28,
        textColor=colors.HexColor("#0f172a"),
        spaceAfter=6
    )

    subtitle_style = ParagraphStyle(
        'DocSub',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=12,
        leading=16,
        textColor=colors.HexColor("#0284c7"),
        spaceAfter=15
    )

    h1_style = ParagraphStyle(
        'Header1',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=14,
        leading=18,
        textColor=colors.HexColor("#0f172a"),
        spaceBefore=14,
        spaceAfter=6,
        keepWithNext=True
    )

    h2_style = ParagraphStyle(
        'Header2',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=11,
        leading=15,
        textColor=colors.HexColor("#0369a1"),
        spaceBefore=10,
        spaceAfter=4,
        keepWithNext=True
    )

    body_style = ParagraphStyle(
        'Body',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9.5,
        leading=14,
        textColor=colors.HexColor("#334155"),
        spaceAfter=6
    )

    bullet_style = ParagraphStyle(
        'Bullet',
        parent=body_style,
        leftIndent=14,
        firstLineIndent=-10,
        spaceAfter=3
    )

    table_cell = ParagraphStyle(
        'TableCell',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=11,
        textColor=colors.HexColor("#1e293b")
    )

    table_cell_bold = ParagraphStyle(
        'TableCellBold',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8.5,
        leading=11,
        textColor=colors.HexColor("#0f172a")
    )

    meta_style = ParagraphStyle(
        'MetaStyle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9,
        leading=12,
        textColor=colors.HexColor("#0f172a")
    )

    story = []

    # Title Banner
    story.append(Paragraph("QRINOVA (QR SMART)", title_style))
    story.append(Paragraph("Advanced QR & Barcode Mobile Ecosystem with Real-Time URL Threat Protection", subtitle_style))
    story.append(HRFlowable(width="100%", thickness=2, color=colors.HexColor("#0284c7"), spaceAfter=12))

    # Executive Summary Meta Table
    meta_data = [
        [Paragraph("<b>App Name:</b> Qrinova", table_cell), Paragraph("<b>Target Platform:</b> Android (Google Play Live)", table_cell)],
        [Paragraph("<b>Package ID:</b> com.kiruthikeyan.scanner", table_cell), Paragraph("<b>Tech Stack:</b> React Native (Expo) + FastAPI + Supabase", table_cell)],
        [Paragraph("<b>Version:</b> 1.0.0 (VersionCode 6/7)", table_cell), Paragraph("<b>Developer:</b> Kiruthikeyan S", table_cell)]
    ]
    meta_table = Table(meta_data, colWidths=[240, 264])
    meta_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#f8fafc")),
        ('PADDING', (0,0), (-1,-1), 6),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor("#cbd5e1")),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor("#e2e8f0")),
    ]))
    story.append(meta_table)
    story.append(Spacer(1, 10))

    # SECTION 1: MOTIVATION & PROBLEM STATEMENT
    story.append(Paragraph("1. Project Motivation & Problem Statement", h1_style))
    story.append(Paragraph(
        "Standard QR code scanning applications suffer from significant limitations and dangerous security risks: "
        "(1) <b>QR Phishing (Quishing):</b> Conventional scanners automatically open scanned URLs or redirect users without checking if the destination domain is deceptive, contains malicious homographs, or links directly to malware executables. "
        "(2) <b>Format Rigidity:</b> Most tools only support generic text or basic website links, lacking support for industrial barcodes, Wi-Fi credentials, structured JSON, and order receipts. "
        "(3) <b>Storage & Sharing Gap:</b> Creating QR codes for media (e.g. photos, PDF flyers, menus) usually requires clumsy third-party cloud links. Qrinova solves these challenges with an integrated, secure, and privacy-respecting ecosystem.",
        body_style
    ))
    story.append(Spacer(1, 6))

    # SECTION 2: KEY SYSTEM FEATURES
    story.append(Paragraph("2. Complete Features Delivered in Qrinova", h1_style))
    features = [
        "<b>Real-Time URL Threat & Safety Engine:</b> 0–100 risk scoring algorithm detecting dangerous URL schemes (javascript:, blob:, data:), homograph/punycode spoofing, raw IP addresses, suspicious TLDs, and executable download extensions (.apk, .exe). Scanned links are marked SAFE, SUSPICIOUS, or UNSAFE.",
        "<b>Ultra-Fast Multi-Code Scanner:</b> Camera-based continuous detection of 1D and 2D barcodes with customizable scan overlay, pinch-to-zoom, torch toggle, and optical clarity enhancements.",
        "<b>Gallery Image QR Scanner:</b> Allows scanning QR codes directly from gallery images utilizing Android's privacy-focused System Photo Picker.",
        "<b>Cloud-Linked Photo & PDF QR Generator:</b> Encrypted HTTPS file uploads directly to Supabase Storage bucket (qr-files) generating instant shareable QR codes accessible across any device without local network dependencies.",
        "<b>12+ Multi-Format QR Generator:</b> Native generators for Plain Text, Website URL, Wi-Fi Network (WPA/WPA2/WPA3), Phone dialer, Email, SMS, Contact vCard 3.0, Geo Location (Google Maps), Order ID, and Structured JSON payloads.",
        "<b>Industrial Barcode Generator:</b> High-resolution SVG barcode generation with standard retail/warehouse formats: CODE128, EAN-13, UPC-A, CODE39, and ITF-14.",
        "<b>Visual QR Customizer:</b> Allows users to customize QR foreground/background palettes, pick quick themes, adjust error correction levels (L, M, Q, H), and embed custom center logos.",
        "<b>Local Scan History & Favorites:</b> Offline-first persistent storage (AsyncStorage) with real-time text search, type filtering, multi-select batch deletion, and verified safe security badges."
    ]
    for feat in features:
        story.append(Paragraph(f"• {feat}", bullet_style))
    story.append(Spacer(1, 10))

    # SECTION 3: TOOLS, LIBRARIES & FRAMEWORKS
    story.append(Paragraph("3. Tools, Libraries & Frameworks Used", h1_style))
    
    tools_data = [
        [Paragraph("<b>Category</b>", table_cell_bold), Paragraph("<b>Tool / Library</b>", table_cell_bold), Paragraph("<b>Version</b>", table_cell_bold), Paragraph("<b>Purpose in Project</b>", table_cell_bold)],
        [Paragraph("Frontend Framework", table_cell), Paragraph("React Native / Expo SDK", table_cell), Paragraph("0.86 / 57", table_cell), Paragraph("Cross-platform mobile UI development architecture", table_cell)],
        [Paragraph("Language", table_cell), Paragraph("TypeScript", table_cell), Paragraph("5.3+", table_cell), Paragraph("Strict static type checking across all components & models", table_cell)],
        [Paragraph("Navigation", table_cell), Paragraph("@react-navigation/native-stack & tabs", table_cell), Paragraph("7.20", table_cell), Paragraph("WhatsApp-style header, bottom tabs & smooth stack routes", table_cell)],
        [Paragraph("Camera & Vision", table_cell), Paragraph("expo-camera", table_cell), Paragraph("57.0", table_cell), Paragraph("High performance live camera feed & QR frame decoding", table_cell)],
        [Paragraph("System Pickers", table_cell), Paragraph("expo-image-picker & document-picker", table_cell), Paragraph("57.0", table_cell), Paragraph("Privacy-compliant Android Photo & Document pickers", table_cell)],
        [Paragraph("QR Encoding", table_cell), Paragraph("nayuki-qr-code-generator / react-native-svg", table_cell), Paragraph("1.8 / 15.15", table_cell), Paragraph("Mathematical matrix QR calculation & SVG vector rendering", table_cell)],
        [Paragraph("Client Storage", table_cell), Paragraph("@react-native-async-storage", table_cell), Paragraph("2.2", table_cell), Paragraph("Offline persistent storage for history, favorites & settings", table_cell)],
        [Paragraph("Cloud Client", table_cell), Paragraph("@supabase/supabase-js", table_cell), Paragraph("2.117", table_cell), Paragraph("Direct authenticated storage uploads to Supabase cloud", table_cell)],
        [Paragraph("Backend Framework", table_cell), Paragraph("FastAPI (Python)", table_cell), Paragraph("0.115+", table_cell), Paragraph("High performance async REST API for threat analysis", table_cell)],
        [Paragraph("ASGI Server", table_cell), Paragraph("Uvicorn (Standard)", table_cell), Paragraph("0.28+", table_cell), Paragraph("Async server process powering backend endpoints", table_cell)],
        [Paragraph("Database ORM", table_cell), Paragraph("SQLAlchemy + Pydantic v2", table_cell), Paragraph("2.0 / 2.6", table_cell), Paragraph("Schema validation, model serialization & SQLite storage", table_cell)],
        [Paragraph("Cloud Platform", table_cell), Paragraph("Supabase Storage & PostgreSQL", table_cell), Paragraph("Cloud", table_cell), Paragraph("Encrypted public storage bucket hosting uploaded media", table_cell)],
        [Paragraph("Build Tooling", table_cell), Paragraph("Expo EAS CLI / Gradle", table_cell), Paragraph("24.12+", table_cell), Paragraph("Automated Android App Bundle (AAB) cloud builder", table_cell)]
    ]
    tools_table = Table(tools_data, colWidths=[95, 130, 55, 224])
    tools_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#e0f2fe")),
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ('PADDING', (0,0), (-1,-1), 4),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#cbd5e1")),
    ]))
    story.append(tools_table)
    story.append(Spacer(1, 10))

    # SECTION 4: API ARCHITECTURE & ENDPOINTS
    story.append(Paragraph("4. Backend Architecture & API Workflows", h1_style))
    story.append(Paragraph(
        "The project combines a local offline-first client architecture with a FastAPI and Supabase cloud service layer:",
        body_style
    ))
    
    api_data = [
        [Paragraph("<b>Endpoint / Method</b>", table_cell_bold), Paragraph("<b>Source / Service</b>", table_cell_bold), Paragraph("<b>Description & Request/Response Flow</b>", table_cell_bold)],
        [Paragraph("<b>GET /health</b>", table_cell), Paragraph("FastAPI Service", table_cell), Paragraph("Health check probe verifying API status, database and system uptime.", table_cell)],
        [Paragraph("<b>POST /security/check-url</b>", table_cell), Paragraph("Threat Analyzer", table_cell), Paragraph("Payload: <code>{'url': string}</code>. Evaluates safety index (0–100), detects homograph deception, raw IPs, blocked protocols. Returns threat breakdown.", table_cell)],
        [Paragraph("<b>POST /files/upload</b>", table_cell), Paragraph("Files Service", table_cell), Paragraph("Multipart file upload endpoint saving media metadata and assigning randomized unique tracking IDs (e.g. P-8X29K).", table_cell)],
        [Paragraph("<b>GET /files/raw/{id}</b>", table_cell), Paragraph("Files Service", table_cell), Paragraph("Streams uploaded photo or PDF bytes directly for public viewing in browser or image viewer.", table_cell)],
        [Paragraph("<b>POST storage/v1/object/qr-files</b>", table_cell), Paragraph("Supabase Storage API", table_cell), Paragraph("Direct client-to-cloud encrypted HTTPS upload pipeline uploading user-selected photos/documents using publishable anon key.", table_cell)]
    ]
    api_table = Table(api_data, colWidths=[130, 100, 274])
    api_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#f1f5f9")),
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ('PADDING', (0,0), (-1,-1), 4.5),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#cbd5e1")),
    ]))
    story.append(api_table)
    story.append(Spacer(1, 10))

    # SECTION 5: GOOGLE PLAY STORE COMPLIANCE & PRIVACY
    story.append(Paragraph("5. Google Play Store Compliance & Production Approval", h1_style))
    story.append(Paragraph(
        "A critical milestone of this project was achieving strict Google Play Store production approval. The app was successfully engineered to pass Google Play's rigorous security and privacy audits:",
        body_style
    ))
    compliance_items = [
        "<b>Elimination of Broad Storage Permissions:</b> Removed broad legacy permissions (<code>READ_MEDIA_IMAGES</code>, <code>READ_MEDIA_VIDEO</code>, <code>READ_EXTERNAL_STORAGE</code>) and explicitly set them in <code>blockedPermissions</code> in <code>app.json</code>.",
        "<b>Android Photo Picker Integration:</b> Implemented native non-intrusive Android Photo Picker (<code>expo-image-picker</code> without media library permission grants), respecting user privacy.",
        "<b>Removal of Audio Permissions:</b> Fully removed <code>RECORD_AUDIO</code> and <code>MODIFY_AUDIO_SETTINGS</code>, preventing microphone policy violations.",
        "<b>Live Compliant Privacy Policy:</b> Authored and published a comprehensive privacy disclosure meeting Google Play criteria, hosted at <code>https://telegra.ph/Privacy-Policy---Qrinova-10-21</code> and backed up on Supabase.",
        "<b>AAB Versioning & EAS Cloud Build:</b> Configured <code>eas.json</code> with local version codes (VersionCode 6/7) and production bundle generation (<code>.aab</code>) for seamless Play Store rollout."
    ]
    for comp in compliance_items:
        story.append(Paragraph(f"✓ {comp}", bullet_style))
    story.append(Spacer(1, 10))

    # SECTION 6: FUTURE SCOPE & ENHANCEMENTS
    story.append(Paragraph("6. Future Scope & Roadmap", h1_style))
    future_items = [
        "<b>Batch Barcode Scanner (Inventory Mode):</b> Rapid multi-code continuous scanning for retail stocktaking with CSV/Excel export.",
        "<b>Google Safe Browsing & VirusTotal API Integration:</b> Real-time threat feeds enhancing the built-in heuristic threat analyzer.",
        "<b>Encrypted Cloud Backup & Sync:</b> End-to-end encrypted user account history sync across multiple Android & iOS devices.",
        "<b>Dynamic QR Codes:</b> Editable destination URLs and click-through analytics dashboard for generated business QR codes."
    ]
    for fut in future_items:
        story.append(Paragraph(f"• {fut}", bullet_style))
    story.append(Spacer(1, 14))

    # Footer Signoff Box
    signoff = [
        [Paragraph("<b>Status:</b> Approved & Published on Google Play Store | <b>Documentation Date:</b> November 2026", table_cell_bold)]
    ]
    signoff_table = Table(signoff, colWidths=[504])
    signoff_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#f0fdf4")),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor("#86efac")),
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('PADDING', (0,0), (-1,-1), 7),
    ]))
    story.append(signoff_table)

    # Build Document
    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"Successfully generated PDF at: {pdf_path}")

if __name__ == '__main__':
    create_project_pdf()
