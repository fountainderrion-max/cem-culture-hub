# Render Production Settings - CEM CULTURE / WISDO World

## Required service type
- **Type:** Web Service
- **Runtime:** Node

## Required repository settings
- **Repo root:** project root
- **Root directory:** `app`
- **Build command:** `node -v`
- **Start command:** `node launch.js`
- **Health check path:** `/api/health`

`launch.js` loads the WISDO World sidecar API first and then starts the existing CEM CULTURE server. Starting `server.js` directly remains available as a legacy/debug path, but it does not load `/api/world/*`.

## Required environment variables
- `NODE_ENV=production`
- `HOST=0.0.0.0`
- `PORT` (Render provides this; do not hardcode it in the dashboard if already injected)
- `SESSION_SECRET` (long random value)
- `DEFAULT_SIGNUP_ROLE=user`
- `ALLOW_SELF_PROVIDER_SIGNUP=false`
- `ALLOW_SELF_OPERATOR_SIGNUP=false`
- `REQUIRE_ADMIN_PROVIDER_APPROVAL=true`
- `REQUIRE_ADMIN_OPERATOR_APPROVAL=true`
- `ALLOW_DEV_LOGIN=false`
- `WORLD_ALLOW_DEV_TIER=false`

## Recommended environment variables
- `NEXT_PUBLIC_APP_URL=https://<your-service>.onrender.com` or the production custom domain
- `NEXT_PUBLIC_SITE_URL=https://<your-service>.onrender.com` or the production custom domain
- `NEXTAUTH_URL=https://<your-service>.onrender.com` or the production custom domain
- `ENABLE_SIMULATION_MODE=true`
- `ENABLE_USER_SUPPLIED_MODE=true`

## WISDO persistence requirement
The current application writes prototype state under `app/data`, including `wisdo-world-store.json`. Render web services use an ephemeral filesystem by default, so those runtime JSON changes will be lost on a redeploy/restart unless persistent storage is configured.

For temporary/single-instance testing, attach a Render Persistent Disk that covers the runtime data directory. Because the service root is `app`, verify the resolved source path in Render before selecting the disk mount path.

For production commerce, entitlements, progression, audit history, reporter nodes, and account records should move to a managed database instead of relying on a local JSON file. Do not treat the JSON store as the long-term production source of truth.

## Render dashboard check after merging
If the Render service was created manually instead of from the Blueprint, changing `app/render.yaml` may not change the existing service settings automatically. Verify in Render:

1. Service: `cem-culture-hub`
2. Root Directory: `app`
3. Build Command: `node -v`
4. Start Command: `node launch.js`
5. Health Check Path: `/api/health`
6. Auto-Deploy: enabled for `main` if you want merges to deploy automatically
7. `ALLOW_DEV_LOGIN=false`
8. `WORLD_ALLOW_DEV_TIER=false`

Then deploy the latest `main` commit.

## Post-deploy smoke checks
- `GET /api/health` should return a healthy JSON response.
- `/` should load the CEM CULTURE application.
- `/wisdo-world.html` should load WISDO World.
- `GET /api/world/catalog` should return the WISDO World catalog.
- After signing in, `GET /api/world/me` should return the member world profile and server-backed access state.

## Why `x-render-routing: no-deploy` happens
Render can return `x-render-routing: no-deploy` when no healthy deploy is serving traffic. Typical causes:
- wrong root directory
- process starts but does not bind to `0.0.0.0:$PORT`
- start command fails before the listener opens
- deploy times out during boot

## Proof files in this repo
- production launcher: `app/launch.js`
- WISDO World sidecar: `app/wisdo-world-bootstrap.js`
- host/port listener and existing API: `app/server.js`
- Render service config baseline: `app/render.yaml`
- env template: `app/.env.example`
