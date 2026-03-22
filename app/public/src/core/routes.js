import { APP_ROLES } from "./roles.js";

/**
 * @typedef {import("./roles.js").AppRole} AppRole
 * @typedef {"public" | "app" | "war-room" | "admin"} ShellId
 */

/**
 * @typedef AppRoute
 * @property {string} path
 * @property {string} label
 * @property {string} title
 * @property {string} summary
 * @property {ShellId} shell
 * @property {ReadonlyArray<AppRole>} access
 * @property {string} navGroup
 * @property {string} integrationTodo
 */

const PUBLIC_ACCESS = Object.freeze([
  APP_ROLES.VISITOR,
  APP_ROLES.USER,
  APP_ROLES.PROVIDER,
  APP_ROLES.OPERATOR,
  APP_ROLES.ADMIN
]);

const APP_ACCESS = Object.freeze([
  APP_ROLES.USER,
  APP_ROLES.PROVIDER,
  APP_ROLES.OPERATOR,
  APP_ROLES.ADMIN
]);

const WAR_ROOM_ACCESS = Object.freeze([
  APP_ROLES.PROVIDER,
  APP_ROLES.OPERATOR,
  APP_ROLES.ADMIN
]);

const ADMIN_ACCESS = Object.freeze([APP_ROLES.ADMIN]);

/**
 * @type {Readonly<Record<ShellId, string>>}
 */
export const SHELL_DISPLAY_NAMES = Object.freeze({
  public: "Public",
  app: "App",
  "war-room": "War Room",
  admin: "Admin"
});

/**
 * @param {Omit<AppRoute, "path"> & { path: string }} route
 * @returns {AppRoute}
 */
function route(route) {
  return Object.freeze({
    ...route,
    path: normalizePathname(route.path)
  });
}

/**
 * @type {ReadonlyArray<AppRoute>}
 */
