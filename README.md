# Matdata Pulse — Field Voter Outreach & Analytics Platform

**Matdata Pulse** *(Matdata = Voter + Pulse = Real-Time Civic Telemetry)* is a production-grade, offline-first full-stack platform engineered for election field operations, booth-level citizen sentiment capture, and real-time campaign analytics.

---

## Architecture Overview

```text
matdata-pulse/
├── App/                  # Module 1: Offline-First Flutter Mobile App (GetX, Hive, Dio)
├── server/               # Module 2: Layered REST API (Node.js, Express, TypeScript, PostgreSQL, Redis)
├── website/              # Module 3: Campaign Director Web Admin Panel (React, Vite, Tailwind CSS)
└── docker-compose.yml    # One-command PostgreSQL 16 + Redis 7 + API + Web stack
```

### Security & Systems Design Highlights

- **JWT Authentication & Token Rotation**: Short-lived access tokens (`jti`, `sub`, `role`, `assignedConstituency`) paired with SHA-256 hashed refresh tokens rotated inside a PostgreSQL `SELECT ... FOR UPDATE` transaction to prevent concurrent token replay attacks.
- **Instant Token Revocation (Redis)**: On logout, the access token `jti` is blacklisted in Redis until its natural expiry.
- **Distributed Rate Limiting (Redis Lua)**: Atomic fixed-window rate limiter in Redis (`INCR` + `PEXPIRE`) with separate quotas for auth (`/api/auth/login`), batch survey sync (`POST /api/surveys`), and general API routes, plus graceful in-memory fallback.
- **PostgreSQL Row-Level Locking (`SELECT ... FOR UPDATE`)**: Every admin audit transition (`PATCH /api/surveys/:id/status`) acquires a row-level exclusive lock on the target survey row inside an ACID transaction, increments `version`, and records an immutable entry in `survey_audit_logs`.
- **Idempotent Offline Batch Sync**: Surveys carry a client-generated UUID (`clientSurveyId`) with a composite unique constraint `UNIQUE (collector_id, client_survey_id)` and `ON CONFLICT DO NOTHING` so offline retries never lose data or create duplicates.
- **Role-Based Access Control (RBAC)**:
  - `field_worker`: Can submit single/batch surveys and view only their own captured records.
  - `admin`: Full visibility across all constituencies, analytics, audit status transitions, and audit trail history.
- **Input Validation & Transport Security**: Strict Zod schemas on all payloads/queries, parameterized SQL queries, `helmet`, strict `CORS` allowlist, and 1 MB JSON body limit.

---

## Quick Start (Docker Compose)

```bash
docker compose up --build -d
# Run database seed once server/postgres are healthy:
docker compose exec server npm run db:seed:prod
```

- **Backend API**: `http://localhost:5000` (`GET /health`)
- **Web Admin Dashboard**: `http://localhost:5173`

---

## Manual Local Setup

### Prerequisites
- **Node.js** 20+ & **npm**
- **PostgreSQL** 15+
- **Redis** 7+
- **Flutter SDK** 3.22+ (for mobile app)

### 1. Backend Service (`server/`)

```bash
cd server
cp .env.example .env
# Update DATABASE_URL and REDIS_URL in .env if needed

npm install
npm run db:migrate
npm run db:seed
npm run dev
```

Run backend type-check, build, and automated test suite:

```bash
npm run build
npm test
```

### 2. Web Admin Dashboard (`website/`)

```bash
cd website
cp .env.example .env
npm install
npm run dev
```

Production build check:

```bash
npm run build
```

### 3. Flutter Mobile App (`App/`)

```bash
cd App
flutter pub get
# For Android Emulator (points to host localhost via 10.0.2.2):
flutter run

# Or for a physical device on LAN:
flutter run --dart-define=API_BASE_URL=http://<YOUR_LAN_IP>:5000/api
```

Run Flutter unit tests:

```bash
flutter test
```

---

## Demo Credentials (Seeded by `npm run db:seed`)

| Role | Email | Password | Access |
| :--- | :--- | :--- | :--- |
| **Campaign Director (`admin`)** | `director@matdatapulse.in` | `Director@2026!` | Web Admin Dashboard + All APIs |
| **Field Worker (`field_worker`)** | `rohan.field@matdatapulse.in` | `Worker@2026!` | Flutter App (Shivajinagar) |
| **Field Worker (`field_worker`)** | `sneha.field@matdatapulse.in` | `Worker@2026!` | Flutter App (Kothrud) |

---

## REST API Endpoints (`server/`)

| Method | Endpoint | Auth / Role | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/health` | Public | PostgreSQL & Redis connectivity check |
| `POST` | `/api/auth/login` | Public (Rate-limited) | Issue JWT access & refresh tokens |
| `POST` | `/api/auth/refresh` | Public (Rate-limited) | Row-locked refresh token rotation |
| `POST` | `/api/auth/logout` | Authenticated | Revoke access `jti` in Redis & refresh token |
| `GET` | `/api/auth/me` | Authenticated | Return current authenticated user |
| `POST` | `/api/surveys` | `field_worker`, `admin` | Ingest single survey or batch array (`1–100`) |
| `GET` | `/api/surveys` | `field_worker` (own), `admin` (all) | Paginated & filtered survey listing |
| `GET` | `/api/surveys/analytics` | `field_worker`, `admin` | Redis-cached KPIs, sentiment % & top 3 issues |
| `PATCH` | `/api/surveys/:id/status` | `admin` only | Row-locked (`FOR UPDATE`) status update (`Verified`, `Flagged`, `Duplicate`) |
| `GET` | `/api/surveys/:id/audit-logs` | `admin` only | Survey audit transition history |
