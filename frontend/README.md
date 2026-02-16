# EchoSafe – Frontend

Interfața web pentru aplicația **EchoSafe**. Construită cu React, Vite și React Router.

## Cerințe

- Node.js 18+
- npm sau pnpm

## Instalare și rulare

```bash
cd frontend
npm install
npm run dev
```

Aplicația pornește la [http://localhost:3000](http://localhost:3000).

## Structură

- `src/` – cod sursă
  - `components/` – Layout, Header (reutilizabile)
  - `pages/` – Landing, Login, Register, Dashboard
  - `styles/` – design system (variabile CSS, stiluri globale)
- `public/` – favicon și resurse statice

## Pagini actuale

| Rută         | Descriere                          |
|-------------|-------------------------------------|
| `/`         | Pagina de prezentare (landing)      |
| `/login`    | Autentificare                       |
| `/register` | Înregistrare cont nou               |
| `/dashboard`| Panou de control (shell pentru cerințe viitoare) |

## Build pentru producție

```bash
npm run build
npm run preview
```

După ce îmi trimiți cerințele de business, pot extinde frontend-ul cu componente și fluxuri specifice (ex.: profil copil, setări, rapoarte, notificări).
