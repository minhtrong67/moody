<div align="center">

<img src="public/icons/icon-192.png" alt="Moody" width="96" height="96" />

# Moody

**Daily mood journal — Nhật ký tâm trạng hằng ngày**

Check in every day, look back at your emotional trends and export reports. Designed with **Material Design 3**, available in **English / Tiếng Việt**, and installable as a **PWA** on both phone and desktop.

🌐 **English** · [Tiếng Việt](README.vi.md)

![React](https://img.shields.io/badge/React-18-61dafb?logo=react&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-5-646cff?logo=vite&logoColor=white)
![Tailwind](https://img.shields.io/badge/Tailwind-3-38bdf8?logo=tailwindcss&logoColor=white)
![Firebase](https://img.shields.io/badge/Firebase-10-ffca28?logo=firebase&logoColor=black)
![Node](https://img.shields.io/badge/node-%3E%3D18-informational)
![Open Source](https://img.shields.io/badge/open%20source-yes-brightgreen)
![License](https://img.shields.io/badge/license-MIT-blue)
![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen)

</div>

---

## Table of contents

- [About](#about)
- [Screenshots](#screenshots)
- [Features](#features)
- [Getting started](#getting-started)
- [Tech stack](#tech-stack)
- [Development](#development)
- [Build & deploy](#build--deploy)
- [Project structure](#project-structure)
- [Contributing](#contributing)
- [License](#license)

## About

Moody lets you log your mood in seconds: pick one of 5 mood levels, tag the activities of your day and add a note. Review everything later as a list, a monthly calendar and statistics charts, or export it as a PDF/PNG report.

> **Moody is a public, open-source project.** You are free to read, use, fork and improve the code. Issues and pull requests are welcome.

- **Use it instantly, no account needed** — guest mode stores data in `localStorage`; sign in with Google to sync to Firestore.
- **Mobile-first, but not mobile-only** — phones get a bottom navigation bar; laptops/desktops get a permanent left drawer and multi-column layouts.
- **Personalized** — change the theme color (the full Material 3 palette is regenerated from your color), light/dark mode, font size and language.

## Screenshots

| Desktop — Today | Desktop — Statistics |
|---|---|
| ![Today](screenshots/image01.png) | ![Statistics](screenshots/image02.png) |

| Desktop — History | Desktop — Settings (theme color) |
|---|---|
| ![History](screenshots/image03.png) | ![Settings](screenshots/image04.png) |

| Mobile — Today | Mobile — Check-in | Mobile — Statistics (dark, EN) | Mobile — History (dark, EN) |
|---|---|---|---|
| <img src="screenshots/image05.png" width="200" /> | <img src="screenshots/image06.png" width="200" /> | <img src="screenshots/image07.png" width="200" /> | <img src="screenshots/image08.png" width="200" /> |

## Features

| Area | Description |
|---|---|
| **Today** | Greeting, check-in status, 7-day strip, current streak, weekly average mood and recent check-ins |
| **Check-in** | Pick date and time, 1 of 5 moods, multiple activities (chips) and an auto-growing note; edit anytime |
| **History** | *List* view (search, filter by period/mood, sort, swipe right to edit / swipe left to delete) and *monthly Calendar* view (tap an empty day to create a check-in) |
| **Statistics** | By Day / Week / Month / Year: mood trend, mood distribution & share (bar + pie), most frequent activities |
| **Export report** | PDF or PNG with overview metrics, trend, mood distribution, a **mood share pie chart** and an **activity distribution chart** |
| **Manage activities** | Add / edit / delete, reorder via drag-and-drop or arrow buttons |
| **Manage moods** | Change the emoji and display name of the 5 mood levels, restore defaults |
| **Settings** | Light/dark/system theme, **theme color**, font size, **language (EN/VI)**, PWA install, export/delete data |

Highlights:

- **Full Material Design 3**: color roles, shape, elevation, state layers, top app bar, navigation bar/drawer, FAB, dialog, snackbar, segmented button, switch, chip, outlined text field.
- **Custom theme color**: pick a suggested color or any color you like; light/dark palettes are generated with [`@material/material-color-utilities`](https://github.com/material-foundation/material-color-utilities) and applied before first paint (no color flash). The default is blue (seed `#769CDF`).
- **Responsive**: phone → tablet → laptop → large screens.
- **Performance**: per-route code-splitting, separate `react` / `firebase` / `charts` chunks, PDF libraries loaded only when exporting, content-shaped skeleton loading.
- **SEO & social sharing**: meta description, canonical, Open Graph, Twitter Card, JSON-LD, `robots.txt`, 1200×630 preview image.
- **PWA**: installable, works offline via a service worker.

## Getting started

Requirements: **Node.js ≥ 18** and npm.

```bash
git clone <repo-url> moody
cd moody
npm install
cp .env.example .env     # then fill in your Firebase config (see below)
npm run dev
```

Open `http://localhost:5173`. **It runs without Firebase configured** — the app falls back to guest mode (data stored locally).

### Firebase setup (optional)

1. Create a project in the [Firebase Console](https://console.firebase.google.com).
2. **Authentication → Sign-in method** → enable **Google**.
3. **Firestore Database** → create a database.
4. **Project settings → Your apps** → create a Web app and copy each value into `.env`:

   | Variable | Meaning |
   |---|---|
   | `VITE_FIREBASE_API_KEY` | Web app API key |
   | `VITE_FIREBASE_AUTH_DOMAIN` | `your-project.firebaseapp.com` |
   | `VITE_FIREBASE_PROJECT_ID` | Project ID |
   | `VITE_FIREBASE_STORAGE_BUCKET` | `your-project.appspot.com` |
   | `VITE_FIREBASE_MESSAGING_SENDER_ID` | Sender ID |
   | `VITE_FIREBASE_APP_ID` | App ID |
   | `VITE_SITE_URL` | Deployed URL (no trailing `/`) — used for canonical / Open Graph / Twitter Card |

5. Set **Firestore Security Rules** so each user can only read/write their own data:

   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /users/{userId}/{document=**} {
         allow read, write: if request.auth != null && request.auth.uid == userId;
       }
     }
   }
   ```

`.env` is already in `.gitignore`. **Never commit your own Firebase keys or secrets** to a public repository.

## Tech stack

| Area | Technology |
|---|---|
| UI | React 18, React Router 6 (`HashRouter`) |
| Build | Vite 5, `vite-plugin-pwa` (Workbox) |
| Styling | Tailwind CSS 3 + Material Design 3 CSS variables |
| Dynamic color | `@material/material-color-utilities` |
| Icons & font | `react-icons` (Material Design icons), Roboto (`@fontsource/roboto`, self-hosted, Vietnamese subset included) |
| Backend | Firebase Authentication (Google) + Cloud Firestore |
| Charts | Recharts |
| Reports | html2canvas + jsPDF (loaded on demand) |
| i18n | Lightweight custom translator (`src/i18n`) — English & Tiếng Việt |

## Development

| Command | Description |
|---|---|
| `npm run dev` | Start the dev server (HMR) |
| `npm run build` | Production build into `dist/` |
| `npm run preview` | Preview the production build |

Things worth knowing:

- **Changing the default color**: edit the `--md-*` variables (light + dark) in [`src/index.css`](src/index.css) — you can export a new set from [Material Theme Builder](https://material-foundation.github.io/material-theme-builder/) — together with `DEFAULT_SEED` in [`src/lib/theme.js`](src/lib/theme.js), `theme_color` in `vite.config.js` and the icons in `public/`.
- **Adding a language / new strings**: add the key to `src/i18n/vi.js` and `src/i18n/en.js`, then use `const { t } = useI18n()` → `t('key')`. Missing keys fall back to Vietnamese.
- **Charts** use literal colors read from the current CSS variables (`readRole()` in `theme.js`) because SVG in some browsers doesn't resolve `var()` reliably.
- **"Today"** is always computed in the device's local time zone (never UTC via `toISOString()`).

## Build & deploy

```bash
npm run build
```

Deploy the `dist/` folder to any static host (Firebase Hosting, Vercel, Netlify, Cloudflare Pages…). Because the app uses `HashRouter`, no SPA rewrite rules are needed. Set `VITE_SITE_URL` before building so canonical / Open Graph tags point to the right domain.

## Project structure

```
├── index.html                  # SEO / Open Graph / Twitter / JSON-LD meta, boot screen
├── vite.config.js              # Vite + PWA manifest + chunk splitting
├── tailwind.config.js          # Material 3 color roles, shape, elevation mapping
├── public/                     # favicon, PWA icons, og-image, robots.txt
├── screenshots/                # Images used in the README (image01 … image08)
└── src/
    ├── App.jsx · main.jsx
    ├── index.css               # Color roles (--md-*), typography, state layers, component classes
    ├── i18n/                   # vi.js · en.js · index.jsx (I18nProvider, useI18n)
    ├── context/                # Auth, MoodEntries, Activities, Moods, Toast
    ├── hooks/                  # useMoodEntries, useActivities, useMoods, useInstallPrompt, useIsDark
    ├── lib/                    # moodConfig, dateUtils, statsUtils, reportGenerator, theme
    ├── components/             # AppShell, Sidebar, Dialog, ConfirmDialog, TextField, Switch,
    │                           # SegmentedButton, SwipeableRow, PageSkeleton, icons, Login…
    └── pages/                  # Dashboard, CheckIn, History, Statistics, Settings,
                                # ManageActivities, ManageMoods
```

**Data model** — `users/{uid}/entries/{id}`: `date` (`YYYY-MM-DD`), `time` (ISO), `mood` (`great|good|okay|sad|angry`), `score` (1–5), `activities[]`, `note`. Custom activities and mood names/emojis live in `users/{uid}/meta/activities` and `users/{uid}/meta/moods`; in guest mode everything is stored in `localStorage`.

## Contributing

Moody is open source and contributions are welcome:

1. Fork the repository and create a branch: `git checkout -b feat/your-feature`.
2. Make your changes and make sure `npm run build` passes.
3. If you add UI text, add it to **both** `src/i18n/en.js` and `src/i18n/vi.js`.
4. Commit and open a pull request describing what changed and why.

Found a bug or have an idea? Open an issue.

## License

Released as open source under the **MIT License** © 2026 minhtrong67. You may use, copy, modify and distribute this project, provided the copyright notice and license text are included.

> Maintainer note: add a `LICENSE` file containing the MIT text at the repository root so GitHub recognizes the license.
