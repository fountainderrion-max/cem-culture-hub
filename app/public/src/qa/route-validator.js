import { ROUTE_REGISTRY } from "../core/routes.js";

export function validateRouteRegistry() {
  const issues = [];
  const seen = new Set();
  const requiredPublicRoutes = new Set([
    "/",
    "/bots",
    "/squads",
    "/providers",
    "/results",
    "/community",
    "/pricing",
    "/faq",
    "/contact",
    "/legal/privacy",
    "/legal/terms",
    "/legal/risk-disclosure",
    "/privacy",
    "/terms",
    "/risk",
    "/security",
    "/login",
    "/signup"
  ]);
  const requiredAppRoutes = new Set([
    "/app/feed",
    "/app/link-vault/my-accounts",
    "/app/bot-arena/all-bots",
    "/app/squads/explore",
    "/app/switch-lab/explore",
    "/app/vps-forge/plans",
    "/app/growth-chamber/account-growth",
    "/app/leaderboard",
    "/app/messages",
    "/app/challenges",
    "/app/profile",
    "/app/settings"
  ]);

  for (const route of ROUTE_REGISTRY) {
    if (seen.has(route.path)) issues.push(`Duplicate path: ${route.path}`);
    seen.add(route.path);

    if (!route.label || !route.title || !route.summary) {
      issues.push(`Missing metadata: ${route.path}`);
    }
    if (!Array.isArray(route.access) || route.access.length === 0) {
      issues.push(`Missing role access controls: ${route.path}`);
    }
    if (!route.navGroup) {
      issues.push(`Missing navGroup metadata: ${route.path}`);
    }
  }

  for (const path of requiredPublicRoutes) {
    if (!seen.has(path)) issues.push(`Missing required public route: ${path}`);
  }
  for (const path of requiredAppRoutes) {
    if (!seen.has(path)) issues.push(`Missing required app route: ${path}`);
  }

  return { ok: issues.length === 0, issues };
}
