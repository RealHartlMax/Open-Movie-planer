# Open Movie Planer – Roadmap

Stand: Mai 2026

---

## ✅ MVP – abgeschlossen

| Feature | Status | Notes |
|---|---|---|
| Projekt CRUD (Create/Read/Update) | ✅ | inkl. Status pre/production/post |
| Kostenstellen CRUD + Inline-Budget-Edit | ✅ | |
| Ausgaben CRUD | ✅ | |
| Drehtage CRUD | ✅ | |
| Dashboard (Gesamtbudget, Ist, Restbudget, Top-Kostenstellen, nächste Drehtage) | ✅ | |
| Externe Kostenrechnung (Soll/Ist/Differenz je Kostenstelle) | ✅ | |
| Export / Druckvorschau (PDF + Print für alle Module + Kompletttbericht) | ✅ | html2pdf.js |
| Lokalisierung DE/EN (react-i18next) | ✅ | Sprachumschaltung live |
| Währungseinstellung (EUR/USD/GBP/CHF) | ✅ | localStorage-persistent |
| Settings Modal (Sprache + Währung) | ✅ | |
| Dark Mode | ✅ | CSS-Variablen-basiert |
| Reference Radar (Überblick Modulphasen) | ✅ | |
| Docker Compose Setup | ✅ | API + DB |

---

## ✅ MVP-Nacharbeiten – erledigt

Ursprünglich als offene MVP-Lücken geführt, alle umgesetzt:

| # | Feature | Status | Notes |
|---|---|---|---|
| 1 | **Projektfilter nach Status** (pre/production/post) | ✅ | Filter-Select + Freitextsuche in Projektliste |
| 2 | **ShootDayActivities UI** | ✅ | Vollständige CRUD-UI inkl. Inline-Edit, Transport, Equipment, Catering |
| 3 | **Projekt-Statusbadge** in Projektkarte + Hero-Kachel | ✅ | Farbbadge (pre/production/post) in Liste und zuletzt genutzter Karte |

### Noch offen (MVP-Scope)

| # | Feature | Priorität | Notes |
|---|---|---|---|
| 1 | **Delete** für Projekte, Kostenstellen, Ausgaben, Drehtage | ✅ Umgesetzt | |
| 2 | **Formularvalidierung** (End < Start Datum, Pflichtfelder) | ✅ Umgesetzt | |
| 3 | **CORS-Fix** für Production-Build | ✅ Umgesetzt | API-URL zur Laufzeit aus `window.location.hostname` abgeleitet |
| 4 | **BudgetScenarios UI** | ✅ Umgesetzt | |
| 5 | **CostPositions UI** | ✅ Umgesetzt | |

---

## 🚀 Phase 2 – Should Have

| # | Feature | Status |
|---|---|---|
| 1 | **CSV Import/Export** (Kostenstellen, Ausgaben) | ⬜ offen |
| 2 | **Datei-Upload für Belege** (Receipts an Expense hängen) | ⬜ offen |
| 3 | **Budget-Versionierung** (BudgetScenario vollständig) | ⬜ offen |
| 4 | **Einfaches Rollen- & Rechtekonzept** (Admin / Viewer) | ⬜ offen |
| 5 | **Kontakt- & Terminverwaltung** (Crew/Cast + Kalender) | ✅ API + UI (Kontakte, Termine, Kalenderansicht) |
| 6 | **Drehdispo-Erstellung** (Tagesablaufplan / Call Sheet) | ✅ Vollständig umgesetzt (siehe Details unten) |
| 7 | **Einstellungen: Produktionsfirma + Logo** | ✅ localStorage-persistent (Name, Adresse, Telefon, E-Mail, Website, USt-IdNr., Logo-Upload) |
| 8 | **Vertragsverwaltung** (Cast/Crew-Verträge, Dokumentenlink) | ⬜ offen |
| 9 | **Digitale Zeiterfassung** (Arbeitszeit, Genehmigungsworkflow) | ⬜ offen |
| 10 | **Authentifizierung / Login** (JWT, Sessions) | ⬜ offen · Voraussetzung für Rollen |
| 11 | **Mehrmandantenfähigkeit** (mehrere User-Workspaces) | ⬜ offen · Voraussetzung für SaaS |

