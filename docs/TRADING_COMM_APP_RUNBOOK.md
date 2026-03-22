# Trading Communicator Secure Server Runbook

Purpose: operate the Trading Communicator as a secured server for team use.

## Current Security Model

- Session-based member authentication (`/api/auth/*`) with HTTP-only cookies.
- Optional API key gate for all API routes (`x-api-key` header).
- Input sanitization and request body size limits.
- Per-IP rate limiting.
- Security response headers and strict CSP.
- Persistent JSON store in `app/data/store.json`.
- Optional direct TLS (`TLS_CERT_PATH` + `TLS_KEY_PATH`).

## Files

- `app/server.js`
- `app/public/index.html`
- `app/public/app.js`
- `app/.env.example`
- `scripts/ops/generate-app-secrets.ps1`

## 1) Generate Secure Secrets

From workspace root:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\ops\generate-app-secrets.ps1
```

This creates:

- `app/.env.local`

Then set final production values before internet exposure:

- `BASE_URL` (your public HTTPS URL)
- `ALLOW_DEV_LOGIN=false`
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI` (if using Google OAuth)

Run security config audit:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\ops\audit-secure-config.ps1
```

## 2) Local Secure Baseline Test

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\ops\start-secure-app.ps1
```

Check:

- `GET /api/health` returns `{ ok: true }` (include `x-api-key` when API key gate is enabled)
- unauthenticated `GET /api/state` returns `401`
- after login, `GET /api/state` works

## 3) Production Exposure Pattern (Recommended)

Expose through a reverse proxy with HTTPS termination and firewall rules.

Recommended flow:

1. Run app on private interface or internal port (`HOST=127.0.0.1`, `PORT=3000`).
2. Put Nginx/Caddy/Traefik in front with TLS certificates.
3. Allow only ports `443` (and `80` for redirect to `443`) publicly.
4. Keep Node app port private.

## 4) Required Production Settings

- `SESSION_SECRET`: long random secret (already generated)
- `REQUIRE_MEMBER_LOGIN=true`
- `REQUIRE_API_KEY=true`
- `TRADING_APP_API_KEY`: long random key (already generated)
- `ALLOW_DEV_LOGIN=false`
- `BASE_URL=https://<your-domain>`

## 5) Hardening Checklist Before Go-Live

- Confirm HTTPS is active end-to-end.
- Confirm dev login is disabled.
- Confirm API key is required.
- Confirm Google OAuth callback uses HTTPS domain.
- Confirm no default or placeholder secrets remain.
- Restrict server admin access (SSH/RDP) by IP where possible.
- Back up `app/data/store.json` on a schedule.

## 6) Operations Notes

- App logs to stdout; forward to your server logging stack.
- Data file: `app/data/store.json`.
- Rotating API keys:
  1. Generate a new key.
  2. Update `TRADING_APP_API_KEY`.
  3. Restart server and update trusted clients.

This runbook is the minimum path to open a secured server for the communicator component.
