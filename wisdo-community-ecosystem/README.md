# CEM CULTURE WISDO Community Ecosystem Patch

Date: 2026-05-06

This folder marks the WISDO multi-terminal/community trading ecosystem patch that was prepared from the uploaded package `CEM_CULTURE_WISDO_HTTP_500_SIGNAL_HOTFIX_2026_05_06.zip`.

## What this patch contains

- `/member-portal` slash command registration repair.
- `/connect` alias support.
- Multi-terminal pairing fix so one Discord user can hold separate pending pair codes for demo/live terminals.
- MT4 signal service hotfix for the JavaScript `Cannot access ... before initialization` HTTP 500 crash.
- Trade signal creation ordering fix.
- Signal health endpoint repair.
- Community Share page concept.
- Profit Pool page concept with compliance guardrail language.
- Portal action handler hardening.
- Navigation expansion for Community and Profit Pool.

## Correct deployment target

This connected GitHub installation only exposed:

`fountainderrion-max/cem-culture-hub`

The old backend repo name from the project history, `wisdo-mt4-api-bridge`, was not visible to the GitHub connector in this chat. Because this CEM hub repo already contains a separate commercial frontend shell, the WISDO bridge should be deployed as its own service folder or pushed to the actual backend repo when that repo is connected.

## Deploy flow after the full source is placed here or in the backend repo

```bash
npm install
npm run register-commands
npm start
```

## MT4 test flow

```text
/connect name: Demo Lead role: Leader
/connect name: Live Account role: Follower
/my-accounts
/set-active-account account_id:<live-account-id>
/member-portal
```

Expected MT4 sync response after the hotfix:

```json
{
  "ok": true,
  "status": "connected",
  "copySignalsOpened": 1,
  "copySignalsClosed": 0,
  "signalSkipped": false
}
```

## Important note

The full hotfix zip includes binary `.ex4`, `.zip`, media, and private bot package files. The available GitHub connector in this chat supports text-file writes through the contents API, but not a true bulk binary push of the 76MB package. Do not overwrite the existing `app/` shell until the WISDO backend repo path is confirmed.