export const ROUTE_REGISTRY = Object.freeze([
  route({
    path: "/",
    label: "Home",
    title: "CEM CULTURE",
    summary: "Premium social trading operating system landing experience.",
    shell: "public",
    access: PUBLIC_ACCESS,
    navGroup: "discover",
    integrationTodo: "TODO: Connect live growth highlights and verified performance feed."
  }),
  route({
    path: "/bots",
    label: "Bot Arena",
    title: "Bot Arena",
    summary: "Explore bot families, strategies, and progression-aligned loadouts.",
    shell: "public",
    access: PUBLIC_ACCESS,
    navGroup: "discover",
    integrationTodo: "TODO: Connect public bot catalog with eligibility and risk profile data."
  }),
  route({
    path: "/squads",
    label: "Squads",
    title: "Squads",
    summary: "Discover squad archetypes and social coordination frameworks.",
    shell: "public",
    access: PUBLIC_ACCESS,
    navGroup: "discover",
    integrationTodo: "TODO: Connect live squad roster and ranking endpoints."
  }),
  route({
    path: "/providers",
    label: "Providers",
    title: "Provider Directory",
    summary: "Find signal providers and operator teams aligned with your style.",
    shell: "public",
    access: PUBLIC_ACCESS,
    navGroup: "discover",
    integrationTodo: "TODO: Connect provider verification and public performance cards."
  }),
  route({
    path: "/results",
    label: "Results",
    title: "Verified Results",
    summary: "Review account growth snapshots and risk-adjusted outcomes.",
    shell: "public",
    access: PUBLIC_ACCESS,
    navGroup: "discover",
    integrationTodo: "TODO: Connect broker-verified reporting service before marking data as live."
  }),
  route({
    path: "/community",
    label: "Community",
    title: "Culture Feed Preview",
    summary: "See social mission highlights, leaderboards, and challenge clips.",
    shell: "public",
    access: PUBLIC_ACCESS,
    navGroup: "discover",
    integrationTodo: "TODO: Connect moderation-safe public feed stream."
  }),
  route({
    path: "/pricing",
    label: "Pricing",
    title: "Plans & Access",
    summary: "Compare tiers across Link Vault, Bot Arena, and VPS Forge features.",
    shell: "public",
    access: PUBLIC_ACCESS,
    navGroup: "support",
    integrationTodo: "TODO: Connect billing product catalog and entitlement service."
  }),
  route({
    path: "/faq",
    label: "FAQ",
    title: "Frequently Asked Questions",
    summary: "Clarify linking, risk controls, and platform progression mechanics.",
    shell: "public",
    access: PUBLIC_ACCESS,
    navGroup: "support",
    integrationTodo: "TODO: Connect searchable help center content API."
  }),
  route({
    path: "/contact",
    label: "Contact",
    title: "Contact Team",
    summary: "Reach support, provider onboarding, and operations teams.",
    shell: "public",
    access: PUBLIC_ACCESS,
    navGroup: "support",
    integrationTodo: "TODO: Connect secure support ticket intake service."
  }),
  route({
    path: "/login",
    label: "Log In",
    title: "Member Login",
    summary: "Authenticate to access app, war-room, and admin experiences.",
    shell: "public",
    access: PUBLIC_ACCESS,
    navGroup: "support",
    integrationTodo: "TODO: Replace dev login with production identity provider."
  }),
  route({
    path: "/signup",
    label: "Sign Up",
    title: "Create Account",
    summary: "Join CEM CULTURE and unlock progression-driven social trading tools.",
    shell: "public",
    access: PUBLIC_ACCESS,
    navGroup: "support",
    integrationTodo: "TODO: Connect registration, verification, and consent workflows."
  }),

  route({
    path: "/app/feed",
    label: "Culture Feed",
    title: "Culture Feed",
    summary: "Personalized social stream, strategy drops, and challenge activity.",
    shell: "app",
    access: APP_ACCESS,
    navGroup: "social",
    integrationTodo: "TODO: Connect personalized social graph and ranking events."
  }),
  route({
    path: "/app/link-vault/my-accounts",
    label: "My Accounts",
    title: "Link Vault - My Accounts",
    summary: "View linked MT4/MT5 accounts, status, and trust controls.",
    shell: "app",
    access: APP_ACCESS,
    navGroup: "link-vault",
    integrationTodo: "TODO: Connect broker ownership verification and sync jobs."
  }),
  route({
    path: "/app/link-vault/add-account",
    label: "Add Account",
    title: "Link Vault - Add Account",
    summary: "Start new MT4/MT5 account linking workflow.",
    shell: "app",
    access: APP_ACCESS,
    navGroup: "link-vault",
    integrationTodo: "TODO: Connect encrypted credential exchange and validation flow."
  }),
  route({
    path: "/app/link-vault/analytics",
    label: "Analytics",
    title: "Link Vault - Analytics",
    summary: "Monitor equity, risk context, and account health windows.",
    shell: "app",
    access: APP_ACCESS,
    navGroup: "link-vault",
    integrationTodo: "TODO: Connect account telemetry and PnL aggregation APIs."
  }),
  route({
    path: "/app/link-vault/copier-profiles",
    label: "Copier Profiles",
    title: "Link Vault - Copier Profiles",
    summary: "Manage copy templates, limits, and execution preferences.",
    shell: "app",
    access: APP_ACCESS,
    navGroup: "link-vault",
    integrationTodo: "TODO: Connect copier orchestration service before claiming live execution."
  }),
  route({
    path: "/app/link-vault/protections",
    label: "Protections",
    title: "Link Vault - Protections",
    summary: "Set guardrails like max drawdown, pause rules, and kill switches.",
    shell: "app",
    access: APP_ACCESS,
    navGroup: "link-vault",
    integrationTodo: "TODO: Connect policy engine and emergency disconnect hooks."
  }),
  route({
    path: "/app/link-vault/history",
    label: "History",
    title: "Link Vault - History",
    summary: "Review account event history and configuration audit trail.",
    shell: "app",
    access: APP_ACCESS,
    navGroup: "link-vault",
    integrationTodo: "TODO: Connect immutable account action log service."
  }),
  route({
    path: "/app/bot-arena/all-bots",
    label: "All Bots",
    title: "Bot Arena - All Bots",
    summary: "Browse all available bots with strategy and compatibility context.",
    shell: "app",
    access: APP_ACCESS,
    navGroup: "bot-arena",
    integrationTodo: "TODO: Connect bot registry and availability service."
  }),
  route({
    path: "/app/bot-arena/my-bots",
    label: "My Bots",
    title: "Bot Arena - My Bots",
    summary: "Track your active bots, health, and loadout readiness.",
    shell: "app",
    access: APP_ACCESS,
    navGroup: "bot-arena",
    integrationTodo: "TODO: Connect user entitlement and deployment state."
  }),
  route({
    path: "/app/bot-arena/profiles",
    label: "Profiles",
    title: "Bot Arena - Profiles",
    summary: "Inspect behavior profiles, risk modes, and fallback logic.",
    shell: "app",
    access: APP_ACCESS,
    navGroup: "bot-arena",
    integrationTodo: "TODO: Connect model profile metadata and changelog feed."
  }),
  route({
    path: "/app/bot-arena/families",
    label: "Families",
    title: "Bot Arena - Families",
    summary: "Compare bot families and shared execution DNA.",
    shell: "app",
    access: APP_ACCESS,
    navGroup: "bot-arena",
    integrationTodo: "TODO: Connect family taxonomy and release channels."
  }),
  route({
    path: "/app/bot-arena/compatible-switches",
    label: "Compatible Switches",
    title: "Bot Arena - Compatible Switches",
    summary: "See switch compatibility and economic unlock requirements.",
    shell: "app",
    access: APP_ACCESS,
    navGroup: "bot-arena",
    integrationTodo: "TODO: Connect compatibility matrix and pricing constraints."
  }),
  route({
    path: "/app/bot-arena/loadout",
    label: "Loadout",
    title: "Bot Arena - Loadout",
    summary: "Assemble and activate your bot stack for current market posture.",
    shell: "app",
    access: APP_ACCESS,
    navGroup: "bot-arena",
    integrationTodo: "TODO: Connect remote config publishing for runtime loadouts."
  }),
  route({
    path: "/app/squads/explore",
    label: "Explore Squads",
    title: "Squads - Explore",
    summary: "Find squads aligned to strategy style and progression goals.",
    shell: "app",
    access: APP_ACCESS,
    navGroup: "squads",
    integrationTodo: "TODO: Connect squad discovery index and participation policies."
  }),
  route({
    path: "/app/squads/my-squads",
    label: "My Squads",
    title: "Squads - My Squads",
    summary: "Manage your squad memberships and operating status.",
    shell: "app",
    access: APP_ACCESS,
    navGroup: "squads",
    integrationTodo: "TODO: Connect squad membership graph and invite workflow."
  }),
  route({
    path: "/app/squads/profiles",
    label: "Squad Profiles",
    title: "Squads - Profiles",
    summary: "View squad profiles, strengths, and role composition.",
    shell: "app",
    access: APP_ACCESS,
    navGroup: "squads",
    integrationTodo: "TODO: Connect squad profile cards and performance metrics."
  }),
  route({
    path: "/app/squads/builder",
    label: "Squad Builder",
    title: "Squads - Builder",
    summary: "Design squads around bots, switches, and objectives.",
    shell: "app",
    access: APP_ACCESS,
    navGroup: "squads",
    integrationTodo: "TODO: Connect squad orchestration and save-publish APIs."
  }),
  route({
    path: "/app/switch-lab/explore",
    label: "Explore Switches",
    title: "Switch Lab - Explore",
    summary: "Discover available switches and unlock routes.",
    shell: "app",
    access: APP_ACCESS,
    navGroup: "switch-lab",
    integrationTodo: "TODO: Connect switch catalog and entitlement inventory."
  }),
  route({
    path: "/app/switch-lab/my-switches",
    label: "My Switches",
    title: "Switch Lab - My Switches",
    summary: "Manage owned switches and readiness states.",
    shell: "app",
    access: APP_ACCESS,
    navGroup: "switch-lab",
    integrationTodo: "TODO: Connect ownership ledger and switch assignment service."
  }),
  route({
    path: "/app/switch-lab/active",
    label: "Active Switches",
    title: "Switch Lab - Active",
    summary: "Monitor currently active switches and performance impact.",
    shell: "app",
    access: APP_ACCESS,
    navGroup: "switch-lab",
    integrationTodo: "TODO: Connect real-time activation state and rollback actions."
  }),
  route({
    path: "/app/switch-lab/unlock-path",
    label: "Unlock Path",
    title: "Switch Lab - Unlock Path",
    summary: "Track the progression ladder for locked switch capabilities.",
    shell: "app",
    access: APP_ACCESS,
    navGroup: "switch-lab",
    integrationTodo: "TODO: Connect progression service and unlock events."
  }),
  route({
    path: "/app/vps-forge/plans",
    label: "Plans",
    title: "VPS Forge - Plans",
    summary: "Compare VPS plans by workload, latency, and reliability tiers.",
    shell: "app",
    access: APP_ACCESS,
    navGroup: "vps-forge",
    integrationTodo: "TODO: Connect infrastructure catalog and plan pricing."
  }),
  route({
    path: "/app/vps-forge/servers",
    label: "Servers",
    title: "VPS Forge - Servers",
    summary: "View provisioned servers and operating status.",
    shell: "app",
    access: APP_ACCESS,
    navGroup: "vps-forge",
    integrationTodo: "TODO: Connect provisioning provider inventory."
  }),
  route({
    path: "/app/vps-forge/launch",
    label: "Launch",
    title: "VPS Forge - Launch",
    summary: "Launch new VPS instances for bot execution workloads.",
    shell: "app",
    access: APP_ACCESS,
    navGroup: "vps-forge",
    integrationTodo: "TODO: Connect infrastructure provisioning workflow."
  }),
  route({
    path: "/app/vps-forge/health",
    label: "Health",
    title: "VPS Forge - Health",
    summary: "Monitor uptime, resource pressure, and incident risk.",
    shell: "app",
    access: APP_ACCESS,
    navGroup: "vps-forge",
    integrationTodo: "TODO: Connect heartbeat, alerts, and resource telemetry."
  }),
  route({
    path: "/app/vps-forge/terminal-manager",
    label: "Terminal Manager",
    title: "VPS Forge - Terminal Manager",
    summary: "Coordinate MT4/MT5 terminal runtime states across servers.",
    shell: "app",
    access: APP_ACCESS,
    navGroup: "vps-forge",
    integrationTodo: "TODO: Connect remote terminal lifecycle controls."
  }),
  route({
    path: "/app/vps-forge/deployment-logs",
    label: "Deployment Logs",
    title: "VPS Forge - Deployment Logs",
    summary: "Review deployment status and operational history.",
    shell: "app",
    access: APP_ACCESS,
    navGroup: "vps-forge",
    integrationTodo: "TODO: Connect central deployment event stream."
  }),
  route({
    path: "/app/growth-chamber/account-growth",
    label: "Account Growth",
    title: "Growth Chamber - Account Growth",
    summary: "Track progression-focused growth curves and consistency metrics.",
    shell: "app",
    access: APP_ACCESS,
    navGroup: "growth",
    integrationTodo: "TODO: Connect account growth and risk consistency analytics."
  }),
  route({
    path: "/app/growth-chamber/unlock-ladder",
    label: "Unlock Ladder",
    title: "Growth Chamber - Unlock Ladder",
    summary: "View unlock sequence for capabilities and privileges.",
    shell: "app",
    access: APP_ACCESS,
    navGroup: "growth",
    integrationTodo: "TODO: Connect entitlement milestones and unlock rewards."
  }),
  route({
    path: "/app/growth-chamber/rank-path",
    label: "Rank Path",
    title: "Growth Chamber - Rank Path",
    summary: "Understand rank requirements and advancement targets.",
    shell: "app",
    access: APP_ACCESS,
    navGroup: "growth",
    integrationTodo: "TODO: Connect rank scoring and anti-abuse rules."
  }),
  route({
    path: "/app/growth-chamber/milestones",
    label: "Milestones",
    title: "Growth Chamber - Milestones",
    summary: "Review completed and upcoming progression milestones.",
    shell: "app",
    access: APP_ACCESS,
    navGroup: "growth",
    integrationTodo: "TODO: Connect milestone event ingestion pipeline."
  }),
  route({
    path: "/app/growth-chamber/rewards",
    label: "Rewards",
    title: "Growth Chamber - Rewards",
    summary: "Inspect earned and pending progression rewards.",
    shell: "app",
    access: APP_ACCESS,
    navGroup: "growth",
    integrationTodo: "TODO: Connect reward inventory and claim workflows."
  }),
  route({
    path: "/app/leaderboard",
    label: "Leaderboard",
    title: "Leaderboard",
    summary: "Compare performance and community reputation standings.",
    shell: "app",
    access: APP_ACCESS,
    navGroup: "social",
    integrationTodo: "TODO: Connect ranking service with anti-cheat validation."
  }),
  route({
    path: "/app/messages",
    label: "Messages",
    title: "Messages",
    summary: "Coordinate squad and provider communication threads.",
    shell: "app",
    access: APP_ACCESS,
    navGroup: "social",
    integrationTodo: "TODO: Connect secure real-time messaging service."
  }),
  route({
    path: "/app/challenges",
    label: "Challenges",
    title: "Challenges",
    summary: "Join progression-driven challenge campaigns.",
    shell: "app",
    access: APP_ACCESS,
    navGroup: "social",
    integrationTodo: "TODO: Connect challenge engine and leaderboard updates."
  }),
  route({
    path: "/app/profile",
    label: "Profile",
    title: "Profile",
    summary: "Manage identity, achievements, and trading persona.",
    shell: "app",
    access: APP_ACCESS,
    navGroup: "social",
    integrationTodo: "TODO: Connect profile media and preference storage."
  }),
  route({
    path: "/app/settings",
    label: "Settings",
    title: "Settings",
    summary: "Control security, preferences, and notification rules.",
    shell: "app",
    access: APP_ACCESS,
    navGroup: "social",
    integrationTodo: "TODO: Connect account settings and audit events."
  }),

  route({
    path: "/war-room/overview",
    label: "Overview",
    title: "War Room - Overview",
    summary: "Operational snapshot for provider and operator teams.",
    shell: "war-room",
    access: WAR_ROOM_ACCESS,
    navGroup: "operations",
    integrationTodo: "TODO: Connect live operational dashboard feeds."
  }),
  route({
    path: "/war-room/provider-profile",
    label: "Provider Profile",
    title: "War Room - Provider Profile",
    summary: "Manage public provider identity, policies, and trust badges.",
    shell: "war-room",
    access: WAR_ROOM_ACCESS,
    navGroup: "operations",
    integrationTodo: "TODO: Connect provider identity verification workflow."
  }),
  route({
    path: "/war-room/followers",
    label: "Followers",
    title: "War Room - Followers",
    summary: "Monitor follower segments and communication strategy.",
    shell: "war-room",
    access: WAR_ROOM_ACCESS,
    navGroup: "operations",
    integrationTodo: "TODO: Connect follower analytics and segmentation APIs."
  }),
  route({
    path: "/war-room/squads",
    label: "Squads",
    title: "War Room - Squads",
    summary: "Coordinate squads for provider strategy execution.",
    shell: "war-room",
    access: WAR_ROOM_ACCESS,
    navGroup: "operations",
    integrationTodo: "TODO: Connect provider-to-squad assignment controls."
  }),
  route({
    path: "/war-room/mission-control",
    label: "Mission Control",
    title: "War Room - Mission Control",
    summary: "Execute high-priority operations and incident actions.",
    shell: "war-room",
    access: WAR_ROOM_ACCESS,
    navGroup: "mission-control",
    integrationTodo: "TODO: Connect command execution workflow and approval chain."
  }),
  route({
    path: "/war-room/posts",
    label: "Posts",
    title: "War Room - Posts",
    summary: "Publish mission updates and provider communications.",
    shell: "war-room",
    access: WAR_ROOM_ACCESS,
    navGroup: "operations",
    integrationTodo: "TODO: Connect provider publishing and moderation pipeline."
  }),
  route({
    path: "/war-room/payouts",
    label: "Payouts",
    title: "War Room - Payouts",
    summary: "Track revenue share, payout schedules, and exceptions.",
    shell: "war-room",
    access: WAR_ROOM_ACCESS,
    navGroup: "operations",
    integrationTodo: "TODO: Connect payout ledger and processor webhooks."
  }),
  route({
    path: "/war-room/alerts",
    label: "Alerts",
    title: "War Room - Alerts",
    summary: "Review incidents, policy triggers, and escalation history.",
    shell: "war-room",
    access: WAR_ROOM_ACCESS,
    navGroup: "mission-control",
    integrationTodo: "TODO: Connect incident aggregation and acknowledgement flows."
  }),
  route({
    path: "/mission-control",
    label: "Mission Control",
    title: "Mission Control",
    summary: "Unified operator command surface outside nested war-room paths.",
    shell: "war-room",
    access: WAR_ROOM_ACCESS,
    navGroup: "mission-control",
    integrationTodo: "TODO: Connect global command center integrations."
  }),

  route({
    path: "/admin",
    label: "Admin Home",
    title: "Admin Console",
    summary: "Administrative overview for compliance and platform operations.",
    shell: "admin",
    access: ADMIN_ACCESS,
    navGroup: "governance",
    integrationTodo: "TODO: Connect admin metrics and audit dashboards."
  }),
  route({
    path: "/admin/users",
    label: "Users",
    title: "Admin - Users",
    summary: "Manage user accounts, statuses, and support actions.",
    shell: "admin",
    access: ADMIN_ACCESS,
    navGroup: "governance",
    integrationTodo: "TODO: Connect user administration endpoints."
  }),
  route({
    path: "/admin/providers",
    label: "Providers",
    title: "Admin - Providers",
    summary: "Review provider onboarding, verification, and performance flags.",
    shell: "admin",
    access: ADMIN_ACCESS,
    navGroup: "governance",
    integrationTodo: "TODO: Connect provider compliance workflows."
  }),
  route({
    path: "/admin/bots",
    label: "Bots",
    title: "Admin - Bots",
    summary: "Control bot availability, risk classifications, and policy checks.",
    shell: "admin",
    access: ADMIN_ACCESS,
    navGroup: "platform",
    integrationTodo: "TODO: Connect bot governance and release controls."
  }),
  route({
    path: "/admin/squads",
    label: "Squads",
    title: "Admin - Squads",
    summary: "Manage squad policies and moderation controls.",
    shell: "admin",
    access: ADMIN_ACCESS,
    navGroup: "platform",
    integrationTodo: "TODO: Connect squad moderation and policy enforcement."
  }),
  route({
    path: "/admin/switches",
    label: "Switches",
    title: "Admin - Switches",
    summary: "Govern switch rules, unlock criteria, and lifecycle states.",
    shell: "admin",
    access: ADMIN_ACCESS,
    navGroup: "platform",
    integrationTodo: "TODO: Connect switch inventory and pricing authority."
  }),
  route({
    path: "/admin/vps",
    label: "VPS",
    title: "Admin - VPS",
    summary: "Monitor infrastructure availability and provisioning health.",
    shell: "admin",
    access: ADMIN_ACCESS,
    navGroup: "operations",
    integrationTodo: "TODO: Connect infrastructure provider control plane."
  }),
  route({
    path: "/admin/accounts",
    label: "Accounts",
    title: "Admin - Linked Accounts",
    summary: "Oversee account linking integrity and risk policy enforcement.",
    shell: "admin",
    access: ADMIN_ACCESS,
    navGroup: "operations",
    integrationTodo: "TODO: Connect account verification and anomaly detection."
  }),
  route({
    path: "/admin/payments",
    label: "Payments",
    title: "Admin - Payments",
    summary: "Review subscriptions, settlements, and payout exceptions.",
    shell: "admin",
    access: ADMIN_ACCESS,
    navGroup: "operations",
    integrationTodo: "TODO: Connect billing reconciliation and dispute workflows."
  }),
  route({
    path: "/admin/moderation",
    label: "Moderation",
    title: "Admin - Moderation",
    summary: "Moderate social content and enforce community policy.",
    shell: "admin",
    access: ADMIN_ACCESS,
    navGroup: "governance",
    integrationTodo: "TODO: Connect moderation queues and escalation actions."
  }),
  route({
    path: "/admin/analytics",
    label: "Analytics",
    title: "Admin - Analytics",
    summary: "Analyze platform growth, risk patterns, and retention.",
    shell: "admin",
    access: ADMIN_ACCESS,
    navGroup: "governance",
    integrationTodo: "TODO: Connect internal analytics warehouse queries."
  })
]);

