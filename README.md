# CareImpact: Medicare Star Ratings & Clinical Gap-Closure Simulator

> **A Clinical Quality Intelligence & Star Ratings Optimization Platform** for Medicare Advantage (MA) Health Plans, featuring real-time NCQA HEDIS measure evaluation, dynamic CMS cutpoint prioritization, a spring-animated Quantum Star Simulator, and a Groq-powered AI Clinical Copilot.

---

## 📋 Table of Contents
1. [Quick Start & Installation Guide](#-quick-start--installation-guide)
2. [Full Technology Stack](#-full-technology-stack)
3. [System Architecture](#-system-architecture)
4. [Data Model & Schemas](#-data-model--schemas)
5. [Clinical Quality Logic & NCQA HEDIS Engine](#-clinical-quality-logic--ncqa-hedis-engine)
6. [Dynamic Priority & Outreach Ranking Model](#-dynamic-priority--outreach-ranking-model)
7. [Star Rating Simulation & ROI Engine](#-star-rating-simulation--roi-engine)
8. [AI Clinical Assistant (Groq Llama-3.3 70B)](#-ai-clinical-assistant-groq-llama-33-70b)
9. [Backend REST API Specification](#-backend-rest-api-specification)
10. [Frontend Application Pages & Features](#-frontend-application-pages--features)
11. [Cloud Deployment Guide (Render & Vercel)](#-cloud-deployment-guide-render--vercel)

---

## 🚀 Quick Start & Installation Guide

Follow these steps to run the complete project locally on your machine.

### Prerequisites
- **Python**: `3.10`, `3.11`, or `3.12`
- **Node.js**: `18.x` or higher and `npm`
- **Git**: Installed and configured

---

### Step 1: Clone the Repository
```bash
git clone https://github.com/rpnish/CareImpact.git
cd CareImpact
```

---

### Step 2: Set Up & Start the Backend

1. Navigate to the `backend` directory:
   ```bash
   cd backend
   ```
2. Create and activate a Python virtual environment:
   ```bash
   # macOS / Linux
   python3 -m venv venv
   source venv/bin/activate

   # Windows (PowerShell)
   python -m venv venv
   .\venv\Scripts\Activate.ps1
   ```
3. Install backend dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Verify or create your `backend/.env` file:
   ```env
   DATABASE_URL=postgresql://your_user:your_password@your_neon_host.neon.tech/neondb?sslmode=require
   MONGODB_URI=mongodb+srv://your_user:your_password@cluster0.mongodb.net/?appName=Cluster0
   DB_NAME=medicare_star_ratings
   DATA_CSV_PATH=../data/data.csv
   GROQ_API_KEY=your_groq_api_key_here
   ```
5. Run automated test suites:
   ```bash
   PYTHONPATH=. pytest tests -v
   ```
6. Start the FastAPI development server:
   ```bash
   uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
   ```
   - **Backend API**: `http://127.0.0.1:8000`
   - **Interactive OpenAPI / Swagger UI**: `http://127.0.0.1:8000/docs`

---

### Step 3: Set Up & Start the Frontend

1. Open a new terminal and navigate to `frontend`:
   ```bash
   cd frontend
   ```
2. Install npm packages:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
4. Open your browser and navigate to:
   - **Web App**: `http://localhost:5173`

---

## 🛠️ Full Technology Stack

### Frontend Architecture
| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Framework** | **React 19 (SPA)** | Ultra-fast single-page application built on Vite |
| **Build Tool** | **Vite 8.2** | Sub-second hot module reloading (HMR) and optimized rollup production bundling |
| **Styling** | **Tailwind CSS v4 + Vanilla CSS** | Custom Deep Space Obsidian design system (`#060814`, `#0B0F24`), Electric AI Violet (`#8B5CF6`), and Cyber Cyan tokens |
| **Animations** | **Framer Motion** | Physics-based orbital dials, step animations, and layout transition springs |
| **Data Visualization**| **Recharts** | Interactive SVG charts (Donut status distribution, Area star trend, Bar gap volumes, Before-vs-After comparison) |
| **Geographic Mapping**| **Leaflet & React-Leaflet** | CartoDB Dark Matter tile layer plotting Massachusetts patient coordinates and city gap density |
| **Icons** | **Lucide React** | Clinical, operational, and AI-themed SVG iconography |
| **HTTP Client** | **Custom Fetch Client (`client.js`)** | Environment-aware auto-resolver detecting local (`127.0.0.1:8000`) vs. hosted (`careimpact.onrender.com`) |

---

### Backend Architecture
| Component | Technology | Purpose |
| :--- | :--- | :--- |
| **API Framework** | **FastAPI (Python 3.12)** | Asynchronous, type-safe RESTful API with automated OpenAPI / Swagger documentation |
| **ASGI Server** | **Uvicorn** | High-concurrency asynchronous server with multi-worker support |
| **Data Validation** | **Pydantic v2** | Strict input/output clinical models and schema coercion |
| **Primary Relational DB** | **Neon PostgreSQL (AsyncPG)** | Hosted serverless PostgreSQL 18.4 storing members, conditions, HEDIS readings, and binary PDF/image storage |
| **Document Store** | **MongoDB Atlas (Motor)** | Cloud document store for hospital proof documents, audit logs, and file metadata |
| **LLM Inference** | **Groq Cloud API (`httpx`)** | LPU inference running `llama-3.3-70b-versatile` with <1.3s response latency |
| **Test Framework** | **Pytest & Pytest-Asyncio** | End-to-end integration and clinical gap engine unit tests |

---

## 🏛️ System Architecture

```
                                  ┌────────────────────────────────────────────────────────────┐
                                  │                     React 19 Frontend                      │
                                  │   Dashboard  ·  Members  ·  Simulator  ·  AI Assistant     │
                                  └─────────────────────────────┬──────────────────────────────┘
                                                                │
                                                    HTTP / HTTPS REST Calls
                                                                │
                                                                ▼
                                  ┌────────────────────────────────────────────────────────────┐
                                  │                  FastAPI Backend Server                    │
                                  │  • gap_engine.py      (NCQA HEDIS Measure Evaluator)       │
                                  │  • priority_engine.py (Dynamic CMS Part C Ranking)         │
                                  │  • ingestion.py       (Automatic CSV Sync & Normalization) │
                                  └───────────────┬─────────────────────────────┬──────────────┘
                                                  │                             │
                                                  ▼                             ▼
        ┌──────────────────────────────────────────────────┐      ┌───────────────────────────────┐
        │            Neon PostgreSQL (Primary DB)          │      │      Groq Cloud (AI LPU)      │
        │                                                  │      │                               │
        │  • Members Table (Demographics, Measures, Ranks) │      │  • Llama-3.3 70B Versatile    │
        │  • Proof Documents (PDF/PNG bytea & Base64)      │      │  • Live Cohort Ingestion      │
        │  • Dynamic Priority Scores & Encounter Data      │      │  • Clinical Outreach Triage   │
        └──────────────────────────────────────────────────┘      └───────────────────────────────┘
```

---

## 📊 Data Model & Schemas

### 1. PostgreSQL `members` Table
```sql
CREATE TABLE members (
    id TEXT PRIMARY KEY,                       -- Member ID (e.g. 'f9a2b3c4-...')
    name TEXT NOT NULL,                        -- Full patient name
    age INT NOT NULL,                          -- Patient age (e.g. 68)
    gender TEXT NOT NULL,                      -- Gender ('M' or 'F')
    city TEXT NOT NULL,                        -- City (e.g. 'Boston', 'Worcester')
    state TEXT NOT NULL DEFAULT 'Massachusetts',
    insurance_company TEXT NOT NULL,           -- Medicare Advantage PPO / HMO
    plan_type TEXT NOT NULL DEFAULT 'Medicare Advantage',
    has_diabetes BOOLEAN DEFAULT FALSE,        -- True if diagnosed with Type 1 or Type 2 Diabetes
    has_hypertension BOOLEAN DEFAULT FALSE,    -- True if diagnosed with Essential Hypertension
    eye_exam_status TEXT,                      -- 'compliant', 'gap', or 'not_eligible'
    eye_exam_value TEXT,                       -- Last eye exam date (ISO: 'YYYY-MM-DD')
    bp_status TEXT,                            -- 'compliant', 'gap', or 'not_eligible'
    bp_value TEXT,                             -- Last reading (e.g. '128/82')
    adh_status TEXT,                           -- 'compliant', 'gap', or 'not_eligible'
    adh_value DOUBLE PRECISION,                -- Proportion of Days Covered % (e.g. 84.5)
    flu_status TEXT,                           -- 'compliant' or 'gap'
    flu_value TEXT,                            -- Last flu vaccine date (ISO: 'YYYY-MM-DD')
    overall_status TEXT NOT NULL,              -- 'completed' (zero gaps) or 'pending' (>=1 gap)
    priority_score INT DEFAULT 0,              -- Dynamic priority rank score (0 to 100)
    reachability_score INT DEFAULT 0,          -- Encounter reachability (0 to 20)
    reachability_label TEXT,                   -- 'High', 'Moderate', 'Low'
    target_measure TEXT,                       -- Closest star target measure (e.g. 'flu_vaccination')
    raw_doc JSONB,                             -- Full serialized member object with proof history
    updated_at TEXT                            -- UTC ISO timestamp
);
```

### 2. PostgreSQL `proof_documents` Table
```sql
CREATE TABLE proof_documents (
    id TEXT PRIMARY KEY,                       -- Unique document UUID
    member_id TEXT NOT NULL REFERENCES members(id),
    measure_key TEXT NOT NULL,                 -- 'diabetic_eye_exam', 'blood_pressure_control', etc.
    filename TEXT NOT NULL,                    -- Saved disk / database filename
    original_filename TEXT NOT NULL,           -- Original uploaded filename (e.g. 'Retinal_Scan_Report.pdf')
    file_url TEXT NOT NULL,                    -- API streaming URL: '/members/{id}/proof-documents/{doc_id}/download'
    content_type TEXT NOT NULL,                -- 'application/pdf', 'image/png', 'image/jpeg'
    size_bytes INT NOT NULL,                   -- Document size in bytes
    file_data_b64 TEXT,                        -- Raw binary file stored directly in PostgreSQL
    notes TEXT,                                -- Physician notes / hospital sign-off comments
    uploaded_at TEXT NOT NULL                  -- UTC ISO timestamp
);
```

---

## 🩺 Clinical Quality Logic & NCQA HEDIS Engine

The `app/gap_engine.py` is the single clinical source of truth executing official NCQA Measurement Year 2026 specifications:

```
                                  ┌──────────────────────────────┐
                                  │      Patient Diagnosis       │
                                  └──────────────┬───────────────┘
                                                 │
                        ┌────────────────────────┼────────────────────────┐
                        ▼                        ▼                        ▼
               ┌────────────────┐       ┌────────────────┐       ┌────────────────┐
               │    Diabetes    │       │  Hypertension  │       │  All Patients  │
               └────────┬───────┘       └────────┬───────┘       └────────┬───────┘
                        │                        │                        │
             ┌──────────┴──────────┐             │                        │
             ▼                     ▼             ▼                        ▼
     ┌───────────────┐     ┌───────────────┐ ┌───────────────┐    ┌───────────────┐
     │ Diabetic Eye  │     │ Med Adherence │ │  BP Control   │    │  Flu Vaccine  │
     │  Exam (EED)   │     │  (PDC ≥ 80%)  │ │ (< 140/90)    │    │ (Jul 1 - Dec) │
     └───────────────┘     └───────────────┘ └───────────────┘    └───────────────┘
```

1. **Diabetic Eye Exam (NCQA HEDIS: EED / CMS C11)**:
   - **Eligibility**: Patient has diagnosed Diabetes (`has_diabetes == True`).
   - **Compliance Rule**: Retinal or dilated eye exam performed within a 24-month rolling lookback (`<= 730 days`).
   - **Status**: `compliant` if within 24 months, `gap` if overdue (>24 months) or missing, `not_eligible` if non-diabetic.

2. **Controlling High Blood Pressure (NCQA HEDIS: CBP / CMS C14 - 3x TRIPLE CMS WEIGHT)**:
   - **Eligibility**: Patient has diagnosed Hypertension (`has_hypertension == True`).
   - **Compliance Rule**: Systolic BP `< 140 mmHg` AND Diastolic BP `< 90 mmHg` on most recent reading.
   - **Status**: `compliant` if `< 140/90`, `gap` if `>= 140` systolic OR `>= 90` diastolic, `not_eligible` if non-hypertensive.

3. **Diabetes Medication Adherence (NCQA HEDIS: PDC / CMS D11)**:
   - **Eligibility**: Patient has diagnosed Diabetes (`has_diabetes == True`).
   - **Compliance Rule**: Proportion of Days Covered (PDC) $\ge 80.0\%$ for oral diabetes medications.
   - **Status**: `compliant` if `adherence_pct >= 80.0`, `gap` if `< 80.0%`, `not_eligible` if non-diabetic.

4. **Annual Flu Vaccine (NCQA HEDIS: AIS-E / CMS C03)**:
   - **Eligibility**: Universal (100% of Medicare Advantage population).
   - **Compliance Rule**: Influenza vaccine administered between July 1 of prior year and June 30 of measurement year.
   - **Status**: `compliant` if administered in season, `gap` if overdue.

---

## 🎯 Dynamic Priority & Outreach Ranking Model

The priority engine (`app/priority_engine.py`) continuously reads the **2026 CMS Part C Cut Points Table** and ranks members into **3 Distinct Actionable Tiers**:

$$\text{Priority Score} = w_{\text{measure}} \cdot \left(1.0 - \frac{\text{Distance to Next Star}}{\text{Cutpoint Spread}}\right) \times 50 + \text{Reachability Score}$$

### 3-Tier Priority Matrix
| Priority Rank | UI Background Color | Priority Label | Description & Outreach Action |
| :---: | :---: | :---: | :--- |
| **Rank 3** | 🔴 **Light Red** (`bg-rose-950/30`) | **High Priority** | Member has an open gap in the **#1 Target Measure** (closest to crossing the next Star cutpoint) + High reachability score. **Call First Today**. |
| **Rank 2** | 🟠 **Orange** (`bg-amber-950/30`) | **Medium Priority** | Member has multiple open gaps or triple-weighted BP gap. Scheduled for secondary outreach. |
| **Rank 1** | 🔵 **Navy / Slate** (`bg-navy-950/60`) | **Normal / Low** | Member is either compliant or has low-impact gaps with extended due dates. |

---

## 🔮 Star Rating Simulation & ROI Engine

The **Quantum Star Simulator (`/simulator`)** enables healthcare executives to model exact clinical and financial outcomes before deploying care coordinators:

- **CMS 4.0★ Bonus Threshold**: Medicare Advantage plans achieving $\ge 4.0$ Stars receive an extra **5% Quality Bonus Payment (QBP)** rebate from CMS (equating to millions in additional health plan revenue).
- **Measure Weighting**:
  - `Controlling Blood Pressure (CBP)`: **3x Weight**
  - `Diabetic Eye Exam (EED)`: **1x Weight**
  - `Diabetes Medication Adherence (PDC)`: **1x Weight**
  - `Annual Flu Vaccination (AIS-E)`: **1x Weight**
- **Live Cutpoint Analysis**: Dynamically calculates the exact number of member gap closures needed per measure to step from 3★ $\rightarrow$ 4★ $\rightarrow$ 5★.

---

## 🤖 AI Clinical Assistant (Groq Llama-3.3 70B)

The AI Assistant (`/assistant`) acts as a 24/7 Quality Director Copilot:
- **Live Cohort RAG**: Pulls all 33 patient clinical records, diagnosed chronic conditions, last hospital encounter dates, and open gaps directly from Neon PostgreSQL into the prompt.
- **Smart Outreach Triage**: When asked *"Who should I call first today?"*, it provides exact patient names, ages, cities, phone reachability, and custom nurse telephone scripts.
- **Star Strategy Explainer**: Calculates exact cutpoint distances and explains the fastest path to 4.0+ Stars.

---

## 📡 Backend REST API Specification

### Members Endpoints (`/members`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/members` | List members with optional query params (`status=pending/completed`, `measure=...`, `search=...`) with dynamic priority scoring |
| `GET` | `/members/{id}` | Retrieve full member clinical record, conditions, and attached proof documents |
| `POST` | `/members` | Create new member with automatic live HEDIS gap calculation |
| `PUT` | `/members/{id}` | Update member clinical data (BP, exam dates, adherence) with real-time re-evaluation |
| `DELETE` | `/members/{id}` | Delete member from database |
| `POST` | `/members/{id}/proof-documents` | Upload hospital proof document (PDF/PNG/JPG) with multipart file payload |
| `GET` | `/members/{id}/proof-documents/{doc_id}/download` | Stream and preview proof document directly from Neon PostgreSQL |
| `DELETE` | `/members/{id}/proof-documents/{doc_id}` | Remove proof document |

### Analytics Endpoints (`/analytics`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/analytics/summary` | Cohort summary: total members, completed, pending, star rating, measure compliance rates |
| `GET` | `/analytics/trend` | Monthly Star Rating performance trajectory |
| `GET` | `/analytics/geo` | City-level coordinates and gap volume for Massachusetts cohort mapping |
| `GET` | `/analytics/priority` | Dynamic CMS Priority Engine target measure and outreach ranking |

### AI Assistant Endpoints (`/assistant`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/assistant/chat` | Groq Llama-3.3 70B chat completion with live patient context injection |
| `GET` | `/assistant/suggestions` | Curated clinical outreach and simulation prompt cards |

### Admin & Lifecycle (`/admin`, `/health`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/admin/resync` | Trigger manual resync from `data.csv` |
| `GET` | `/admin/sync-status` | Ingestion status and row count audit |
| `GET` | `/health` | Health check and database connectivity status |

---

## 🖥️ Frontend Application Pages & Features

### 1. Executive Quality Dashboard (`/`)
- **Star Score Hero**: Displays active cohort Star Rating (`3.30 ★`) with tier badge.
- **HEDIS Measure Progress Grid**: 4 cards showing current rate vs. 3★, 4★, and 5★ CMS cutpoints with animated status indicators.
- **Interactive Visualizations**:
  - Donut Chart: Pending vs. Completed cohort ratio.
  - Bar Chart: Open gap distribution per measure.
  - Area Chart: Star rating trend across MY2026.
- **Massachusetts Geo Map**: Interactive Leaflet map with dark CartoDB tiles plotting patient density and gap clusters in Boston, Worcester, Springfield, and surrounding cities.

### 2. Members Care Gap Management (`/members`)
- **Two Main Tabs**: **"Pending Gaps (11)"** and **"Completed (22)"** with live badge counters.
- **3-Tier Priority Highlighting**:
  - High Priority (Rank 3): Light Red row background.
  - Medium Priority (Rank 2): Orange row background.
  - Normal Priority (Rank 1): Deep Slate row background.
- **Filters & Search**: Instant search by name, city, ID, and condition filter (Diabetes, Hypertension).
- **"+ Add Member" Modal**: Real-time interactive gap predictor that updates measure statuses as you type.

### 3. Patient Detail & Hospital Proof Hub (`/members/:id`)
- **Patient Banner**: Demographics, insurance plan, diagnosed conditions, and overall compliance status.
- **Clinical Measure Breakdown**: 4 detailed cards explaining NCQA compliance criteria and last recorded readings.
- **Hospital Proof Documents Section**:
  - View attached PDFs, retinal scans, clinic notes, and vaccine cards.
  - Upload new hospital documents with physician sign-off notes.
  - Stream/preview documents directly in the browser with 1 click.

### 4. Quantum Star Rating Simulator (`/simulator`)
- **Quantum Star Reactor**: Dual orbital gauges with spring physics visualizing real-time Star Rating changes.
- **Smart Scenario Presets**:
  - 🚀 *Target 4.0★ Leap*: Calculates minimum gaps to hit 4.0 Stars.
  - ⚡ *Priority #1 Max*: Closes all gaps in the top ROI measure.
  - 👑 *5.0★ Maximum*: Models 100% gap closure across all measures.
- **Interactive Quantum Slider Cards**: Step increment chips (`+1`, `+5`, `+10`, `Max All`, `Reset`) with CMS cutpoint notch markers.
- **Before vs After Comparison**: Horizontal stacked bar chart visualizing simulated improvements.
- **Floating Glassmorphic HUD Bar**: Anchored status bar with live star delta and reset controls.

### 5. AI Clinical Assistant & Copilot (`/assistant`)
- **Telemetry Bar**: Real-time status indicators for Groq LPU acceleration and Neon PostgreSQL connectivity.
- **Live Plan Context Sidebar**: Displays current compliance metrics, open gap counts, and the #1 target measure.
- **Quick-Start Clinical Prompts**: 1-click execution for outreach lists, cutpoint analysis, and regional queries.
- **Markdown Chat Console**: Formatted responses with clickable member links, nurse phone scripts, and copy buttons.

---

## ☁️ Cloud Deployment Guide (Render & Vercel)

### Deploying Backend on Render.com
1. Go to **[render.com](https://render.com)** $\rightarrow$ **New Web Service** $\rightarrow$ Connect `rpnish/CareImpact`.
2. Settings:
   - **Root Directory**: `backend`
   - **Runtime**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
3. Add Environment Variables:
   - `DATABASE_URL`: Your Neon PostgreSQL connection string.
   - `MONGODB_URI`: Your MongoDB Atlas URI.
   - `GROQ_API_KEY`: Your Groq API key.
   - `DATA_CSV_PATH`: `../data/data.csv`
4. Click **Deploy**. Backend will be live at `https://careimpact-api.onrender.com`.

### Deploying Frontend on Vercel.com
1. Go to **[vercel.com](https://vercel.com)** $\rightarrow$ **Add New Project** $\rightarrow$ Select `CareImpact`.
2. Settings:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
3. Click **Deploy** *(Zero environment variables required — auto-detects cloud backend)*.

---

## 📄 License
This project is licensed under the MIT License for the Medicare Advantage Quality Innovation Hackathon.
