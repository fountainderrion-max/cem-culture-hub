# Deployment Platform Note

As of the WISDO World merge, GitHub reports a successful Vercel status on the merged `main` commit, while this repository also contains an explicit Render Web Service baseline (`app/render.yaml`).

These are not interchangeable deployment models:

- **Render Web Service** can run the current long-lived Node HTTP server directly using `node launch.js`.
- **Vercel** may successfully build/deploy the repository while still requiring serverless/function routing changes before the long-lived backend APIs behave like the Render service.

Before declaring production complete, confirm which platform owns the production custom domain and test:

1. `GET /api/health`
2. `GET /api/world/catalog`
3. authenticated `GET /api/world/me`
4. `/wisdo-world.html`

If Render is production, use the settings in `docs/render-production-settings.md`.

If Vercel is production, do not assume the existing `server.listen()` process is equivalent to a persistent Web Service. Adapt the backend to Vercel functions or keep the API on Render and point the Vercel frontend at that API.
