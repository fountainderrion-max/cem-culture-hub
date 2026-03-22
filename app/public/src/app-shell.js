import { canAccessRoute, resolveAuthContext, routeRequiresLogin, writeSimulatedRole } from "./core/auth.js";
import { APP_ROLES, ROLE_LABELS } from "./core/roles.js";
import {
  SHELL_DISPLAY_NAMES,
  defaultPathForRole,
  getShellForPath,
  listRoutesForShell,
  normalizePathname
} from "./core/routes.js";
import { createSpaRouter } from "./core/router.js";
import { renderMarketingPage } from "./domains/marketing/index.js";
import { renderProviderPage } from "./domains/provider/index.js";
import { renderAdminPage } from "./domains/admin/index.js";
import { renderFeedView } from "./domains/social/feed-view.js";
import { renderProfileView } from "./domains/social/profile-view.js";
import { renderMessagesView } from "./domains/social/messages-view.js";
import { renderChallengesView } from "./domains/social/challenges-view.js";
import { renderLeaderboardView } from "./domains/social/leaderboard-view.js";
import { mountLinkVaultDomain } from "./domains/link-vault/index.js";
import { mountBotArenaDomain } from "./domains/bot-arena/index.js";
import { mountSquadsDomain } from "./domains/squads/index.js";
import { mountSwitchLabDomain } from "./domains/switch-lab/index.js";
import { mountVpsForge } from "./domains/vps-forge/index.js";
import { mountGrowthDomain } from "./domains/growth/index.js";
import { getPublicConfig } from "./core/config.js";

/**
 * @typedef {import("./core/auth.js").AuthContext} AuthContext
 * @typedef {import("./core/routes.js").AppRoute} AppRoute
 */

const SHELL_ORDER = Object.freeze(["public", "app", "war-room", "admin"]);
const SHELL_ENTRY_PATH = Object.freeze({
  public: "/",
  app: "/app/feed",
  "war-room": "/war-room/overview",
  admin: "/admin"
});

const GROUP_LABELS = Object.freeze({
  discover: "Discover",
  support: "Support",
  social: "Social",
  "link-vault": "Link Vault",
  "bot-arena": "Bot Arena",
  squads: "Squads",
  "switch-lab": "Switch Lab",
  "vps-forge": "VPS Forge",
  growth: "Growth Chamber",
  operations: "Operations",
  "mission-control": "Mission Control",
  governance: "Governance",
  platform: "Platform"
});

/**
 * @param {HTMLElement} root
 */
export function startAppShell(root) {
  const state = {
    root,
    /** @type {AuthContext | null} */
    auth: null,
    router: null,
    activeUnmount: null
  };

  state.root.innerHTML = renderBootState();
  bindShellEvents(state);
  void initializeShell(state);
}

/**
 * @param {{ root: HTMLElement; auth: AuthContext | null; router: ReturnType<typeof createSpaRouter> | null }} state
 */
async function initializeShell(state) {
  try {
    state.auth = await resolveAuthContext();
    renderShellFrame(state);
    state.router = createSpaRouter({
      guard: (ctx) => guardRouteAccess(state, ctx.path, ctx.route),
      onRoute: (ctx) => renderActiveRoute(state, ctx.path, ctx.route),
      onNotFound: (ctx) => renderNotFound(state, ctx.path),
      onForbidden: (ctx) => renderForbidden(state, ctx.path, ctx.reason || "Access restricted.")
    });
    state.router.start();
  } catch (error) {
    state.root.innerHTML = renderFatalState(error);
  }
}

/**
 * @param {{ root: HTMLElement; auth: AuthContext | null; router: ReturnType<typeof createSpaRouter> | null }} state
 */
function bindShellEvents(state) {
  state.root.addEventListener("change", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLSelectElement)) return;
    if (target.id !== "cem-role-sim") return;

    const selected = String(target.value || "").trim();
    if (!selected || selected === "backend") {
      writeSimulatedRole(null);
    } else if (
      selected === APP_ROLES.USER ||
      selected === APP_ROLES.PROVIDER ||
      selected === APP_ROLES.OPERATOR ||
      selected === APP_ROLES.ADMIN
    ) {
      writeSimulatedRole(selected);
    }

    void refreshAuthAndReroute(state);
  });
}

/**
 * @param {{ root: HTMLElement; auth: AuthContext | null; router: ReturnType<typeof createSpaRouter> | null }} state
 */
async function refreshAuthAndReroute(state) {
  state.auth = await resolveAuthContext();
  renderHeaderState(state);
  const currentPath = state.router ? state.router.getCurrentPath() : window.location.pathname;
  if (state.router) {
    await state.router.navigate(currentPath, { source: "replace", replace: true });
  }
}

/**
 * @param {{ root: HTMLElement; auth: AuthContext | null; router: ReturnType<typeof createSpaRouter> | null }} state
 */
