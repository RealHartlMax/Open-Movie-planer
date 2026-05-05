# Open Movie Planer – Product Backlog

Stand: Mai 2026

---

## MoSCoW-Priorisierung – aktueller Status

### Must Have (Release 1.0) — ✅ alle umgesetzt

| # | Feature | Status |
|---|---|---|
| 1 | Projektverwaltung (CRUD, Status pre/production/post, Filter) | ✅ |
| 2 | Kostenstellenverwaltung (CRUD, Inline-Budget-Edit) | ✅ |
| 3 | Ausgaben erfassen (CRUD, Soll/Ist/Differenz) | ✅ |
| 4 | Drehplanung (Drehtage CRUD, Drehdispo/Call Sheet + Aktivitäten) | ✅ |
| 5 | Dashboard (Gesamtbudget, Ist, Restbudget, Top-Kostenstellen, nächste Drehtage) | ✅ |

### Should Have (Phase 2)

| # | Feature | Status |
|---|---|---|
| 1 | CSV Import/Export (Kostenstellen, Ausgaben) | ⬜ offen |
| 2 | Datei-Upload für Belege (Receipts an Expense) | ⬜ offen |
| 3 | Budget-Versionierung (BudgetScenarios vollständig) | ⬜ offen |
| 4 | Einfaches Rollen- & Rechtekonzept (Admin / Viewer) | ⬜ offen |
| 5 | Kontakt- & Terminverwaltung (Crew/Cast + Kalender) | ✅ |
| 6 | Drehdispo-Erstellung (Call Sheet, PDF-Export) | ✅ inkl. Transport/Equipment/Catering |
| 7 | Einstellungen: Produktionsfirma + Logo | ✅ |
| 8 | Vertragsverwaltung (Cast/Crew-Verträge, Dokumentenlink) | ✅ API + UI Basis |
| 9 | Digitale Zeiterfassung (Arbeitszeit, Genehmigungsworkflow) | ✅ API + UI Basis |
| 10 | Authentifizierung / Login (JWT, Sessions) | ⬜ offen |

### Could Have (Phase 3)

| # | Feature | Status |
|---|---|---|
| 1 | Kommentare pro Projektobjekt | ⬜ offen |
| 2 | Mobile-first UI Optimierung | ⬜ offen |
| 3 | Externe API für Integrationen | ⬜ offen |
| 4 | Erweiterte Dashboard-Charts (Burn-down, Zeitverlauf) | ⬜ offen |
| 5 | Synchron-Disposition | ⬜ offen |
| 6 | Suche / Volltextfilter (Projekt-, Kosten-, Drehtag-Suche) | ⬜ offen |

### Won't Have (MVP)

| Feature | Begründung |
|---|---|
| DATEV-Integration | Außerhalb Scope |
| Lohn- & Steuerlogik | Eigenes Fachgebiet |
| Vollständiges ERP-/Mandantenmodell | Zu komplex |

---

## Offene Lücken im MVP-Scope (Nacharbeiten)

| # | Feature | Priorität |
|---|---|---|
| 1 | **Delete-UI** für Projekte, Kostenstellen, Ausgaben, Drehtage | ✅ Umgesetzt |
| 2 | **Formularvalidierung** (End < Start, Pflichtfelder konsistent) | ✅ Umgesetzt |
| 3 | **CORS-Fix** für Production-Build | ✅ Umgesetzt |
| 4 | **BudgetScenarios UI** | ✅ Umgesetzt |
| 5 | **CostPositions UI** (Kalkulationspositionen je Kostenstelle) | ✅ Umgesetzt |

---

## MVP User Stories – Status

| ID | User Story (Kurzform) | Status |
|---|---|---|
| US-001 | Projekt anlegen | ✅ |
| US-002 | Projektstammdaten bearbeiten | ✅ |
| US-003 | Projekte nach Status filtern | ✅ |
| US-004 | Kostenstellen pro Projekt anlegen | ✅ |
| US-005 | Kostenstellenbudgets inline bearbeiten | ✅ |
| US-006 | Budget-Gesamtsumme sehen | ✅ |
| US-007 | Ausgaben erfassen | ✅ |
| US-008 | Ausgaben pro Kostenstelle sehen | ✅ |
| US-009 | Soll/Ist/Differenz pro Kostenstelle sehen | ✅ |
| US-010 | Restbudget auf Projektebene sehen | ✅ |
| US-011 | Drehtage anlegen | ✅ |
| US-012 | Drehtage chronologisch sehen | ✅ |
| US-013 | Nächste Drehtage im Dashboard sehen | ✅ |
| US-014 | Top-Kostenstellen nach Ausgaben sehen | ✅ |
| US-015 | Dashboard-Kernkennzahlen sehen | ✅ |

