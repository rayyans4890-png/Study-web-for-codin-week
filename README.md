# StudyOS — Make studying feel beautiful

A complete, premium studying workspace: focus sessions, planning, exam preparation, statistics, gamification and an AI study tutor — in one calm, forest-green interface.

![StudyOS](data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' rx='15' fill='%231E4D36'/%3E%3Cpath d='M32 21c-4.2-3.1-9.3-4.1-14-3v25.5c4.7-1.1 9.8-.1 14 3 4.2-3.1 9.3-4.1 14-3V18c-4.7-1.1-9.8-.1-14 3z' fill='%23F6F4EE'/%3E%3C/svg%3E)

## Run it

No build step, no dependencies to install.

```bash
# any static server works, e.g.:
python3 -m http.server 3000
# then open http://localhost:3000
```

Opening `index.html` directly from disk also works (fonts/3D need internet for the Google Fonts CDN; everything else is local).

## What's inside

| Area | Highlights |
|---|---|
| **Landing** | 3D floating book scene (Three.js), parallax cards, scroll narrative through every feature |
| **Home** | Daily goal ring, streak, next exam, quick-start launcher, weekly rhythm, subject progress |
| **Focus** | Pomodoro / classic / deep-work sessions, progress ring, breaks, ambient sound (synthesized), XP rewards, runs across navigation |
| **Planner** | Month + week calendar, study blocks, exams on the grid, day detail panel |
| **Tasks** | Priorities, tags, due dates, exam links, satisfying completion animation |
| **Exams** | Live countdowns, topic checklists, preparation %, linked tasks & sessions |
| **Subjects** | Per-subject time, weekly goals, 30-day charts, recent sessions |
| **Statistics** | Real charts (bars, donut, heatmap, trend), generated insights, goal completion |
| **AI Tutor** | Streaming chat, markdown/code/equations, study-context awareness, conversations, flashcards & quizzes |
| **Study Battle** | XP, levels, daily challenges, achievements, streaks |
| **Settings** | Profile, avatar, goals, themes (Day / Evening), data export/import/reset |

Everything is connected: sessions feed streaks, XP, subject stats and insights; tasks feed exam preparation; the tutor reads your real study context.

## AI tutor setup

The tutor calls an **OpenAI-compatible** endpoint directly from your browser.

1. Open **AI Tutor → API settings** (or Settings → AI tutor)
2. Paste your API key (placeholder shown: `YOUR_AI_API_KEY`)
3. Optionally change the base URL (`https://api.openai.com/v1` by default — works with OpenRouter, Groq, Together, local servers…) and model

No key is hardcoded and the key never leaves your browser (stored in `localStorage`). Without a key the tutor runs in **demo mode** with built-in, context-aware example responses.

## Data

All data lives in your browser's `localStorage` (key `studyos:v2`). **The app starts completely empty** — no subjects, tasks, exams, sessions, XP or streaks are pre-filled. You add your own subjects and everything grows from your real activity.

- **Fresh start** — a new visitor gets a clean workspace with a short 3-step setup on Home (add subjects → personalize → first session).
- **Load demo workspace** — Settings → Data → *Load demo workspace* fills everything with a sample student (Salem) if you want to explore the features first. Your profile and tutor settings are kept, and *Start fresh* clears it again.
- Export / import your data as JSON from **Settings → Data**.

The marketing landing page shows a fixed sample workspace (streak 9, next exam in 18 days, etc.) — those numbers are static illustrations, never written to your storage.

## Deploy to Netlify (drag & drop)

The site is 100% static — no build step, no server code.

1. Zip the contents of this folder so that `index.html` is at the **root** of the archive (not inside a subfolder). A ready-made `studyos.zip` is provided alongside this folder.
2. Go to [app.netlify.com/drop](https://app.netlify.com/drop).
3. Drag the ZIP (or the folder) onto the page.
4. Done — Netlify serves it over HTTPS at a random subdomain you can rename (Site settings → Change site name). Connect a custom domain from the same screen if you like.

No `netlify.toml` or redirect rules are needed: routing is hash-based (`#/home`, `#/focus`, …) and every asset — including Three.js and the fonts fallback — is local or CDN-loaded, so it works on any static host (Netlify, GitHub Pages, Vercel, Cloudflare Pages).

## Tech notes

- Vanilla HTML/CSS/JS — no frameworks, no build
- Three.js (vendored locally, `js/vendor/three.min.js`) for the hero scene; graceful fallback if unavailable
- Custom SVG chart library, custom markdown renderer, WebAudio ambient sound & chimes
- `prefers-reduced-motion` respected throughout; keyboard-navigable command palette (⌘K / Ctrl+K)
