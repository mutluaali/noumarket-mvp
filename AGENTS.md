# AGENTS.md

## Cursor Cloud specific instructions

### Overview
NouMarket is a classified ads marketplace MVP for New Caledonia, built with Next.js 16 (App Router, JavaScript/JSX, no TypeScript). It uses Supabase (PostgreSQL + Auth + Storage) as the primary backend and Stripe for payments.

### Node version
The project requires **Node.js 20.x** (`engines` field in `package.json`). The VM's default node may be v22; prepend the nvm v20 path:
```
export PATH="$HOME/.nvm/versions/node/v20.20.2/bin:$PATH"
```

### Running the dev server
```
npm run dev        # starts Next.js on http://localhost:3000 (uses --webpack flag)
```

### Lint / Test / Build
- **Lint**: `npm run lint` — currently a no-op (`echo "Lint skipped for MVP"`); no ESLint config exists.
- **Tests**: No test framework or test files exist in this repo.
- **Build**: `npm run build` — runs a production build with Turbopack.

### Environment variables
Copy `.env.example` to `.env.local`. The app gracefully degrades when Supabase credentials are missing (`hasSupabase` guard in `lib/supabase.js`), so the UI renders and is navigable without a live Supabase project. Stripe keys are also optional — payment features will fail but browsing/listing works.

### External services
| Service | Required? | Notes |
|---------|-----------|-------|
| Supabase | Yes (for full functionality) | DB, Auth, Storage, Realtime messaging. Schema files in `sql/` and `supabase/` dirs. |
| Stripe | Optional | Payment processing. App uses placeholder keys at build time. |

### Gotchas
- The `.npmrc` sets `legacy-peer-deps=true` — this is needed for `next-pwa` compatibility.
- `npm run dev` uses `--webpack` flag (not Turbopack) for dev, but `npm run build` uses Turbopack.
- No CI/CD, no git hooks, no test suite, no Docker configuration.
