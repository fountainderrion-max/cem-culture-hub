import crypto from "crypto";
import http from "http";
import https from "https";
import path from "path";
import { fileURLToPath } from "url";
import { promises as fs } from "fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, "data");
const WORLD_STORE_FILE = path.join(DATA_DIR, "wisdo-world-store.json");
const MAX_BODY_BYTES = Number(process.env.MAX_BODY_BYTES || 50_000);
const WORLD_ALLOW_DEV_TIER = String(process.env.WORLD_ALLOW_DEV_TIER || "false").toLowerCase() === "true";
const ALLOW_DEV_LOGIN = String(process.env.ALLOW_DEV_LOGIN || "true").toLowerCase() === "true";

const WORLD_TIERS = Object.freeze([
  { key: "cadet", legacyLabel: "Cadet", worldLabel: "Member", level: 0, price: Number(process.env.TIER_CADET_PRICE || 0) },
  { key: "operator", legacyLabel: "Operator", worldLabel: "Sovereign", level: 1, price: Number(process.env.TIER_OPERATOR_PRICE || 150) },
  { key: "squadron", legacyLabel: "Squadron", worldLabel: "Elite", level: 2, price: Number(process.env.TIER_SQUADRON_PRICE || 500) },
  { key: "command", legacyLabel: "Command", worldLabel: "Commander", level: 3, price: Number(process.env.TIER_COMMAND_PRICE || 0) }
]);

const WORLD_DESTINATIONS = Object.freeze([
  { id: "trading-tower", minTier: "cadet" },
  { id: "academy", minTier: "cadet" },
  { id: "vault", minTier: "operator" },
  { id: "bot-arena", minTier: "cadet" },
  { id: "switch-lab", minTier: "operator" },
  { id: "growth-chamber", minTier: "cadet" },
  { id: "strategy-lab", minTier: "squadron" },
  { id: "coach-center", minTier: "cadet" },
  { id: "culture-arena", minTier: "cadet" },
  { id: "marketplace", minTier: "cadet" },
  { id: "vps-forge", minTier: "operator" },
  { id: "private-rooms", minTier: "command" },
  { id: "war-room", minTier: "command" }
]);

const NODE_TYPES = new Set([
  "PRIMARY_REPORTER",
  "LAPTOP_REPORTER",
  "VPS_REPORTER",
  "MOBILE_CELLULAR_NODE",
  "MOBILE_CONTROLLER",
  "COPY_FOLLOWER_NODE",
  "COACH_VIEWER_NODE",
  "BACKUP_REPORTER",
  "SIGNAL_ONLY_NODE",
  "CLOUD_EXECUTION_NODE"
]);

const ROUTE_TYPES = new Set([
  "LOCAL_REPORTER",
  "VPS_REPORTER",
  "CLOUD_MT4_NODE",
  "BROKER_API",
  "FIX_API",
  "MANUAL_ONLY"
]);

const NODE_PREFIX = Object.freeze({
  PRIMARY_REPORTER: "RPT",
  LAPTOP_REPORTER: "RPT",
  VPS_REPORTER: "VPS",
  MOBILE_CELLULAR_NODE: "MOB",
  MOBILE_CONTROLLER: "MOB",
  COPY_FOLLOWER_NODE: "CPY",
  COACH_VIEWER_NODE: "COA",
  BACKUP_REPORTER: "BKP",
  SIGNAL_ONLY_NODE: "SIG",
  CLOUD_EXECUTION_NODE: "CLD"
});

let worldStore = null;
let worldWriteQueue = Promise.resolve();
const sidecarRate = new Map();

function uid(prefix) {
  return `${prefix}-${crypto.randomBytes(8).toString("hex")}`;
}

function clean(value, maxLen = 240) {
  if (typeof value !== "string") return "";
  return value.replace(/\u0000/g, "").trim().slice(0, maxLen);
}

