#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

if ! command -v node >/dev/null 2>&1; then
  echo "Node.js is required (20+)."
  exit 1
fi

if ! command -v npm >/dev/null 2>&1; then
  echo "npm is required."
  exit 1
fi

# ── PostgreSQL via Docker ────────────────────────────────────────────────────
if command -v docker >/dev/null 2>&1 && [[ -f "docker-compose.yml" ]]; then
  COMPOSE="docker compose -p open-movie-planer -f docker-compose.yml"

  # Check whether the postgres container already exists (first run = empty output)
  EXISTING_ID="$($COMPOSE ps -aq postgres 2>/dev/null || true)"

  if [[ -z "$EXISTING_ID" ]]; then
    echo "First run: downloading PostgreSQL image (this may take a moment)..."
    $COMPOSE pull postgres

    echo "Starting PostgreSQL for the first time..."
    $COMPOSE up -d postgres

    echo "Waiting for PostgreSQL to accept connections..."
    for i in $(seq 1 30); do
      if $COMPOSE exec -T postgres pg_isready -U omp_user -d open_movie_planer >/dev/null 2>&1; then
        echo "PostgreSQL is ready."
        break
      fi
      if [[ "$i" -eq 30 ]]; then
        echo "ERROR: PostgreSQL did not become ready within 60 s. Check 'docker compose logs postgres'."
        exit 1
      fi
      sleep 2
    done
  else
    echo "PostgreSQL data found – starting existing database..."
    $COMPOSE up -d postgres
  fi
else
  # Docker not available – try local PostgreSQL service
  PG_STARTED=0

  # systemd (Debian/Ubuntu/Fedora)
  if command -v systemctl >/dev/null 2>&1; then
    for SVC in postgresql postgresql-16 postgresql-15 postgresql-14; do
      if systemctl list-unit-files "${SVC}.service" >/dev/null 2>&1; then
        echo "Found local PostgreSQL service: ${SVC}"
        sudo systemctl start "${SVC}" 2>/dev/null || true
        echo "PostgreSQL service started (or already running)."
        PG_STARTED=1
        break
      fi
    done
  fi

  # macOS Homebrew
  if [[ "$PG_STARTED" -eq 0 ]] && command -v brew >/dev/null 2>&1; then
    if brew list postgresql@16 >/dev/null 2>&1; then
      echo "Starting Homebrew PostgreSQL..."
      brew services start postgresql@16 2>/dev/null || true
      PG_STARTED=1
    elif brew list postgresql >/dev/null 2>&1; then
      echo "Starting Homebrew PostgreSQL..."
      brew services start postgresql 2>/dev/null || true
      PG_STARTED=1
    fi
  fi

  if [[ "$PG_STARTED" -eq 0 ]]; then
    echo "WARNING: Docker not found and no local PostgreSQL service detected."
    echo "         Make sure PostgreSQL is running on localhost:5432"
    echo "         (user: omp_user | password: omp_password | db: open_movie_planer)"
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

# ── Database migrations & client ─────────────────────────────────────────────
echo "Applying database migrations..."
npm --prefix apps/api run db:deploy 2>/dev/null || true

echo "Generating Prisma client..."
npm --prefix apps/api run db:generate >/dev/null 2>&1 || true

API_PORT="${API_PORT:-3000}"
WEB_PORT="${WEB_PORT:-4173}"
WEB_HOST="${WEB_HOST:-0.0.0.0}"

echo "Starting API on port ${API_PORT}..."
(
  cd apps/api
  PORT="$API_PORT" npm run start
) &
API_PID=$!

echo "Starting Web preview on http://${WEB_HOST}:${WEB_PORT} ..."
(
  cd apps/web
  npx vite preview --host "$WEB_HOST" --port "$WEB_PORT"
) &
WEB_PID=$!

echo
echo "Open Movie Planer is starting:"
echo "- API: http://localhost:${API_PORT}"
echo "- WEB: http://localhost:${WEB_PORT}"
echo
echo "For LAN access use your host IP, e.g. http://192.168.x.x:${WEB_PORT}"

cleanup() {
  kill "$API_PID" "$WEB_PID" 2>/dev/null || true
}

trap cleanup INT TERM EXIT
wait
