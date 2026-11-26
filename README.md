# LaunchPad – Startup Idea Validation Platform

LaunchPad is a full-stack SaaS web application for founders, product managers, and builders to capture startup ideas, track validation progress across structured lifecycle stages, document customer discovery notes with competitor references, and monitor real-time portfolio metrics.

---

## Features

1. **Dynamic Validation Dashboard**
   - Displays live SQLite-backed KPIs: **Total Ideas**, **Under Research** (`Researching` + `Validating`), **Validated Ideas** (`Validated`), and **Needs Improvement** (tracked via a dedicated improvement flag).
   - Interactive validation pipeline bar showing the distribution across all five stages.
   - Quick access to recently updated startup ideas.

2. **Complete Idea Management (CRUD)**
   - Create, view, edit, and delete startup ideas with persistent SQLite storage.
   - Captures **Title**, **Description**, **Problem Statement**, **Proposed Solution**, **Target Audience**, **Validation Status**, and an optional **Improvement Flag & Note**.

3. **Validation Tracker**
   - Assign and update each idea through five stages:
     - `Not Started`
     - `Researching`
     - `Validating`
     - `Validated`
     - `Rejected`
   - Includes a separate **Needs Improvement** flag (`needs_improvement` + `improvement_note`) so any idea—even one currently in `Researching` or `Validating`—can be marked for refinement or pivoting independently of its lifecycle status.

4. **Research Notes & Competitor Tracking**
   - Add, edit, and delete research entries attached to individual ideas.
   - Supports detailed research findings plus optional **Competitor Name** and validated **Competitor URL** (`http://` / `https://`) links.
   - Deleting an idea automatically cascades and removes its associated research notes.

5. **Search & Multi-Criteria Filtering**
   - Debounced live search across idea title, description, problem statement, proposed solution, and target audience.
   - Status-based filter pills and a dedicated **Needs Improvement** toggle.

---

## Technology Stack

- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS, Lucide React
- **Backend:** Python 3.12, FastAPI, Pydantic v2, SQLAlchemy 2.0, Uvicorn
- **Database:** SQLite (`backend/launchpad.db`)
- **Testing:** `pytest` + FastAPI `TestClient` (`httpx`), TypeScript compiler (`tsc --noEmit`)

---

## Project Structure

```text
LaunchPad/
├── .gitignore
├── README.md
├── backend/
│   ├── pytest.ini
│   ├── requirements.txt
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py              # FastAPI app, CORS, lifespan table creation
│   │   ├── database.py          # SQLite engine, PRAGMA foreign_keys=ON, SessionLocal
│   │   ├── models.py            # SQLAlchemy ORM models (Idea, ResearchNote)
│   │   ├── schemas.py           # Pydantic request/response schemas & validators
│   │   ├── crud.py              # Database queries & mutations
│   │   └── routers/
│   │       ├── __init__.py
│   │       ├── dashboard.py     # GET /api/dashboard/stats
│   │       ├── ideas.py         # Idea CRUD, status & improvement endpoints
│   │       └── notes.py         # Research notes CRUD endpoints
│   └── tests/
│       ├── __init__.py
│       └── test_api.py          # Automated API + SQLite integration tests
└── frontend/
    ├── index.html
    ├── package.json
    ├── tsconfig.json
    ├── vite.config.ts           # Proxies /api/* requests to http://127.0.0.1:8000
    ├── tailwind.config.js
    └── src/
        ├── App.tsx
        ├── main.tsx
        ├── index.css
        ├── types/index.ts
        ├── api/                 # Typed REST API client modules
        ├── pages/               # DashboardPage, IdeasPage
        └── components/          # Reusable layout, dashboard, idea, note & UI components
```

---

## Database Schema (SQLite)

### `ideas`
| Column | Type | Constraints | Notes |
| :--- | :--- | :--- | :--- |
| `id` | `INTEGER` | `PRIMARY KEY` | Auto-incrementing ID |
| `title` | `VARCHAR(150)` | `NOT NULL` | Startup idea name |
| `description` | `TEXT` | `NOT NULL` | Summary of the concept |
| `problem_statement` | `TEXT` | `NOT NULL` | Customer pain point |
| `proposed_solution` | `TEXT` | `NOT NULL` | Proposed product solution |
| `target_audience` | `VARCHAR(255)` | `NOT NULL` | Primary customer segment |
| `status` | `VARCHAR(30)` | `NOT NULL` | `Not Started`, `Researching`, `Validating`, `Validated`, or `Rejected` |
| `needs_improvement` | `BOOLEAN` | `NOT NULL DEFAULT 0` | Independent improvement indicator |
| `improvement_note` | `TEXT` | `NULL` | Optional refinement note |
| `created_at` | `DATETIME` | `NOT NULL` | UTC creation timestamp |
| `updated_at` | `DATETIME` | `NOT NULL` | UTC update timestamp |

