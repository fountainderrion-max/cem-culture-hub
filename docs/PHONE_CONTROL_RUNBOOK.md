# Phone Control Runbook

This adds phone-driven control to your trading console using Telegram.
This now supports both Telegram and Twilio SMS.

## 1) Configure Telegram

In `app/.env.local` add:

- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_CHAT_ID`

Optional:

- `TELEGRAM_POLL_INTERVAL_MS=5000`

Restart server:

```powershell
cd "C:\Users\jaque\Documents\TRADING ECOSYSTEM\app"
node server.js
```

## 2) What you can text

Examples:

- `extend tp 30%`
- `increase percentage to 1000%`
- `never let winning trade go negative`
- `buy`
- `sell`
- `move stop to breakeven`
- `partial close 40% XAUUSD`
- `close all XAUUSD`
- `trail stop 25 XAUUSD`
- `pause symbol XAUUSD`
- `resume symbol XAUUSD`
- `move stop to breakeven at 15 pips`

The server parses these and applies policies/commands immediately.

## 2b) Configure Twilio SMS (optional)

In `app/.env.local` add:

- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_FROM_NUMBER`
- `TWILIO_TO_NUMBER`
- `TWILIO_WEBHOOK_TOKEN`

Set Twilio incoming webhook URL:

- `POST https://your-domain/api/phone/sms/webhook?token=YOUR_TWILIO_WEBHOOK_TOKEN`

Twilio messages are parsed by the same command engine as Telegram.

One-command local startup (app + tunnel):

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\ops\start-phone-control-stack.ps1
```

Tunnel-only command:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\ops\start-sms-webhook-tunnel.ps1
```

## 3) Ask/approve flow

Create a question:

```powershell
Invoke-WebRequest -UseBasicParsing -Method POST `
  -Uri "http://localhost:3000/api/phone/ask" `
  -ContentType "application/json" `
  -Body '{"question":"Extend TP by 25%?","actionType":"tp","actionPayload":{"kind":"policy","key":"tpExtensionPercent","value":25}}'
```

Reply on Telegram with `YES` or `NO`, or call:

```powershell
Invoke-WebRequest -UseBasicParsing -Method POST `
  -Uri "http://localhost:3000/api/phone/reply" `
  -ContentType "application/json" `
  -Body '{"questionId":"q-xxxx","answer":"yes"}'
```

## 4) Phone control endpoints

- `GET /api/phone/state`
- `POST /api/phone/ask`
- `POST /api/phone/message`
- `POST /api/phone/reply`
- `POST /api/phone/sms/webhook?token=...`

## 5) Important note

Current setup follows your request for no hard guardrails. Commands can set very aggressive behavior. Use carefully in live markets.
