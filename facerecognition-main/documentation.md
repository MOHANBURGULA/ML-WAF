# SentinelAI WAF — AI-Powered Self-Learning Web Application Firewall

A state-of-the-art, enterprise-grade Security Operations Center (SOC) dashboard and reverse proxy security engine. **SentinelAI WAF** inspects HTTP traffic in real time, classifies security exploits using a **3-tier Hybrid Detection Pipeline (Rules → ML → Smart LLM Fallback)**, enforces policy blocking (`HTTP 403`), streams live telemetry over WebSockets, automatically generates self-learned firewall rules, and continuously trains its neural classifier on novel attack vectors.

---

## 🌟 Key Features of the Project

### 🛡️ 1. Real-Time Reverse Proxy Inspection Pipeline
- **Edge Security Shield**: Operates as a reverse proxy between external client traffic and downstream application servers (`:4001` -> `:3000`).
- **Zero-Latency Target Proxying**: Uses `http-proxy-middleware` to forward clean, benign HTTP traffic seamlessly to the origin server.
- **Fast Per-IP Rate Limiting**: Employs `express-rate-limit` to drop volumetric HTTP POST/GET floods before feature extraction (`RATE_LIMIT_MAX` requests per minute).

### 🤖 2. 3-Tier Hybrid Threat Detection Engine
- **Tier 1 (Fast Path — Rules Check)**: Instant regex evaluation for known signatures (`SQLI_REGEX`, `XSS_REGEX`, `PATH_TRAVERSAL_REGEX`) and active MongoDB security rules (`source: "rules"`, `confidence: 0.99`).
- **Tier 2 (ML Path — Transformer Inference)**: Offloads threat classification to a Python FastAPI ML microservice (`POST /predict`), scoring feature vectors (Shannon Entropy, special character density, SQLi/XSS keywords).
- **Tier 3 (Smart Path — LLM Fallback & Heuristic Classifier)**: Automatically routes novel/unclassified attack vectors (`confidence < ML_CONFIDENCE_THRESHOLD`) to Google Gemini 1.5 Flash (`GEMINI_API_KEY`) or an embedded Smart Pattern Classifier for deep analysis.
- **Dynamic Multi-Class Categorization**: Dynamically detects and labels **SQL Injection, XSS, Path Traversal, Command Injection, SSTI, NoSQL Injection, XXE, CRLF, LDAP Injection, and Header Injection**.
- **Cost Guard & Cache**: Protects API budget with an in-memory SHA-256 payload cache (30-min TTL) and a 20 calls/min rate limiter guard.

### 🔄 3. Continuous Self-Learning & Automated Retraining Loop
- **Feedback Training Samples**: Automatically saves high-confidence LLM classifications (`confidence >= 0.70`) as labeled records in the `WafTrainingSample` collection.
- **Background Retraining Trigger**: When unused samples reach threshold (`RETRAIN_SAMPLE_THRESHOLD=50`), a background worker automatically triggers Python model retraining (`POST /retrain`), marks samples as `used_for_training: true`, and logs a new `WafModelVersion` record.
- **Self-Learning Proof Panel**: Real-time dashboard panel tracking **LLM Fallback Rate Over Time**, proving that LLM dependency decreases as the ML model absorbs novel attack classes over time.

### 🎨 4. Production Dual Light + Dark Theme System
- **ThemeProvider & `useTheme()`**: Clean React Context managing theme state and applying the `dark` class to `document.documentElement`.
- **Top Navbar Switcher**: Interactive `Sun` / `Moon` toggle button in top-right navbar.
- **`localStorage` Persistence**: Remembers user theme preference under `'theme'` key (default `'dark'`).
- **Enterprise Light Theme**: Clean `#F1F5F9` slate background, `#FFFFFF` cards, `#E2E8F0` borders, `#0F172A` primary text, hover row effects, and sharp badge contrast.

### 📊 5. Real-Time SOC Operations Dashboard
- **Live WebSocket Feed**: Broadcasts streaming HTTP evaluations over Socket.IO to connected React dashboard clients.
- **Overview & Analytics**: Interactive charts for **Traffic Over Time** (Area Chart), **Attack Types Breakdown** (Dynamic Donut Chart with string-hash colors), **LLM Fallback Rate Trend** (Area Chart), and **Top Attacking IP Telemetry** (Table & World Map).
- **Request Inspector Side Drawer**: Inspects raw HTTP headers, payload snippets, ML feature vector decompositions, and classification provenance (`source` & `reason`).
- **Ground-Truth Feedback**: SOC operators mark live requests as *False Positive* or *Confirmed Attack* to fine-tune the model.

