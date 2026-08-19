# CareImpact: Medicare Star Ratings & Quality Gap Intelligence Platform

> **An Enterprise Quality Intelligence & Star Ratings Optimization Engine** for Medicare Advantage (MA) and commercial health plans. Features real-time NCQA HEDIS MY2026 quality measure evaluation, dynamic CMS cutpoint prioritization, an interactive Gap Closure Star Simulator, hospital proof document verification, and a Groq-powered AI Quality Copilot.

---

## 📋 Table of Contents
1. [System Overview & Architecture](#-system-overview--architecture)
2. [Three Engineering Roles & Tech Stacks](#-three-engineering-roles--tech-stacks)
   - [Data Engineering](#1-data-engineering-pipeline--domain-architecture)
   - [Backend Engineering](#2-backend-engineering-architecture)
   - [Frontend Engineering](#3-frontend-engineering-architecture)
3. [Quick Start & Running Commands](#-quick-start--running-commands)
4. [The 4 Core Platform Workspaces](#-the-4-core-platform-workspaces)
   - [1. Executive Dashboard](#1-executive-quality-dashboard-)
   - [2. Members Roster & Profile Verification Hub](#2-members-roster--profile-verification-hub-members-membersid)
   - [3. Star Rating Simulator](#3-star-rating-simulator-simulator)
   - [4. AI Quality Assistant](#4-ai-quality-assistant-assistant)
5. [Mathematical & Quality Engines](#-mathematical--quality-engines)
   - [Star Engine & NCQA HEDIS Cutpoints](#1-star-engine--ncqa-hedis-my2026-cutpoints)
   - [CareImpact Priority Engine & Scoring Logic](#2-careimpact-priority-engine--scoring-logic)
6. [AI Agent Architecture & Data Ingestion Pipeline](#-ai-agent-architecture--data-ingestion-pipeline)
7. [Backend REST API Specification](#-backend-rest-api-specification)
8. [Production Deployment Guide](#-production-deployment-guide)

---

## 🏛️ System Overview & Architecture

```
                                  ┌────────────────────────────────────────────────────────────┐
                                  │                     React 19 Frontend                      │
                                  │   Dashboard  ·  Members  ·  Simulator  ·  AI Assistant     │
                                  │   (Two-Way Company Scoping & Member Store Context)         │
                                  └─────────────────────────────┬──────────────────────────────┘
                                                                │
                                                    HTTP / HTTPS REST & Direct LPU
                                                                │
                                                                ▼
                                  ┌────────────────────────────────────────────────────────────┐
                                  │                  FastAPI Backend Server                    │
                                  │  • gap_engine.py      (NCQA HEDIS MY2026 Measure Rules)    │
                                  │  • priority_engine.py (CMS Cutpoint Distance & Outreach)   │
                                  │  • ingestion.py       (Multi-Company Ingestion & Schema)   │
                                  └───────────────┬─────────────────────────────┬──────────────┘
                                                  │                             │
                                                  ▼                             ▼
        ┌──────────────────────────────────────────────────┐      ┌───────────────────────────────┐
        │            Neon PostgreSQL (Primary DB)          │      │      Groq Cloud (AI LPU)      │
        │                                                  │      │                               │
        │  • Members Table (Demographics, Measures, Ranks) │      │  • Model: openai/gpt-oss-120b │
        │  • Proof Documents (Binary bytea & Base64 PDF)   │      │  • Dynamic Company RAG        │
        │  • Dynamic Priority Scores & Clinical Dates      │      │  • Clinical Outreach Triage   │
        └──────────────────────────────────────────────────┘      └───────────────────────────────┘
```

---

## 🛠️ Three Engineering Roles & Tech Stacks

### 1. Data Engineering Pipeline & Domain Architecture

The Data Engineering layer manages ingestion, schema normalization, clinical rule validation, and chronic disease plan mapping.

| Component | Technology | Purpose |
| :--- | :--- | :--- |
| **Primary Dataset** | `data/newmembers.csv` | 220 validated member records across 10 health plans (22 members/plan). |
| **Ingestion Pipeline** | Python 3.11+, Pandas, PapaParse | Synchronizes CSV records into Neon PostgreSQL and client-side memory stores. |
| **Clinical Standard** | NCQA HEDIS MY2026 | Encodes specifications across 9 core HEDIS quality measures. |
| **Plan Architecture** | `PLAN_DISEASE_AFFILIATIONS` | Scopes clinical criteria and disease cohorts strictly per insurance company. |

#### 🏢 10 Insurance Companies & Assigned Chronic Disease Criteria
1. **Medicare**: Cardiovascular, Metabolic & Preventive Health (`CBP` 3x, `HBD_C7` 1x, `FVA` 1x).
2. **Humana**: Cardiometabolic & Endocrine Management (`CBP` 3x, `HBD_C7` 1x, `SPD` 1x).
3. **Blue Cross Blue Shield**: Preventive Oncology & Adult Wellness (`BCS` 1x, `AWV` 1x, `FVA` 1x).
4. **Dual Eligible (Medicare/Medicaid)**: Complex Multi-Condition (`CBP` 3x, `EED` 1x, `KED` 1x, `AWV` 1x).
5. **Anthem**: Diabetic Microvascular & Renal Health (`HBD_C7` 1x, `EED` 1x, `KED` 1x).
6. **Aetna**: Diabetic Microvascular & Statin Therapy (`HBD_C7` 1x, `EED` 1x, `SPD` 1x).
7. **Cigna Health**: Cardiometabolic & Renal Health (`CBP` 3x, `KED` 1x, `SPD` 1x).
8. **Medicaid**: Preventive Women's & Adult Wellness (`BCS` 1x, `AWV` 1x, `CBP` 3x).
9. **UnitedHealthcare**: Comprehensive Senior Care (`CBP` 3x, `AWV` 1x, `MRP` 1x).
10. **Kaiser Permanente**: Integrated Chronic Care (`CBP` 3x, `HBD_C7` 1x, `EED` 1x).

---

### 2. Backend Engineering Architecture

The backend delivers an asynchronous, type-safe REST API executing NCQA HEDIS evaluation, dynamic CMS cutpoint prioritization, and AI copilot routing.

| Component | Technology | Purpose |
| :--- | :--- | :--- |
| **Framework** | **FastAPI (Python 3.12)** | Asynchronous, type-safe RESTful API with automated OpenAPI documentation. |
| **ASGI Server** | **Uvicorn** | High-performance asynchronous server with auto-reloading. |
| **Validation** | **Pydantic v2** | Strict input/output clinical models, request validation, and schema coercion. |
| **Primary Relational DB** | **Neon PostgreSQL (AsyncPG)** | Serverless PostgreSQL storing members, clinical encounters, and binary PDF/image proof blobs. |
| **Document Store** | **MongoDB Atlas (Motor)** | Optional document store for audit logging and metadata tracking. |
| **LLM Inference Client** | **Groq Cloud API (`httpx`)** | High-speed LPU inference with multi-model fallback and strict timeout guards. |
| **Testing** | **Pytest & Pytest-Asyncio** | Automated unit and integration tests for clinical engines and endpoints. |

---

### 3. Frontend Engineering Architecture

The frontend is a single-page application engineered with modern dark-mode aesthetics, two-way synchronized scoping, and responsive enterprise components.

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Framework** | **React 19 (SPA)** | Reactive user interface built on Vite. |
| **Build Tool** | **Vite 8.2** | Lightning-fast hot module replacement (HMR) and optimized production rollup builds. |
| **Styling** | **Tailwind CSS v4 + Vanilla CSS** | Enterprise dark design tokens (Obsidian `#020617`, Slate `#0f172a`, Indigo `#6366f1`, Emerald `#10b981`). |
| **Markdown Rendering** | **React-Markdown + Remark-GFM** | Renders structured GitHub Markdown tables, lists, and bold text in the AI Assistant. |
| **Animations** | **Framer Motion** | Micro-animations, drawer transitions, and live simulation spring physics. |
| **Data Visualization** | **Recharts** | Visual comparative dual-bar charts, Star trajectory rails, and compliance progress gauges. |
| **Geographic Mapping** | **Leaflet & React-Leaflet** | Interactive map plotting patient coordinates, ZIP density, and regional gap clusters. |
| **Icons** | **Lucide React** | Clinical, operational, and navigational SVG icons. |
| **State Management** | **Context API (`useCompanyScope`, `useMemberStore`)** | Manages two-way company dropdown synchronization, gap closures, proof documents, and custom member enrollment. |

---

## 🚀 Quick Start & Running Commands

Follow these steps to run the complete project locally.

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
   DATABASE_URL=postgresql://neondb_owner:npg_4LCt3GdmzjIQ@ep-dry-heart-aytda65j.c-5.us-east-2.aws.neon.tech/neondb?sslmode=require
   MONGODB_URI=mongodb+srv://nethrabalan05_db_user:z1YOXzFcphJbGEA4@cluster0.qmcyqzn.mongodb.net/?appName=Cluster0&tlsAllowInvalidCertificates=true
   DB_NAME=medicare_star_ratings
   DATA_CSV_PATH=../data/newmembers.csv
   GROQ_API_KEY=gsk_your_groq_api_key_here
   ```
5. Start the FastAPI development server:
   ```bash
   uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
   ```
   - **Backend API**: `http://127.0.0.1:8000`
   - **Interactive OpenAPI / Swagger Docs**: `http://127.0.0.1:8000/docs`

---

### Step 3: Set Up & Start the Frontend
1. Open a new terminal and navigate to `frontend`:
   ```bash
   cd frontend
   ```
2. Install npm dependencies:
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

## 🖥️ The 4 Core Platform Workspaces

### 1. Executive Quality Dashboard (`/`)
- **Global Payer Dropdown**: Synchronized two-way dropdown scoping metrics, enrolled members, and clinical criteria.
- **Top KPI Cards**: Displays current plan compliance rate (%), total open gaps, gap-free members, and weighted Star rating.
- **Plan Disease & Measure Architecture**: Displays the clinical target population, diagnosed conditions, and assigned HEDIS measures.
- **Criteria Analysis Cards**: Live cutpoint targets (1★ to 5★), gaps needed to flip to the next Star tier, reachability %, and clinical gap rationales.
- **Geographic Dispersion Map**: Leaflet map plotting patient locations and regional gap clusters.

---

### 2. Members Roster & Profile Verification Hub (`/members`, `/members/:id`)
- **Actionable Roster Table**:
  - Clickable member rows navigating to the full profile overview (`/members/:id`).
  - Measures matrix displaying exact statuses (`MET` in green, `GAP` in red, `-` for non-applicable).
  - Priority badge ($1 - 100$) derived from the CareImpact Priority Engine.
  - Action column with **"Update"** and **"Delete"** trash buttons (with confirmation modals).
- **"+ Enroll New Member" Modal**:
  - Full enrollment form with demographics, insurance company selection, and auto-assigned plan criteria.
- **Member Profile Detail Page (`/members/:id`)**:
  - Full demographics banner, insurance plan, priority score, and assigned clinical criteria.
  - **Gap Closure & Hospital Proof Upload**:
    - For **`GAP`** measures: Real `<input type="file" />` picker accepting hospital documents (PDF, PNG, JPG, DOCX), recording doctor names, hospital names, clinical readings, and flipping status to `MET`.
    - For **`MET`** measures: Displays a read-only *"Compliant · No Gap Action Needed"* indicator.
  - **Hospital Proof Documents History**: View, download, and stream attached hospital verification documents.

---

### 3. Star Rating Simulator (`/simulator`)
- **Company Scoped**: Scopes strictly to the active insurance company selected in the global dropdown.
- **Top Rating Cards**: Compares **Current Plan Baseline Rating** vs. **Simulated Projected Rating** with real-time $+\Delta \text{Stars}$ gain.
- **Projected Star Impact Track**: Horizontal 1.0★ $\longrightarrow$ 5.0★ visual continuum rail with pin markers.
- **Interactive Gap Closure Sliders (`Gap Closure Simulator`)**:
  - Range sliders ($0 \longrightarrow \text{Total Gaps}$) for each assigned measure in the plan.
  - Real-time feedback cards: Selected Gaps, Projected Compliance Rate %, Compliance Improvement %, and Star Tier Transition.
- **Before vs After Dual-Bar Chart**: Side-by-side compliance rate comparison.
- **Impact & Priority Analysis**: Ranked by CareImpact Priority Score with a **Highest Strategic ROI Callout** banner.
- **Recommended Interventions**: Prioritized clinical intervention protocols (#1, #2, #3) with direct links to view the prioritized member roster.
- **Sticky Summary Footer**: Live counter of Gaps Selected, Remaining Gaps, Projected Rating, Star Improvement, and Reset controls.

---

### 4. AI Quality Assistant (`/assistant`)
- **Zero Dropdown in Chat**: Automatically inherits the globally selected insurance company without an internal selector.
- **Company Context Injection**: Ingests active cohort size, compliance %, Star rating, open care gaps, assigned criteria, and prioritized patient records.
- **Live Prompt Chips**: Company-specific questions (*"Who should I call first?", "Next Star Strategy", "Overview of Open Gaps"*).
- **Clean Markdown Table Rendering**: Formats patient outreach call lists into polished GitHub Markdown tables with nurse phone scripts.
- **Fast Groq LPU Inference**: Powered by Groq API (`openai/gpt-oss-120b`) with a 25s timeout guard and reasoning block sanitization.

---

## 📐 Mathematical & Quality Engines

### 1. Star Engine & NCQA HEDIS MY2026 Cutpoints

The Star Engine calculates measure-level and plan-level Star ratings based on official NCQA HEDIS MY2026 cutpoints:

| Measure Code | Full Clinical Measure Name | Domain | CMS Weight | 1★ | 2★ | 3★ | 4★ | 5★ |
| :--- | :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **`CBP`** | Controlling High Blood Pressure ($<140/90\text{ mmHg}$) | Clinical Outcome | **$3.0\times$ (Triple)** | 0% | 53.0% | 68.0% | 75.0% | 85.0% |
| **`HBD_C7`** | Diabetes HbA1c Poor Control ($<8.0\%$) | Clinical Outcome | $1.0\times$ | 0% | 45.0% | 60.0% | 72.0% | 84.0% |
| **`SPD`** | Statin Therapy for Patients with Diabetes | Process / Screening | $1.0\times$ | 0% | 65.0% | 75.0% | 82.0% | 89.0% |
| **`EED`** | Diabetic Retinal Eye Exam ($<24\text{ mo}$) | Process / Screening | $1.0\times$ | 0% | 52.0% | 65.0% | 76.0% | 88.0% |
| **`KED`** | Kidney Health Evaluation for Diabetes | Process / Screening | $1.0\times$ | 0% | 40.0% | 55.0% | 68.0% | 80.0% |
| **`BCS`** | Breast Cancer Screening (Mammogram) | Preventive Care | $1.0\times$ | 0% | 58.0% | 68.0% | 76.0% | 84.0% |
| **`FVA`** | Adult Annual Flu Vaccine | Preventive Care | $1.0\times$ | 0% | 60.0% | 72.0% | 81.0% | 90.0% |
| **`AWV`** | Annual Wellness Visit Completion | Preventive Care | $1.0\times$ | 0% | 50.0% | 65.0% | 78.0% | 88.0% |
| **`MRP`** | Medication Reconciliation Post-Encounter | Care Coordination | $1.0\times$ | 0% | 48.0% | 62.0% | 74.0% | 86.0% |

#### 🧮 Overall Plan Star Rating Formula
$$\text{Overall Star Rating} = \frac{\sum_{m \in M} \left( \text{Star}_m \times W_m \right)}{\sum_{m \in M} W_m}$$

---

### 2. CareImpact Priority Engine & Scoring Logic

The Priority Engine ranks members with care gaps to maximize clinical ROI and Star Rating acceleration.

#### Why Patient Scores Differ for 1 Gap:
- **Rogelio Monahan (1 Gap in `CBP` 3x)** $\longrightarrow$ **Score: `100` (Highest Priority)**.
  - `CBP` carries a **3x CMS Triple Weight**. Closing this 1 gap immediately flips Medicare's blood pressure measure from 3★ $\rightarrow$ 4★.
- **Benito Gulgowski (1 Gap in `FVA` 1x)** $\longrightarrow$ **Score: `78` (Moderate Priority)**.
  - `FVA` is a **1x Standard Weight** measure, and the plan is already at 5 Stars for flu vaccines.
- **Grisel Balistreri (0 Gaps)** $\longrightarrow$ **Score: `0` (Gap-Free / Compliant)**.
  - Patient is fully compliant; no outreach required.

#### Mathematical Formulas:
1. **Distance to Next Cutpoint**:
   $$D_m = S_{\text{next}} - P_m$$
2. **Gaps Needed to Flip Star**:
   $$G_{\text{needed}} = \left\lceil \frac{D_m}{100} \times E_m \right\rceil$$
3. **Reachability Percentage**:
   $$R_m = \max\left(0, \left(1 - \frac{G_{\text{needed}}}{\text{Total Gaps}_m}\right) \times 100\right)$$
4. **Measure Strategic Priority**:
   $$Q_m = \left( O_m \times 0.45 \right) + \left( R_m \times 0.45 \right) + \left( W_m \times 10 \times \text{WeightFactor} \right)$$
5. **Patient Priority Score ($1 - 100$)**:
   $$\text{Patient Priority} = \max_{m \in \text{Patient Gaps}} \left( Q_m \times \text{UrgencyMultiplier} \right)$$

---

## 🤖 AI Agent Architecture & Data Ingestion Pipeline

### AI Agent Flow Diagram
```
  User Selects Company (e.g. Medicare / Humana)
                      │
                      ▼
  Frontend Assembles Real-Time Scoped Context:
  • Company Name & Target Population
  • Total Enrolled Members (22) & Compliance %
  • Current Star Rating (e.g. 3.8★) & Total Open Gaps
  • Assigned Chronic Disease Criteria (CBP 3x, HBD_C7 1x, etc.)
  • Prioritized Member Roster with Open Gaps & Priority Scores (1-100)
                      │
                      ▼
  System Prompt Construction (Clinical Guardrails & Table Formatting)
                      │
                      ▼
  Groq API Client (Endpoint: https://api.groq.com/openai/v1/chat/completions)
  Model: openai/gpt-oss-120b | Max Tokens: 2048 | Temp: 0.2
                      │
                      ▼
  Output Sanitization: Strips <think>...</think> Reasoning Blocks
                      │
                      ▼
  React-Markdown + Remark-GFM: Formats Clean Dark-Theme HTML Tables & Call Scripts
```

---

## 📡 Backend REST API Specification

### Members Endpoints (`/members`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/members` | List members with optional query params (`company`, `status`, `search`) and dynamic priority scores. |
| `GET` | `/members/{id}` | Retrieve full member clinical record, conditions, and attached hospital proof documents. |
| `POST` | `/members` | Create new member with automatic live HEDIS gap calculation. |
| `PUT` | `/members/{id}` | Update member clinical readings (BP, dates, adherence) with real-time re-evaluation. |
| `DELETE` | `/members/{id}` | Delete member from database. |
| `POST` | `/members/{id}/proof-documents` | Upload hospital proof document (PDF/PNG/JPG) with multipart file payload. |
| `GET` | `/members/{id}/proof-documents/{doc_id}/download` | Stream and download proof document from Neon PostgreSQL. |
| `DELETE` | `/members/{id}/proof-documents/{doc_id}` | Remove proof document. |

### Analytics Endpoints (`/analytics`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/analytics/summary` | Cohort summary: total members, completed, pending, star rating, compliance rates. |
| `GET` | `/analytics/priority` | Dynamic CMS Priority Engine target measure and outreach ranking. |
| `GET` | `/analytics/geo` | City-level coordinates and gap volume for mapping. |

### AI Assistant Endpoints (`/assistant`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/assistant/chat` | Groq AI chat completion with dynamic company context injection. |

---

## ☁️ Production Deployment Guide

### Deploying Backend on Render.com
1. Create a new Web Service on [render.com](https://render.com) connected to your GitHub repository.
2. Build Settings:
   - **Root Directory**: `backend`
   - **Runtime**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
3. Environment Variables:
   - `DATABASE_URL`: Neon PostgreSQL connection string.
   - `GROQ_API_KEY`: Your Groq API key (e.g. `gsk_...`).
   - `DATA_CSV_PATH`: `../data/newmembers.csv`

### Deploying Frontend on Vercel
1. Import the repository on [vercel.com](https://vercel.com).
2. Framework Preset: `Vite`.
3. Root Directory: `frontend`.
4. Build Command: `npm run build`, Output Directory: `dist`.
5. Deploy.

---

## 📄 License
Licensed under the MIT License.
