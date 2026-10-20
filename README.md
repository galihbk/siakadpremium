# SIAKAD Premium 🎓

> Sistem Informasi Akademik Perguruan Tinggi Terpadu & Modern dengan Arsitektur Monorepo Berstandar Enterprise.

[![CI/CD Pipeline](https://github.com/galihbk/siakadpremium/actions/workflows/ci-cd.yml/badge.svg)](https://github.com/galihbk/siakadpremium/actions/workflows/ci-cd.yml)
[![Turborepo](https://img.shields.io/badge/monorepo-turborepo-ef4444.svg)](https://turbo.build/repo)
[![pnpm](https://img.shields.io/badge/package__manager-pnpm-f97316.svg)](https://pnpm.io/)
[![Next.js](https://img.shields.io/badge/Next.js-15-black.svg)](https://nextjs.org/)
[![NestJS](https://img.shields.io/badge/NestJS-10-ea2845.svg)](https://nestjs.com/)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-5a67d8.svg)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL%2016-336791.svg)](https://www.postgresql.org/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ed.svg)](https://www.docker.com/)

---

## 🏛️ Gambaran Umum

**SIAKAD Premium** adalah produk sistem informasi akademik enterprise-grade yang dirancang khusus untuk perguruan tinggi di Indonesia. Solusi ini mencakup portal pendaftaran mahasiswa baru (PMB), portal perkuliahan mahasiswa, sistem bimbingan dan penilaian dosen, serta dashboard pemantauan BAAK dan pelaporan PDDIKTI.

---

## 🏗️ Struktur Monorepo

```
siakadpremium/
├── apps/
│   ├── web/                     # Next.js 15 Landing Page & PMB Kampus (Port 3000)
│   ├── portal/                  # Next.js 15 Dashboard Terpadu Mahasiswa/Dosen/Admin (Port 3002)
│   ├── p2m/                     # Next.js 15 Situs publik Penjaminan Mutu, subdomain p2m. (Port 3005)
│   ├── p3m/                     # Next.js 15 Situs publik LP3M (penelitian & pengabdian), subdomain p3m. (Port 3006)
│   ├── pmb/                     # Next.js 15 Portal Penerimaan Mahasiswa Baru, subdomain pmb. (Port 3004)
│   └── api/                     # NestJS 10 Enterprise REST API Backend (Port 3001)
├── packages/
│   ├── database/                # Prisma ORM v6 (PostgreSQL Schema, Client Singleton, Seed Data)
│   ├── types/                   # Shared TypeScript Domain Types, Enums & DTOs
│   ├── utils/                   # Shared Utilities (Format Rupiah, Tanggal Indo, IPK Calc)
│   ├── auth/                    # Shared Auth Constants, Role Hierarchy & Session
│   ├── ui/                      # Shared UI Components (Button, Card, Badge, Input, Table)
│   ├── config/                  # Shared Constants & Tailwind Config Presets
│   └── eslint-config/           # Monorepo Shared ESLint Configurations
├── docker/
│   ├── postgres/                # PostgreSQL init scripts (UUID & pgcrypto extension)
│   └── redis/                   # Redis configuration & persistence
├── .github/workflows/           # GitHub Actions CI/CD Pipeline (Build & GHCR Push + Self-Hosted Deploy)
├── docker-compose.yml           # Development Docker Compose (Postgres & Redis)
├── docker-compose.prod.yml      # Production Full-Stack Docker Compose (ghcr.io images)
└── turbo.json                   # Turborepo Build Pipeline Orchestration
```

---

## 🚀 Port & Akses Layanan

| Layanan | Port Lokal (Dev) | Port Host Server (Prod) | Deskripsi |
|---|:---:|:---:|---|
| **Website & PMB** | `http://localhost:3000` | `http://<server-ip>:3100` | Landing Page resmi ITN & Informasi PMB |
| **REST API Engine** | `http://localhost:3001` | `http://<server-ip>:3101` | Backend API terintegrasi PostgreSQL & Redis |
| **Portal Civitas** | `http://localhost:3002` | `http://<server-ip>:3102` | Dashboard Terpadu (Mahasiswa, Dosen, Admin BAAK) |
| **Swagger OpenAPI** | `http://localhost:3001/api/docs` | `http://<server-ip>:3101/api/docs` | Dokumentasi interaktif endpoint REST API |

> **Catatan Server**: Port server produksi dialokasikan pada range `3100 - 3102` sehingga tidak bentrok dengan container lain di server Anda (`jpcloud-web` di port 3000, `jpcloud-api` di port 4000, atau `portainer` di port 9000).


---

## ⚡ Quick Start (Development)

### 1. Prasyarat
- Node.js >= 20.x
- pnpm >= 9.x
- Docker & Docker Compose

### 2. Instalasi Dependensi
```bash
# Clone repository
git clone https://github.com/galihbk/siakadpremium.git
cd siakadpremium

# Install package monorepo
pnpm install
```

### 3. Setup Database & Environment
```bash
# Salin environment file
cp .env.example .env

# Jalankan PostgreSQL & Redis
docker compose up -d

# Generate Prisma Client & Migrate
pnpm --filter @siakad/database db:generate
pnpm --filter @siakad/database db:migrate

# Isi data awal (seed)
pnpm --filter @siakad/database db:seed
```

### 4. Menjalankan Semua Aplikasi
```bash
pnpm dev
```

---

## 🚢 CI/CD & Production Deployment (Home Server)

Sistem deployment mengadopsi arsitektur containerized dengan **GitHub Container Registry (GHCR)** dan **Self-Hosted Runner**:

1. **GitHub Cloud Runner**:
   - Membangun image Docker multi-stage untuk `api`, `web`, `pmb`, dan `portal`.
   - Mengunggah container image ke `ghcr.io/galihbk/siakad-api`, `ghcr.io/galihbk/siakad-web`, `ghcr.io/galihbk/siakad-pmb`, dan `ghcr.io/galihbk/siakad-portal`.
2. **Self-Hosted Runner (Home Server)**:
   - Menarik image terbaru dari GHCR di `/srv/projects/siakadpremium`.
   - Menjalankan `docker compose -f docker-compose.prod.yml up -d --force-recreate`.
   - Melakukan live health-check otomatis pada port 3000, 3001, dan 3002.

---

## 📄 Lisensi
Hak Cipta © 2026 SIAKAD Premium. Proprietary / All Rights Reserved.

---

## 🔗 Integrasi OBE (Outcome-Based Education)

SIAKAD menyediakan endpoint **baca-saja** agar sistem OBE dapat menarik data akademik. Modul: `apps/api/src/modules/obe-integration`.

- **Alamat dasar:** `{API_URL}/api/v1/integrations/obe` (isi sebagai *Base URL* di OBE → Pengaturan → Integrasi → SIAKAD).
- **Autentikasi:** `Authorization: Bearer <OBE_API_KEY>` (server-ke-server, bukan token pengguna). Atur `OBE_API_KEY` di `.env`; kosong = endpoint ditutup (503).
- **Paginasi:** `page` dan `per_page` (default 200, maks. 500); jawaban memuat `data` dan `meta.last_page`.

| Endpoint (GET) | Isi |
|---|---|
| `institutions` | Nama dan singkatan kampus (dari pengaturan situs) |
| `faculties`, `study-programs` | Fakultas dan program studi (`degree`: D3/D4/S1/S2/S3/PROFESI) |
| `students` | NIM, nama, email, program studi, status |
| `lecturers` | Dosen ber-NIDN/NUPTK/NIP (`nidn` = NIDN, bila kosong NUPTK, lalu NIP) |
| `courses` | Kode, nama, SKS |
| `curriculum-courses` | Mata kuliah di dalam kurikulum: kode/nama/tahun/status kurikulum, program studi, semester, SKS, jenis (`MANDATORY`/`ELECTIVE`) |
| `academic-periods` | Tahun akademik + semester, kode mis. `2026/2027-GANJIL` |
| `course-offerings` | Kelas: mata kuliah, periode, kode kelas, dosen |
| `enrollments` | KRS berstatus APPROVED yang terikat ke kelas |
| `grades` | Nilai FINAL: komponen Tugas/UTS/UAS bila terisi, ditambah nilai akhir. `totalScore` di database bercampur skala 0-100 dan indeks 0-4, sehingga skalanya dikirim lewat `max_score` |

Hanya data akademik yang dibagikan; tidak ada NIK, alamat, data orang tua, atau keuangan.
