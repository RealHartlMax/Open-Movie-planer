# Reference Map fuer pic_reference

Dieses Dokument ordnet die Dateien unter pic_reference fachlich ein und zeigt,
welche Referenzen direkt fuer das MVP genutzt werden und welche erst in spaeteren Phasen relevant sind.

## 1. Direkt fuer MVP nutzen

### Kalkulation (MVP Kern)

Quelle: pic_reference/Kalkulation

Nutzen fuer MVP:
- Struktur fuer Kostenstellen-Ansicht
- Budget-Erfassung und Summenlogik
- Anhaltspunkte fuer Cashflow-/Uebersichts-Widgets

Konkrete Umsetzung im Produkt:
- Budget-Tabelle mit Spalten: Kostenstelle, Budget, Ist, Differenz
- Aggregierte Kennzahlen fuer Dashboard

### Drehplan (MVP Kern)

Quelle: pic_reference/Drehplan

Nutzen fuer MVP:
- Datenstruktur fuer Drehtage, Kalenderdarstellung, Auswertungslogik
- Bezeichner und Interaktionsmuster fuer Planungstabellen

Konkrete Umsetzung im Produkt:
- Shoot-Day CRUD
- Sortierung nach Datum, Anzeige naechster Drehtage

### Externe Kostenrechnung (MVP Kern)

Quelle: pic_reference/externe-Kostenrechnung

Nutzen fuer MVP:
- Soll/Ist-Denke
- Forecast- und Kostenstand-Logik als spaeteres Dashboard-Upgrade

Konkrete Umsetzung im Produkt:
- Restbudget-Berechnung
- Top-Kostenstellen nach Ausgaben

## 2. Fuer Phase 2 vormerken

### Kontakt-Terminverwaltung

Quelle: pic_reference/Kontakt-Terminverwaltung

Potenzial:
- Kontakte pro Projekt
- Terminlisten und einfache Kalenderintegration

### Vertragsverwaltung

Quelle: pic_reference/Vertragsverwaltung

Potenzial:
- Vertragsobjekte fuer Cast/Crew
- Versionierung und Dokumentenverknuepfung

### Digitale-Zeiterfassung

Quelle: pic_reference/Digitale-Zeiterfassung

Potenzial:
- Arbeitszeit-Erfassung
- Genehmigungsworkflows

## 3. Out of Scope fuer MVP (nur Referenzwissen)

### Finanzbuchhaltung

Quelle: pic_reference/Finanzbuchhaltung

### Lohnbuchhaltung

Quelle: pic_reference/Lohnbuchhaltung

### Anlagenbuchhaltung

Quelle: pic_reference/Anlagenbuchhaltung

### Warenwirtschaft

Quelle: pic_reference/Warenwirtschaft

### Rechnungseingangsbuch

Quelle: pic_reference/Rechnungseingangsbuch

### Synchron-Disposition

Quelle: pic_reference/Synchron-Disposition

Diese Bereiche dienen aktuell als Domain-Orientierung fuer spaetere Module.

## 4. Arbeitsmodus fuer Referenzen

1. Pro Feature zuerst relevante Unterordner im pic_reference Verzeichnis sichten.
2. Nur Interaktionsmuster und fachliche Struktur uebernehmen, nicht visuell 1:1 kopieren.
3. Jede neue User Story in docs/product-backlog.md mit Referenzpfad markieren.
4. Bei Unklarheiten zuerst Datenmodell definieren, danach UI anpassen.

## 5. Prioritaetsmatrix (abgeleitet)

- P1: Kalkulation, Drehplan, externe-Kostenrechnung
- P2: Kontakt-Terminverwaltung, Vertragsverwaltung, Digitale-Zeiterfassung
- P3: Finanz-, Lohn-, Anlagenbuchhaltung, Warenwirtschaft, Rechnungseingang, Synchron-Disposition
