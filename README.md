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

| Layanan | Port Lokal | Deskripsi |
|---|:---:|---|
| **Website & PMB** | `http://localhost:3000` | Landing Page resmi Institut Teknologi Nusantara (ITN) & Informasi PMB |
| **Portal Civitas** | `http://localhost:3002` | Dashboard Akademik Terpadu (Mahasiswa, Dosen, BAAK / Super Admin) |
| **REST API Engine** | `http://localhost:3001` | Backend API terintegrasi PostgreSQL & Redis |
| **Swagger OpenAPI** | `http://localhost:3001/api/docs` | Dokumentasi interaktif endpoint REST API |

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
   - Membangun image Docker multi-stage untuk `api`, `web`, dan `portal`.
   - Mengunggah container image ke `ghcr.io/galihbk/siakad-api`, `ghcr.io/galihbk/siakad-web`, dan `ghcr.io/galihbk/siakad-portal`.
2. **Self-Hosted Runner (Home Server)**:
   - Menarik image terbaru dari GHCR di `/srv/projects/siakadpremium`.
   - Menjalankan `docker compose -f docker-compose.prod.yml up -d --force-recreate`.
   - Melakukan live health-check otomatis pada port 3000, 3001, dan 3002.

---

## 📄 Lisensi
Hak Cipta © 2026 SIAKAD Premium. Proprietary / All Rights Reserved.
