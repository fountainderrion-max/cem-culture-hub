/**
 * Canonical application role names used by frontend route guards.
 * @typedef {"visitor" | "user" | "provider" | "operator" | "admin"} AppRole
 */

/**
 * @type {Readonly<Record<Uppercase<AppRole>, AppRole>>}
 */
export const APP_ROLES = Object.freeze({
  VISITOR: "visitor",
  USER: "user",
  PROVIDER: "provider",
  OPERATOR: "operator",
  ADMIN: "admin"
});

/**
 * @typedef {{ visitor: string; user: string; provider: string; operator: string; admin: string }} RoleLabels
 */

/**
 * @type {Readonly<RoleLabels>}
 */
export const ROLE_LABELS = Object.freeze({
  visitor: "Visitor",
  user: "Member",
  provider: "Provider",
  operator: "Operator",
  admin: "Admin"
});

/**
 * Normalize backend-provided role values to the frontend role union.
 * Unknown authenticated values are treated as member-level access.
 *
 * TODO: align this mapping with backend-issued RBAC claims once available.
 *
 * @param {string | null | undefined} backendRole
 * @param {boolean} authenticated
 * @returns {AppRole}
 */
export function normalizeAppRole(backendRole, authenticated) {
  const raw = String(backendRole || "").trim().toLowerCase();
  if (!authenticated) return APP_ROLES.VISITOR;
  if (raw === APP_ROLES.ADMIN) return APP_ROLES.ADMIN;
  if (raw === APP_ROLES.OPERATOR) return APP_ROLES.OPERATOR;
  if (raw === APP_ROLES.PROVIDER) return APP_ROLES.PROVIDER;
  return APP_ROLES.USER;
}

/**
 * @param {ReadonlyArray<AppRole>} allowedRoles
 * @param {AppRole} currentRole
 * @returns {boolean}
 */
export function hasRoleAccess(allowedRoles, currentRole) {
  return Array.isArray(allowedRoles) && allowedRoles.includes(currentRole);
}