function renderShellFrame(state) {
  state.root.innerHTML = `
    <div class="cem-shell" data-shell-root="true">
      <header class="cem-shell__header" id="cem-shell-header"></header>
      <nav class="cem-shell__primary-nav" id="cem-shell-primary-nav" aria-label="Shell Navigation"></nav>
      <nav class="cem-shell__context-nav" id="cem-shell-context-nav" aria-label="Section Navigation"></nav>
      <main class="cem-shell__outlet" id="cem-shell-outlet" aria-live="polite"></main>
    </div>
  `;
  renderHeaderState(state);
}

/**
 * @param {{ root: HTMLElement; auth: AuthContext | null; router: ReturnType<typeof createSpaRouter> | null }} state
 */
function renderHeaderState(state) {
  const header = state.root.querySelector("#cem-shell-header");
  if (!(header instanceof HTMLElement) || !state.auth) return;

  const memberHandle =
    state.auth.member && typeof state.auth.member === "object" && "handle" in state.auth.member
      ? String(state.auth.member.handle || "Member")
      : "Visitor";
  const backendRole = state.auth.backendRole ? String(state.auth.backendRole) : "none";
  const roleLabel = ROLE_LABELS[state.auth.role] || "Member";

  header.innerHTML = `
    <div class="cem-shell__brand">
      <p class="cem-shell__eyebrow">CEM CULTURE</p>
      <h1>Mission Control Shell</h1>
      <p>Core architecture scaffold for public, app, war-room, and admin routes.</p>
    </div>
    <div class="cem-shell__session">
      <p><strong>Session:</strong> ${escapeHtml(memberHandle)}</p>
      <p><strong>Access:</strong> ${escapeHtml(roleLabel)}</p>
      <p><strong>Role Source:</strong> ${state.auth.simulationEnabled ? "Simulation" : "Backend"}</p>
      <label for="cem-role-sim">
        Role Simulation (development only)
      </label>
      <select id="cem-role-sim">
        <option value="backend"${state.auth.simulationEnabled ? "" : " selected"}>Backend role (${escapeHtml(
    backendRole
  )})</option>
        <option value="user"${state.auth.role === APP_ROLES.USER && state.auth.simulationEnabled ? " selected" : ""}>Member</option>
        <option value="provider"${
          state.auth.role === APP_ROLES.PROVIDER && state.auth.simulationEnabled ? " selected" : ""
        }>Provider</option>
        <option value="operator"${
          state.auth.role === APP_ROLES.OPERATOR && state.auth.simulationEnabled ? " selected" : ""
        }>Operator</option>
        <option value="admin"${state.auth.role === APP_ROLES.ADMIN && state.auth.simulationEnabled ? " selected" : ""}>Admin</option>
      </select>
      <p class="cem-shell__hint">TODO: replace role simulation with backend-issued RBAC claims.</p>
      ${renderAuthErrors(state.auth.errors)}
    </div>
  `;
}

/**
 * @param {ReadonlyArray<string>} errors
 * @returns {string}
 */
function renderAuthErrors(errors) {
  if (!errors || errors.length === 0) return "";
  return `
    <section class="cem-shell__error-state">
      <h2>Auth Service Warnings</h2>
      ${errors.map((error) => `<p>${escapeHtml(error)}</p>`).join("")}
    </section>
  `;
}

/**
 * @param {{ root: HTMLElement; auth: AuthContext | null; router: ReturnType<typeof createSpaRouter> | null }} state
 * @param {string} path
 * @param {AppRoute | null} route
 * @returns {{ allow: boolean; redirectTo?: string; reason?: string }}
 */
function guardRouteAccess(state, path, route) {
  if (!state.auth) {
    return { allow: false, reason: "Auth context unavailable." };
  }
  if (!route) {
    return { allow: true };
  }

  const isAuthPage = route.path === "/login" || route.path === "/signup";
  if (isAuthPage && state.auth.authenticated) {
    return {
      allow: false,
      redirectTo: defaultPathForRole(state.auth.role),
      reason: "Already authenticated."
    };
  }

  if (!canAccessRoute(route, state.auth)) {
    if (routeRequiresLogin(route) && !state.auth.authenticated) {
      return {
        allow: false,
        redirectTo: "/login",
        reason: "Sign in required for this route."
      };
    }
    return {
      allow: false,
      redirectTo: defaultPathForRole(state.auth.role),
      reason: `Role ${ROLE_LABELS[state.auth.role]} does not have access.`
    };
  }

  return { allow: true };
}

/**
 * @param {{ root: HTMLElement; auth: AuthContext | null; router: ReturnType<typeof createSpaRouter> | null }} state
 * @param {string} path
 * @param {AppRoute | null} route
 */
