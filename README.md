# Open Movie Planer

Open Movie Planer ist ein fokussiertes Produktions- und Budgettool für Creator, Indie-Filmer und kleine Produktionsteams.
Es bietet Projektplanung, Budgetkontrolle, Kosten-Tracking, Drehplanung mit Call-Sheet-Export und Kontaktverwaltung – komplett im Browser, ohne Cloud-Zwang.

> **Stand:** Mai 2026 · Version 0.1.0 · Stack: React 18 + NestJS + PostgreSQL + Prisma

---

## Funktionsumfang (aktueller Stand)

| Modul | Status |
|---|---|
| Projektverwaltung (CRUD, Status pre/production/post, Filter) | ✅ |
| Kostenstellen + Inline-Budget-Editing | ✅ |
| Ausgaben-Erfassung + Soll/Ist/Differenz | ✅ |
| Externe Kostenrechnung (Forecast, Endkosten) | ✅ |
| Drehtage CRUD | ✅ |
| Drehdisposition / Call Sheet (Aktivitäten, Szenen, Crew, Cast) | ✅ |
| Aktivitäten mit Transport / Equipment / Catering | ✅ |
| PDF-Export & Druckvorschau (alle Module) | ✅ |
| Dashboard (KPI-Karten, nächste Drehtage, Top-Kostenstellen) | ✅ |
| Kontakt- & Terminverwaltung (Crew/Cast + Kalenderansicht) | ✅ |
| Einstellungen: Sprache (DE/EN), Währung, Produktionsfirma + Logo | ✅ |
| Dark Mode (CSS-Variablen-basiert) | ✅ |
| Lokalisierung DE/EN (react-i18next, Umschaltung live) | ✅ |

---

## Plattformunterstützung

Open Movie Planer läuft nativ auf **Windows, macOS und Linux** – sowohl im Entwicklungs- als auch im Produktionsmodus.
Die Datenbank läuft als Docker-Container (plattformunabhängig) oder als lokale PostgreSQL-Installation.

| Plattform | Entwicklung | Produktion (Deploy-Skript) |
|---|---|---|
| **Windows 10/11** | ✅ | ✅ `deploy\start.bat` |
| **macOS 12+** | ✅ | ✅ `deploy/start.sh` |
| **Linux (Ubuntu 20.04+, Debian 11+)** | ✅ | ✅ `deploy/start.sh` |
| Browser: Chrome 110+, Firefox 115+, Edge 110+, Safari 16+ | ✅ | ✅ |

---

## Systemanforderungen

### Mindestanforderungen

| Komponente | Minimum |
|---|---|
| **Node.js** | 20 LTS |
| **npm** | 10.x (im Lieferumfang von Node 20) |
| **Docker** | 24.x + Docker Compose v2 (für DB-Container) |
| **RAM** | 4 GB (2 GB frei für API + DB) |
| **Disk** | 2 GB (inkl. Node-Module + DB-Volume) |
| **OS** | Windows 10 64-bit · macOS 12 Monterey · Ubuntu 20.04 LTS |
| **Browser** | Chrome 110 · Firefox 115 · Edge 110 · Safari 16 |
| **Bildschirm** | 1280 × 768 px |

### Empfohlene Konfiguration

| Komponente | Empfehlung |
|---|---|
| **Node.js** | 22 LTS |
| **npm** | 10.x |
| **Docker** | 25.x + Docker Compose v2 |
| **RAM** | 8 GB oder mehr |
| **Disk** | 5 GB SSD |
| **OS** | Windows 11 · macOS 14 Sonoma · Ubuntu 22.04 LTS |
| **Browser** | Chrome 120+ · Firefox 120+ · Edge 120+ |
| **Bildschirm** | 1920 × 1080 px (Full HD) oder größer |

> **Hinweis:** Für reinen Browser-Zugriff (kein lokales Entwickeln) reicht ein Gerät mit aktuellem Browser und Internetzugang zum Host.

---

## Schnellstart (Docker – empfohlen)