> Vollständige Akzeptanzkriterien und technisches Delivery-Board sind im ursprünglichen Backlog-Dokument (Stand Projektstart) dokumentiert.
> UI/UX-Richtlinien inkl. Darkmode sind verbindlich in [docs/ui-ux-darkmode-spec.md](ui-ux-darkmode-spec.md) definiert.

| ID | User Story | Akzeptanzkriterien | Referenzpfad |
|---|---|---|---|
| US-001 | Als Produktionsleiter moechte ich ein Projekt anlegen, damit ich Budget und Planung zentral verwalten kann. | Ein Projekt kann mit Titel und Status angelegt werden; Projekt erscheint in der Liste; Pflichtfelder werden validiert. | pic_reference/Kalkulation |
| US-002 | Als Produktionsleiter moechte ich Projektstammdaten bearbeiten, damit Zeitfenster und Beschreibung aktuell bleiben. | Titel, Beschreibung, Start- und Enddatum sind editierbar; Aenderungen sind nach Reload sichtbar; Enddatum darf nicht vor Startdatum liegen. | pic_reference/Kalkulation |
| US-003 | Als Teammitglied moechte ich Projekte nach Status filtern, damit ich schnell aktive Produktionen sehe. | Filter fuer pre, production, post vorhanden; Trefferliste aktualisiert sich sofort; Filter kann zurueckgesetzt werden. | pic_reference/Kalkulation |
| US-004 | Als Produktionsleiter moechte ich Kostenstellen pro Projekt anlegen, damit Budgets strukturiert sind. | Kostenstelle mit Name und Budget anlegbar; Kostenstelle ist genau einem Projekt zugeordnet; Duplikatnamen im selben Projekt werden verhindert. | pic_reference/Kalkulation |
| US-005 | Als Produktionsleiter moechte ich Kostenstellenbudgets inline bearbeiten, damit ich schnell auf Planungsupdates reagiere. | Budget ist direkt in der Tabelle editierbar; nur numerische Werte >= 0 erlaubt; Gesamtbudget aktualisiert sich ohne Seitenwechsel. | pic_reference/Kalkulation |
| US-006 | Als Produktionsleiter moechte ich die Budget-Gesamtsumme sehen, damit ich den finanziellen Rahmen auf einen Blick kenne. | Gesamtbudget berechnet sich als Summe aller Kostenstellen; Wert aktualisiert sich nach jeder Aenderung; Dezimalwerte werden korrekt gerundet dargestellt. | pic_reference/Kalkulation |
| US-007 | Als Produktionsassistenz moechte ich Ausgaben erfassen, damit Ist-Kosten laufend dokumentiert sind. | Ausgabe mit Betrag, Datum, Kostenstelle und Notiz speicherbar; Betrag ist Pflichtfeld; Ausgabe erscheint sofort in der Ausgabenliste. | pic_reference/externe-Kostenrechnung |
| US-008 | Als Produktionsleiter moechte ich Ausgaben pro Kostenstelle sehen, damit ich Budgetabweichungen erkenne. | Liste kann nach Kostenstelle gefiltert werden; Summen pro Kostenstelle werden angezeigt; Filter wirkt auf Tabellenansicht und Summenzeile. | pic_reference/externe-Kostenrechnung |
| US-009 | Als Produktionsleiter moechte ich Soll/Ist pro Kostenstelle sehen, damit ich Ueberziehungen frueh erkenne. | Spalten Budget, Ist und Differenz vorhanden; Differenz wird als Budget minus Ist berechnet; negative Differenz wird visuell hervorgehoben. | pic_reference/externe-Kostenrechnung |
| US-010 | Als Produktionsleiter moechte ich Restbudget auf Projektebene sehen, damit ich Ausgaben steuern kann. | Restbudget = Gesamtbudget minus Gesamtausgaben; Wert wird auf Dashboard und Budgetseite identisch angezeigt; Berechnung ist auch bei leeren Datensaetzen korrekt. | pic_reference/externe-Kostenrechnung |
| US-011 | Als Disponent moechte ich Drehtage anlegen, damit Ablauf und Locations geplant sind. | Drehtag mit Datum, Location und Notiz anlegbar; Datum ist Pflichtfeld; Drehtag wird dem richtigen Projekt zugeordnet. | pic_reference/Drehplan |
| US-012 | Als Disponent moechte ich Drehtage chronologisch sehen, damit ich den Ablauf sicher steuern kann. | Drehtage werden standardmaessig aufsteigend sortiert; gleiche Daten bleiben stabil sortiert; Liste aktualisiert sich direkt nach Neuanlage. | pic_reference/Drehplan |
| US-013 | Als Produktionsleiter moechte ich naechste Drehtage im Dashboard sehen, damit ich priorisieren kann. | Dashboard zeigt die naechsten 3 Drehtage; nur zukuenftige Termine werden angezeigt; bei keinen Terminen erscheint ein leerer, klarer Status. | pic_reference/Drehplan |
| US-014 | Als Produktionsleiter moechte ich Top-Kostenstellen nach Ausgaben sehen, damit ich Kostentreiber identifiziere. | Dashboard listet die 3 hoechsten Kostenstellen nach Ist; Sortierung ist absteigend; Gleichstaende werden deterministisch aufgeloest. | pic_reference/externe-Kostenrechnung |
| US-015 | Als Teammitglied moechte ich Kernkennzahlen auf dem Dashboard sehen, damit ich den Projektzustand ohne Detailansicht verstehe. | Dashboard zeigt Gesamtbudget, Gesamtausgaben und Restbudget; Werte laden unter 2 Sekunden bei typischer Datenmenge; fehlerhafte API-Antwort zeigt nutzerfreundliche Meldung. | pic_reference/Kalkulation |

