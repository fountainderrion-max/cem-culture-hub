import { getRouteByPath, normalizePathname } from "./routes.js";

/**
 * @typedef {import("./routes.js").AppRoute} AppRoute
 */

/**
 * @typedef RouteMatch
 * @property {string} path
 * @property {AppRoute | null} route
 * @property {"start" | "push" | "replace" | "pop"} source
 */

/**
 * @typedef GuardDecision
 * @property {boolean} allow
 * @property {string=} redirectTo
 * @property {string=} reason
 */

/**
 * @typedef RouterOptions
 * @property {(ctx: RouteMatch) => Promise<void> | void} onRoute
 * @property {(ctx: RouteMatch) => Promise<void> | void} [onNotFound]
 * @property {(ctx: RouteMatch & { reason?: string }) => Promise<void> | void} [onForbidden]
 * @property {(ctx: RouteMatch) => Promise<GuardDecision | boolean> | GuardDecision | boolean} [guard]
 */

/**
 * @param {RouterOptions} options
 */
export function createSpaRouter(options) {
  let started = false;
  let currentPath = normalizePathname(window.location.pathname);

  /**
   * @param {MouseEvent} event
   */
  function onDocumentClick(event) {
    if (event.defaultPrevented) return;
    if (event.button !== 0) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

    const target = event.target;
    if (!(target instanceof Element)) return;
    const anchor = target.closest("a[href]");
    if (!anchor) return;
    if (anchor.hasAttribute("download")) return;
    if (anchor.getAttribute("target") === "_blank") return;
    if (anchor.hasAttribute("data-router-ignore")) return;

    const href = anchor.getAttribute("href") || "";
    if (!href || href.startsWith("mailto:") || href.startsWith("tel:")) return;

    const url = new URL(href, window.location.origin);
    if (url.origin !== window.location.origin) return;
    if (url.pathname.startsWith("/api/")) return;

    event.preventDefault();
    void navigate(url.pathname, { source: "push" });
  }

  function onPopState() {
    void navigate(window.location.pathname, { source: "pop", replace: true });
  }

  /**
   * @param {string} path
   * @param {{ source?: "start" | "push" | "replace" | "pop"; replace?: boolean }} [opts]
   */
  async function navigate(path, opts = {}) {
    const normalized = normalizePathname(path);
    const source = opts.source || "push";
    const route = getRouteByPath(normalized);
    /** @type {RouteMatch} */
    const match = { path: normalized, route, source };

    if (options.guard) {
      const decision = await options.guard(match);
      const interpreted = interpretGuardDecision(decision);
      if (!interpreted.allow) {
        if (interpreted.redirectTo) {
          const redirectPath = normalizePathname(interpreted.redirectTo);
          if (redirectPath !== normalized) {
            return navigate(redirectPath, { source: "replace", replace: true });
          }
        }
        if (options.onForbidden) {
          await options.onForbidden({ ...match, reason: interpreted.reason });
        }
        return;
      }
    }

    syncHistory(normalized, !!opts.replace || source === "start" || source === "pop");
    currentPath = normalized;

    if (!route) {
      if (options.onNotFound) {
        await options.onNotFound(match);
      } else {
        await options.onRoute(match);
      }
      return;
    }

    await options.onRoute(match);
  }

  /**
   * @param {string} targetPath
   * @param {boolean} replace
   */
  function syncHistory(targetPath, replace) {
    const current = normalizePathname(window.location.pathname);
    if (current === targetPath) return;
    if (replace) {
      window.history.replaceState({}, "", targetPath);
      return;
    }
    window.history.pushState({}, "", targetPath);
  }

  function start() {
    if (started) return;
    started = true;
    window.addEventListener("popstate", onPopState);
    document.addEventListener("click", onDocumentClick);
    void navigate(window.location.pathname, { source: "start", replace: true });
  }

  function stop() {
    if (!started) return;
    started = false;
    window.removeEventListener("popstate", onPopState);
    document.removeEventListener("click", onDocumentClick);
  }

  return {
    start,
    stop,
    navigate,
    getCurrentPath: () => currentPath
  };
}

/**
 * @param {GuardDecision | boolean | undefined} input
 * @returns {GuardDecision}
 */
function interpretGuardDecision(input) {
  if (typeof input === "boolean") {
    return { allow: input };
  }
  if (!input || typeof input !== "object") {
    return { allow: true };
  }
  return {
    allow: input.allow !== false,
    redirectTo: input.redirectTo,
    reason: input.reason
  };
}

