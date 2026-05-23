# V34 - Vercel Route Runtime Config Hotfix

This hotfix removes route-level `runtime` exports from API route files to avoid Next.js/Vercel production build errors related to re-exported or unrecognized route segment config.

## Install

```bash
npm install
npm run dev
```

## Deploy

```bash
git add .
git commit -m "fix vercel api route runtime config"
git push
```

## SQL

No SQL migration is required.