/**
 * @type {ReadonlyMap<string, AppRoute>}
 */
export const ROUTE_BY_PATH = new Map(ROUTE_REGISTRY.map((item) => [item.path, item]));

/**
 * @param {string} pathname
 * @returns {string}
 */
export function normalizePathname(pathname) {
  if (!pathname) return "/";
  const noQuery = pathname.split("?")[0].split("#")[0];
  const trimmed = noQuery.trim();
  if (!trimmed || trimmed === "/") return "/";
  const normalized = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  return normalized.length > 1 ? normalized.replace(/\/+$/, "") : normalized;
}

/**
 * @param {string} pathname
 * @returns {AppRoute | null}
 */
export function getRouteByPath(pathname) {
  return ROUTE_BY_PATH.get(normalizePathname(pathname)) || null;
}

/**
 * @param {ShellId} shell
 * @returns {ReadonlyArray<AppRoute>}
 */
export function listRoutesForShell(shell) {
  return ROUTE_REGISTRY.filter((item) => item.shell === shell);
}

/**
 * @param {string} pathname
 * @returns {ShellId}
 */
export function getShellForPath(pathname) {
  const normalized = normalizePathname(pathname);
  if (normalized === "/" || normalized === "/login" || normalized === "/signup" || !normalized.startsWith("/")) {
    return "public";
  }
  if (normalized.startsWith("/admin")) return "admin";
  if (normalized.startsWith("/war-room") || normalized === "/mission-control") return "war-room";
  if (normalized.startsWith("/app")) return "app";
  return "public";
}

/**
 * @param {AppRole} role
 * @returns {string}
 */
export function defaultPathForRole(role) {
  if (role === APP_ROLES.ADMIN) return "/admin";
  if (role === APP_ROLES.OPERATOR || role === APP_ROLES.PROVIDER) return "/war-room/overview";
  if (role === APP_ROLES.USER) return "/app/feed";
  return "/";
}

