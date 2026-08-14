# SentinelAI WAF — AI-Powered Self-Learning Web Application Firewall Documentation

Comprehensive technical documentation of the **SentinelAI AI-Powered Self-Learning Web Application Firewall (WAF)** project architecture, operations performed, complete working API routes list, dual-theme design system, 3-tier hybrid detection pipeline, and self-learning AI mechanics.

---

## 📋 Table of Contents
1. [Executive Summary](#-executive-summary)
2. [System Architecture & Micro-Packages](#-system-architecture--micro-packages)
3. [Operations Performed During Development](#-operations-performed-during-development)
4. [Complete Working API Routes Table](#-complete-working-api-routes-table)
5. [3-Tier Hybrid Threat Classification Engine](#-3-tier-hybrid-threat-classification-engine)
6. [Self-Learning AI Feedback Loop & Retraining](#-self-learning-ai-feedback-loop--retraining)
7. [Dual Light + Dark Theme System](#-dual-light--dark-theme-system)
8. [Step-by-Step Execution Guide](#-step-by-step-execution-guide)
9. [Environment Variable Reference](#-environment-variable-reference)

---

## 📋 Executive Summary

SentinelAI WAF is an enterprise-grade Security Operations Center (SOC) dashboard and reverse proxy security engine. It sits in front of protected web applications (`:4001` -> `:3000`), inspects HTTP traffic in real time, classifies security exploits using a **3-tier Hybrid Detection Pipeline (Rules → ML → Smart LLM Fallback)**, enforces real-time policy blocking (`HTTP 403`), logs telemetry to MongoDB Atlas, streams WebSocket events via Socket.IO, provides a dual **Light + Dark theme system**, and implements an AI self-learning feedback loop that continuously trains its neural classifier on novel attack vectors.

---

## 🏗️ System Architecture & Micro-Packages

The project is structured into 4 decoupled, dedicated micro-packages:

```
facerecognition-main/
├── README.md                   # Technical Summary & Quick Start
├── documentation.md            # Primary Comprehensive Documentation
├── doc.md                      # Complete Technical Reference (Root)
│
├── frontend/                   # React 19 + TypeScript + Vite + Tailwind CSS Dashboard (:5173)
│   ├── src/
│   │   ├── components/         # Navbar (with Theme Toggle), Sidebar, ModeConfirmationModal
│   │   ├── context/            # WafContext (Socket.IO + REST) & ThemeContext (Light/Dark Mode)
│   │   ├── pages/              # Overview, Live Traffic, Attacks, Rules, Settings
│   │   ├── types/              # TypeScript interfaces (LiveRequest, WafRule, etc.)
│   │   ├── App.tsx             # Main Dashboard Router
│   │   ├── index.css           # Tailwind CSS directives & Google Fonts
│   │   └── main.tsx            # React Root Renderer
│   ├── index.html              # HTML Shell
│   ├── vite.config.ts          # Vite Bundler Config
│   └── tailwind.config.js      # Tailwind Custom SOC Color System & Dark Mode Class Strategy
│
├── backend/                    # Node.js + Express + TypeScript Core Backend (:4001)
│   ├── src/
│   │   ├── models/             # Mongoose Models (Request, Rule, Settings, AttackStat, TrainingSample, ModelVersion)
│   │   ├── middleware/         # WAF Proxy Inspection Pipeline & http-proxy-middleware
│   │   ├── services/           # Feature Extractor, ML Client, LLM Classifier, Self-Learning Engine, Socket.IO
│   │   ├── routes/             # Admin REST API (/api/admin/*)
│   │   └── server.ts           # Express + HTTP + Socket.IO Server Entrypoint & MongoDB Atlas Connect
│   ├── .env                    # Environment Configuration (Mongo URI, Gemini API Key, Thresholds)
│   ├── tsconfig.json           # ESM NodeNext TypeScript Compiler Config
│   └── package.json            # Backend Dependencies (express, mongoose, socket.io, zod, http-proxy-middleware)
│
├── test-app/                   # Protected Origin Target Web Application (:3000)
│   ├── server.js               # Express target server with vulnerable endpoints
│   └── package.json            # Target App Dependencies
│
└── ml-service/                 # Python FastAPI ML Threat Classifier (:8000)
    └── app.py                  # FastAPI server (/predict, /retrain, /health)
```

---

## 🛠️ Operations Performed During Development

1. **MongoDB Atlas & Server Connectivity**:
   - Replaced MongoMemoryServer fallback with production Mongoose connection (`MONGODB_URI`).
   - Implemented explicit IPv4 DNS SRV resolution (`family: 4`, `dns.setServers(['8.8.8.8', '1.1.1.1'])`) resolving Windows DNS SRV lookup bugs.
   - Configured backend port to `4001`.

2. **Dual Light + Dark Theme System**:
   - Built `ThemeContext.tsx` (`ThemeProvider` + `useTheme` hook) managing theme state and persisting under `'theme'` key in `localStorage` (defaulting to `'dark'`).
   - Added interactive `Sun` / `Moon` toggle button in top-right navbar.
   - Implemented production Light Theme styling (`#F1F5F9` background, `#FFFFFF` cards, `#E2E8F0` borders, `#0F172A` text).

3. **3-Tier Hybrid Detection Pipeline**:
   - **Fast Path (Rules)**: Fast regex signatures (`SQLI_REGEX`, `XSS_REGEX`, `PATH_TRAVERSAL_REGEX`) and active MongoDB rules (`source: "rules"`, `confidence: 0.99`).
   - **ML Path**: Python FastAPI microservice inference engine.
   - **Smart Path (LLM Fallback)**: Deep analysis via Google Gemini 1.5 Flash (`GEMINI_API_KEY`) and Smart Heuristic Engine for novel attack vectors (`SSTI`, `NoSQL Injection`, `Command Injection`, `XXE`, `CRLF`, `LDAP Injection`).
   - In-memory SHA-256 payload cache (30-min TTL) and 20 calls/min rate limiter guard.

4. **Self-Learning Feedback Loop & Retraining**:
   - Added `WafTrainingSample` collection storing labeled LLM classifications (`confidence >= 0.70`).
   - Added `WafModelVersion` collection storing historical retraining records.
   - Decoupled background retraining trigger: automatically kicks off ML model fine-tuning when 50 new samples accumulate (`RETRAIN_SAMPLE_THRESHOLD=50`).
   - Added **Self-Learning Progress Panel** on Overview dashboard displaying the downward LLM Fallback Rate trend graph.

---

## 📡 Complete Working API Routes Table

### Admin REST API Endpoints (Port 4001)

All `/api/admin/*` endpoints require a JWT Bearer token obtained via `/api/admin/auth/login`.

| Method | Endpoint Route | Auth Required | Description | Status |
| --- | --- | --- | --- | --- |
| `POST` | `/api/admin/auth/login` | Public | Authenticates admin (`admin`/`admin`) and returns signed 24h JWT token. | **Working** |
| `GET` | `/api/admin/stats/overview` | Bearer JWT | Returns Requests Today, Attacks Blocked, Active/Pending Rules, FP Rate, Daily Trend, Attack Breakdown, and Top Attackers. | **Working** |
| `GET` | `/api/admin/stats/self-learning` | Bearer JWT | Returns unused training sample count, total samples, LLM fallback rate, and model version history. | **Working** |
| `GET` | `/api/admin/traffic` | Bearer JWT | Returns paginated & filterable list of evaluated HTTP requests. | **Working** |
| `GET` | `/api/admin/attacks` | Bearer JWT | Returns timeline log of confirmed blocked attacks grouped by date. | **Working** |
| `GET` | `/api/admin/rules` | Bearer JWT | Returns list of all active rules and AI-suggested pending rules. | **Working** |
| `POST` | `/api/admin/rules` | Bearer JWT | Creates and deploys a new custom WAF rule (Regex, Rate-Limit, IP Block, Entropy). | **Working** |
| `PATCH` | `/api/admin/rules/:id` | Bearer JWT | Toggles rule `enabled` state or approves/rejects pending AI rules (`action: 'approve' \| 'reject'`). | **Working** |
| `DELETE` | `/api/admin/rules/:id` | Bearer JWT | Permanently deletes a rule from the MongoDB database. | **Working** |
| `POST` | `/api/admin/mode` | Bearer JWT | Switches WAF protection mode (`Monitoring` vs `Active Blocking`). | **Working** |
| `POST` | `/api/admin/requests/:id/feedback` | Bearer JWT | Submits operator ground-truth feedback (`false_positive` or `confirmed_attack`). | **Working** |
| `GET` | `/api/admin/model/info` | Bearer JWT | Returns active model metrics (version, accuracy, precision, recall, f1Score). | **Working** |
| `POST` | `/api/admin/model/retrain` | Bearer JWT | Triggers ML model retraining using collected feedback samples. | **Working** |
| `GET` | `/api/admin/api-keys` | Bearer JWT | Lists all proxy node API credentials. | **Working** |
| `POST` | `/api/admin/api-keys` | Bearer JWT | Generates a new proxy API secret key. | **Working** |
| `PATCH` | `/api/admin/api-keys/:id/revoke` | Bearer JWT | Revokes a proxy API key. | **Working** |

---

## 🔬 3-Tier Hybrid Threat Classification Engine

Every request hitting the reverse proxy follows a 3-tier evaluation flow:

1. **Tier 1 (Fast Path — Rules Check)**:
   - Evaluates path and payload against fast local regex blocklists (`SQLI_REGEX`, `XSS_REGEX`, `PATH_TRAVERSAL_REGEX`) and active MongoDB `Rule` documents.
   - If matched, returns immediately (`source: "rules"`, `confidence: 0.99`).

2. **Tier 2 (ML Path — Transformer Inference)**:
   - Calculates **Shannon Entropy** rate (bits per character) of the payload.
   - Scores special character density, SQLi keyword count, and XSS token count.
   - Calls Python FastAPI `POST /predict`. If confidence ≥ `ML_CONFIDENCE_THRESHOLD` (0.75), returns ML classification (`source: "ml"`).

3. **Tier 3 (Smart Path — LLM Fallback & Heuristic Classifier)**:
   - Triggered when ML confidence is `< 0.75` or attack type is `Unknown / Zero-day`.
   - Sends payload to Google Gemini 1.5 Flash (`classifyWithLLM`) or runs the Smart Pattern Classifier for deep multi-class identification (`Command Injection`, `SSTI`, `NoSQL Injection`, `XXE`, `CRLF`, `LDAP Injection`).
   - If confidence ≥ 0.70, asynchronously saves a labeled training sample into `WafTrainingSample` collection.

---

## ⚡ Self-Learning AI Feedback Loop Mechanics

```
┌─────────────────┐       ┌─────────────────┐       ┌──────────────────┐
│  HTTP Attacker  │ ────> │ Node.js WAF     │ ────> │  Google Gemini   │
│  Novel Vector   │       │ Reverse Proxy   │       │  Flash LLM API   │
└─────────────────┘       └────────┬────────┘       └────────┬─────────┘
                                   │                         │ (Classifies SSTI/NoSQL)
                                   │                         v
                                   │               ┌──────────────────┐
                                   │               │ Save Labeled     │
                                   │               │ TrainingSample   │
                                   │               └────────┬─────────┘
                                   │ (Check Count >= 50)    │
                                   v                        v
                          ┌──────────────────────────────────────────┐
                          │ Background Worker Triggers ML Retraining │
                          └────────────────┬─────────────────────────┘
                                           │
                                           v
                          ┌──────────────────────────────────────────┐
                          │   ML Model Version Updated + LLM         │
                          │   Fallback Rate Trends Downward          │
                          └──────────────────────────────────────────┘
```

1. **Feedback Capture**: Successful LLM classifications (`confidence >= 0.70`) are stored in `WafTrainingSample` collection with `used_for_training: false`.
2. **Threshold Trigger**: Background engine checks count of unused training samples. When count reaches `RETRAIN_SAMPLE_THRESHOLD` (50 samples), it triggers model fine-tuning (`POST /retrain`).
3. **Model Versioning**: After retraining, samples are marked `used_for_training: true` and a new `WafModelVersion` document is logged.
4. **Self-Learning Visual Proof**: LLM Fallback Rate trends downward over time as the ML model absorbs novel attack classes.

---

## 🚀 Step-by-Step Execution Guide

### 1. Start Vulnerable Target Origin Application
```bash
cd test-app
npm start
# Runs on http://localhost:3000
```

### 2. Start Python ML Microservice
```bash
cd ml-service
python app.py
# Runs on http://localhost:8000
```

### 3. Start WAF Core Backend Proxy Server
```bash
cd backend
npm run dev
# Runs on http://localhost:4001
```

### 4. Start React SOC Admin Dashboard
```bash
cd frontend
npm run dev
# Runs on http://localhost:5173
```

---

## ⚙️ Environment Variable Reference

Located in `backend/.env`:

```env
PORT=4001
MONGODB_URI="mongodb+srv://<username>:<password>@cluster0.mongodb.net/sentinel_waf?retryWrites=true&w=majority"
JWT_SECRET=sentinel_waf_super_secret_jwt_key_2026
PYTHON_ML_URL=http://127.0.0.1:8000
TARGET_ORIGIN_URL=http://127.0.0.1:3000
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX=120
GEMINI_API_KEY=YOUR_GEMINI_API_KEY
ML_CONFIDENCE_THRESHOLD=0.75
RETRAIN_SAMPLE_THRESHOLD=50
```