### 🔑 6. MongoDB Atlas & Proxy Credentials
- **MongoDB Atlas Integration**: Native Mongoose connection (`MONGODB_URI`) with IPv4 DNS SRV fallback resolution (`dns.setServers(['8.8.8.8', '1.1.1.1'])`).
- **Proxy Node API Keys**: Manage Cloudflare Workers, NGINX Ingress, and Envoy edge gateway authentication keys (`GET/POST/PATCH /api/admin/api-keys`).

---

## ⚙️ Actions SentinelAI WAF Can Perform

| Category | Action | Description |
| --- | --- | --- |
| **Traffic Inspection** | **Inspect HTTP Requests** | Evaluates incoming `GET`, `POST`, `PUT`, `DELETE` requests for anomalies, entropy rate, and malicious tokens. |
| **Traffic Forwarding** | **Forward Benign Traffic** | Routes clean requests untouched to the protected downstream application (`http://localhost:3000`). |
| **Threat Blocking** | **Block Malicious Exploits** | Serves custom styled **HTTP 403 Forbidden** incident pages (`INC-XXXX`) when attacks exceed confidence thresholds in `Active Blocking` mode. |
| **Hybrid Classification** | **Run 3-Tier Pipeline** | Evaluates requests via Fast Rules → ML Transformer → Smart Gemini LLM Fallback. |
| **Novel Attack Detection**| **Classify Dynamic Vectors** | Detects and categorizes Command Injection, SSTI, NoSQL, XXE, CRLF, LDAP, and Zero-day attacks. |
| **Rate Limiting** | **Throttle Volumetric Floods** | Rate-limits excessive request spikes per IP address (`RATE_LIMIT_MAX` requests per minute). |
| **Live Telemetry** | **Broadcast WebSockets** | Pushes real-time `new_request`, `new_pending_rule`, and `mode_changed` events over Socket.IO. |
| **Feedback Loop** | **Store Training Samples** | Saves successful LLM classifications into `WafTrainingSample` collection for ML retraining. |
| **Auto-Retraining** | **Background Model Tuning** | Automatically triggers model retraining (`POST /retrain`) when 50 new samples accumulate. |
| **Self-Learning Rules** | **Auto-Suggest Rules** | Detects high-velocity attack vectors and generates `pending-review` rules for SOC operator approval. |
| **Rule Management** | **Approve / Reject Rules** | Promotes AI-suggested rules to active status or dismisses false suggestions. |
| **Rule Customization** | **Add Custom WAF Rules** | Admin can deploy custom Regex, Rate-limit, IP-block, or Entropy threshold rules. |
| **Theme Controls** | **Toggle Light / Dark Mode** | Switches instantly between Dark (`#020617`) and Light (`#F1F5F9`) themes with `localStorage` persistence. |
| **Credentials** | **Manage Proxy API Keys** | Generates and revokes proxy authentication secret keys for Cloudflare Workers / NGINX gateways. |

---

## 🏗️ System Architecture & Technology Stack

```
                               ┌──────────────────────────────────────────────┐
                               │            React 19 SOC Dashboard            │
                               │          (Frontend Port :5173)               │
                               └──────────────────────┬───────────────────────┘
                                                      │ REST API & WebSockets
                                                      v
┌─────────────────┐       ┌───────────────────────────────────────────────────┐       ┌─────────────────┐
│  HTTP Client /  │ ────> │       SentinelAI Express Backend Proxy Core       │ ────> │  Target App     │
│  Attacker       │       │                (Port :4001)                       │       │  (Port :3000)   │
└─────────────────┘       └─────────┬──────────────────────────────┬──────────┘       └─────────────────┘
                                    │                              │
                    ┌───────────────┴──────────────┐               │ Database Persist
                    │                              │               v
                    v                              v     ┌──────────────────┐
          ┌──────────────────┐           ┌──────────────┐│ MongoDB Atlas /  │
          │ Python FastAPI   │           │ Google Gemini││ Mongoose DB      │
          │ ML Microservice  │           │ Flash LLM API│└──────────────────┘
          │ (Port :8000)     │           └──────────────┘
          └──────────────────┘
```

### Technology Stack Summary
- **Frontend (`/frontend`)**: React 19, TypeScript, Vite, Tailwind CSS, Recharts, Lucide Icons, Socket.IO Client, ThemeContext.
- **Backend (`/backend`)**: Node.js, Express, TypeScript ESM, Mongoose, Socket.IO, Zod, `http-proxy-middleware`, `express-rate-limit`, `llmClassifier`.
- **ML Microservice (`/ml-service`)**: Python 3, FastAPI, Uvicorn, Pydantic, Scikit-Learn heuristics.
- **Target Application (`/test-app`)**: Node.js, Express (Vulnerable target app for live attack testing).

---

## 📡 REST API Routes & WebSocket Reference

### Admin REST API Endpoints (Port 4001)

