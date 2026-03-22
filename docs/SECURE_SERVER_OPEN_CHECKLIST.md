# Secure Server Open Checklist

Use this checklist when exposing the Trading Ecosystem app to the internet.

## Step 1: Secrets and Local Config

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\ops\generate-app-secrets.ps1
```

Edit `app/.env.local` and confirm:

- `SESSION_SECRET` is random and unique
- `TRADING_APP_API_KEY` is random and unique
- `BASE_URL` points to your HTTPS domain
- `ALLOW_DEV_LOGIN=false`
- `REQUIRE_MEMBER_LOGIN=true`
- `REQUIRE_API_KEY=true`

Audit:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\ops\audit-secure-config.ps1
```

## Step 2: Start App on Internal Interface

Set:

- `HOST=127.0.0.1`
- `PORT=3000`

Run:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\ops\start-secure-app.ps1
```

## Step 3: Reverse Proxy + TLS

Put Nginx/Caddy/Traefik in front and terminate TLS there.

Rules:

- redirect all `http://` to `https://`
- proxy only to `127.0.0.1:3000`
- preserve `X-Forwarded-Proto=https`

Templates:

- `config/server/nginx-trading-ecosystem.conf.example`
- `config/server/Caddyfile.example`

## Step 4: Firewall

- Open public inbound: `443` only (optionally `80` for redirect).
- Keep Node app port closed publicly.
- Restrict admin ports (SSH/RDP) by source IP where possible.

## Step 5: Validation

- `GET /api/health` returns `200`.
- unauthenticated `GET /api/state` returns `401`.
- with valid API key + member session, `/api/state` returns data.
- logout invalidates session.
- browser shows HTTPS lock and valid certificate.

## Step 6: Ops Readiness

- Add backup for `app/data/store.json`.
- Add process supervision (systemd/pm2/windows service).
- Add log shipping/retention.
- Document key rotation cadence.

Complete all steps before opening public access.
