# React Dashboard

Moduflow Vite/React dashboard. This app is managed by the root pnpm
workspace and should be run from the monorepo root.

## Local Development

```bash
pnpm install
pnpm dev:dashboard
```

The dashboard reads browser-exposed environment variables from `.env`:

```env
VITE_STRAPI_URL=http://localhost:1337
VITE_STRAPI_TOKEN=some-token
VITE_STRAPI_TIMEOUT_MS=15000
VITE_MODUFLOW_API_URL=http://localhost:3001/api
```

## Build

```bash
pnpm build:dashboard
```

The production build is emitted to `apps/react-dashboard/dist`.

## Vercel

The repository root contains `vercel.json` for this app:

- install command: `pnpm install --frozen-lockfile`
- build command: `pnpm build:dashboard`
- output directory: `apps/react-dashboard/dist`

Set the required `VITE_*` variables in Vercel project settings.