function clamp(value, min, max) {
  const n = Number(value);
  if (!Number.isFinite(n)) return min;
  return Math.max(min, Math.min(max, n));
}

function tierByKey(key) {
  return WORLD_TIERS.find((tier) => tier.key === key) || WORLD_TIERS[0];
}

function destinationById(id) {
  return WORLD_DESTINATIONS.find((destination) => destination.id === id) || null;
}

function seedWorldStore() {
  return {
    version: 1,
    members: [],
    entitlements: [],
    workspaces: [],
    tradingAccounts: [],
    reporterNodes: [],
    executionRoutes: [],
    auditLogs: []
  };
}

async function ensureWorldStore() {
  if (worldStore) return worldStore;
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    worldStore = JSON.parse(await fs.readFile(WORLD_STORE_FILE, "utf8"));
  } catch {
    worldStore = seedWorldStore();
    await fs.writeFile(WORLD_STORE_FILE, JSON.stringify(worldStore, null, 2), "utf8");
  }

  for (const key of ["members", "entitlements", "workspaces", "tradingAccounts", "reporterNodes", "executionRoutes", "auditLogs"]) {
    if (!Array.isArray(worldStore[key])) worldStore[key] = [];
  }
  return worldStore;
}

function saveWorldStore() {
  worldWriteQueue = worldWriteQueue
    .then(() => fs.writeFile(WORLD_STORE_FILE, JSON.stringify(worldStore, null, 2), "utf8"))
    .catch((error) => console.error("WISDO World store save failed:", error));
  return worldWriteQueue;
}

function writeHeaders(res) {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Content-Security-Policy", "default-src 'none'; frame-ancestors 'none'; base-uri 'none'");
}

function sendJson(res, status, payload) {
  writeHeaders(res);
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(payload));
}

async function readBody(req) {
  const chunks = [];
  let total = 0;
  for await (const chunk of req) {
    total += chunk.length;
    if (total > MAX_BODY_BYTES) throw new Error("PAYLOAD_TOO_LARGE");
    chunks.push(chunk);
  }
  if (!chunks.length) return {};
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    return null;
  }
}

function isSidecarRateLimited(req) {
  const raw = req.headers["x-forwarded-for"];
  const ip = typeof raw === "string" && raw ? raw.split(",")[0].trim() : req.socket?.remoteAddress || "unknown";
  const now = Date.now();
  const state = sidecarRate.get(ip) || { startedAt: now, count: 0 };
  if (now - state.startedAt > 60_000) {
    state.startedAt = now;
    state.count = 0;
  }
  state.count += 1;
  sidecarRate.set(ip, state);
  return state.count > 240;
}

function captureResponse() {
  let statusCode = 200;
  const headers = new Map();
  let body = "";
  let resolveDone;
  const done = new Promise((resolve) => {
    resolveDone = resolve;
  });

  return {
    done,
    get statusCode() {
      return statusCode;
    },
    get body() {
      return body;
    },
    setHeader(name, value) {
      headers.set(String(name).toLowerCase(), value);
    },
    getHeader(name) {
      return headers.get(String(name).toLowerCase());
    },
    writeHead(code, suppliedHeaders = {}) {
      statusCode = Number(code) || 200;
      for (const [name, value] of Object.entries(suppliedHeaders || {})) {
        headers.set(name.toLowerCase(), value);
      }
      return this;
    },
    write(chunk) {
      if (chunk) body += Buffer.isBuffer(chunk) ? chunk.toString("utf8") : String(chunk);
      return true;
    },
    end(chunk) {
      if (chunk) body += Buffer.isBuffer(chunk) ? chunk.toString("utf8") : String(chunk);
      resolveDone();
    }
  };
}