```bash
# 1. Repository klonen
git clone https://github.com/RealHartlMax/Open-Movie-planer.git
cd Open-Movie-planer

# 2. Datenbank starten
docker compose up -d

# 3. API-Abhängigkeiten installieren & Migration ausführen
cd apps/api
npm install
npm run db:migrate
cd ../..

# 4. Web-Abhängigkeiten installieren
cd apps/web && npm install && cd ../..

# 5. Entwicklungsserver starten
# Terminal 1 – API
cd apps/api && npm run start:dev

# Terminal 2 – Web
cd apps/web && npm run dev
```

Anschließend im Browser öffnen: **http://localhost:5173**

---

## Produktion (Deploy-Skripte)

Die Deploy-Skripte bauen das Web-Frontend und starten API + Web-Preview in einem Schritt:

**Windows:**
```bat
deploy\start.bat
```

**macOS / Linux:**
```bash
chmod +x deploy/start.sh
./deploy/start.sh
```

Standardports: API `3000` · Web `4173`  
Konfiguration erfolgt über `config.json` im Release-Bundle oder `deploy/config.json` im Repo.

Für lokale PostgreSQL-Installationen ohne Docker müssen bei Bedarf zusätzlich `db.adminUser` und `db.adminPassword` gesetzt werden, damit das Skript User, Datenbank und Rechte automatisch anlegen kann.

---

## Datenbankverbindung

| Parameter | Wert |
|---|---|
| Host | `localhost` |
| Port | `5432` (Docker) · `5433` (lokaler Dev-Cluster) |
| Datenbank | `open_movie_planer` |
| User | `omp_user` |
| Passwort | `omp_password` |

Beispiel für lokale PostgreSQL-Installation mit Admin-Login in `config.json`:
```
{
  "db": {
    "host": "localhost",
    "port": 5432,
    "name": "open_movie_planer",
    "user": "omp_user",
    "password": "omp_password",
    "adminUser": "postgres",
    "adminPassword": "DEIN_POSTGRES_PASSWORT"
  }
}
```

Connection String (`apps/api/.env`):
```
DATABASE_URL="postgresql://omp_user:omp_password@localhost:5432/open_movie_planer"
```

> **Lokaler Dev-Cluster (Windows, ohne Docker):**
> ```
> "C:\Program Files\PostgreSQL\16\bin\pg_ctl.exe" -D "D:\..\.pgdata" -l ".pgdata\server.log" -o "-p 5433" start
> ```

---

## Technischer Stack

| Schicht | Technologie |
|---|---|
| Frontend | React 18 · TypeScript · Vite · Tailwind CSS · react-i18next |
| Backend | NestJS 10 · TypeScript |
| ORM | Prisma 5 |
| Datenbank | PostgreSQL 16 |
| PDF-Export | html2pdf.js |
| Container | Docker + Docker Compose |

---

## Projektstruktur

```
apps/
  api/        NestJS-Backend (REST API, Prisma)
  web/        React-Frontend (Vite, Tailwind)
prisma/       Datenbankschema (schema.prisma)
deploy/       Start-Skripte für Windows (start.bat) und Linux/macOS (start.sh)
docs/         Spezifikationen, Roadmap, Backlog, OpenAPI
```

---

## Dokumente

| Dokument | Pfad |
|---|---|
| Roadmap | [docs/roadmap.md](docs/roadmap.md) |
| MVP-Pflichtenheft | [docs/mvp-pflichtenheft.md](docs/mvp-pflichtenheft.md) |
| Priorisierter Backlog | [docs/product-backlog.md](docs/product-backlog.md) |
| REST API (OpenAPI 3.0) | [docs/openapi-mvp.yaml](docs/openapi-mvp.yaml) |
| Datenmodell (Prisma) | [prisma/schema.prisma](prisma/schema.prisma) |
| UI/UX Design-Spec (Darkmode) | [docs/ui-ux-darkmode-spec.md](docs/ui-ux-darkmode-spec.md) |
| Referenz-Zuordnung | [docs/reference-map.md](docs/reference-map.md) |

---

## Lizenz

[GNU AGPL v3](LICENSE)