### `research_notes`
| Column | Type | Constraints | Notes |
| :--- | :--- | :--- | :--- |
| `id` | `INTEGER` | `PRIMARY KEY` | Auto-incrementing ID |
| `idea_id` | `INTEGER` | `NOT NULL, FOREIGN KEY -> ideas.id (ON DELETE CASCADE)` | Parent idea |
| `note_content` | `TEXT` | `NOT NULL` | Market research or interview findings |
| `competitor_name` | `VARCHAR(150)` | `NULL` | Optional competitor name |
| `competitor_url` | `VARCHAR(500)` | `NULL` | Optional validated `http(s)` URL |
| `created_at` | `DATETIME` | `NOT NULL` | UTC creation timestamp |
| `updated_at` | `DATETIME` | `NOT NULL` | UTC update timestamp |

---

## REST API Reference

Base URL (local dev): `http://127.0.0.1:8000/api` (interactive Swagger docs available at `http://127.0.0.1:8000/docs`).

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Health check |
| `GET` | `/api/dashboard/stats` | Dynamic KPI metrics and status breakdown |
| `GET` | `/api/ideas` | List ideas (`?search=`, `?status=`, `?needs_improvement=`) |
| `POST` | `/api/ideas` | Create a startup idea |
| `GET` | `/api/ideas/{idea_id}` | Retrieve an idea and its research notes |
| `PUT` | `/api/ideas/{idea_id}` | Update an idea |
| `PATCH` | `/api/ideas/{idea_id}/status` | Update validation status |
| `PATCH` | `/api/ideas/{idea_id}/improvement` | Toggle/update improvement flag and note |
| `DELETE` | `/api/ideas/{idea_id}` | Delete an idea and cascade its research notes |
| `GET` | `/api/ideas/{idea_id}/notes` | List research notes for an idea |
| `POST` | `/api/ideas/{idea_id}/notes` | Add a research note to an idea |
| `PUT` | `/api/notes/{note_id}` | Update a research note |
| `DELETE` | `/api/notes/{note_id}` | Delete a research note |

---

## Local Setup & Running the Application

### Prerequisites
- **Python 3.12+**
- **Node.js 20+** and **npm**

### 1. Start the Backend (FastAPI + SQLite)

```powershell
cd backend

# Create virtual environment (first time only)
python -m venv .venv

# Install Python dependencies
.\.venv\Scripts\python.exe -m pip install -r requirements.txt

# Start the API server (runs on http://127.0.0.1:8000)
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

> On macOS/Linux, use `./.venv/bin/python` instead of `.\.venv\Scripts\python.exe`.

### 2. Start the Frontend (React + TypeScript + Vite)

Open a second terminal:

```powershell
cd frontend

# Install Node dependencies (first time only)
npm install

# Start the development server (runs on http://localhost:5173)
npm run dev
```

> **Windows PowerShell tip:** If PowerShell blocks `npm` due to script execution policy (`npm.ps1 cannot be loaded`), run `npm.cmd install` and `npm.cmd run dev` instead.

Open **`http://localhost:5173`** in your browser. The Vite dev server automatically proxies `/api/*` requests to FastAPI on port `8000`.

---

## Running Tests & Quality Checks

### Backend Integration Tests (`pytest`)
```powershell
cd backend
.\.venv\Scripts\python.exe -m pytest -v
```
Tests run against an isolated temporary SQLite database per test case and verify CRUD operations, dynamic dashboard calculations, search/filtering, research note cascade deletion, and `404`/`422` error handling.

### Frontend Type Check & Production Build
```powershell
cd frontend
npm.cmd run typecheck
npm.cmd run build
```

---

## Production Deployment (GitHub + Neon + Vercel)

LaunchPad deploys as a **single Vercel project** (React static build + FastAPI Python serverless API on the same origin) while keeping **SQLite** locally and **Neon free PostgreSQL** for persistent production data:

1. **Database (Neon Free PostgreSQL):**
   - Create a free project at [neon.tech](https://neon.tech) and copy the **pooled** PostgreSQL `DATABASE_URL`.
2. **Vercel Single-Project Deployment:**
   - Import the GitHub repository on [vercel.com](https://vercel.com) (keep Root Directory as `./`).
   - [vercel.json](vercel.json) automatically builds `frontend/` into `frontend/dist`, routes `/api/*` to [api/index.py](api/index.py), and serves the React SPA for all other paths.
   - Add one **Environment Variable** in Vercel:
     - `DATABASE_URL` = your Neon PostgreSQL connection string
   - Leave `VITE_API_BASE_URL` unset so the frontend uses same-origin `/api/*` requests cleanly.

---

## Architecture & Interview Talking Points

- **Why SQLAlchemy + Pydantic instead of raw SQL?** Pydantic validates incoming JSON payloads (rejecting blank strings, invalid statuses, and malformed URLs with `422` errors) before touching the database, while SQLAlchemy prevents SQL injection and keeps schema logic clean.
- **Why enable `PRAGMA foreign_keys=ON` in SQLite?** SQLite disables foreign key cascades by default. Enabling it on every connection guarantees `ON DELETE CASCADE` works at the database level when deleting an idea.
- **Why separate `needs_improvement` from `Rejected`?** A startup idea can be actively under `Researching` or `Validating` while still needing pricing refinement or a sharper target audience. Keeping `needs_improvement` as an explicit flag keeps the five validation lifecycle stages clean and unambiguous.
- **How are N+1 queries avoided?** `GET /api/ideas` computes `notes_count` in a single `LEFT OUTER JOIN` against a grouped subquery rather than running one query per idea.
