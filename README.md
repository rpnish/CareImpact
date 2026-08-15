# Medicare Star Ratings & Gap-Closure Simulator

A production-grade, clinical Medicare Advantage (MA) Star Ratings and HEDIS Gap-Closure application featuring automatic CSV data ingestion, live HEDIS quality measure evaluation, a FastAPI backend with MongoDB Atlas integration, and a high-aesthetic React/Tailwind/Framer Motion frontend with interactive charts, Massachusetts geographic gap mapping, and two-tab member management.

---

## 🌟 Key Features

1. **Automatic CSV Ingestion (`/data/data.csv`)**:
   - Ingests `data/data.csv` on backend startup and via `POST /admin/resync`.
   - Idempotent upsert by `_id` into MongoDB `members` collection — never creates duplicates.
   - Row validation with audit metrics exposed via `GET /admin/sync-status`.

2. **Live NCQA HEDIS Measure Evaluation Engine (`gap_engine.py`)**:
   - Single source of truth evaluating all 4 core Part C & D measures against official NCQA MY2026 specs:
     - **Diabetic Eye Exam (EED / C07)**: Biennial 24-month rolling lookback for diabetic members.
     - **Blood Pressure Control (CBP / C11)**: Systolic < 140 and Diastolic < 90 mmHg within measurement window.
     - **Diabetes Med Adherence (PDC / D11)**: Proportion of Days Covered ≥ 80%.
     - **Annual Flu Vaccine (AIS-E / C03)**: Administered between July 1 prior year & measurement year end.
   - Computes `overallStatus`:
     - `completed`: All 4 measures are either `compliant` or `not_eligible` (zero open care gaps).
     - `pending`: At least 1 open `gap`.
   - `priorityScore: 0` placeholder for future star-cutpoint optimization models.

3. **Modern Interactive Clinical Frontend**:
   - **Dashboard (`/`)**:
     - Star Rating Hero score with animated fill & tier badges.
     - 4 HEDIS measure cards with animated progress bars against 3★, 4★, and 5★ CMS cutpoints.
     - Donut Chart showing Pending vs Completed cohort split.
     - Bar Chart showing open gap volume per measure.
     - Area Chart showing Star Rating trajectory across the measurement year.
     - Interactive Leaflet map plotting Massachusetts cohort cities with pending gap clustering.
   - **Members Management (`/members`)**:
     - Two Main Tabs: **"Pending Gaps"** and **"Completed (Gap-Free)"** with live counts.
     - Full-column data table displaying all 17+ fields from `data.csv` with column sorting.
     - Search by name, city, state, or ID + condition & measure gap filters.
     - **"+ Add Member"** modal with raw clinical inputs and **real-time live gap prediction**.
   - **Member Detail (`/members/:id`)**:
     - Comprehensive clinical profile and condition breakdown.
     - 4 detailed measure cards with official HEDIS criteria explanations.
     - **"Edit Member"** modal that PUTs to backend, triggers live re-evaluation, and updates statuses immediately without a page reload.

---

## 🛠️ Tech Stack

- **Backend**: FastAPI (Python 3.10+), Pydantic v2, Motor / PyMongo, Uvicorn, Pytest
- **Database**: MongoDB Atlas (with seamless in-memory fallback for local development)
- **Frontend**: React 19 (Vite), Tailwind CSS v4, Framer Motion, Recharts, Leaflet / CartoDB Dark Matter, Lucide React
- **Data Source**: `/data/data.csv`

---

## 🚀 Quick Start & Setup Guide

### 1. Prerequisites
- Python 3.10 or higher
- Node.js 18+ and npm

### 2. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create and activate Python virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# (Optional) Configure MongoDB Atlas in .env
# If MONGODB_URI is left blank, backend automatically runs in high-performance local in-memory mode
cp .env.example .env

# Run unit and integration tests
PYTHONPATH=. pytest tests -v

