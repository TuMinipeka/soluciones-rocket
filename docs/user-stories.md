# User Stories and Acceptance Criteria (HU-01 to HU-24)

**System:** Campus Control — Central Operating Management System  
**Priorities:** **P0** = Indispensable for live demo; **P1** = Important for integrated MVP; **P2** = Optional enhancement.

---

## Module 1: Architecture & Space Reservations (Conde)

### HU-01 — FastAPI Initialization & Architecture (P0)
- **As a** developer,
- **I want** an organized, documented API,
- **So that** backend modules can be easily integrated.
- **Acceptance Criteria:**
  - API runs inside Docker container (`compose.yaml`).
  - `GET /health` returns status 200 with SQLite connectivity check.
  - OpenAPI docs available at `/docs`.
  - Consistent JSON error response format (`{"error": {"code": "...", "message": "...", "details": ...}}`).

### HU-02 — Space Availability Query (P0)
- **As a** teacher or administrator,
- **I want** to query rooms by date and time interval,
- **So that** I know which spaces are available to book.
- **Acceptance Criteria:**
  - `GET /spaces` lists all 10 official rooms (`SAL-001` to `SAL-010`) with their capacities.
  - Filters by date, start time, and end time.
  - Correctly excludes blocked rooms and overlapping confirmed reservations.

### HU-03 — Create Valid Space Booking (P0)
- **As a** teacher or administrator,
- **I want** to reserve a room by specifying date, times, and attendees,
- **So that** space availability is guaranteed for academic activities.
- **Acceptance Criteria:**
  - Requires Bearer token authentication.
  - Restricts role to `admin` and `teacher` (`support` gets 403 Forbidden).
  - Rejects capacity overflow, schedule overlap, or disabled rooms.
  - Enforces start time < end time.

### HU-04 — Modify and Cancel Bookings (P1)
- **As a** teacher,
- **I want** to update or cancel my reservations,
- **So that** changes are reflected immediately in availability.
- **Acceptance Criteria:**
  - Teachers can only modify/cancel their own bookings; Admins can manage any.
  - Cancelling immediately restores room availability.

### HU-05 — Smart Space Relocation (P1)
- **As an** administrator,
- **I want** to receive compatible alternatives when a room is disabled by an incident,
- **So that** scheduled classes continue smoothly.
- **Acceptance Criteria:**
  - Identifies affected future reservations.
  - Recommends available rooms with compatible capacity.
  - Requires explicit administrator confirmation to apply relocations.

---

## Module 2: Persistence, Inventory & DevOps (Mayorga)

### HU-06 — Data Persistence (P0)
- **Acceptance Criteria:** SQLAlchemy 2.x declarative models, SQLite with active foreign keys, container restarts do not wipe data (volume persistence).

### HU-07 — Reproducible Seed (P0)
- **Acceptance Criteria:** Idempotently loads 10 official rooms, creates default accounts (`admin`, `teacher`, `support`), sample bookings and incidents without duplicating.

### HU-08 — Resource Inventory & Loans (P0)
- **Acceptance Criteria:** Queries inventory, prevents loans of damaged/disabled equipment, manages return lifecycle.

### HU-09 — Official Dataset Importer (P0)
- **Acceptance Criteria:** Adaptable importer for CSV/JSON, validates columns and IDs, reports imported and rejected records.

### HU-10 — Docker Compose Orchestration (P0)
- **Acceptance Criteria:** `docker compose up --build` launches frontend and backend, persistent SQLite volume, `.env.example` documented without secrets.

---

## Module 3: Authentication, Security, Incidents & AI (Diego)

### HU-11 — Public User Registration (P0)
- **As a** campus visitor,
- **I want** to register an account,
- **So that** I can access authorized system operations.
- **Acceptance Criteria:**
  - `POST /auth/register` creates user with `teacher` role strictly.
  - Privilege escalation attempts (`role="admin"`, `is_admin=True`) are safely ignored.
  - Enforces unique email, strong password rules, and stores Argon2id hash.
  - Never returns password hash in responses.

### HU-12 — Login and JWT Authentication (P0)
- **As a** registered user,
- **I want** to log in securely,
- **So that** I receive an authenticated session token.
- **Acceptance Criteria:**
  - `POST /auth/login` checks credentials using constant-time dummy hash comparison (anti-timing attacks).
  - Returns signed JWT (`exp`, `iat`, `sub`, `iss`, `jti`).
  - Inactive accounts get 403 Forbidden.
  - `GET /auth/me` verifies identity in real-time against SQLite.

### HU-13 — User Administration and Permissions (P1)
- **As an** administrator,
- **I want** to manage user accounts and roles,
- **So that** I control system permissions.
- **Acceptance Criteria:**
  - Only `admin` can list users, update roles, or change status.
  - Users cannot modify their own role or active status.
  - System prevents deactivating or downgrading the last active admin.

### HU-14 — Incident Reporting and Management (P0)
- **As a** teacher or staff member,
- **I want** to report campus failures,
- **So that** maintenance and IT can respond.
- **Acceptance Criteria:**
  - `POST /incidents` records issue, validates space/resource IDs, logs audit events.
  - Support and Admin can update status (`open` -> `in_progress` -> `resolved`).
  - Reopening is restricted to `admin`.
  - Disabling space availability requires authorized confirmation and is automatically restored upon resolution.

### HU-15 — Intelligent AI Incident Triage (P0)
- **As a** reporting user,
- **I want** automatic AI classification,
- **So that** issues are categorized and routed quickly.
- **Acceptance Criteria:**
  - `POST /incidents/analyze` processes descriptions with prompt injection defenses.
  - Validates response strictly with Pydantic (`category`, `priority`, `team`).
  - Issues signed `analysis_token` for cryptographic provenance.
  - Discards hallucinated spaces with clear warnings.

### HU-16 — Local Rules Fallback and Real Recommendations (P1)
- **As an** administrator,
- **I want** the system to continue classifying issues when the AI model is offline,
- **So that** operational flow never stops.
- **Acceptance Criteria:**
  - Activates deterministic keyword classifier on AI timeout, HTTP errors, or missing keys.
  - Clearly identifies `classification_source: "rules"`.
  - Recommends real available spaces/resources without fake data.

---

## Module 4 & 5: Frontend Visual and Integration (Mafe & Guerra)

### HU-17 to HU-20 — Frontend UI & Dashboard (Mafe)
- Main layout, interactive room map with status colors, executive dashboard, and incident viewer.

### HU-21 to HU-24 — Frontend Functional & Integration (Guerra)
- JWT auth store, booking submission forms, resource loans, and end-to-end incident reporting flow with AI triage.
