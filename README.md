# Kaiju Vault

CPSC 449 semester project.

Kaiju Vault is a community platform for kaiju/Godzilla movie fans. Browse a film catalog seeded from TMDB, build a personal watchlist, and get AI-powered film recommendations based on what's already on it — all wrapped in a bold, comic-book / monster-movie poster visual theme.

## Live Links

- **Frontend (Vercel):** _TODO: https://kaiju-vault.vercel.app/
- **Backend API (Render):** _TODO: https://kaiju-vault.onrender.com

## Features

- **Film catalog browsing** — catalog seeded from [TMDB](https://www.themoviedb.org/) (see `db/seed-films.js`), browsable from the home page
- **JWT-based authentication** — registration and login with bcrypt-hashed passwords and signed JWTs
- **Personal watchlist** — add, view, and remove films from your own watchlist
- **AI film recommendations** — get a kaiju/monster movie recommendation based on your current watchlist, powered by the Anthropic Claude API
- **Role-based access control** — accounts carry a `user`/`admin` role (stored in the database and encoded in the JWT), with reusable middleware (`middleware/roles.js`) ready to gate admin-only routes
- **Comic-book / monster-movie visual theme** — high-contrast dark palette, condensed poster-style display typography, thick "stamped" borders, and poster-style film cards across the whole app

## Tech Stack

| Layer | Technology |
| --- | --- |
| Frontend | React + Vite + React Router |
| Backend | Node.js + Express |
| Database | PostgreSQL, hosted via Supabase |
| Auth | Custom JWT auth with bcrypt password hashing (no third-party auth provider) |
| Frontend hosting | Vercel |
| Backend hosting | Render |

## APIs Used

| API | Type | Purpose |
| --- | --- | --- |
| [TMDB API](https://developer.themoviedb.org/docs) | Public | Film metadata (titles, posters, overviews, genres, release years) used to seed and search the film catalog |
| Kaiju Vault backend API (this repo's `routes/`) | Private | Auth (register/login), watchlist (add/view/remove), and recommendations, consumed by the frontend |
| [Anthropic Claude API](https://docs.anthropic.com/) | Private | Generates a film recommendation from a user's watchlist (`routes/recommendations.js`) |

## Setup — Running Locally

This is a single repository with one `package.json` covering both the frontend and backend — there's only one `npm install` to run, not separate frontend/backend installs.

1. **Clone the repo**
   ```
   git clone https://github.com/JAndre0119/Kaiju-Vault.git
   cd Kaiju-Vault
   ```

2. **Install dependencies**
   ```
   npm install
   ```

3. **Set up environment variables**

   Copy `.env.example` to `.env.local` and fill in the values:
   ```
   cp .env.example .env.local
   ```

   | Variable | Used by | Notes |
   | --- | --- | --- |
   | `SUPABASE_URL` | backend | From your Supabase project's Settings → API |
   | `SUPABASE_ANON_KEY` | backend | From your Supabase project's Settings → API |
   | `SUPABASE_SERVICE_ROLE_KEY` | backend | From your Supabase project's Settings → API — keep secret |
   | `JWT_SECRET` | backend | Any long random string, used to sign auth JWTs |
   | `PORT` | backend | Local dev only — Render assigns this at runtime |
   | `TMDB_API_KEY` | backend | TMDB API key, used server-side by `db/seed-films.js` |
   | `ANTHROPIC_API_KEY` | backend | Anthropic API key, used by `routes/recommendations.js` |
   | `FRONTEND_URL` | backend | Leave unset for local dev — CORS falls back to allowing any origin |
   | `VITE_TMDB_API_KEY` | frontend | TMDB API key exposed to the browser bundle (can be the same value as `TMDB_API_KEY`) |
   | `VITE_API_URL` | frontend | Base URL of the backend API — defaults to `http://localhost:3001` if unset, so local dev needs no change |

4. **Seed the database**
   ```
   npm run seed:films
   ```
   This populates the `films` table from TMDB. It's idempotent — safe to re-run.

5. **Start the backend and frontend dev servers** (in two terminals)
   ```
   npm run server
   ```
   ```
   npm run dev
   ```
   The backend listens on `http://localhost:3001` by default; the frontend Vite dev server prints its own local URL (defaults to `http://localhost:5173`).

### Other available scripts

| Script | Purpose |
| --- | --- |
| `npm run build` | Production build of the frontend |
| `npm run preview` | Preview the production frontend build locally |
| `npm start` | Start the backend (same as `npm run server` — this is the command Render's start command uses) |

## Screenshots

Drop image files into a `screenshots/` folder in the repo root using the filenames below — the images will render automatically here once they exist, no further edits needed.

### Home / Search
![Home / Search](screenshots/home-search.png)

### Login Page
![Login Page](screenshots/login.png)

### Watchlist (with films added)
![Watchlist with films added](screenshots/watchlist.png)

### AI Recommendation in Action
![AI Recommendation in action](screenshots/recommendation.png)

## Project Structure

```
├── db/          # Supabase client, film-seeding script, and schema documentation
├── routes/      # Express route handlers: auth, films, watchlist, recommendations
├── middleware/  # Express middleware: JWT auth guard (auth.js), role gating (roles.js)
├── src/         # Frontend (React) — pages, components, hooks, and the global stylesheet
└── supabase/    # Supabase project config and SQL migrations
```

- **`db/`** — `supabaseClient.js` creates the server-side Supabase client; `seed-films.js` populates the film catalog from TMDB; `README.md` documents the full database schema.
- **`routes/`** — one file per resource (`auth.js`, `films.js`, `watchlist.js`, `recommendations.js`), each exporting an Express router mounted in `server.js`.
- **`middleware/`** — `auth.js` verifies the JWT on protected routes; `roles.js` provides a `requireRole()` guard for restricting routes by account role.
- **`src/`** — `pages/` holds the top-level routed views (Home, Login, Watchlist), `components/` holds shared UI pieces (film cards, nav bar), `hooks/` holds the auth and watchlist data hooks, and `index.css` is the single global stylesheet for the site's visual theme.

## Known Limitations / Future Work

- **Kaiju Showdown** (real-time head-to-head voting between films) — the database schema already has `showdowns` and `votes` tables, but no backend routes or frontend UI exist yet.
- **Reviews** — the database schema already has a `reviews` table, but writing/viewing reviews isn't implemented yet.
- No Row Level Security (RLS) policies are defined on the Supabase tables yet.
- Role-based access control is encoded (JWT `role` claim, `requireRole()` middleware) but no route currently restricts access to admins only.
