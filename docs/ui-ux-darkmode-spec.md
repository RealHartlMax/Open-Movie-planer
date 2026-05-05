# Open Movie Planer - Modern UI/UX Spec (Darkmode First)

## 1. Designprinzipien

- Darkmode ist Standard-Theme fuer die komplette Anwendung.
- Fokus auf schnelle Dateneingabe fuer Power User (Tabellen, Tastatur, Inline-Edit).
- Informationsdichte hoch, visuelle Last niedrig (klare Hierarchie, ruhige Flaechen).
- Moderne, cineastische Anmutung statt generischer SaaS-Optik.

## 2. Visuelle Richtung

### Typografie

- Headline-Font: Space Grotesk
- UI/Text-Font: Manrope
- Monospace fuer Zahlen und Budgetspalten: JetBrains Mono

Fallbacks:
- sans-serif fuer Headline/UI
- monospace fuer numerische Zellen

### Farbwelt (Darkmode)

CSS Custom Properties (Beispielwerte):

```css
:root {
  --bg-0: #0b0f14;
  --bg-1: #111823;
  --bg-2: #182231;
  --surface: #1d2a3b;
  --text-1: #e7edf7;
  --text-2: #9fb0c8;
  --line: #2b3c53;
  --accent: #31c48d;
  --accent-2: #56ccf2;
  --warn: #f5a524;
  --danger: #f05d5e;
  --success: #3ddc97;
}
```

Anwendung:
- Seitenhintergrund: vertikaler Verlauf von --bg-0 nach --bg-1.
- Karten/Panele: --surface mit 1px Border --line.
- Positive Delta-Werte: --success.
- Negative Delta-Werte: --danger.

## 3. Layoutsystem

- 12-Spalten Raster auf Desktop.
- 4-Spalten Raster auf Mobile.
- Hauptstruktur:
  - Left Rail Navigation (Module)
  - Top Bar (Projektwechsel, Suche, Theme)
  - Content Canvas (Dashboard/Tabellen)

Spacing Scale:
- 4, 8, 12, 16, 24, 32

Radius:
- Cards: 14px
- Inputs: 10px

## 4. Komponentenstandards

### Tabellen (zentral)

- Sticky Header
- Zeilenhoehe 40px
- Inline-Editing per Enter/Escape
- Numerik rechtsbuendig, Text linksbuendig
- Keyboard Flow: Tab navigiert editierbare Zellen

### KPI Cards

- 3 Kernkarten: Gesamtbudget, Ausgaben, Restbudget
- Grosse Kennzahl + Subtext + Trendindikator
- Delta-Farben nur fuer semantische Aussage, nicht dekorativ

### Formulare

- Sofortiges Inline-Feedback bei Validation
- Primaraktion visuell klar (Accent)
- Sekundaeraktionen neutral (outline)

## 5. Motion und Micro-Interactions

- Seitenwechsel mit kurzer Fade/Slide-Transition (140-180ms)
- Staggered Reveal fuer KPI-Karten (40ms Offset)
- Tabellen-Highlight bei gespeicherter Inline-Aenderung (kurzer Flash 300ms)

Keine ueberladenen Animationen, Fokus bleibt auf Eingabegeschwindigkeit.

## 6. Responsiveness

- Breakpoints:
  - sm: 640px
  - md: 768px
  - lg: 1024px
  - xl: 1280px
- Unter md werden Tabellen horizontal scrollbar, Kernaktionen bleiben sticky sichtbar.
- Dashboard-Karten stacken untereinander ab md.

## 7. Accessibility

- Kontrastziel mindestens WCAG AA.
- Fokuszustand klar sichtbar (2px outline in --accent-2).
- Alle Formulareingaben mit Label und Fehlertext.
- Tastaturbedienbarkeit fuer alle Kernfluesse (Projekt, Budget, Ausgaben, Drehplan).

## 8. UX-Regeln fuer MVP Stories

- US-004 bis US-010: Tabellen-First UX mit minimalen Modals.
- US-011 bis US-013: Datumseingaben schnell via Tastatur moeglich.
- US-015: Dashboard zeigt Loading, Empty und Error explizit als definierte States.

## 9. Technische UI-Umsetzung

- React + TypeScript
- Tailwind mit CSS Variables fuer Theme Tokens
- TanStack Table fuer Budget-, Expense- und Drehplan-Tabellen
- Zustandsmanagement lokal pro View, Query-Cache fuer API Daten

## 10. Definition of Done (UI)

- Darkmode ist durchgaengig und ohne helle Restflaechen.
- Alle KPI- und Tabellen-Seiten sind auf Desktop und Mobile nutzbar.
- Keyboard-Navigation in Tabellen funktioniert fuer Kernflows.
- Kein Blocker-Contrast-Issue in manueller QA.
