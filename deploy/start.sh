#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

if ! command -v node >/dev/null 2>&1; then echo "Node.js is required (20+)." && exit 1; fi
if ! command -v npm  >/dev/null 2>&1; then echo "npm is required."           && exit 1; fi

# ── Load config.json ─────────────────────────────────────────────────────────
CFG="config.json"
[[ ! -f "$CFG" && -f "deploy/config.json" ]] && CFG="deploy/config.json"

DB_HOST="localhost"
DB_PORT="5432"
DB_NAME="open_movie_planer"
DB_USER="omp_user"
DB_PASS="omp_password"
DB_ADMIN_USER="postgres"
DB_ADMIN_PASS=""
API_PORT="3000"
WEB_PORT="4173"
WEB_HOST="0.0.0.0"

if [[ -f "$CFG" ]]; then
  _json() { python3 -c "import json,sys; d=json.load(open('$CFG')); print(d$1)" 2>/dev/null || true; }
  DB_HOST="$( _json "['db']['host']"     || echo "$DB_HOST" )"; DB_HOST="${DB_HOST:-localhost}"
  DB_PORT="$( _json "['db']['port']"     || echo "$DB_PORT" )"; DB_PORT="${DB_PORT:-5432}"
  DB_NAME="$( _json "['db']['name']"     || echo "$DB_NAME" )"; DB_NAME="${DB_NAME:-open_movie_planer}"
  DB_USER="$( _json "['db']['user']"     || echo "$DB_USER" )"; DB_USER="${DB_USER:-omp_user}"
  DB_PASS="$( _json "['db']['password']" || echo "$DB_PASS" )"; DB_PASS="${DB_PASS:-omp_password}"
  DB_ADMIN_USER="$( _json "['db']['adminUser']" || echo "$DB_ADMIN_USER" )"; DB_ADMIN_USER="${DB_ADMIN_USER:-postgres}"
  DB_ADMIN_PASS="$( _json "['db']['adminPassword']" || echo "$DB_ADMIN_PASS" )"; DB_ADMIN_PASS="${DB_ADMIN_PASS:-}"
  API_PORT="$(_json "['api']['port']"    || echo "$API_PORT")"; API_PORT="${API_PORT:-3000}"
  WEB_PORT="$(_json "['web']['port']"    || echo "$WEB_PORT")"; WEB_PORT="${WEB_PORT:-4173}"
  echo "Loaded configuration from $CFG"
else
  echo "config.json not found – using defaults."
fi

# ── PostgreSQL via Docker ────────────────────────────────────────────────────
if command -v docker >/dev/null 2>&1 && [[ -f "docker-compose.yml" ]] && docker info >/dev/null 2>&1; then
  COMPOSE="docker compose -p open-movie-planer -f docker-compose.yml"
  EXISTING_ID="$($COMPOSE ps -aq postgres 2>/dev/null || true)"

  if [[ -z "$EXISTING_ID" ]]; then
    echo "First run: downloading PostgreSQL image (this may take a moment)..."
    $COMPOSE pull postgres
    echo "Starting PostgreSQL for the first time..."
    $COMPOSE up -d postgres
    echo "Waiting for PostgreSQL to accept connections..."
    for i in $(seq 1 30); do
      if $COMPOSE exec -T postgres pg_isready -U "$DB_USER" -d "$DB_NAME" >/dev/null 2>&1; then
        echo "PostgreSQL is ready."; break
      fi
      [[ "$i" -eq 30 ]] && echo "WARNING: PostgreSQL not ready after 60s." && break
      sleep 2
    done
  else
    echo "PostgreSQL data found – starting existing database..."
    $COMPOSE up -d postgres
  fi
else
  # Docker not available – try local service
  PG_STARTED=0
  if command -v systemctl >/dev/null 2>&1; then
    for SVC in postgresql postgresql-17 postgresql-16 postgresql-15 postgresql-14; do
      if systemctl list-unit-files "${SVC}.service" >/dev/null 2>&1; then
        echo "Found local PostgreSQL service: ${SVC}"
        sudo systemctl start "${SVC}" 2>/dev/null || true
        echo "PostgreSQL service started (or already running)."
        PG_STARTED=1; break
      fi
    done
  fi
  if [[ "$PG_STARTED" -eq 0 ]] && command -v brew >/dev/null 2>&1; then
    for BREW_SVC in postgresql@17 postgresql@16 postgresql@15 postgresql; do
      if brew list "$BREW_SVC" >/dev/null 2>&1; then
        echo "Starting Homebrew PostgreSQL ($BREW_SVC)..."
        brew services start "$BREW_SVC" 2>/dev/null || true
        PG_STARTED=1; break
      fi
    done
  fi
  if [[ "$PG_STARTED" -eq 0 ]]; then
    echo "WARNING: No PostgreSQL found. Make sure it is running on ${DB_HOST}:${DB_PORT}"
    echo "         (user: ${DB_USER} | db: ${DB_NAME})"
  fi
fi

# ── Node dependencies ────────────────────────────────────────────────────────
if [[ ! -d "apps/api/node_modules" ]]; then
  echo "Installing API dependencies..."
  npm --prefix apps/api ci --omit=dev --no-audit
