@echo off
setlocal enabledelayedexpansion

rem ── Determine project root ────────────────────────────────────────────────
if exist "%~dp0apps\" set "ROOT=%~dp0" & goto :root_ok
if exist "%~dp0..\apps\" set "ROOT=%~dp0..\" & goto :root_ok
echo ERROR: Cannot locate apps\ folder relative to this script.
pause
exit /b 1
:root_ok
cd /d "%ROOT%"

rem ── Defaults ─────────────────────────────────────────────────────────────
set "DB_HOST=localhost"
set "DB_PORT=5432"
set "DB_NAME=open_movie_planer"
set "DB_USER=omp_user"
set "DB_PASS=omp_password"
set "DB_ADMIN_USER=postgres"
set "DB_ADMIN_PASS="
set "API_PORT=3000"
set "WEB_PORT=4173"

rem ── Load config.json (via PowerShell) ─────────────────────────────────────
set "CFG=config.json"
if not exist "%CFG%" if exist "deploy\config.json" set "CFG=deploy\config.json"
if not exist "%CFG%" goto :cfg_done
for /f "usebackq delims=" %%v in (`powershell -NoProfile -Command "$c=Get-Content '%CFG%' -Raw | ConvertFrom-Json; 'DB_HOST='+$c.db.host; 'DB_PORT='+$c.db.port; 'DB_NAME='+$c.db.name; 'DB_USER='+$c.db.user; 'DB_PASS='+$c.db.password; 'DB_ADMIN_USER='+$c.db.adminUser; 'DB_ADMIN_PASS='+$c.db.adminPassword; 'API_PORT='+$c.api.port; 'WEB_PORT='+$c.web.port" 2^>nul`) do set "%%v"
echo Loaded configuration from %CFG%
:cfg_done

rem ── Check Node.js + npm ───────────────────────────────────────────────────
where node >nul 2>nul
if errorlevel 1 echo Node.js is required ^(20+^). & exit /b 1
where npm >nul 2>nul
if errorlevel 1 echo npm is required. & exit /b 1

set "OMP_PSQL_EXE=psql"
where psql >nul 2>nul
if not errorlevel 1 goto :psql_ready
for %%p in ("%ProgramFiles%\PostgreSQL\17\bin\psql.exe" "%ProgramFiles%\PostgreSQL\16\bin\psql.exe" "%ProgramFiles%\PostgreSQL\15\bin\psql.exe" "%ProgramFiles%\PostgreSQL\14\bin\psql.exe" "%ProgramFiles(x86)%\PostgreSQL\17\bin\psql.exe" "%ProgramFiles(x86)%\PostgreSQL\16\bin\psql.exe" "%ProgramFiles(x86)%\PostgreSQL\15\bin\psql.exe" "%ProgramFiles(x86)%\PostgreSQL\14\bin\psql.exe") do (
  if exist "%%~p" (
    set "OMP_PSQL_EXE=%%~p"
    goto :psql_ready
  )
)
set "OMP_PSQL_EXE="
:psql_ready

rem ── PostgreSQL via Docker ─────────────────────────────────────────────────
where docker >nul 2>nul
if errorlevel 1 goto :try_local_pg
if not exist "docker-compose.yml" goto :try_local_pg
docker info >nul 2>nul
if errorlevel 1 goto :try_local_pg

set "OMP_PG_ID="
for /f "usebackq delims=" %%i in (`docker compose -p open-movie-planer -f docker-compose.yml ps -aq postgres 2^>nul`) do set "OMP_PG_ID=%%i"
if defined OMP_PG_ID goto :pg_start_existing

echo First run: downloading PostgreSQL image...
docker compose -p open-movie-planer -f docker-compose.yml pull postgres
if errorlevel 1 goto :after_pg
docker compose -p open-movie-planer -f docker-compose.yml up -d postgres
if errorlevel 1 goto :after_pg
goto :pg_wait

:pg_start_existing
echo PostgreSQL data found - starting existing database...
docker compose -p open-movie-planer -f docker-compose.yml up -d postgres

:pg_wait
echo Waiting for PostgreSQL to accept connections...
set "OMP_PG_TRIES=0"
:pg_wait_loop
set /a OMP_PG_TRIES+=1
docker compose -p open-movie-planer -f docker-compose.yml exec -T postgres pg_isready -U %DB_USER% -d %DB_NAME% >nul 2>nul
if not errorlevel 1 echo PostgreSQL is ready. & goto :after_pg
if !OMP_PG_TRIES! geq 30 echo WARNING: PostgreSQL not ready after 60s. & goto :after_pg
ping -n 3 127.0.0.1 >nul
goto :pg_wait_loop

:try_local_pg
set "OMP_PG_STARTED=0"
for %%s in (postgresql-x64-17 postgresql-x64-16 postgresql-x64-15 postgresql-x64-14 postgresql) do (
  if !OMP_PG_STARTED! == 0 (
    sc query "%%s" >nul 2>nul
    if not errorlevel 1 (
      echo Found local PostgreSQL service: %%s
      net start "%%s" >nul 2>nul
      set "OMP_PG_STARTED=1"
    )
  )
)
if !OMP_PG_STARTED! == 1 goto :pg_svc_ok
echo WARNING: No PostgreSQL found. Make sure it is running on %DB_HOST%:%DB_PORT%
echo          ^(user: %DB_USER% ^| db: %DB_NAME%^)
goto :after_pg
:pg_svc_ok
echo PostgreSQL service started or already running.