function renderActiveRoute(state, path, route) {
  const activeShell = route ? route.shell : getShellForPath(path);
  renderPrimaryShellNav(state, activeShell);
  renderContextNav(state, activeShell, normalizePathname(path));

  const outlet = state.root.querySelector("#cem-shell-outlet");
  if (!(outlet instanceof HTMLElement) || !state.auth) return;

  if (!route) {
    renderNotFound(state, path);
    return;
  }

  cleanupActiveMount(state);
  renderRouteSurface(state, outlet, route, path);
}

function cleanupActiveMount(state) {
  if (typeof state.activeUnmount === "function") {
    try {
      state.activeUnmount();
    } catch {
      // ignore cleanup errors
    }
  }
  state.activeUnmount = null;
}

function renderRouteSurface(state, outlet, route, path) {
  const normalized = normalizePathname(path);
  if (route.shell === "public") {
    outlet.innerHTML = renderMarketingPage(normalized);
    return;
  }

  if (route.shell === "war-room") {
    outlet.innerHTML = renderProviderPage(normalized);
    return;
  }

  if (route.shell === "admin") {
    outlet.innerHTML = renderAdminPage(normalized);
    return;
  }

  if (normalized === "/app/feed") {
    renderFeedView(outlet);
    return;
  }
  if (normalized === "/app/profile") {
    renderProfileView(outlet);
    return;
  }
  if (normalized === "/app/messages") {
    renderMessagesView(outlet);
    return;
  }
  if (normalized === "/app/challenges") {
    renderChallengesView(outlet);
    return;
  }
  if (normalized === "/app/leaderboard") {
    renderLeaderboardView(outlet);
    return;
  }

  if (normalized.startsWith("/app/link-vault/")) {
    const tabMap = {
      "/app/link-vault/my-accounts": "my-accounts",
      "/app/link-vault/add-account": "add-account",
      "/app/link-vault/analytics": "analytics",
      "/app/link-vault/copier-profiles": "copier-profiles",
      "/app/link-vault/protections": "protections",
      "/app/link-vault/history": "history"
    };
    mountLinkVaultDomain(outlet, { initialTab: tabMap[normalized] || "my-accounts" });
    return;
  }

  if (normalized.startsWith("/app/bot-arena/")) {
    mountBotArenaDomain(outlet);
    return;
  }
  if (normalized.startsWith("/app/squads/")) {
    mountSquadsDomain(outlet);
    return;
  }
  if (normalized.startsWith("/app/switch-lab/")) {
    mountSwitchLabDomain(outlet);
    return;
  }
  if (normalized.startsWith("/app/vps-forge/")) {
    const runtime = mountVpsForge(outlet);
    state.activeUnmount = () => runtime?.destroy?.();
    return;
  }
  if (normalized.startsWith("/app/growth-chamber/")) {
    mountGrowthDomain(outlet);
    return;
  }
  if (normalized === "/app/settings") {
    const config = getPublicConfig();
    outlet.innerHTML = `
      <section class="mk-page">
        <header class="mk-hero">
          <p class="mk-kicker">Settings</p>
          <h2>Profile, Security, and Notification Controls</h2>
          <p>Security and trust controls are represented in shell form until backend preference APIs are fully wired.</p>
        </header>
        <div class="mk-grid mk-grid-3">
          <article class="mk-card"><h3>Security</h3><p>Session controls, trusted devices, and emergency disconnect.</p></article>
          <article class="mk-card"><h3>Notifications</h3><p>Mission alerts, switch activation updates, and VPS health events.</p></article>
          <article class="mk-card"><h3>Privacy and Permissions</h3><p>Account-link scopes, profile visibility, and feed audience controls.</p></article>
        </div>
        <article class="mk-card">
          <h3>Apply for Provider / Operator Access</h3>
          <p>Default signup role is ${escapeHtml(config.roleDefaults.defaultSignupRole)}. Elevated roles require manual admin vetting before War Room access is granted.</p>
          <div class="chip-row"><span class="chip">${escapeHtml(config.labels.userSupplied)}</span><span class="chip">${escapeHtml(config.labels.placeholderIntegration)}</span></div>
        </article>
      </section>
    `;
    return;
  }

  outlet.innerHTML = `
    <section class="cem-shell__route">
      <header>
        <p>${escapeHtml(SHELL_DISPLAY_NAMES[route.shell])}</p>
        <h2>${escapeHtml(route.title)}</h2>
        <p>${escapeHtml(route.summary)}</p>
      </header>
      <section class="cem-shell__route-placeholder">
        <p>${escapeHtml(route.integrationTodo)}</p>
      </section>
    </section>
  `;
}

/**
 * @param {{ root: HTMLElement; auth: AuthContext | null; router: ReturnType<typeof createSpaRouter> | null }} state
 * @param {"public" | "app" | "war-room" | "admin"} activeShell
 */
