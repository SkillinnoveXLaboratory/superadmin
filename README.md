# Schoolmate — Super Admin (Web)

Platform owner console. React + Vite + TypeScript, Tailwind, Framer Motion, Lottie, Recharts, TanStack Query, Zustand.

## Run

```bash
npm install
cp .env.example .env
npm run dev    # http://localhost:5173
npm run build  # production bundle in dist/
```

`.env.example` already points at the live API (`https://schoolmate.digitalleadpro.com/api/v1`). Override with `VITE_API_BASE_URL` if needed.

## Routes

| Path                 | Page             | API calls                          |
| -------------------- | ---------------- | ---------------------------------- |
| `/login`             | Sign-in (hero)   | `POST /super-admin/auth/login`     |
| `/`                  | Overview         | `GET /super-admin/analytics/overview` |
| `/schools`           | Schools list     | `GET/POST/PATCH /super-admin/schools…` |
| `/schools/:id`       | School detail    | `GET /super-admin/schools/{id}`    |
| `/plans`             | Plan management  | client-side until backend exposed   |
| `/users`             | Platform users   | client-side                         |
| `/announcements`     | Platform notices | `GET/POST /announcements`          |
| `/data`              | Bulk + backup    | `POST /data/system/backup`         |
| `/settings`          | Profile          | client-side                         |

## Architecture

- `src/lib/api/client.ts` — Axios + JWT + `X-School-ID` injection.
- `src/lib/api/services.ts` — every endpoint, one function each, grouped by module.
- `src/lib/stores/auth.ts` — Zustand store, persisted to localStorage.
- `src/components/AppShell.tsx` — sidebar, topbar, animated route transitions.
- `src/components/Icon.tsx` — inline-SVG icon set (no emoji).
- `src/components/Lottie.tsx` — DotLottie wrapper with reduced-motion handling.

## Brand & motion

See `/shared/tokens/colors.md`, `typography.md`, `motion.md` for the shared system.
