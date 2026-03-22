import { APP_ROLES, hasRoleAccess, normalizeAppRole } from "./roles.js";

/**
 * @typedef {import("./roles.js").AppRole} AppRole
 * @typedef {import("./routes.js").AppRoute} AppRoute
 */

const SIMULATED_ROLE_KEY = "cemculture.simulatedRole";

/**
 * @typedef AuthContext
 * @property {boolean} authenticated
 * @property {AppRole} role
 * @property {unknown | null} member
 * @property {string | null} backendRole
 * @property {boolean} allowDevLogin
 * @property {boolean} simulationEnabled
 * @property {ReadonlyArray<string>} errors
 */

/**
 * @param {string} path
 * @returns {Promise<any>}
 */
async function getJson(path) {
  const response = await fetch(path, {
    method: "GET",
    headers: { Accept: "application/json" },
    credentials: "same-origin"
  });
  if (!response.ok) {
    throw new Error(`${path} request failed (${response.status})`);
  }
  return response.json();
}

/**
 * Read locally simulated role.
 * Simulation is explicit for shell scaffolding while backend RBAC is pending.
 *
 * TODO: remove local simulation once backend role claims are signed and trusted.
 *
 * @returns {AppRole | null}
 */
export function readSimulatedRole() {
  try {
    const raw = window.localStorage.getItem(SIMULATED_ROLE_KEY);
    if (!raw) return null;
    const lowered = raw.trim().toLowerCase();
    if (
      lowered === APP_ROLES.USER ||
      lowered === APP_ROLES.PROVIDER ||
      lowered === APP_ROLES.OPERATOR ||
      lowered === APP_ROLES.ADMIN
    ) {
      return lowered;
    }
  } catch {
    return null;
  }
  return null;
}

/**
 * @param {AppRole | null} role
 */
export function writeSimulatedRole(role) {
  try {
    if (!role || role === APP_ROLES.VISITOR) {
      window.localStorage.removeItem(SIMULATED_ROLE_KEY);
      return;
    }
    window.localStorage.setItem(SIMULATED_ROLE_KEY, role);
  } catch {
    // ignore local storage failures in constrained browsers
  }
}

/**
 * @returns {Promise<AuthContext>}
 */
export async function resolveAuthContext() {
  /** @type {string[]} */
  const errors = [];
  let allowDevLogin = false;
  let authenticated = false;
  /** @type {unknown | null} */
  let member = null;
  let backendRole = null;

  const [configResult, meResult] = await Promise.allSettled([
    getJson("/api/auth/config"),
    getJson("/api/auth/me")
  ]);

  if (configResult.status === "fulfilled") {
    allowDevLogin = !!configResult.value?.allowDevLogin;
  } else {
    errors.push(configResult.reason?.message || "Failed to load auth config.");
  }

  if (meResult.status === "fulfilled") {
    authenticated = !!meResult.value?.authenticated;
    member = meResult.value?.member || null;
    const value = member && typeof member === "object" ? member.role : null;
    backendRole = typeof value === "string" ? value : null;
  } else {
    errors.push(meResult.reason?.message || "Failed to load auth identity.");
  }

  let role = normalizeAppRole(backendRole, authenticated);
  const simulatedRole = readSimulatedRole();
  const simulationEnabled = !!simulatedRole && role !== APP_ROLES.VISITOR;
  if (simulationEnabled && simulatedRole) {
    role = simulatedRole;
  }

  return {
    authenticated,
    role,
    member,
    backendRole,
    allowDevLogin,
    simulationEnabled,
    errors
  };
}

/**
 * @param {AppRoute} route
 * @returns {boolean}
 */
export function routeRequiresLogin(route) {
  return !route.access.includes(APP_ROLES.VISITOR);
}

/**
 * @param {AppRoute} route
 * @param {AuthContext} auth
 * @returns {boolean}
 */
export function canAccessRoute(route, auth) {
  if (routeRequiresLogin(route) && !auth.authenticated) {
    return false;
  }
  return hasRoleAccess(route.access, auth.role);
}