### Drehdispo-Erstellung – Umsetzungsstand (Mai 2026)

**Vollständig umgesetzt:**
- Drehtag-Auswahl, Tagesablauf-Aktivitäten CRUD mit Inline-Edit
- Aktivitäten-Felder: Zeit, Titel, Crew, Transport, Equipment, Catering, Notizen
- Rufzeit, Wetter, allgemeine Hinweise direkt in der Dispo pflegbar
- Location-Inhaber und Ansprechperson pro Drehtag
- Szenenübersicht (Szene Nr., Titel, Synopsis, Location, Dauer)
- Crew-Disposition (Name, Funktion, Rufzeit, Wrapzeit, Notizen)
- Cast-Disposition (Darsteller/in, Rolle, Rufzeit, Szenen, Notizen)
- PDF-Export (DIN A4, druckfertig) + Druckvorschau
- API-Endpunkte: `GET /projects/:id/shoot-dispositions[/:shootDayId]`

**Offen für Ausbaustufe:**
- E-Mail-Versand an Crew
- Eigene DB-Modelle für Szenen/Crew/Cast (statt Ableitung aus ShootDayActivity)

---

## 💡 Phase 3 – Could Have

| # | Feature | Notes |
|---|---|---|
| 1 | Kommentare pro Projektobjekt | Diskussionsthread an Cost Center / Shoot Day |
| 2 | Mobile-first UI Optimierung | Responsive Breakpoints, Touch-Gesten |
| 3 | Externe REST-API für Integrationen | OpenAPI vollständig, Webhooks |
| 4 | Erweiterte Dashboard-Charts | z. B. Burn-down, Zeitverlauf Budget vs Ist |
| 5 | Synchron-Disposition | pic_reference/Synchron-Disposition |
| 6 | Suche / Volltextfilter | Projekt-, Kosten- und Drehtag-Suche |
| 7 | Benachrichtigungen / Alerts | z. B. Budget-Warnung bei > 80 % Auslastung |
| 8 | Audit-Log / Änderungshistorie | Wer hat was wann geändert |

---

## ❌ Won't Have (MVP & darüber hinaus)

| Feature | Begründung |
|---|---|
| DATEV-Integration | Rechtliche/steuerliche Komplexität außerhalb Scope |
| Lohn- & Steuerlogik | Eigenes Fachgebiet, separate Tools notwendig |
| Vollständiges ERP-/Mandantenmodell | Zu komplex für Film-Produktions-Nische |
| Finanzbuchhaltung (Buchungslogik) | Nur als Referenzwissen geführt |
| Lohnbuchhaltung | Nur als Referenzwissen geführt |
| Anlagenbuchhaltung | Nur als Referenzwissen geführt |
| Warenwirtschaft | Nur als Referenzwissen geführt |
| Rechnungseingangsbuch | Nur als Referenzwissen geführt |

---

## Nächste empfohlene Schritte

Alle MVP-Nacharbeiten sind abgeschlossen. Die nächsten sinnvollen Schritte kommen aus Phase 2:

1. **CSV Import/Export** (Kostenstellen, Ausgaben) – schneller Mehrwert für Nutzer
2. **Budget-Versionierung** (BudgetScenarios vollständig ausbauen: Vergleich, Historie)
3. **Datei-Upload für Belege** (Receipts an Expense hängen)
4. **Authentifizierung / Login** (JWT) – Voraussetzung für Rollen & Mehrmandantenfähigkeit
5. **Vertragsverwaltung** (Cast/Crew-Verträge, Dokumentenlink)
