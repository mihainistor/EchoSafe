# Istoric Versiuni (Changelog)

Acest fișier documentează modificările notabile ale aplicației (frontend și backend). Format inspirat din “Keep a Changelog”, cu versiuni SemVer.

## [Neeliberat]
- N/A

## [0.3.0] – 2026-02-16

Added
- Documentație arhitectură extinsă și diagrame:
  - [Architecture.md](file:///d:/SafeKidAPP/Architecture.md) — descriere completă straturi, fluxuri și practici.
  - [ArhitectureDiagram.md](file:///d:/SafeKidAPP/ArhitectureDiagram.md) — diagramă PlantUML a arhitecturii.
  - [DiagramsUML.md](file:///d:/SafeKidAPP/DiagramsUML.md) — diagrame de secvență pentru principalele fluxuri (auth, devices, alerts, time machine, route builder, dev helpers etc.).
- Specificație OpenAPI pentru import în Swagger Editor:
  - [ApiSwagger.md](file:///d:/SafeKidAPP/ApiSwagger.md) (OpenAPI 3.0.3).
- Extindere suite E2E:
  - Scenarii: traseu free‑hand, configurare alertă staționare + Safe Zones, export CSV, plus robustețe la selectori.

Changed
- Îmbunătățit stabilitatea testelor E2E: selectori mai preciși (strict mode compliant).

Docs
- Actualizări rezultate testare: [TestingResults.md](file:///d:/SafeKidAPP/TestingResults.md).

## [0.2.0] – 2026-02-16

Added
- Integrare testare E2E cu Playwright în frontend:
  - [playwright.config.js](file:///d:/SafeKidAPP/frontend/playwright.config.js) — baseURL 3006, reuseExistingServer.
  - [tests/e2e.spec.js](file:///d:/SafeKidAPP/frontend/tests/e2e.spec.js) — scenarii inițiale (Heatmap, Replay, Alerte, Header, Live + contor).
  - Scripturi în [package.json](file:///d:/SafeKidAPP/frontend/package.json) — `test:e2e`.

Fixed
- Corecții de selectori pentru strict mode (ex. țintire explicită a butoanelor “+ Adaugă” și elementelor duplicate).

Docs
- Inițiere documentare cazuri de test și rezultate:
  - [TestCases.md](file:///d:/SafeKidAPP/TestCases.md)
  - [TestingResults.md](file:///d:/SafeKidAPP/TestingResults.md)

## [0.1.1] – 2026-02-16

Front-end
- Changed: Aliniere terminologie “child/children” → “member/members” în context, pagini și CSS (Dashboard, MemberList, MemberDetail, TimeMachine, AddMember).
- Added: Buton “Șterge” pentru fiecare membru în pagina Familie, cu confirmare.
- Fixed: Validare MSISDN la adăugare membru — normalizează numerele și acceptă format 07xxxxxxxx.
- Fixed: Randare linkuri în mesaje de alertă — afișează “Vezi hartă” pentru Google Maps și URL pentru altele.

Back-end
- Fără modificări funcționale.

## [0.1.0] – Lansare inițială

Front-end
- Added: Aplicație React cu routing protejat (Login, Register, Dashboard, Familie, Alerte, Time Machine, Profil).
- Added: Panou de control cu afișare membri, alerte, status localizare și mod Demo.
- Added: Gestionare membri (listă, detaliu, adăugare cu OTP, vizualizare pe hartă).
- Added: Module pentru destinații, trasee (inclusiv RouteBuilder), zone No‑Go și alerte.

Back-end
- Added: API Express de bază (autentificare, gestionare dispozitive, utilizatori).
- Added: Servicii stub pentru locație, reachability și SMS (Orange) și schemă inițială.
