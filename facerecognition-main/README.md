# SentinelAI WAF — AI-Powered Self-Learning Web Application Firewall

**SentinelAI WAF** is an enterprise-grade Security Operations Center (SOC) dashboard and reverse proxy security engine. It inspects incoming HTTP traffic in real time, classifies security exploits using a **3-Tier Hybrid Detection Pipeline (Rules → ML → Smart LLM Fallback)**, enforces real-time policy blocking (`HTTP 403`), logs telemetry to MongoDB Atlas, streams live WebSocket events via Socket.IO, provides a dual **Light + Dark theme system**, and implements an AI self-learning feedback loop that continuously trains its neural classifier on novel attack vectors.

> [!NOTE]
> For the complete technical documentation, architecture details, and full API endpoint reference, see [documentation.md](file:///c:/Users/vamsh/Desktop/Updated/facerecognition-main/documentation.md).

---

## 🌟 Key Features

1. **Reverse Proxy Inspection Pipeline**: Inspects incoming HTTP traffic before reaching downstream origin applications (`:4001` -> `:3000`).
2. **3-Tier Hybrid Threat Classifier**: Combines Fast Local Rules, Python ML Transformer inference, and Google Gemini 1.5 Flash LLM Fallback for deep anomaly classification.
3. **Novel Attack Vector Detection**: Dynamically detects and labels SQLi, XSS, Path Traversal, Command Injection, SSTI, NoSQL Injection, XXE, CRLF, and LDAP Injection.
4. **Self-Learning Feedback & Retraining Loop**: Automatically saves high-confidence LLM classifications into `WafTrainingSample` collection and triggers background model retraining when 50 new samples accumulate.
5. **Production Dual Light + Dark Theme System**: Built-in `ThemeProvider` with top-right navbar toggle button (`Sun` / `Moon`) and `localStorage` persistence.
6. **Real-Time SOC Dashboard**: React 19 + TypeScript + Vite + Tailwind CSS + Recharts dashboard with real-time Socket.IO WebSocket stream.
7. **MongoDB Atlas Integration**: Mongoose Atlas database connection with automatic IPv4 DNS SRV fallback resolution.

---

## 🚀 How to Run

```bash
# 1. Start Target Application (Port 3000)
cd test-app
npm start

# 2. Start Python ML Microservice (Port 8000)
cd ml-service
python app.py

# 3. Start WAF Core Backend Proxy (Port 4001)
cd backend
npm run dev

# 4. Start React SOC Dashboard (Port 5173)
cd frontend
npm run dev
```

---

## 🧪 Quick Test Commands

```bash
# Benign Request (Allowed 200)
curl http://localhost:4001/

# SQL Injection Attack (Blocked 403 — Fast Rules / ML)
curl "http://localhost:4001/api/users?q=UNION+SELECT+1,2,3"

# Cross-Site Scripting (XSS) Attack (Blocked 403 — Fast Rules / ML)
curl "http://localhost:4001/comments?payload=<script>alert(1)</script>"

# Path Traversal Attack (Blocked 403 — Fast Rules / ML)
curl "http://localhost:4001/file?path=../../../../etc/passwd"

# Server-Side Template Injection (SSTI) Attack (Blocked 403 — LLM Fallback)
curl "http://localhost:4001/login?username=%7B%7B7*7%7D%7D&password=122"

# Command Injection Attack (Blocked 403 — LLM Fallback)
curl "http://localhost:4001/file?cmd=cat+/etc/passwd;id"

# NoSQL Injection Attack (Blocked 403 — LLM Fallback)
curl "http://localhost:4001/login?username%5B%24ne%5D=admin&password%5B%24ne%5D=122"
```

For full system architecture, API route details, and configuration variables, read [documentation.md](file:///c:/Users/vamsh/Desktop/Updated/facerecognition-main/documentation.md).