## Delivery Tech Board (MVP)

| Story | Backend/API | Frontend/UI | Test/QA |
|---|---|---|---|
| US-001 | POST /projects, DTO Validation, Unique ID | Projekt-Create-Dialog mit Pflichtfeldhinweisen | API-Validation-Tests, Formular-Fehlerfaelle |
| US-002 | PUT /projects/:id, Date-Range Rule | Projekt-Detail mit Inline-Edit fuer Stammdaten | Rule-Test fuer end < start, E2E Edit-Flow |
| US-003 | GET /projects?status= | Status-Filterchips in Projektliste | Filter-Integrationstest, leere Trefferliste |
| US-004 | POST /projects/:id/cost-centers, Name-Unique-per-Project | Kostenstellen-Create-Dialog | Duplicate-Name-Test, Happy Path |
| US-005 | PATCH cost-center budget, Decimal Parsing | Budgettabelle mit Inline-Zelle und Commit on Enter | UI-Edit-Test, invalid numeric input |
| US-006 | Aggregation query fuer totalBudget | Budget Summary Card | Aggregation-Test (0, 1, n Kostenstellen) |
| US-007 | POST /projects/:id/expenses | Expense Modal mit Kostenstellen-Select | Pflichtfeld-Test amount, API contract test |
| US-008 | GET expenses + filter by costCenterId | Filterbare Ausgaben-Tabelle + Summenzeile | Filter-Test auf Liste + Summe |
| US-009 | Serverseitige delta-Berechnung je Kostenstelle | Budget-Ist-Differenz-Spalten mit Warnfarbcode | Delta-Formeltest inkl. negativer Werte |
| US-010 | Dashboard-Feld remainingBudget | Restbudget KPI-Karte | Konsistenztest Dashboard vs Budgetseite |
| US-011 | POST /projects/:id/shoot-days | Drehtag-Formular (Datum, Location, Notiz) | Datum-Pflichttest, Zuordnungs-Test |
| US-012 | GET shoot-days sorted ascending | Drehplan-Liste mit Standardsortierung | Sortier-Test inkl. gleicher Datumwerte |
| US-013 | Dashboard query fuer next 3 future shoot-days | Widget Naechste Drehtage | Test fuer 0, 1, 3+ kommende Termine |
| US-014 | Ranking query top cost centers by spent | Widget Top-Kostenstellen | Ranking-Test bei Gleichstand |
| US-015 | Dashboard endpoint mit allen KPI-Werten | KPI-Grid + Error-State + Loading-State | Performance smoke test (<2s), UI Fehlerzustand |

Hinweis: UI/UX-Richtlinien inkl. Darkmode sind verbindlich in docs/ui-ux-darkmode-spec.md definiert.