# Start the FastAPI server
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

Backend will be accessible at:
- **API Root**: [http://127.0.0.1:8000](http://127.0.0.1:8000)
- **Interactive Swagger Docs**: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)

### 3. Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Install npm packages
npm install

# Start Vite dev server
npm run dev
```

Frontend will be accessible at:
- **Web Application**: [http://localhost:5173](http://localhost:5173)

---

## 📁 Repository Directory Structure

```
CTS_Hack_AI/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py              # FastAPI application, lifespan sync, CORS
│   │   ├── config.py            # Environment settings & measurement window constants
│   │   ├── database.py          # MongoDB Atlas manager with async in-memory fallback
│   │   ├── models.py            # Pydantic v2 schemas for Member, Measure, Analytics
│   │   ├── gap_engine.py        # Single source of truth for live HEDIS measure evaluation
│   │   ├── ingestion.py         # Standalone CSV ingestion, validation, and upsert
│   │   └── routes/
│   │       ├── __init__.py
│   │       ├── members.py       # GET /members, GET /members/:id, POST /members, PUT, DELETE
│   │       ├── analytics.py     # GET /analytics/summary, /analytics/trend, /analytics/geo
│   │       └── admin.py         # POST /admin/resync, GET /admin/sync-status
│   ├── tests/
│   │   ├── test_gap_engine.py   # HEDIS measure evaluation unit tests
│   │   └── test_api.py          # Full API workflow integration tests
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── index.html               # Google Fonts & Leaflet dark stylesheet
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── src/
│   │   ├── main.jsx
│   │   ├── App.jsx              # Routing & Toast provider
│   │   ├── index.css            # Tailwind theme tokens & glassmorphic styles
│   │   ├── api/
│   │   │   └── client.js        # API fetch client
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx    # Star rating hero, cards, charts, and map
│   │   │   ├── Members.jsx      # Pending/Completed tabs, full table, add modal
│   │   │   └── MemberDetail.jsx # Member profile, 4 measure breakdown cards, edit modal
│   │   ├── components/
│   │   │   ├── Navbar.jsx       # Branding, navigation tabs, quick resync button
│   │   │   ├── StatusBadge.jsx  # Status badge component (compliant/gap/not_eligible)
│   │   │   ├── Skeleton.jsx     # Loading shimmer placeholders
│   │   │   ├── Toast.jsx        # Notification alert system
│   │   │   ├── SyncModal.jsx    # CSV sync metrics and manual resync modal
│   │   │   ├── StarRatingHero.jsx
│   │   │   ├── MeasureProgressCards.jsx
│   │   │   ├── StatusDonutChart.jsx
│   │   │   ├── GapBarChart.jsx
│   │   │   ├── RatingTrendChart.jsx
│   │   │   ├── GeoMapView.jsx
│   │   │   ├── MemberTable.jsx  # Full-columns table with sorting and filtering
│   │   │   ├── AddMemberModal.jsx
│   │   │   └── EditMemberModal.jsx
│   │   └── utils/
│   │       └── constants.js     # Measure configs & cutpoints
├── data/
│   ├── data.csv                 # Single source of truth for members
│   ├── members_wide.csv         # Synthea processed dataset
│   └── RULES_AND_SOURCES.md     # Official NCQA HEDIS specifications
└── README.md
```

---

## 📊 Updating Ingestion Data

To point the simulator at a new dataset:
1. Place the new CSV file at `data/data.csv` (or configure `DATA_CSV_PATH` in `.env`).
2. Click **"data.csv Sync"** in the top navigation bar of the web app, or execute:
   ```bash
   curl -X POST http://127.0.0.1:8000/admin/resync
   ```
3. The backend will validate each row, upsert records by `member_id`, log metrics, and update the UI immediately!

---

## 🧪 Testing

Run the automated backend test suite:

```bash
cd backend
source venv/bin/activate
PYTHONPATH=. pytest tests -v
```
