#!/usr/bin/env bash
# ==============================================================================
# SIAKAD Premium - skrip update di SERVER KAMPUS
#
# Dijalankan oleh GitHub Actions (lewat SSH, atau langsung oleh self-hosted runner di server itu).
# Variabel yang wajib ada: APP_DIR, IMAGE_TAG, IMAGE_OWNER, GHCR_USER, GHCR_TOKEN
#
# Urutan yang aman:
#   1. cek .env  2. backup database  3. tarik image baru  4. sinkron skema (tanpa menghapus data)
#   5. ganti container  6. cek kesehatan  7. rollback otomatis bila gagal
# Selama langkah 1-4 gagal, container lama TIDAK disentuh dan tetap melayani pengguna.
# ==============================================================================
set -euo pipefail

: "${APP_DIR:?APP_DIR belum diisi}" "${IMAGE_TAG:?IMAGE_TAG belum diisi}" "${IMAGE_OWNER:?IMAGE_OWNER belum diisi}"
: "${GHCR_USER:?GHCR_USER belum diisi}" "${GHCR_TOKEN:?GHCR_TOKEN belum diisi}"

cd "$APP_DIR"
COMPOSE="docker compose -f docker-compose.prod.yml"
export IMAGE_TAG IMAGE_OWNER

log() { printf '\n==> %s\n' "$*"; }
fail() { printf '\n[GAGAL] %s\n' "$*" >&2; exit 1; }
envval() { grep -E "^$1=" .env 2>/dev/null | tail -n1 | cut -d= -f2- | tr -d '"' || true; }

# ---- 1. .env wajib sudah diisi per kampus --------------------------------------
if [ ! -f .env ]; then
  [ -f .env.prod.example ] && cp .env.prod.example .env
  fail "File .env belum ada di $APP_DIR. Template sudah disalin; isi alamat kampus, kata sandi database, dan JWT_SECRET, lalu jalankan ulang."
fi
if grep -qE 'change_me|siakad_secure_password_2026' .env; then
  fail ".env masih memakai kata sandi/rahasia bawaan (JWT_SECRET atau password database). Ganti dengan nilai unik kampus ini sebelum deploy."
fi

INSTANCE="$(envval INSTANCE_NAME)"; INSTANCE="${INSTANCE:-siakad}"
PG_USER="$(envval POSTGRES_USER)"; PG_USER="${PG_USER:-siakad}"
PG_DB="$(envval POSTGRES_DB)"; PG_DB="${PG_DB:-siakad_premium}"
API_PORT="$(envval SIAKAD_API_PORT)"; API_PORT="${API_PORT:-3101}"

PREV_TAG="$(cat .deployed-tag 2>/dev/null || true)"
log "Deploy $IMAGE_TAG ke $APP_DIR (versi sebelumnya: ${PREV_TAG:-belum ada})"

log "Login ke GitHub Container Registry"
printf '%s' "$GHCR_TOKEN" | docker login ghcr.io -u "$GHCR_USER" --password-stdin >/dev/null

# ---- 2. backup database sebelum apa pun berubah --------------------------------
mkdir -p backups-deploy
OUT="(tidak ada backup baru)"
if docker ps --format '{{.Names}}' | grep -qx "${INSTANCE}-postgres-prod"; then
  log "Backup database"
  OUT="backups-deploy/pre-$(date +%Y%m%d-%H%M%S)-${IMAGE_TAG}.sql.gz"
  docker exec "${INSTANCE}-postgres-prod" pg_dump -U "$PG_USER" -d "$PG_DB" | gzip > "$OUT"
  [ -s "$OUT" ] || fail "Backup database kosong; deploy dibatalkan demi keamanan data."
  ls -1t backups-deploy/*.sql.gz 2>/dev/null | tail -n +11 | xargs -r rm -f
  echo "Backup: $OUT"
else
  echo "Database belum berjalan (instalasi pertama) -- backup dilewati."
fi

# ---- 3. tarik image baru -------------------------------------------------------
log "Tarik image $IMAGE_TAG"
$COMPOSE pull

# ---- 4. sinkron skema database (tanpa --accept-data-loss) ----------------------
log "Siapkan database & sinkron skema"
$COMPOSE up -d --wait postgres redis
# View baca-saja untuk OBE (skema obe_api) dijatuhkan dulu supaya tidak menahan perubahan kolom; API memasangnya lagi saat menyala.
$COMPOSE exec -T postgres sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "DROP SCHEMA IF EXISTS obe_api CASCADE"' || true
if ! $COMPOSE run --rm --no-deps api npx prisma db push --skip-generate; then
  fail "Sinkron skema database ditolak (perubahan skema berpotensi menghapus data). Versi lama tetap berjalan. Periksa log di atas, lalu pulihkan dari $OUT bila perlu."
fi

# ---- 5. ganti container --------------------------------------------------------
log "Ganti container ke versi baru"
$COMPOSE up -d --remove-orphans

# ---- 6. cek kesehatan ----------------------------------------------------------
log "Cek kesehatan API (http://localhost:${API_PORT}/api/v1/health)"
OK=0
for _ in $(seq 1 30); do
  if curl -fsS "http://localhost:${API_PORT}/api/v1/health" >/dev/null 2>&1; then OK=1; break; fi
  sleep 3
done

if [ "$OK" != "1" ]; then
  # ---- 7. rollback ---------------------------------------------------------------
  echo "API tidak sehat setelah update." >&2
  if [ -n "$PREV_TAG" ] && [ "$PREV_TAG" != "$IMAGE_TAG" ]; then
    log "Rollback ke $PREV_TAG"
    IMAGE_TAG="$PREV_TAG" $COMPOSE up -d --remove-orphans
  fi
  fail "Deploy $IMAGE_TAG gagal dan dikembalikan ke ${PREV_TAG:-versi sebelumnya}. Backup database sebelum update ada di backups-deploy/."
fi

echo "$IMAGE_TAG" > .deployed-tag
docker image prune -af --filter "until=168h" >/dev/null 2>&1 || true
log "Selesai: $IMAGE_TAG aktif"
