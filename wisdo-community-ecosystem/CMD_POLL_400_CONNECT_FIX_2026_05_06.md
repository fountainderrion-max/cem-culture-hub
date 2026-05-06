# CMD Poll 400 + Connect Interaction Fix

Prepared package: `CEM_CULTURE_WISDO_CMD_POLL_400_CONNECT_FIX_2026_05_06.zip`

## Symptoms fixed

```text
ERROR: Cmd Poll HTTP 400
DiscordAPIError[10062]: Unknown interaction
command: connect-mt4
at interaction.deferReply
```

## Root cause

1. Discord slash command interactions were expiring before `/connect-mt4` safely acknowledged the command.
2. When `/connect-mt4` expired, the bot did not reliably create/save the new pairing code.
3. MT4 Reporter then polled `/mt4-command-poll` with a missing, stale, or expired pairing code.
4. Server returned HTTP 400, making the terminal show `Cmd Poll HTTP 400`.

## Patch behavior

- Adds earlier/safe Discord acknowledgement for `/connect` and `/connect-mt4`.
- Adds safer defer handling so expired interactions do not crash the command chain.
- Makes `/mt4-command-poll` return a clean reconnect-required response instead of throwing a scary 400 for stale/missing pairing codes.
- Patches duplicate command/API copies in root, `server`, and `server/src` versions of the project package.

## Required reset after deploy

```text
1. Restart Render.
2. Run: npm run register-commands
3. In Discord, use /connect name: Demo Lead role: Leader
4. Copy the brand-new pairing code.
5. In the DEMO MT4 Reporter, paste that code.
6. For live, run /connect name: Live Account role: Follower
7. Paste that second code into the LIVE MT4 Reporter.
```

Do not reuse old pairing codes. Once `/connect-mt4` threw `Unknown interaction`, that code was not safely created/saved.

## Full package push limitation

The prepared zip is about 74MB and contains binaries/media such as `.ex4`, `.zip`, `.mp4`, `.png`, and `.jpg`. The connected GitHub tool in this chat can write text files through GitHub's contents API, but cannot perform a true bulk binary `git push` or extract the uploaded zip directly into the repository.

To push the full package, use the local commands below from your laptop.

```bash
cd path/to/correct/backend/repo
unzip ~/Downloads/CEM_CULTURE_WISDO_CMD_POLL_400_CONNECT_FIX_2026_05_06.zip -d /tmp/wisdo-fix
rsync -av --exclude='.env' --exclude='node_modules' /tmp/wisdo-fix/'CEM UPGRADE 1ST 5 6 26'/ ./
git add .
git commit -m "Fix WISDO command poll and connect interactions"
git push origin main
```
