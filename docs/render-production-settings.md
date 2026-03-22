# Render Production Settings - CEM CULTURE

## Required service type
- **Type:** Web Service
- **Runtime:** Node

## Required repository settings
- **Repo root:** project root (`TRADING ECOSYSTEM`)
- **Root directory:** `app`
- **Build command:** `node -v`
- **Start command:** `node server.js`

## Required environment variables
- `NODE_ENV=production`
- `HOST=0.0.0.0`
- `PORT` (Render provides this; do not hardcode in dashboard if already injected)
- `SESSION_SECRET` (long random value)
- `DEFAULT_SIGNUP_ROLE=user`
- `ALLOW_SELF_PROVIDER_SIGNUP=false`
- `ALLOW_SELF_OPERATOR_SIGNUP=false`
- `REQUIRE_ADMIN_PROVIDER_APPROVAL=true`
- `REQUIRE_ADMIN_OPERATOR_APPROVAL=true`

## Recommended environment variables
- `NEXT_PUBLIC_APP_URL=https://<your-service>.onrender.com`
- `NEXT_PUBLIC_SITE_URL=https://<your-service>.onrender.com`
- `NEXTAUTH_URL=https://<your-service>.onrender.com`
- `ENABLE_SIMULATION_MODE=true`
- `ENABLE_USER_SUPPLIED_MODE=true`

## Why "x-render-routing: no-deploy" happens
Render returns `x-render-routing: no-deploy` when no healthy deploy is serving traffic. Typical causes:
- wrong root directory (for example, `app` missing)
- process starts but does not bind to `0.0.0.0:$PORT`
- start command fails before listener opens
- deploy timed out during boot

## Proof files in this repo
- host/port listener: `app/server.js`
- render service config baseline: `app/render.yaml`
- env template: `app/.env.example`