:after_pg

rem ── Node dependencies ─────────────────────────────────────────────────────
if not exist "apps\api\node_modules" (
  echo Installing API dependencies...
  npm --prefix apps\api ci --omit=dev --no-audit --fund=false
)
if not exist "apps\web\node_modules" (
  echo Installing Web dependencies...
  npm --prefix apps\web ci --no-audit --fund=false
)

rem ── Sync .env files from config.json ──────────────────────────────────────
echo DATABASE_URL=postgresql://%DB_USER%:%DB_PASS%@%DB_HOST%:%DB_PORT%/%DB_NAME%> "apps\api\.env"
echo PORT=%API_PORT%>> "apps\api\.env"
echo Synced apps\api\.env from config.json

echo VITE_API_BASE_URL=> "apps\web\.env"
echo VITE_API_PORT=%API_PORT%>> "apps\web\.env"
echo Synced apps\web\.env from config.json

rem ── Ensure PostgreSQL user + database exist ───────────────────────────────
if "%OMP_PSQL_EXE%"=="" echo WARNING: psql.exe not found. PostgreSQL bootstrap skipped. & goto :skip_psql
set "PGPASSWORD=%DB_ADMIN_PASS%"
set "OMP_PSQL=%OMP_PSQL_EXE% -h %DB_HOST% -p %DB_PORT% -U %DB_ADMIN_USER% -d postgres -w"
%OMP_PSQL% -tc "SELECT 1" >nul 2>nul
if not errorlevel 1 goto :admin_psql_ready
set "PGPASSWORD="
set "OMP_PSQL=%OMP_PSQL_EXE% -d postgres -w"
%OMP_PSQL% -tc "SELECT 1" >nul 2>nul
if not errorlevel 1 goto :admin_psql_ready
echo WARNING: PostgreSQL bootstrap skipped. Could not connect with admin credentials.
echo          Configure db.adminUser and db.adminPassword in config.json for local PostgreSQL installs.
goto :check_app_db
:admin_psql_ready
%OMP_PSQL% -tc "SELECT 1 FROM pg_roles WHERE rolname='%DB_USER%'" 2>nul | find "1" >nul
if not errorlevel 1 goto :user_exists
echo Creating PostgreSQL user %DB_USER%...
%OMP_PSQL% -c "CREATE USER %DB_USER% WITH PASSWORD '%DB_PASS%';" >nul 2>nul
:user_exists
%OMP_PSQL% -tc "SELECT 1 FROM pg_database WHERE datname='%DB_NAME%'" 2>nul | find "1" >nul
if not errorlevel 1 goto :db_exists
echo Creating PostgreSQL database %DB_NAME%...
%OMP_PSQL% -c "CREATE DATABASE %DB_NAME% OWNER %DB_USER%;" >nul 2>nul
:db_exists
%OMP_PSQL% -c "GRANT ALL PRIVILEGES ON DATABASE %DB_NAME% TO %DB_USER%;" >nul 2>nul
:check_app_db
set "PGPASSWORD=%DB_PASS%"
%OMP_PSQL_EXE% -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% -w -tc "SELECT 1" >nul 2>nul
if not errorlevel 1 goto :skip_psql
echo ERROR: Application database login failed for %DB_USER%@%DB_HOST%:%DB_PORT%/%DB_NAME%
echo        Update config.json with valid db.user/db.password or local admin credentials.
pause
exit /b 1
:skip_psql
set "PGPASSWORD="

rem ── Database migrations & Prisma client ──────────────────────────────────
echo Applying database migrations...
npm --prefix apps\api run db:deploy
if errorlevel 1 echo WARNING: Migrations could not be applied - is PostgreSQL running?

echo Generating Prisma client...
npm --prefix apps\api run db:generate
if errorlevel 1 echo WARNING: Prisma client generation failed.

rem ── Build API if dist\ missing ────────────────────────────────────────────
if exist "apps\api\dist\main.js" goto :start_services
echo Building API...
npm --prefix apps\api run build
if errorlevel 1 echo ERROR: API build failed. & pause & exit /b 1

:start_services
echo Starting API on port %API_PORT%...
start "OMP API" cmd /k "cd /d "%ROOT%apps\api" && set PORT=%API_PORT% && npm run start"

echo Starting Web preview on port %WEB_PORT%...
start "OMP WEB" cmd /k "cd /d "%ROOT%apps\web" && npx vite preview --host 0.0.0.0 --port %WEB_PORT%"

echo.
echo Open Movie Planer is starting:
echo - API: http://localhost:%API_PORT%
echo - WEB: http://localhost:%WEB_PORT%
echo.
echo For LAN access use your host IP, e.g. http://192.168.x.x:%WEB_PORT%
echo.
pause
endlocal

