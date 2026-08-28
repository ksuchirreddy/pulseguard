<div align="center">

# 🛡️ PulseGuard — Uptime & API Health Monitor

**Enterprise-grade Uptime & API Health Monitoring System with Real-Time Latency Telemetry, Automated Probes, and Incident Management.**

[![Next.js 15](https://img.shields.io/badge/Next.js-15.1.7-black?style=flat&logo=next.js)](https://nextjs.org/)
[![React 19](https://img.shields.io/badge/React-19.0.0-61dafb?style=flat&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38bdf8?style=flat&logo=tailwindcss)](https://tailwindcss.com/)
[![SQLite / PostgreSQL](https://img.shields.io/badge/Database-SQLite_%2F_PostgreSQL-336791?style=flat&logo=postgresql)](https://supabase.com/)

</div>

---

## 📌 Architecture Overview

PulseGuard is engineered as a modern, local-first and cloud-ready infrastructure monitoring suite:

```
┌─────────────────────────────────────────────────────────────┐
│                       PULSEGUARD UI                         │
│   • Real-Time Monitoring Dashboard                          │
│   • Live Latency Area Charts (Recharts)                     │
│   • Public Status Page (/status)                            │
│   • SLA Analytics & Reliability Reports (/analytics)        │
└──────────────────────────────┬──────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────┐
│                    API & PROBE ENGINE                       │
│   • HTTP/HTTPS Health Prober (GET, POST, HEAD, PUT)         │
│   • Automated Edge Cron Runner (/api/cron)                  │
│   • Latency & TTFB Profiling                                │
│   • Automated Incident State Machine                        │
└──────────────────────────────┬──────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────┐
│                    DATA STORAGE LAYER                       │
│   • Local: Built-in zero-config node:sqlite engine          │
│   • Cloud: PostgreSQL / Supabase with Row Level Security    │
└─────────────────────────────────────────────────────────────┘
```

---

## ✨ Features

- **Automated Health Probes:** Configurable check frequencies (30s, 60s, 120s, 300s), custom timeouts, expected HTTP status codes, and HTTP methods.
- **Latency Telemetry:** Time-series response time graphs with custom tooltips and status indicators.
- **Incident State Machine:** Automatically creates an incident ticket upon failure and auto-resolves when the endpoint returns to healthy status.
- **Public Shareable Status Page (`/status`):** Clean, branded status page showing real-time operational status and 90-day incident logs.
- **SLA & Compliance Dashboard (`/analytics`):** Tracks MTTD (Mean Time to Detect), 24h & 30d uptime percentages, and SLA compliance.
- **Zero-Config Local Database:** Uses Node.js native `node:sqlite` out of the box with zero native C++ compilation steps.
- **Supabase Cloud Schema:** Includes `supabase_schema.sql` for 1-click cloud migration.

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Run the Development Server
```bash
npm run dev
```
Open [http://localhost:3005](http://localhost:3005) in your browser.

### 3. Production Build
```bash
npm run build
npm run start
```

---

## 📡 API Reference

| Endpoint | Method | Description |
| :--- | :---: | :--- |
| `/api/monitors` | `GET` | Returns all configured monitors with 24h uptime stats |
| `/api/monitors` | `POST` | Creates a new health monitor and runs initial probe |
| `/api/monitors/[id]` | `GET` | Retrieves monitor details and recent heartbeat telemetry |
| `/api/monitors/[id]/check` | `POST` | Forces an instant probe test |
| `/api/monitors/[id]/toggle` | `POST` | Pauses or resumes monitoring |
| `/api/cron` | `GET/POST`| Automated background runner that pings all active monitors |
| `/api/stats` | `GET` | Aggregated global statistics (Uptime %, Latency, Incidents) |
| `/api/incidents` | `GET` | Fetches active or past incident logs |

---

## 👨‍💻 Author & Engineering Details

Developed by **K. Suchir Reddy**  
*Computer Science & Business Systems · Full-Stack & AI Engineering*