function renderPrimaryShellNav(state, activeShell) {
  const nav = state.root.querySelector("#cem-shell-primary-nav");
  if (!(nav instanceof HTMLElement) || !state.auth) return;

  const links = SHELL_ORDER.map((shell) => {
    const landingPath = SHELL_ENTRY_PATH[shell];
    const hasAnyAccess = listRoutesForShell(shell).some((item) => canAccessRoute(item, state.auth));
    const active = shell === activeShell ? ' aria-current="page"' : "";

    if (!hasAnyAccess && shell !== "public") {
      return `<span class="cem-shell__tab is-disabled">${escapeHtml(SHELL_DISPLAY_NAMES[shell])}</span>`;
    }
    return `<a href="${landingPath}" class="cem-shell__tab"${active}>${escapeHtml(SHELL_DISPLAY_NAMES[shell])}</a>`;
  }).join("");

  nav.innerHTML = `
    <div class="cem-shell__tabs">
      ${links}
    </div>
  `;
}

/**
 * @param {{ root: HTMLElement; auth: AuthContext | null; router: ReturnType<typeof createSpaRouter> | null }} state
 * @param {"public" | "app" | "war-room" | "admin"} shell
 * @param {string} activePath
 */
function renderContextNav(state, shell, activePath) {
  const nav = state.root.querySelector("#cem-shell-context-nav");
  if (!(nav instanceof HTMLElement) || !state.auth) return;

  const routes = listRoutesForShell(shell).filter((item) => canAccessRoute(item, state.auth));
  if (!routes.length) {
    nav.innerHTML = `
      <section class="cem-shell__empty">
        <p>This section is currently unavailable for your role.</p>
      </section>
    `;
    return;
  }

  /** @type {Map<string, AppRoute[]>} */
  const grouped = new Map();
  for (const item of routes) {
    if (!grouped.has(item.navGroup)) grouped.set(item.navGroup, []);
    grouped.get(item.navGroup).push(item);
  }

  nav.innerHTML = Array.from(grouped.entries())
    .map(([group, items]) => {
      const heading = GROUP_LABELS[group] || group;
      const links = items
        .map((item) => {
          const current = item.path === activePath ? ' aria-current="page"' : "";
          return `<a href="${item.path}"${current}>${escapeHtml(item.label)}</a>`;
        })
        .join("");
      return `
        <section class="cem-shell__group">
          <p>${escapeHtml(heading)}</p>
          <div class="cem-shell__group-links">${links}</div>
        </section>
      `;
    })
    .join("");
}

/**
 * @param {{ root: HTMLElement; auth: AuthContext | null; router: ReturnType<typeof createSpaRouter> | null }} state
 * @param {string} path
 */
function renderNotFound(state, path) {
  renderPrimaryShellNav(state, getShellForPath(path));
  renderContextNav(state, getShellForPath(path), normalizePathname(path));
  const outlet = state.root.querySelector("#cem-shell-outlet");
  if (!(outlet instanceof HTMLElement)) return;
  outlet.innerHTML = `
    <section class="cem-shell__not-found">
      <h2>Route Not Found</h2>
      <p>No route is registered for <strong>${escapeHtml(normalizePathname(path))}</strong>.</p>
      <p>TODO: map this path to a domain module or remove stale links.</p>
    </section>
  `;
}

/**
 * @param {{ root: HTMLElement; auth: AuthContext | null; router: ReturnType<typeof createSpaRouter> | null }} state
 * @param {string} path
 * @param {string} reason
 */
function renderForbidden(state, path, reason) {
  renderPrimaryShellNav(state, getShellForPath(path));
  renderContextNav(state, getShellForPath(path), normalizePathname(path));
  const outlet = state.root.querySelector("#cem-shell-outlet");
  if (!(outlet instanceof HTMLElement)) return;
  outlet.innerHTML = `
    <section class="cem-shell__forbidden">
      <h2>Access Restricted</h2>
      <p>${escapeHtml(reason)}</p>
      <p>You requested: <strong>${escapeHtml(normalizePathname(path))}</strong></p>
      <p>TODO: connect backend role claims and scoped policy hints for precise access messaging.</p>
    </section>
  `;
}

/**
 * @returns {string}
 */
function renderBootState() {
  return `
    <main class="cem-shell__boot">
      <h1>CEM CULTURE</h1>
      <p>Loading architecture shell...</p>
    </main>
  `;
}

/**
 * @param {unknown} error
 * @returns {string}
 */
function renderFatalState(error) {
  const message = error instanceof Error ? error.message : String(error || "Unknown error");
  return `
    <main class="cem-shell__fatal">
      <h1>Shell Initialization Failed</h1>
      <p>${escapeHtml(message)}</p>
      <p>TODO: add centralized frontend telemetry for startup failures.</p>
    </main>
  `;
}

/**
 * @param {string} value
 * @returns {string}
 */
function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
