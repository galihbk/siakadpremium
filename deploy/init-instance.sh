#!/usr/bin/env bash
# ==============================================================================
# SIAKAD Premium - membuat folder + .env untuk instance BARU (demo / kampus baru) di server ini
#
# Memakai nilai acak untuk semua rahasia (kata sandi database, JWT, kata sandi admin awal), jadi tidak ada rahasia
# yang perlu diketik atau lewat chat. Kata sandi admin awal hanya ditampilkan SEKALI di layar ini.
#
# Pemakaian:
#   bash init-instance.sh <nama> <domain-induk> "<Nama Kampus>" <SINGKATAN> <email-admin> [port-awal] [folder]
# Contoh (demo Kudus, port 3200-3205, alamat satu tingkat agar tercakup SSL Cloudflare):
#   bash init-instance.sh kudus nextversa.tech "Kampus Kudus" KDS admin@nextversa.tech 3200
#
# Hasil alamat: kudus.nextversa.tech, portal-kudus.nextversa.tech, pmb-kudus..., p2m-kudus..., p3m-kudus...
# ==============================================================================
set -euo pipefail

NAME="${1:-}"; DOMAIN="${2:-}"; CAMPUS="${3:-}"; SHORT="${4:-}"; ADMIN_EMAIL="${5:-}"
PORT_BASE="${6:-3200}"
DIR="${7:-/srv/projects/siakad-${NAME}}"

if [ -z "$NAME" ] || [ -z "$DOMAIN" ] || [ -z "$CAMPUS" ] || [ -z "$SHORT" ] || [ -z "$ADMIN_EMAIL" ]; then
  sed -n '2,15p' "$0" | sed 's/^# \{0,1\}//'
  exit 1
fi
case "$NAME" in *[!a-z0-9]*|"") echo "Nama instance hanya boleh huruf kecil dan angka." >&2; exit 1;; esac
[[ "$PORT_BASE" =~ ^[0-9]+$ ]] || { echo "Port awal harus angka." >&2; exit 1; }

if [ -e "$DIR/.env" ]; then
  echo "SUDAH ADA: $DIR/.env -- tidak ditimpa. Hapus/ubah manual bila memang ingin membuat ulang." >&2
  exit 1
fi

rand() { openssl rand -hex "$1" 2>/dev/null || head -c "$1" /dev/urandom | od -An -tx1 | tr -d ' \n'; }

mkdir -p "$DIR"
PG_PASS="$(rand 16)"
ADMIN_PASS="$(rand 6)Aa1!"
URL_WEB="https://${NAME}.${DOMAIN}"
URL_PORTAL="https://portal-${NAME}.${DOMAIN}"
URL_PMB="https://pmb-${NAME}.${DOMAIN}"
URL_P2M="https://p2m-${NAME}.${DOMAIN}"
URL_P3M="https://p3m-${NAME}.${DOMAIN}"

umask 077
cat > "$DIR/.env" <<EOF
# SIAKAD Premium - instance "${NAME}" (dibuat $(date +%F)). Rahasia: jangan dibagikan / jangan masuk git.
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1

# --- Instance (membedakan container/volume/jaringan dari instance lain di mesin ini) ---
INSTANCE_NAME=${NAME}
SIAKAD_WEB_PORT=$((PORT_BASE))
SIAKAD_API_PORT=$((PORT_BASE + 1))
SIAKAD_PORTAL_PORT=$((PORT_BASE + 2))
SIAKAD_PMB_PORT=$((PORT_BASE + 3))
SIAKAD_P2M_PORT=$((PORT_BASE + 4))
SIAKAD_P3M_PORT=$((PORT_BASE + 5))

# --- Alamat publik (satu tingkat subdomain agar tercakup Cloudflare Universal SSL) ---
PUBLIC_WEB_URL=${URL_WEB}
PUBLIC_PORTAL_URL=${URL_PORTAL}
PUBLIC_PMB_URL=${URL_PMB}
PUBLIC_P2M_URL=${URL_P2M}
PUBLIC_P3M_URL=${URL_P3M}
NEXT_PUBLIC_APP_URL=${URL_PMB}
NEXT_PUBLIC_WEB_URL=${URL_WEB}
NEXT_PUBLIC_PORTAL_URL=${URL_PORTAL}
NEXT_PUBLIC_API_URL=/api/v1
INTERNAL_API_URL=http://api:3001/api/v1

# --- API ---
API_URL=http://localhost:$((PORT_BASE + 1))
API_PREFIX=api/v1

# --- Database (di jaringan Docker instance ini) ---
POSTGRES_USER=siakad
POSTGRES_PASSWORD=${PG_PASS}
POSTGRES_DB=siakad_premium
DATABASE_URL="postgresql://siakad:${PG_PASS}@postgres:5432/siakad_premium?schema=public"

REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=

# --- Rahasia JWT (unik untuk instance ini) ---
JWT_SECRET=$(rand 32)
JWT_EXPIRES_IN=1d
JWT_REFRESH_SECRET=$(rand 32)
JWT_REFRESH_EXPIRES_IN=7d

UPLOAD_PATH=/app/uploads

# --- Email notifikasi (SMTP): isi bila email verifikasi/reset PMB perlu terkirim ---
MAIL_HOST=
MAIL_PORT=587
MAIL_USERNAME=
MAIL_PASSWORD=
MAIL_FROM_ADDRESS=
MAIL_FROM_NAME="${CAMPUS}"

# --- Akun & profil awal (database kosong). Hapus 3 baris BOOTSTRAP_ADMIN_* setelah login pertama. ---
BOOTSTRAP_ADMIN_EMAIL=${ADMIN_EMAIL}
BOOTSTRAP_ADMIN_PASSWORD=${ADMIN_PASS}
BOOTSTRAP_ADMIN_NAME=Super Administrator
BOOTSTRAP_CAMPUS_NAME="${CAMPUS}"
BOOTSTRAP_CAMPUS_SHORT=${SHORT}
EOF
chmod 600 "$DIR/.env"

cat <<EOF

Selesai: $DIR/.env dibuat (izin 600).

  Login Super Admin pertama (CATAT SEKARANG, tidak ditampilkan lagi):
    email     : ${ADMIN_EMAIL}
    kata sandi: ${ADMIN_PASS}

  Tambahkan 5 public hostname di Cloudflare Tunnel:
    ${URL_WEB#https://}           -> http://localhost:$((PORT_BASE))
    ${URL_PORTAL#https://}   -> http://localhost:$((PORT_BASE + 2))
    ${URL_PMB#https://}      -> http://localhost:$((PORT_BASE + 3))
    ${URL_P2M#https://}      -> http://localhost:$((PORT_BASE + 4))
    ${URL_P3M#https://}      -> http://localhost:$((PORT_BASE + 5))

  Berikutnya: GitHub > Actions > jalankan workflow manual dengan customers = demo-${NAME}
EOF