All `/api/admin/*` endpoints require a JWT Bearer token obtained via `/api/admin/auth/login`.

| Method | Endpoint Route | Auth Required | Description |
| --- | --- | --- | --- |
| `POST` | `/api/admin/auth/login` | Public | Authenticates admin (`admin`/`admin`) and returns signed 24h JWT token. |
| `GET` | `/api/admin/stats/overview` | Bearer JWT | Returns Requests Today, Attacks Blocked, Active/Pending Rules, FP Rate, Daily Trend, Attack Breakdown, and Top Attackers. |
| `GET` | `/api/admin/stats/self-learning` | Bearer JWT | Returns unused training sample count, total samples, LLM fallback rate, and model version history. |
| `GET` | `/api/admin/traffic` | Bearer JWT | Returns paginated & filterable list of evaluated HTTP requests. |
| `GET` | `/api/admin/attacks` | Bearer JWT | Returns timeline log of confirmed blocked attacks grouped by date. |
| `GET` | `/api/admin/rules` | Bearer JWT | Returns list of all active rules and AI-suggested pending rules. |
| `POST` | `/api/admin/rules` | Bearer JWT | Creates and deploys a new custom WAF rule (Regex, Rate-Limit, IP Block, Entropy). |
| `PATCH` | `/api/admin/rules/:id` | Bearer JWT | Toggles rule `enabled` state or approves/rejects pending AI rules (`action: 'approve' \| 'reject'`). |
| `DELETE` | `/api/admin/rules/:id` | Bearer JWT | Permanently deletes a rule from the MongoDB database. |
| `POST` | `/api/admin/mode` | Bearer JWT | Switches WAF protection mode (`Monitoring` vs `Active Blocking`). |
| `POST` | `/api/admin/requests/:id/feedback` | Bearer JWT | Submits operator ground-truth feedback (`false_positive` or `confirmed_attack`). |
| `GET` | `/api/admin/model/info` | Bearer JWT | Returns active model metrics (version, accuracy, precision, recall, f1Score). |
| `POST` | `/api/admin/model/retrain` | Bearer JWT | Triggers ML model retraining using collected feedback samples. |
| `GET` | `/api/admin/api-keys` | Bearer JWT | Lists all proxy node API credentials. |
| `POST` | `/api/admin/api-keys` | Bearer JWT | Generates a new proxy API secret key. |
| `PATCH` | `/api/admin/api-keys/:id/revoke` | Bearer JWT | Revokes a proxy API key. |

### Real-Time Socket.IO WebSocket Events

- `new_request`: Broadcasts freshly evaluated HTTP requests with client IP, country, method, URI, confidence score, verdict, classification `source` (`rules`/`ml`/`llm`), `reason`, and feature breakdown.
- `new_pending_rule`: Emitted when the self-learning AI engine auto-generates a candidate rule recommendation.
- `mode_changed`: Emitted when protection mode is toggled between `Monitoring` and `Active Blocking`.

---

## ⚙️ Environment Variables Reference

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

---

## 🚀 How to Run the Project

### 1. Start Target Application (Port 3000)
```bash
cd test-app
npm start
```

### 2. Start Python ML Microservice (Port 8000)
```bash
cd ml-service
python app.py
```

### 3. Start WAF Core Backend Proxy (Port 4001)
```bash
cd backend
npm run dev
```

### 4. Start React SOC Dashboard (Port 5173)
```bash
cd frontend
npm run dev
```

---

## 🧪 Testing Multi-Vector Attack Interception

Send requests through the WAF Reverse Proxy on port 4001:

```bash
# 1. Benign Request (HTTP 200 Allowed)
curl http://localhost:4001/

# 2. SQL Injection Attack (HTTP 403 Blocked — Fast Rules/ML)
curl "http://localhost:4001/api/users?q=UNION+SELECT+1,2,3"

# 3. Cross-Site Scripting (XSS) Attack (HTTP 403 Blocked — Fast Rules/ML)
curl "http://localhost:4001/comments?payload=<script>alert(1)</script>"

# 4. Path Traversal Attack (HTTP 403 Blocked — Fast Rules/ML)
curl "http://localhost:4001/file?path=../../../../etc/passwd"

# 5. Server-Side Template Injection (SSTI) Attack (HTTP 403 Blocked — LLM Fallback)
curl "http://localhost:4001/login?username=%7B%7B7*7%7D%7D&password=122"

# 6. Command Injection Attack (HTTP 403 Blocked — LLM Fallback)
curl "http://localhost:4001/file?cmd=cat+/etc/passwd;id"

# 7. NoSQL Injection Attack (HTTP 403 Blocked — LLM Fallback)
curl "http://localhost:4001/login?username%5B%24ne%5D=admin&password%5B%24ne%5D=122"
```
