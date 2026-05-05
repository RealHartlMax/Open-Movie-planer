# Open Movie Planer – MVP Pflichtenheft

Stand: Mai 2026 (aktualisiert)

## 1. Produktziel

Entwicklung eines fokussierten Produktions- und Budgettools fuer kleine Film- und Content-Produktionen.
Das System optimiert Planung und Kostenkontrolle, ohne ERP-Komplexitaet aus Phase 1 vorwegzunehmen.

**Status: MVP vollständig implementiert und deployed.**

## 2. Abgrenzung

### In Scope (MVP – alle umgesetzt)

- Projektmanagement (CRUD, Status, Stammdaten, Statusfilter)
- Budgetierung ueber Kostenstellen (inkl. Inline-Edit)
- Kosten-Tracking (manuelle Ausgaben, Soll/Ist/Differenz)
- Externe Kostenrechnung (Forecast, Endkosten)
- Einfache Drehplanung (Drehtage, Drehdisposition/Call Sheet)
- Drehdispo-Aktivitäten (Transport, Equipment, Catering, PDF-Export)
- Kontakt- & Terminverwaltung (Crew/Cast, Kalender)
- Dashboard mit Kernkennzahlen
- Lokalisierung DE/EN
- Einstellungen (Sprache, Währung, Produktionsfirma + Logo)

### Out of Scope (MVP)

- Lohnabrechnung und Tariflogik
- DATEV-/ELSTER-Integration
- Vollstaendige Finanzbuchhaltung
- Multi-Mandanten-Architektur
- Authentifizierung / Login (Phase 2)

## 3. Rollenmodell (MVP)

- Admin: Vollzugriff
- Editor: Projekte, Budget, Ausgaben, Drehplan bearbeiten
- Viewer: Lesender Zugriff auf Reports und Planung

Hinweis: Rollenmodell in MVP auf einfache Application Roles begrenzen (noch nicht umgesetzt, Phase 2).

## 4. Funktionale Anforderungen

### 4.1 Projekte

- Projekt anlegen, bearbeiten, archivieren
- Statuswerte: pre, production, post
- Zeitfenster: start_date, end_date
- Filterung nach Status in der Projektliste

### 4.2 Kostenstellen und Budget

- Kostenstellen je Projekt anlegen
- Budget pro Kostenstelle pflegen (Inline-Edit)
- Budgetsumme pro Projekt aggregieren

### 4.3 Ausgaben

- Ausgabe erfassen mit Betrag, Datum, Kostenstelle, Beschreibung
- Ausgabe einem Projekt zuordnen
- Soll/Ist je Kostenstelle und gesamt berechnen

### 4.4 Drehplanung

- Drehtag mit Datum, Location (inkl. Inhaber + Ansprechperson), Notiz erfassen
- Drehtage je Projekt listen und nach Datum sortieren
- Drehdisposition / Call Sheet pro Drehtag:
  - Tagesablauf-Aktivitäten (Zeit, Titel, Crew, Transport, Equipment, Catering, Notizen)
  - Szenenübersicht, Crew-Disposition, Cast-Disposition
  - PDF-Export (druckfertig)

### 4.5 Dashboard

- Kennzahlen je Projekt:
  - Gesamtbudget
  - Gesamtausgaben
  - Restbudget
  - Top-Kostenstellen nach Ausgaben
  - Naechste Drehtage

### 4.6 Einstellungen

- Sprache (Deutsch / Englisch, live umschaltbar)
- Währung (EUR / USD / GBP / CHF)
- Produktionsfirma: Name, Adresse, Telefon, E-Mail, Website, USt-IdNr., Logo-Upload
- Alle Einstellungen localStorage-persistent (kein Login erforderlich)

### 4.7 Kontakt- & Terminverwaltung

- Kontakte (Crew/Cast) mit Funktion, Telefon, E-Mail
- Termine mit Kontaktzuordnung, Datum, Ort, Beschreibung
- Kalenderansicht (Monatsübersicht)

## 5. Nicht-funktionale Anforderungen

- Performance: Tabellenansichten sollen bei typischer Projektgroesse (< 10.000 Buchungen) flüssig reagieren
- Sicherheit: Authentifizierung fuer alle schreibenden Endpunkte (Phase 2)
- Nachvollziehbarkeit: created_at/updated_at auf zentralen Entitaeten
- Datenintegritaet: FK-Constraints, referentielle Integritaet
- Plattformunabhaengigkeit: Windows / macOS / Linux (Node.js 20+, Docker)

## 6. Architektur (umgesetzt)

- Backend: Modularer Monolith (NestJS 10) – REST API, Prisma ORM
- Frontend: React 18 + TypeScript + Vite + Tailwind CSS + react-i18next
- DB: PostgreSQL 16 (Docker-Container)
- ORM: Prisma 5
- PDF-Export: html2pdf.js
- Deploy: `deploy/start.sh` (Linux/macOS) + `deploy/start.bat` (Windows)

## 7. Releasekriterien (MVP)

- Alle Must-Have Features produktiv nutzbar ✅
- Testabdeckung fuer Kernlogik (Budget, Restbudget, Summenbildung)
- Deployment auf einer Staging-Umgebung
- Grundlegendes Fehler- und Audit-Logging aktiviert