async function resolveMember(req, originalHandler) {
  const fake = captureResponse();
  const authReq = Object.create(req);
  Object.defineProperty(authReq, "url", { configurable: true, enumerable: true, value: "/api/auth/me" });
  Object.defineProperty(authReq, "method", { configurable: true, enumerable: true, value: "GET" });

  try {
    await originalHandler(authReq, fake);
    await fake.done;
  } catch {
    return null;
  }

  if (fake.statusCode !== 200) return null;
  try {
    const payload = JSON.parse(fake.body || "{}");
    return payload?.authenticated && payload?.member ? payload.member : null;
  } catch {
    return null;
  }
}

function ensureMemberWorld(member) {
  let record = worldStore.members.find((item) => item.memberId === member.id);
  if (!record) {
    record = {
      id: uid("world-member"),
      memberId: member.id,
      tierKey: "cadet",
      callsign: clean(member.handle || "Commander", 48) || "Commander",
      title: "World Explorer",
      avatarStyle: "vanguard",
      xp: 0,
      visitedDestinations: [],
      achievements: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    worldStore.members.push(record);
  }

  let workspace = worldStore.workspaces.find((item) => item.ownerMemberId === member.id);
  if (!workspace) {
    workspace = {
      id: uid("workspace"),
      ownerMemberId: member.id,
      name: `${clean(member.handle || "Member", 60)} WISDO Workspace`,
      plan: record.tierKey,
      status: "active",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    worldStore.workspaces.push(workspace);
  }

  return { record, workspace };
}

function activeEntitlements(memberId) {
  const now = Date.now();
  return worldStore.entitlements.filter((item) => {
    if (item.memberId !== memberId || item.status !== "active") return false;
    if (!item.expiresAt) return true;
    return new Date(item.expiresAt).getTime() > now;
  });
}

function destinationAccess(memberRecord) {
  const tier = tierByKey(memberRecord.tierKey);
  const grants = new Set(
    activeEntitlements(memberRecord.memberId)
      .filter((item) => item.kind === "destination")
      .map((item) => item.key)
  );

  return WORLD_DESTINATIONS.map((destination) => {
    const requiredTier = tierByKey(destination.minTier);
    const unlockedByTier = tier.level >= requiredTier.level;
    const unlockedByGrant = grants.has(destination.id);
    return {
      id: destination.id,
      minTier: destination.minTier,
      minTierLabel: requiredTier.worldLabel,
      unlocked: unlockedByTier || unlockedByGrant,
      source: unlockedByGrant ? "entitlement" : unlockedByTier ? "tier" : "locked"
    };
  });
}

function audit(memberId, workspaceId, action, details = {}) {
  worldStore.auditLogs.unshift({
    id: uid("audit"),
    memberId,
    workspaceId,
    action,
    details,
    createdAt: new Date().toISOString()
  });
  worldStore.auditLogs = worldStore.auditLogs.slice(0, 5000);
}

function meshForWorkspace(workspaceId) {
  const accounts = worldStore.tradingAccounts.filter((item) => item.workspaceId === workspaceId);
  const nodes = worldStore.reporterNodes
    .filter((item) => item.workspaceId === workspaceId)
    .map(({ nodeTokenHash, ...safe }) => safe);
  const routes = worldStore.executionRoutes.filter((item) => item.workspaceId === workspaceId);
  return {
    accounts,
    nodes,
    routes,
    summary: {
      accounts: accounts.length,
      nodes: nodes.length,
      onlineNodes: nodes.filter((item) => item.status === "online").length,
      executionRoutes: routes.length,
      executableRoutes: routes.filter((item) => item.canExecute === true && item.status === "online").length
    }
  };
}

function serializeMemberWorld(member, record, workspace) {
  const tier = tierByKey(record.tierKey);
  return {
    member: { id: member.id, handle: member.handle || "", role: member.role || "member" },
    worldProfile: {
      callsign: record.callsign,
      title: record.title,
      avatarStyle: record.avatarStyle,
      xp: record.xp,
      level: Math.max(1, Math.floor(record.xp / 250) + 1),
      visitedDestinations: record.visitedDestinations,
      achievements: record.achievements
    },
    access: {
      tierKey: tier.key,
      legacyLabel: tier.legacyLabel,
      worldLabel: tier.worldLabel,
      level: tier.level,
      destinations: destinationAccess(record),
      entitlements: activeEntitlements(member.id).map((item) => ({
        id: item.id,
        kind: item.kind,
        key: item.key,
        source: item.source,
        expiresAt: item.expiresAt || null
      }))
    },
    workspace: {
      id: workspace.id,
      name: workspace.name,
      plan: workspace.plan,
      status: workspace.status
    },
    mesh: meshForWorkspace(workspace.id).summary,
    persistence: "server",
    updatedAt: record.updatedAt
  };
}

function worldCatalog() {
  return {
    canonicalTierModel: "cadet/operator/squadron/command",
    worldAliases: "Member/Sovereign/Elite/Commander",
    tiers: WORLD_TIERS,
    destinations: WORLD_DESTINATIONS.map((destination) => ({
      ...destination,
      minTierLabel: tierByKey(destination.minTier).worldLabel
    })),
    devTierEndpointEnabled: WORLD_ALLOW_DEV_TIER && ALLOW_DEV_LOGIN,
    billingConnected: false,
    note: "Tier pricing is configuration-driven. Billing must grant server-side entitlements before production access changes."
  };
}

async function handleWorldRequest(req, res, originalHandler) {
  if (isSidecarRateLimited(req)) {
    sendJson(res, 429, { message: "Too many WISDO World requests." });
    return;
  }

  await ensureWorldStore();
  const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);

  if (req.method === "GET" && url.pathname === "/api/world/catalog") {
    sendJson(res, 200, worldCatalog());
    return;
  }

  const member = await resolveMember(req, originalHandler);
  if (!member) {
    sendJson(res, 401, { message: "Authenticated member session required." });
    return;
  }

  const { record, workspace } = ensureMemberWorld(member);

  if (req.method === "GET" && url.pathname === "/api/world/me") {
    await saveWorldStore();
    sendJson(res, 200, serializeMemberWorld(member, record, workspace));
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/world/mesh") {
    sendJson(res, 200, meshForWorkspace(workspace.id));
    return;
  }

  if (req.method !== "POST") {
    sendJson(res, 404, { message: "WISDO World route not found." });
    return;
  }

  let body;
  try {
    body = await readBody(req);
  } catch (error) {
    sendJson(res, error?.message === "PAYLOAD_TOO_LARGE" ? 413 : 400, { message: "Invalid request body." });
    return;
  }
  if (body === null) {
    sendJson(res, 400, { message: "Invalid JSON body." });
    return;
  }

  if (url.pathname === "/api/world/profile") {
    const callsign = clean(body.callsign || record.callsign, 48);
    const title = clean(body.title || record.title, 64);
    const avatarStyle = clean(body.avatarStyle || record.avatarStyle, 24).toLowerCase();
    const allowedAvatarStyles = new Set(["vanguard", "architect", "sentinel", "scholar"]);
    if (!callsign || !title || !allowedAvatarStyles.has(avatarStyle)) {
      sendJson(res, 400, { message: "Valid callsign, title, and avatarStyle are required." });
      return;
    }
    record.callsign = callsign;
    record.title = title;
    record.avatarStyle = avatarStyle;
    record.updatedAt = new Date().toISOString();
    audit(member.id, workspace.id, "WORLD_PROFILE_UPDATED", { callsign, avatarStyle });
    await saveWorldStore();
    sendJson(res, 200, serializeMemberWorld(member, record, workspace));
    return;
  }

  if (url.pathname === "/api/world/visit") {
    const destinationId = clean(body.destinationId || "", 60);
    const destination = destinationById(destinationId);
    if (!destination) {
      sendJson(res, 400, { message: "Unknown destination." });
      return;
    }
    const access = destinationAccess(record).find((item) => item.id === destinationId);
    if (!access?.unlocked) {
      sendJson(res, 403, { message: `Requires ${access?.minTierLabel || "higher"} access.`, access });
      return;
    }
    const firstVisit = !record.visitedDestinations.includes(destinationId);
    if (firstVisit) {
      record.visitedDestinations.push(destinationId);
      record.xp = clamp(record.xp + 50, 0, 10_000_000);
      record.updatedAt = new Date().toISOString();
      audit(member.id, workspace.id, "WORLD_DESTINATION_VISITED", { destinationId, xpAwarded: 50 });
      await saveWorldStore();
    }
    sendJson(res, 200, { firstVisit, xpAwarded: firstVisit ? 50 : 0, state: serializeMemberWorld(member, record, workspace) });
    return;
  }

  if (url.pathname === "/api/world/dev/tier") {
    if (!WORLD_ALLOW_DEV_TIER || !ALLOW_DEV_LOGIN) {
      sendJson(res, 403, { message: "Development tier override is disabled." });
      return;
    }
    const requested = clean(body.tierKey || "", 24).toLowerCase();
    const tier = WORLD_TIERS.find((item) => item.key === requested);
    if (!tier) {
      sendJson(res, 400, { message: "Unknown tierKey." });
      return;
    }
    record.tierKey = tier.key;
    workspace.plan = tier.key;
    record.updatedAt = new Date().toISOString();
    workspace.updatedAt = record.updatedAt;
    audit(member.id, workspace.id, "DEV_WORLD_TIER_OVERRIDE", { tierKey: tier.key });
    await saveWorldStore();
    sendJson(res, 200, serializeMemberWorld(member, record, workspace));
    return;
  }

  if (url.pathname === "/api/world/mesh/account") {
    const broker = clean(body.broker || "", 80);
    const server = clean(body.server || "", 100);
    const login = clean(String(body.login || ""), 80);
    const accountName = clean(body.accountName || "Trading Account", 100);
    const demoLive = clean(body.demoLive || "demo", 12).toLowerCase();
    if (!broker || !server || !login || !["demo", "live"].includes(demoLive)) {
      sendJson(res, 400, { message: "broker, server, login, and demoLive(demo/live) are required." });
      return;
    }
    const duplicate = worldStore.tradingAccounts.find(
      (item) => item.workspaceId === workspace.id && item.broker === broker && item.server === server && item.login === login && item.status !== "removed"
    );
    if (duplicate) {
      sendJson(res, 409, { message: "This account already exists in the workspace.", account: duplicate });
      return;
    }
    const account = {
      id: uid("acct"),
      workspaceId: workspace.id,
      broker,
      server,
      login,
      accountName,
      demoLive,
      status: "registered",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    worldStore.tradingAccounts.push(account);
    audit(member.id, workspace.id, "MESH_ACCOUNT_ADDED", { accountId: account.id, broker, server, login, demoLive });
    await saveWorldStore();
    sendJson(res, 201, account);
    return;
  }

  if (url.pathname === "/api/world/mesh/node") {
    const accountId = clean(body.accountId || "", 80);
    const account = worldStore.tradingAccounts.find((item) => item.id === accountId && item.workspaceId === workspace.id);
    const nodeType = clean(body.nodeType || "", 40).toUpperCase();
    const nodeName = clean(body.nodeName || "WISDO Node", 100);
    if (!account || !NODE_TYPES.has(nodeType)) {
      sendJson(res, 400, { message: "Valid accountId and nodeType are required." });
      return;
    }
    const rawToken = crypto.randomBytes(24).toString("hex");
    const pairCode = `${NODE_PREFIX[nodeType] || "RPT"}-${crypto.randomInt(100000, 1000000)}`;
    const node = {
      id: uid("node"),
      workspaceId: workspace.id,
      tradingAccountId: account.id,
      nodeName,
      nodeType,
      pairCode,
      nodeTokenHash: crypto.createHash("sha256").update(rawToken).digest("hex"),
      status: "pending_pairing",
      canReport: true,
      canReceiveSignals: true,
      canApproveSignals: nodeType !== "SIGNAL_ONLY_NODE",
      canExecuteTrades: false,
      canManageRisk: false,
      canCopyTrades: nodeType === "COPY_FOLLOWER_NODE",
      canControl: ["PRIMARY_REPORTER", "LAPTOP_REPORTER", "VPS_REPORTER", "MOBILE_CONTROLLER", "MOBILE_CELLULAR_NODE"].includes(nodeType),
      isPrimary: false,
      lastSeen: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    worldStore.reporterNodes.push(node);
    audit(member.id, workspace.id, "MESH_NODE_CREATED", { nodeId: node.id, accountId: account.id, nodeType, pairCode });
    await saveWorldStore();
    const { nodeTokenHash, ...safeNode } = node;
    sendJson(res, 201, { node: safeNode, nodeToken: rawToken, tokenNotice: "Shown once. Store securely on the reporter node." });
    return;
  }

  if (url.pathname === "/api/world/mesh/route") {
    const accountId = clean(body.accountId || "", 80);
    const nodeId = clean(body.nodeId || "", 80);
    const routeType = clean(body.routeType || "", 40).toUpperCase();
    const routeName = clean(body.routeName || "Execution Route", 100);
    const account = worldStore.tradingAccounts.find((item) => item.id === accountId && item.workspaceId === workspace.id);
    const node = worldStore.reporterNodes.find(
      (item) => item.id === nodeId && item.workspaceId === workspace.id && item.tradingAccountId === accountId
    );
    if (!account || !node || !ROUTE_TYPES.has(routeType)) {
      sendJson(res, 400, { message: "Valid accountId, nodeId, and routeType are required." });
      return;
    }
    const route = {
      id: uid("route"),
      workspaceId: workspace.id,
      tradingAccountId: account.id,
      nodeId: node.id,
      routeType,
      routeName,
      status: "pending_verification",
      canExecute: false,
      requiresConfirmation: true,
      priority: clamp(body.priority ?? 100, 1, 999),
      lastHeartbeat: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    worldStore.executionRoutes.push(route);
    audit(member.id, workspace.id, "EXECUTION_ROUTE_CREATED", {
      routeId: route.id,
      accountId: account.id,
      nodeId: node.id,
      routeType,
      canExecute: false
    });
    await saveWorldStore();
    sendJson(res, 201, {
      ...route,
      safetyNotice: "Route is registered but execution remains disabled until a verified route and explicit enablement flow are implemented."
    });
    return;
  }

  sendJson(res, 404, { message: "WISDO World route not found." });
}

function wrapRequestHandler(originalHandler) {
  return async function wisdoWorldRequestHandler(req, res) {
    const pathname = new URL(req.url, `http://${req.headers.host || "localhost"}`).pathname;
    if (!pathname.startsWith("/api/world/")) {
      return originalHandler(req, res);
    }
    try {
      return await handleWorldRequest(req, res, originalHandler);
    } catch (error) {
      console.error("WISDO World API error:", error);
      if (!res.headersSent) sendJson(res, 500, { message: "WISDO World service error." });
      else res.end();
    }
  };
}

function patchCreateServer(moduleObject) {
  const originalCreateServer = moduleObject.createServer.bind(moduleObject);
  moduleObject.createServer = (...args) => {
    const handlerIndex = args.findIndex((arg) => typeof arg === "function");
    if (handlerIndex >= 0) {
      args[handlerIndex] = wrapRequestHandler(args[handlerIndex]);
    }
    return originalCreateServer(...args);
  };
}

patchCreateServer(http);
patchCreateServer(https);

console.log("WISDO World sidecar API loaded: /api/world/*");
