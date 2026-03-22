import { ROUTE_REGISTRY } from "../core/routes.js";

export function validateRouteRegistry() {
  const issues = [];
  const seen = new Set();
  for (const route of ROUTE_REGISTRY) {
    if (seen.has(route.path)) issues.push(`Duplicate path: ${route.path}`);
    seen.add(route.path);
    if (!route.label || !route.title || !route.summary) issues.push(`Missing metadata: ${route.path}`);
  }
  return { ok: issues.length === 0, issues };
}
