#!/usr/bin/env node

import { ROUTE_REGISTRY } from "../../app/public/src/core/routes.js";

const requiredCommercialPaths = ["/terms", "/privacy", "/risk", "/security"];
const requiredAppPaths = [
  "/app/feed",
  "/app/link-vault/my-accounts",
  "/app/link-vault/history",
  "/app/bot-arena/all-bots",
  "/app/squads/explore",
  "/app/switch-lab/explore",
  "/app/vps-forge/plans",
  "/app/growth-chamber/account-growth",
  "/app/leaderboard",
  "/app/messages",
  "/app/profile",
  "/app/settings"
];

const issues = [];
const seenPaths = new Set();

for (const route of ROUTE_REGISTRY) {
  if (!route?.path) {
    issues.push(`Route missing path metadata: ${JSON.stringify(route)}`);
    continue;
  }

  if (seenPaths.has(route.path)) {
    issues.push(`Duplicate route path: ${route.path}`);
  } else {
    seenPaths.add(route.path);
  }
}

const missingCommercial = requiredCommercialPaths.filter((path) => !seenPaths.has(path));
if (missingCommercial.length > 0) {
  issues.push(`Missing commercial pages: ${missingCommercial.join(", ")}`);
}

const missingApp = requiredAppPaths.filter((path) => !seenPaths.has(path));
if (missingApp.length > 0) {
  issues.push(`Missing key app routes: ${missingApp.join(", ")}`);
}

if (issues.length === 0) {
  console.log("Route registry validation passed. All commercial and critical app routes are registered.");
} else {
  console.error("Route registry validation failed:\n" + issues.map((issue) => `  - ${issue}`).join("\n"));
  process.exitCode = 1;
}
