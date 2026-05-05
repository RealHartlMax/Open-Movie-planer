@echo off
setlocal enabledelayedexpansion

rem ── Determine project root ────────────────────────────────────────────────
rem In a release bundle start.bat sits next to apps\, prisma\, docker-compose.yml
rem In the dev repo it lives inside deploy\ – one level below the root
if exist "%~dp0apps\" (
  set "ROOT=%~dp0"
) else if exist "%~dp0..\apps\" (
  set "ROOT=%~dp0..\"
) else (
  echo ERROR: Cannot locate apps\ folder relative to this script.
  echo        Run start.bat from the project root or from the deploy\ folder.
  pause
  exit /b 1
)

cd /d "%ROOT%"

where node >nul 2>nul
if errorlevel 1 (
  echo Node.js is required ^(20+^).
  exit /b 1
)

where npm >nul 2>nul
if errorlevel 1 (
  echo npm is required.
  exit /b 1
)

rem ── PostgreSQL via Docker ─────────────────────────────────────────────────
where docker >nul 2>nul
if errorlevel 1 (
  echo WARNING: Docker not found.
  echo          Make sure PostgreSQL is running on localhost:5432
  echo          ^(user: omp_user ^| password: omp_password ^| db: open_movie_planer^)
  goto :skip_docker
)

if not exist "docker-compose.yml" (
  echo WARNING: docker-compose.yml not found.
  goto :skip_docker
)

rem Test whether Docker daemon is reachable at all
docker info >nul 2>nul
if errorlevel 1 (
  echo WARNING: Docker is installed but not running.
  echo          Start Docker Desktop and re-run this script, or start PostgreSQL manually.
  goto :skip_docker
)

rem Check whether the postgres container already exists (empty = first run)
set "OMP_PG_ID="
for /f "usebackq delims=" %%i in (`docker compose -p open-movie-planer -f docker-compose.yml ps -aq postgres 2^>nul`) do set "OMP_PG_ID=%%i"

if defined OMP_PG_ID (
  echo PostgreSQL data found - starting existing database...
  docker compose -p open-movie-planer -f docker-compose.yml up -d postgres
  if errorlevel 1 (
    echo WARNING: Could not start PostgreSQL container. Continuing anyway...
  )
  goto :pg_wait
)

echo First run: downloading PostgreSQL image ^(this may take a moment^)...
docker compose -p open-movie-planer -f docker-compose.yml pull postgres
if errorlevel 1 (
  echo WARNING: Could not pull PostgreSQL image. Continuing anyway...
  goto :skip_docker
)

echo Starting PostgreSQL for the first time...
docker compose -p open-movie-planer -f docker-compose.yml up -d postgres
if errorlevel 1 (
  echo WARNING: Could not start PostgreSQL container. Continuing anyway...
  goto :skip_docker
)

:pg_wait
echo Waiting for PostgreSQL to accept connections...
set OMP_PG_TRIES=0

:pg_wait_loop
set /a OMP_PG_TRIES+=1
docker compose -p open-movie-planer -f docker-compose.yml exec -T postgres pg_isready -U omp_user -d open_movie_planer >nul 2>nul
if not errorlevel 1 (
  echo PostgreSQL is ready.
  goto :skip_docker
)
if !OMP_PG_TRIES! geq 30 (
  echo WARNING: PostgreSQL did not become ready after 60s. Check: docker compose logs postgres
  goto :skip_docker
)
ping -n 3 127.0.0.1 >nul
goto :pg_wait_loop

:skip_docker

rem ── Node dependencies ─────────────────────────────────────────────────────
if not exist "apps\api\node_modules" (
  echo Installing API dependencies...
  npm --prefix apps\api ci --omit=dev
  if errorlevel 1 exit /b 1
)

if not exist "apps\web\node_modules" (
  echo Installing Web dependencies...
  npm --prefix apps\web ci
  if errorlevel 1 exit /b 1
)

rem ── Database migrations & client ──────────────────────────────────────────
echo Applying database migrations...
npm --prefix apps\api run db:deploy
if errorlevel 1 (
  echo WARNING: Migrations could not be applied - is PostgreSQL running?
)

echo Generating Prisma client...
npm --prefix apps\api run db:generate
if errorlevel 1 (
  echo WARNING: Prisma client generation failed.
)

rem ── Build API if no dist\ present (dev repo) ──────────────────────────────
if not exist "apps\api\dist\main.js" (
  echo Building API ^(first time or no dist\ found^)...
  npm --prefix apps\api run build
  if errorlevel 1 (
    echo ERROR: API build failed.
    pause
    exit /b 1
  )
)

if "%API_PORT%"=="" set API_PORT=3000
if "%WEB_PORT%"=="" set WEB_PORT=4173

echo Starting API on port %API_PORT%...
start "OMP API" cmd /k "cd /d %ROOT%apps\api && set PORT=%API_PORT% && npm run start"

echo Starting Web preview on port %WEB_PORT%...
start "OMP WEB" cmd /k "cd /d %ROOT%apps\web && npx vite preview --host 0.0.0.0 --port %WEB_PORT%"

echo.
echo Open Movie Planer is starting:
echo - API: http://localhost:%API_PORT%
echo - WEB: http://localhost:%WEB_PORT%
echo.
echo For LAN access use your host IP, e.g. http://192.168.x.x:%WEB_PORT%
echo.
pause

endlocal