fi
if [[ ! -d "apps/web/node_modules" ]]; then
  echo "Installing Web dependencies..."
  npm --prefix apps/web ci --no-audit
fi

# ── Sync .env files from config.json ─────────────────────────────────────────
printf 'DATABASE_URL="postgresql://%s:%s@%s:%s/%s"\nPORT=%s\n' \
  "$DB_USER" "$DB_PASS" "$DB_HOST" "$DB_PORT" "$DB_NAME" "$API_PORT" > "apps/api/.env"
echo "Synced apps/api/.env from config.json"

printf 'VITE_API_BASE_URL=\nVITE_API_PORT=%s\n' "$API_PORT" > "apps/web/.env"
echo "Synced apps/web/.env from config.json"

# ── Ensure PostgreSQL user + database exist (local install) ──────────────────
if command -v psql >/dev/null 2>&1; then
  export PGPASSWORD="$DB_PASS"
  if psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -w -tc "SELECT 1" >/dev/null 2>&1; then
    unset PGPASSWORD
  else
    if [[ -z "$DB_ADMIN_PASS" ]] && [[ -t 0 ]]; then
      read -r -s -p "PostgreSQL admin password for local bootstrap: " DB_ADMIN_PASS
      echo
    fi
  export PGPASSWORD="$DB_ADMIN_PASS"
  OMP_PSQL=(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_ADMIN_USER" -d postgres -w)
  if ! "${OMP_PSQL[@]}" -tc "SELECT 1" >/dev/null 2>&1; then
    unset PGPASSWORD
    OMP_PSQL=(psql -d postgres -w)
  fi
  if "${OMP_PSQL[@]}" -tc "SELECT 1" >/dev/null 2>&1; then
    if ! "${OMP_PSQL[@]}" -tc "SELECT 1 FROM pg_roles WHERE rolname='${DB_USER}'" 2>/dev/null | grep -q 1; then
      echo "Creating PostgreSQL user ${DB_USER}..."
      "${OMP_PSQL[@]}" -c "CREATE USER ${DB_USER} WITH PASSWORD '${DB_PASS}';" >/dev/null 2>&1 || true
    fi
    if ! "${OMP_PSQL[@]}" -tc "SELECT 1 FROM pg_database WHERE datname='${DB_NAME}'" 2>/dev/null | grep -q 1; then
      echo "Creating PostgreSQL database ${DB_NAME}..."
      "${OMP_PSQL[@]}" -c "CREATE DATABASE ${DB_NAME} OWNER ${DB_USER};" >/dev/null 2>&1 || true
    fi
    "${OMP_PSQL[@]}" -c "GRANT ALL PRIVILEGES ON DATABASE ${DB_NAME} TO ${DB_USER};" >/dev/null 2>&1 || true
  else
    echo "WARNING: PostgreSQL bootstrap skipped. Set db.adminUser/db.adminPassword in config.json for local PostgreSQL installs."
  fi
  export PGPASSWORD="$DB_PASS"
  if ! psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -w -tc "SELECT 1" >/dev/null 2>&1; then
    echo "ERROR: Application database login failed for ${DB_USER}@${DB_HOST}:${DB_PORT}/${DB_NAME}"
    echo "       Update config.json with valid db.user/db.password or local admin credentials."
    exit 1
  fi
  unset PGPASSWORD
  fi
fi

# ── Database migrations & Prisma client ──────────────────────────────────────
echo "Applying database migrations..."
npm --prefix apps/api run db:deploy || echo "WARNING: Migrations could not be applied – is PostgreSQL running?"

HAS_MIGRATIONS=0
if [[ -d "prisma/migrations" ]]; then
  if find "prisma/migrations" -mindepth 1 -maxdepth 1 -type d | grep -q .; then
    HAS_MIGRATIONS=1
  fi
fi
if [[ "$HAS_MIGRATIONS" -eq 0 ]]; then
  echo "No Prisma migrations found - syncing schema via db push..."
  export DATABASE_URL="postgresql://${DB_USER}:${DB_PASS}@${DB_HOST}:${DB_PORT}/${DB_NAME}"
  npx --yes prisma db push --schema prisma/schema.prisma
  unset DATABASE_URL
fi

echo "Generating Prisma client..."
npm --prefix apps/api run db:generate >/dev/null 2>&1 || true

# ── Start services ────────────────────────────────────────────────────────────
echo "Starting API on port ${API_PORT}..."
( cd apps/api; PORT="$API_PORT" npm run start ) &
API_PID=$!

echo "Starting Web preview on http://${WEB_HOST}:${WEB_PORT} ..."
( cd apps/web; npx vite preview --host "$WEB_HOST" --port "$WEB_PORT" ) &
WEB_PID=$!

echo
echo "Open Movie Planer is starting:"
echo "- API: http://localhost:${API_PORT}"
echo "- WEB: http://localhost:${WEB_PORT}"
echo
echo "For LAN access use your host IP, e.g. http://192.168.x.x:${WEB_PORT}"

cleanup() { kill "$API_PID" "$WEB_PID" 2>/dev/null || true; }
trap cleanup INT TERM EXIT
wait

