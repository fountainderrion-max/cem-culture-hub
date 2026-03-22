import crypto from "crypto";
import http from "http";
import https from "https";
import path from "path";
import { fileURLToPath } from "url";
import { existsSync, readFileSync, promises as fs } from "fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ENV_BASE_FILE = path.join(__dirname, ".env");
const ENV_FILE = path.join(__dirname, ".env.local");

function loadEnvFile(filePath) {
  if (!existsSync(filePath)) return;
  const raw = readFileSync(filePath, "utf8");
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx < 1) continue;
    const key = trimmed.slice(0, idx).trim();
    const value = trimmed.slice(idx + 1).trim();
    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

loadEnvFile(ENV_BASE_FILE);
loadEnvFile(ENV_FILE);

const PORT = Number(process.env.PORT || 3000);
const HOST_INPUT = String(process.env.HOST || "").trim().toLowerCase();
const HOST =
  HOST_INPUT === "127.0.0.1" || HOST_INPUT === "localhost"
    ? "0.0.0.0"
    : process.env.HOST || "0.0.0.0";
const PUBLIC_DIR = path.join(__dirname, "public");
const DATA_DIR = path.join(__dirname, "data");
const STORE_FILE = path.join(DATA_DIR, "trade-console-store.json");
const MT4_DIR = path.join(DATA_DIR, "mt4");
const MT4_QUEUE_FILE = path.join(MT4_DIR, "commands-queue.jsonl");
const MT4_EXECUTED_FILE = path.join(MT4_DIR, "commands-executed.jsonl");
const TLS_CERT_PATH = process.env.TLS_CERT_PATH || "";
const TLS_KEY_PATH = process.env.TLS_KEY_PATH || "";

const MAX_BODY_BYTES = Number(process.env.MAX_BODY_BYTES || 50_000);
const RATE_LIMIT_WINDOW_MS = Number(process.env.RATE_LIMIT_WINDOW_MS || 60_000);
const RATE_LIMIT_MAX_REQUESTS = Number(process.env.RATE_LIMIT_MAX_REQUESTS || 200);

const REQUIRE_API_KEY = String(process.env.REQUIRE_API_KEY || "false").toLowerCase() === "true";
const TRADING_APP_API_KEY = process.env.TRADING_APP_API_KEY || "";
const REQUIRE_MEMBER_LOGIN = String(process.env.REQUIRE_MEMBER_LOGIN || "false").toLowerCase() === "true";
const ALLOW_DEV_LOGIN = String(process.env.ALLOW_DEV_LOGIN || "true").toLowerCase() === "true";
const SESSION_SECRET = process.env.SESSION_SECRET || "replace-me";
const SESSION_COOKIE_NAME = "te_session";
const SESSION_TTL_MS = Number(process.env.SESSION_TTL_MS || 1000 * 60 * 60 * 24 * 14);
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "";
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || "";
const TELEGRAM_POLL_INTERVAL_MS = Number(process.env.TELEGRAM_POLL_INTERVAL_MS || 5000);
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID || "";
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN || "";
const TWILIO_FROM_NUMBER = process.env.TWILIO_FROM_NUMBER || "";
const TWILIO_TO_NUMBER = process.env.TWILIO_TO_NUMBER || "";
const TWILIO_WEBHOOK_TOKEN = process.env.TWILIO_WEBHOOK_TOKEN || "";

function envBool(key, fallback = false) {
  const value = process.env[key];
  if (typeof value !== "string" || value.length === 0) return fallback;
  return value.toLowerCase() === "true";
}

function envNumber(key, fallback = 0) {
  const value = Number(process.env[key]);
  return Number.isFinite(value) ? value : fallback;
}

function safePublicConfig() {
  const maxDailyLossPercent = envNumber("MAX_DAILY_LOSS_PERCENT", 65);
  const explicitCaution = process.env.DAILY_LOSS_CAUTION_PERCENT;
  const cautionComputed = Number((maxDailyLossPercent * 0.65).toFixed(2));
  const dailyLossCautionPercent =
    typeof explicitCaution === "string" && explicitCaution.trim().length > 0
      ? envNumber("DAILY_LOSS_CAUTION_PERCENT", cautionComputed)
      : cautionComputed;

  return {
    app: {
      name: process.env.NEXT_PUBLIC_BRAND_NAME || process.env.APP_NAME || "CEM CULTURE",
      appUrl: process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || "",
      siteUrl: process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || "",
      apiUrl: process.env.NEXT_PUBLIC_API_URL || "",
      tagline: process.env.NEXT_PUBLIC_BRAND_TAGLINE || "Trade the culture. Link the squad. Rank up."
    },
    hero: {
      mode: process.env.NEXT_PUBLIC_HERO_MODE || "command",
      primary: process.env.NEXT_PUBLIC_PRIMARY_HERO_CARD || "Bot Arena",
      secondary: process.env.NEXT_PUBLIC_SECONDARY_HERO_CARD || "Switch Lab",
      tertiary: process.env.NEXT_PUBLIC_TERTIARY_HERO_CARD || "VPS Forge",
      support: [
        process.env.NEXT_PUBLIC_SUPPORT_CARD_1 || "Link Vault",
        process.env.NEXT_PUBLIC_SUPPORT_CARD_2 || "Culture Feed",
        process.env.NEXT_PUBLIC_SUPPORT_CARD_3 || "Growth Chamber"
      ]
    },
    roleDefaults: {
      defaultSignupRole: process.env.DEFAULT_SIGNUP_ROLE || "user",
      allowSelfProviderSignup: envBool("ALLOW_SELF_PROVIDER_SIGNUP", false),
      allowSelfOperatorSignup: envBool("ALLOW_SELF_OPERATOR_SIGNUP", false),
      requireAdminProviderApproval: envBool("REQUIRE_ADMIN_PROVIDER_APPROVAL", true),
      requireAdminOperatorApproval: envBool("REQUIRE_ADMIN_OPERATOR_APPROVAL", true)
    },
    featureFlags: {
      socialFeed: envBool("FEATURE_SOCIAL_FEED", true),
      linkVault: envBool("FEATURE_LINK_VAULT", true),
      botArena: envBool("FEATURE_BOT_ARENA", true),
      switchLab: envBool("FEATURE_SWITCH_LAB", true),
      vpsForge: envBool("FEATURE_VPS_FORGE", true),
      growthChamber: envBool("FEATURE_GROWTH_CHAMBER", true),
      providerTools: envBool("FEATURE_PROVIDER_TOOLS", true),
      adminTools: envBool("FEATURE_ADMIN_TOOLS", true)
    },
    labels: {
      simulationEnabled: envBool("ENABLE_SIMULATION_MODE", true),
      userSuppliedEnabled: envBool("ENABLE_USER_SUPPLIED_MODE", true),
      simulation: process.env.SIMULATION_BADGE_TEXT || "Simulation",
      userSupplied: process.env.USER_SUPPLIED_BADGE_TEXT || "User-Supplied",
      placeholderIntegration: process.env.PLACEHOLDER_INTEGRATION_BADGE_TEXT || "Placeholder Integration"
    },
    riskGuardrails: {
      maxDrawdownPercent: envNumber("MAX_DRAWDOWN_PERCENT", 65),
      maxDailyLossPercent,
      dailyLossCautionPercent,
      disableNewEntriesAtDailyLimit: envBool("DISABLE_NEW_ENTRIES_AT_DAILY_LIMIT", true),
      pauseAutomationOnDrawdownBreach: envBool("PAUSE_AUTOMATION_ON_DRAWDOWN_BREACH", true),
      disableLadderOnDailyLimit: envBool("DISABLE_LADDER_ON_DAILY_LIMIT", true),
      downgradeScalpingToMonitorOnCaution: envBool("DOWNGRADE_SCALPING_TO_MONITOR_ON_CAUTION", true)
    },
    tiers: {
      cadet: { name: process.env.TIER_CADET_NAME || "Cadet", price: envNumber("TIER_CADET_PRICE", 0) },
      operator: { name: process.env.TIER_OPERATOR_NAME || "Operator", price: envNumber("TIER_OPERATOR_PRICE", 150) },
      squadron: { name: process.env.TIER_SQUADRON_NAME || "Squadron", price: envNumber("TIER_SQUADRON_PRICE", 500) },
      command: { name: process.env.TIER_COMMAND_NAME || "Command", price: envNumber("TIER_COMMAND_PRICE", 0) }
    }
  };
}

if (REQUIRE_API_KEY && !TRADING_APP_API_KEY) {
  console.error("REQUIRE_API_KEY is true but TRADING_APP_API_KEY is missing.");
  process.exit(1);
}

const mimeTypes = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".json": "application/json"
};

const rateState = new Map();
const sessions = new Map();
let store = null;
let writeQueue = Promise.resolve();
let telegramUpdateOffset = 0;

function id(prefix) {
  return `${prefix}-${crypto.randomBytes(6).toString("hex")}`;
}

function sanitizeText(value, maxLen = 400) {
  if (typeof value !== "string") {
    return "";
  }
  return value.replace(/\u0000/g, "").trim().slice(0, maxLen);
}

function toNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function clamp(v, min, max) {
  if (v < min) return min;
  if (v > max) return max;
  return v;
}

function getRequestIp(req) {
  const xff = req.headers["x-forwarded-for"];
  if (typeof xff === "string" && xff.length > 0) {
    return xff.split(",")[0].trim();
  }
  return req.socket?.remoteAddress || "unknown";
}

function isRateLimited(req) {
  const ip = getRequestIp(req);
  const now = Date.now();
  const state = rateState.get(ip) || { windowStart: now, count: 0 };
  if (now - state.windowStart >= RATE_LIMIT_WINDOW_MS) {
    state.windowStart = now;
    state.count = 0;
  }
  state.count += 1;
  rateState.set(ip, state);
  return state.count > RATE_LIMIT_MAX_REQUESTS;
}

function writeSecurityHeaders(res) {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader("Cache-Control", "no-store");
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; form-action 'self'; base-uri 'self'"
  );
}

function sendText(res, statusCode, text) {
  writeSecurityHeaders(res);
  res.writeHead(statusCode, { "Content-Type": "text/plain; charset=utf-8" });
  res.end(text);
}

function parseCookies(req) {
  const raw = req.headers.cookie || "";
  const out = {};
  for (const part of raw.split(";")) {
    const idx = part.indexOf("=");
    if (idx < 0) continue;
    const k = part.slice(0, idx).trim();
    const v = part.slice(idx + 1).trim();
    out[k] = decodeURIComponent(v);
  }
  return out;
}

function isSecureRequest(req) {
  const forwardedProto = req.headers["x-forwarded-proto"];
  if (typeof forwardedProto === "string" && forwardedProto.toLowerCase() === "https") {
    return true;
  }
  return !!(TLS_CERT_PATH && TLS_KEY_PATH);
}

function signSession(sessionId, expiresAt) {
  const payload = `${sessionId}.${expiresAt}`;
  const signature = crypto.createHmac("sha256", SESSION_SECRET).update(payload).digest("hex");
  return `${payload}.${signature}`;
}

function verifySessionToken(token) {
  const parts = String(token || "").split(".");
  if (parts.length !== 3) return null;
  const [sessionId, expiresAtRaw, signature] = parts;
  const payload = `${sessionId}.${expiresAtRaw}`;
  const expected = crypto.createHmac("sha256", SESSION_SECRET).update(payload).digest("hex");
  if (signature.length !== expected.length) return null;
  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null;
  const expiresAt = Number(expiresAtRaw);
  if (!Number.isFinite(expiresAt) || Date.now() > expiresAt) return null;
  return { sessionId, expiresAt };
}

function setSessionCookie(req, res, token) {
  const attrs = [`${SESSION_COOKIE_NAME}=${encodeURIComponent(token)}`, "Path=/", "HttpOnly", "SameSite=Lax"];
  attrs.push(`Max-Age=${Math.floor(SESSION_TTL_MS / 1000)}`);
  if (isSecureRequest(req)) {
    attrs.push("Secure");
  }
  res.setHeader("Set-Cookie", attrs.join("; "));
}

function clearSessionCookie(req, res) {
  const attrs = [`${SESSION_COOKIE_NAME}=`, "Path=/", "HttpOnly", "SameSite=Lax", "Max-Age=0"];
  if (isSecureRequest(req)) {
    attrs.push("Secure");
  }
  res.setHeader("Set-Cookie", attrs.join("; "));
}

function isApiKeyAuthorized(req) {
  if (!REQUIRE_API_KEY) return true;
  const received = req.headers["x-api-key"];
  if (typeof received !== "string" || !received) return false;
  const a = Buffer.from(received);
  const b = Buffer.from(TRADING_APP_API_KEY);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

function getCurrentMember(req) {
  const cookies = parseCookies(req);
  const token = cookies[SESSION_COOKIE_NAME];
  const parsed = verifySessionToken(token);
  if (!parsed) return null;
  const session = sessions.get(parsed.sessionId);
  if (!session || session.expiresAt !== parsed.expiresAt || session.expiresAt < Date.now()) {
    return null;
  }
  return session.member;
}

function sendJson(res, statusCode, payload) {
  writeSecurityHeaders(res);
  res.writeHead(statusCode, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(payload));
}

async function readBody(req) {
  const chunks = [];
  let total = 0;
  for await (const chunk of req) {
    total += chunk.length;
    if (total > MAX_BODY_BYTES) {
      throw new Error("PAYLOAD_TOO_LARGE");
    }
    chunks.push(chunk);
  }
  if (!chunks.length) {
    return null;
  }
  const raw = Buffer.concat(chunks).toString();
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

async function readRawBody(req) {
  const chunks = [];
  let total = 0;
  for await (const chunk of req) {
    total += chunk.length;
    if (total > MAX_BODY_BYTES) {
      throw new Error("PAYLOAD_TOO_LARGE");
    }
    chunks.push(chunk);
  }
  if (!chunks.length) {
    return "";
  }
  return Buffer.concat(chunks).toString();
}

function seedStore() {
  return {
    members: [],
    bots: [
      { id: "df-quantum", name: "DF Quantum", intent: "volatility sensing", mode: "standby" },
      { id: "aurora", name: "Aurora Pulse", intent: "macro shift catch", mode: "guard" },
      { id: "silversmith", name: "Silversmith", intent: "spread arbitrage", mode: "ready" }
    ],
    posts: [],
    links: [],
    smartSwitchEvents: [],
    profile: {
      name: "Primary Operator",
      baseRiskPercent: 0.75,
      maxRiskPercent: 1.25,
      maxOpenPositions: 3
    },
    latestDecision: null,
    decisions: [],
    commands: [],
    results: [],
    botMemory: [],
    botBusEvents: [],
    chartPlans: [],
    phoneControlPolicies: {
      aggressionPercent: 100,
      tpExtensionPercent: 20,
      neverLetWinnerGoNegative: false,
      autoBreakEvenEnabled: false,
      autoBreakEvenTriggerPips: 20
    },
    pendingPhoneQuestions: [],
    phoneEvents: []
  };
}

async function ensureStorage() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.mkdir(MT4_DIR, { recursive: true });
  try {
    const raw = await fs.readFile(STORE_FILE, "utf8");
    store = JSON.parse(raw);
  } catch {
    store = seedStore();
    await fs.writeFile(STORE_FILE, JSON.stringify(store, null, 2), "utf8");
  }
  if (!Array.isArray(store.members)) {
    store.members = [];
  }
  if (!Array.isArray(store.bots)) {
    store.bots = [];
  }
  if (!Array.isArray(store.posts)) {
    store.posts = [];
  }
  if (!Array.isArray(store.links)) {
    store.links = [];
  }
  if (!Array.isArray(store.smartSwitchEvents)) {
    store.smartSwitchEvents = [];
  }
  if (!Array.isArray(store.botMemory)) {
    store.botMemory = [];
  }
  if (!Array.isArray(store.botBusEvents)) {
    store.botBusEvents = [];
  }
  if (!Array.isArray(store.chartPlans)) {
    store.chartPlans = [];
  }
  if (!store.phoneControlPolicies || typeof store.phoneControlPolicies !== "object") {
    store.phoneControlPolicies = {
      aggressionPercent: 100,
      tpExtensionPercent: 20,
      neverLetWinnerGoNegative: false,
      autoBreakEvenEnabled: false,
      autoBreakEvenTriggerPips: 20
    };
  }
  if (!Array.isArray(store.pendingPhoneQuestions)) {
    store.pendingPhoneQuestions = [];
  }
  if (!Array.isArray(store.phoneEvents)) {
    store.phoneEvents = [];
  }
  await fs.writeFile(MT4_QUEUE_FILE, "", { flag: "a" });
  await fs.writeFile(MT4_EXECUTED_FILE, "", { flag: "a" });
}

function queueSave() {
  writeQueue = writeQueue
    .then(() => fs.writeFile(STORE_FILE, JSON.stringify(store, null, 2), "utf8"))
    .catch((error) => console.error("Store save failed:", error));
  return writeQueue;
}

async function appendJsonLine(file, value) {
  await fs.appendFile(file, `${JSON.stringify(value)}\n`, "utf8");
}

async function telegramApi(pathname, payload = null) {
  if (!TELEGRAM_BOT_TOKEN) return null;
  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/${pathname}`;
  const opts = payload
    ? {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      }
    : {};
  const response = await fetch(url, opts);
  if (!response.ok) return null;
  return response.json();
}

async function sendTelegramMessage(text) {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) return false;
  const r = await telegramApi("sendMessage", { chat_id: TELEGRAM_CHAT_ID, text });
  return !!(r && r.ok);
}

async function sendTwilioSms(text) {
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_FROM_NUMBER || !TWILIO_TO_NUMBER) return false;
  const url = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`;
  const body = new URLSearchParams({
    From: TWILIO_FROM_NUMBER,
    To: TWILIO_TO_NUMBER,
    Body: text
  });
  const auth = Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString("base64");
  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body
  });
  return response.ok;
}

async function sendPhoneNotification(text) {
  const [tg, sms] = await Promise.all([sendTelegramMessage(text), sendTwilioSms(text)]);
  return tg || sms;
}

function addPhoneEvent(source, text, meta = {}) {
  const evt = {
    id: id("phone"),
    ts: new Date().toISOString(),
    source,
    text: sanitizeText(text, 1000),
    meta
  };
  store.phoneEvents.unshift(evt);
  store.phoneEvents = store.phoneEvents.slice(0, 2000);
}

function queuePhoneQuestion(question, actionType, actionPayload = {}) {
  const q = {
    id: id("q"),
    createdAt: new Date().toISOString(),
    status: "pending",
    question: sanitizeText(question, 500),
    actionType: sanitizeText(actionType, 80),
    actionPayload
  };
  store.pendingPhoneQuestions.unshift(q);
  store.pendingPhoneQuestions = store.pendingPhoneQuestions.slice(0, 300);
  return q;
}

function extractFirstNumber(text, fallback = 0) {
  const m = String(text || "").match(/-?\d+(\.\d+)?/);
  if (!m) return fallback;
  const n = Number(m[0]);
  return Number.isFinite(n) ? n : fallback;
}

function extractSymbol(text, fallback = "XAUUSD") {
  const s = String(text || "").toUpperCase();
  const known = ["XAUUSD", "XAGUSD", "EURUSD", "GBPUSD", "USDJPY", "USOIL", "BTCUSD", "ETHUSD"];
  for (const sym of known) {
    if (s.includes(sym)) return sym;
  }
  if (s.includes("GOLD") || s.includes("XAU")) return "XAUUSD";
  if (s.includes("SILVER") || s.includes("XAG")) return "XAGUSD";
  if (s.includes("OIL") || s.includes("USOIL")) return "USOIL";
  return fallback;
}

async function executePhoneDirective(directive) {
  if (directive.kind === "policy") {
    const k = directive.key;
    store.phoneControlPolicies[k] = directive.value;
    addPhoneEvent("policy", `Set ${k}=${directive.value}`);
    return `Policy updated: ${k}=${directive.value}`;
  }

  if (directive.kind === "command") {
    const command = {
      id: id("cmd"),
      createdAt: new Date().toISOString(),
      status: "queued",
      sourceDecisionId: "",
      source: "phone",
      actionType: directive.actionType || "market-order",
      symbol: directive.symbol || "XAUUSD",
      side: directive.side || "BUY",
      entryPrice: directive.entryPrice || 0,
      stopLoss: directive.stopLoss || 0,
      takeProfit: directive.takeProfit || 0,
      lotSize: directive.lotSize || 0.1,
      riskPercent: directive.riskPercent || toNumber(store.phoneControlPolicies.aggressionPercent, 1),
      payload: directive.payload || {}
    };
    store.commands.unshift(command);
    store.commands = store.commands.slice(0, 1000);
    await appendJsonLine(MT4_QUEUE_FILE, command);
    addPhoneEvent("command", `${command.actionType} ${command.symbol} ${command.side} lot=${command.lotSize}`, {
      commandId: command.id
    });
    return `Queued command ${command.id}: ${command.actionType} ${command.symbol} ${command.side}`;
  }

  return "No action executed.";
}

function parsePhoneCommand(text) {
  const t = String(text || "").toLowerCase();
  const symbol = extractSymbol(text, "XAUUSD");

  if (t.includes("never let") && t.includes("winning trade") && t.includes("negative")) {
    return { kind: "policy", key: "neverLetWinnerGoNegative", value: true };
  }
  if (t.includes("allow winning trade go negative") || t.includes("disable never let winner")) {
    return { kind: "policy", key: "neverLetWinnerGoNegative", value: false };
  }
  if (t.includes("increase") && t.includes("percentage")) {
    const v = extractFirstNumber(t, 100);
    return { kind: "policy", key: "aggressionPercent", value: v };
  }
  if (t.includes("extend tp")) {
    const v = extractFirstNumber(t, 20);
    return { kind: "policy", key: "tpExtensionPercent", value: v };
  }
  if (t.includes("close all")) {
    return { kind: "command", actionType: "close-all", side: "HOLD", symbol, lotSize: 0, payload: { symbol } };
  }
  if (t.includes("partial close") || t.includes("close partial")) {
    const pct = extractFirstNumber(t, 25);
    return {
      kind: "command",
      actionType: "partial-close",
      side: "HOLD",
      symbol,
      lotSize: 0,
      payload: { percent: pct, symbol }
    };
  }
  if (t.includes("pause") && t.includes("symbol")) {
    return { kind: "policy", key: `symbolPaused:${symbol}`, value: true };
  }
  if ((t.includes("resume") && t.includes("symbol")) || (t.includes("unpause") && t.includes("symbol"))) {
    return { kind: "policy", key: `symbolPaused:${symbol}`, value: false };
  }
  if (t.startsWith("buy ") || t === "buy") {
    const lot = extractFirstNumber(t, 0.1);
    return { kind: "command", actionType: "market-order", side: "BUY", symbol, lotSize: lot };
  }
  if (t.startsWith("sell ") || t === "sell") {
    const lot = extractFirstNumber(t, 0.1);
    return { kind: "command", actionType: "market-order", side: "SELL", symbol, lotSize: lot };
  }
  if (t.includes("lock profit") || t.includes("move stop to breakeven") || t.includes("break even")) {
    if (t.includes("at") || t.includes("+")) {
      const pips = extractFirstNumber(t, 20);
      return { kind: "policy", key: "autoBreakEvenTriggerPips", value: pips };
    }
    return { kind: "policy", key: "autoBreakEvenEnabled", value: true };
  }
  if (t.includes("trail stop")) {
    const pips = extractFirstNumber(t, 30);
    return {
      kind: "command",
      actionType: "trail-stop",
      side: "HOLD",
      symbol,
      lotSize: 0,
      payload: { trailPips: pips, symbol }
    };
  }
  if (t.includes("disable break even") || t.includes("break even off")) {
    return { kind: "policy", key: "autoBreakEvenEnabled", value: false };
  }

  return null;
}

async function applyPhoneMessage(text) {
  const msg = sanitizeText(text, 1200);
  if (!msg) return "Empty message ignored.";

  addPhoneEvent("inbound", msg);

  const pending = store.pendingPhoneQuestions.find((q) => q.status === "pending");
  if (pending && ["yes", "y", "no", "n"].includes(msg.toLowerCase())) {
    pending.status = "answered";
    pending.answeredAt = new Date().toISOString();
    pending.answer = msg.toLowerCase().startsWith("y") ? "yes" : "no";
    if (pending.answer === "yes") {
      const reply = await executePhoneDirective(pending.actionPayload || { kind: "none" });
      addPhoneEvent("answer", `Question ${pending.id} YES -> ${reply}`);
      return `Applied: ${reply}`;
    }
    addPhoneEvent("answer", `Question ${pending.id} NO`);
    return "Skipped action.";
  }

  const directive = parsePhoneCommand(msg);
  if (!directive) {
    return "Command not recognized. Try: 'extend tp 25%', 'increase percentage to 1000%', 'never let winning trade go negative', 'buy', 'sell'.";
  }

  const result = await executePhoneDirective(directive);
  return result;
}

async function pollTelegramLoop() {
  if (!TELEGRAM_BOT_TOKEN) return;
  try {
    const payload = await telegramApi("getUpdates", {
      timeout: 0,
      offset: telegramUpdateOffset + 1,
      allowed_updates: ["message"]
    });
    if (!payload?.ok || !Array.isArray(payload.result)) return;

    for (const update of payload.result) {
      telegramUpdateOffset = Math.max(telegramUpdateOffset, update.update_id || 0);
      const msg = update.message;
      if (!msg?.text) continue;
      const chatId = String(msg.chat?.id || "");
      if (TELEGRAM_CHAT_ID && chatId !== String(TELEGRAM_CHAT_ID)) continue;
      const out = await applyPhoneMessage(msg.text);
      await sendTelegramMessage(`Ack: ${out}`);
      await queueSave();
    }
  } catch (error) {
    console.error("Telegram poll error:", error?.message || error);
  }
}

function deriveSignal(input) {
  const symbol = sanitizeText(input.symbol || "XAUUSD", 24).toUpperCase();
  const accountBalance = clamp(toNumber(input.accountBalance, 0), 0, 1_000_000_000);
  const riskPercent = clamp(toNumber(input.riskPercent, store.profile.baseRiskPercent), 0.05, store.profile.maxRiskPercent);
  const currentPrice = clamp(toNumber(input.currentPrice, 0), 0, 10_000_000);
  const recentWinRate = clamp(toNumber(input.recentWinRate, 50), 0, 100);
  const recentPnL = toNumber(input.recentPnL, 0);
  const spread = clamp(toNumber(input.spread, 0.2), 0.01, 50);
  const atr = clamp(toNumber(input.atr, currentPrice * 0.004 || 1), 0.00001, 1_000_000);
  const pipValuePerLot = clamp(toNumber(input.pipValuePerLot, 10), 0.00001, 100_000);

  const bias = sanitizeText(input.marketBias || "range", 12).toLowerCase();
  const volatility = sanitizeText(input.volatility || "medium", 12).toLowerCase();
  const structure = sanitizeText(input.structure || "chop", 20).toLowerCase();
  const notes = sanitizeText(input.notes || "", 2000);

  let score = 0;
  if (bias === "bullish") score += 1.2;
  if (bias === "bearish") score -= 1.2;
  if (structure === "breakout") score += bias === "bearish" ? -0.6 : 0.6;
  if (structure === "pullback") score += bias === "bearish" ? -0.3 : 0.3;
  if (volatility === "high") score *= 0.75;
  if (volatility === "low") score *= 1.1;
  score += (recentWinRate - 50) / 60;
  score += recentPnL >= 0 ? 0.2 : -0.25;

  const noteLower = notes.toLowerCase();
  if (noteLower.includes("news") || noteLower.includes("fomc") || noteLower.includes("nfp")) {
    score *= 0.7;
  }
  if (noteLower.includes("trend strong")) {
    score += 0.25;
  }
  if (noteLower.includes("reversal risk")) {
    score *= 0.8;
  }

  let side = "HOLD";
  if (score > 0.35) side = "BUY";
  if (score < -0.35) side = "SELL";

  const confidenceRaw = clamp(Math.abs(score) / 2.2, 0, 1);
  const confidence = Math.round(confidenceRaw * 100) / 100;

  const rrBase = confidence > 0.7 ? 2.2 : confidence > 0.45 ? 1.7 : 1.3;
  const stopDistance = atr * (volatility === "high" ? 1.25 : volatility === "low" ? 0.8 : 1.0) + spread * 1.5;
  const targetDistance = stopDistance * rrBase;

  const riskUsd = accountBalance * (riskPercent / 100);
  const stopPipsApprox = Math.max(stopDistance, 0.00001);
  const lots = clamp(riskUsd / (stopPipsApprox * pipValuePerLot), 0.01, 100);
  const lotSize = Math.round(lots * 100) / 100;

  let stopLoss = currentPrice;
  let takeProfit = currentPrice;
  if (side === "BUY") {
    stopLoss = currentPrice - stopDistance;
    takeProfit = currentPrice + targetDistance;
  } else if (side === "SELL") {
    stopLoss = currentPrice + stopDistance;
    takeProfit = currentPrice - targetDistance;
  }

  const warnings = [];
  if (side === "HOLD") warnings.push("No clear edge detected. Hold until structure improves.");
  if (riskPercent > 1) warnings.push("Risk above 1% per trade is aggressive for most accounts.");
  if (volatility === "high") warnings.push("High volatility can increase slippage and stop-outs.");
  if (recentWinRate < 40) warnings.push("Recent win rate is weak; consider reducing size.");

  return {
    symbol,
    side,
    confidence,
    accountBalance,
    riskPercent,
    riskUsd: Math.round(riskUsd * 100) / 100,
    entryPrice: currentPrice,
    stopLoss: Number(stopLoss.toFixed(5)),
    takeProfit: Number(takeProfit.toFixed(5)),
    rr: Number(rrBase.toFixed(2)),
    lotSize,
    diagnostics: {
      marketBias: bias,
      volatility,
      structure,
      recentWinRate,
      recentPnL,
      spread,
      atr,
      score: Number(score.toFixed(4))
    },
    warnings,
    note: "Model output is decision support, not guaranteed profit. Validate against live conditions."
  };
}

async function handleDecide(req, res, body) {
  if (!body) {
    sendJson(res, 400, { message: "Body required." });
    return;
  }
  const signal = deriveSignal(body);
  const decision = {
    id: id("decision"),
    createdAt: new Date().toISOString(),
    input: body,
    signal
  };
  store.latestDecision = decision;
  store.decisions.unshift(decision);
  store.decisions = store.decisions.slice(0, 500);
  await queueSave();
  sendJson(res, 200, decision);
}

async function handleQueueCommand(req, res, body) {
  if (!body?.decisionId) {
    sendJson(res, 400, { message: "decisionId required." });
    return;
  }
  const decision = store.decisions.find((d) => d.id === body.decisionId);
  if (!decision) {
    sendJson(res, 404, { message: "Decision not found." });
    return;
  }
  if (decision.signal.side === "HOLD") {
    sendJson(res, 400, { message: "HOLD signals are not queueable." });
    return;
  }

  const command = {
    id: id("cmd"),
    createdAt: new Date().toISOString(),
    status: "queued",
    sourceDecisionId: decision.id,
    symbol: decision.signal.symbol,
    side: decision.signal.side,
    entryPrice: decision.signal.entryPrice,
    stopLoss: decision.signal.stopLoss,
    takeProfit: decision.signal.takeProfit,
    lotSize: decision.signal.lotSize,
    riskPercent: decision.signal.riskPercent
  };

  store.commands.unshift(command);
  store.commands = store.commands.slice(0, 1000);
  await appendJsonLine(MT4_QUEUE_FILE, command);
  await queueSave();
  sendJson(res, 200, command);
}

async function handleAcknowledgeCommand(req, res, commandId, body) {
  const command = store.commands.find((c) => c.id === commandId);
  if (!command) {
    sendJson(res, 404, { message: "Command not found." });
    return;
  }
  const status = sanitizeText(body?.status || "executed", 24).toLowerCase();
  if (!["executed", "rejected", "cancelled"].includes(status)) {
    sendJson(res, 400, { message: "Invalid status." });
    return;
  }
  command.status = status;
  command.updatedAt = new Date().toISOString();
  command.executionNote = sanitizeText(body?.note || "", 300);
  await appendJsonLine(MT4_EXECUTED_FILE, command);
  await queueSave();
  sendJson(res, 200, command);
}

async function handleResult(req, res, body) {
  const result = {
    id: id("result"),
    createdAt: new Date().toISOString(),
    commandId: sanitizeText(body?.commandId || "", 50),
    symbol: sanitizeText(body?.symbol || "", 20).toUpperCase(),
    netPnl: toNumber(body?.netPnl, 0),
    win: !!body?.win,
    note: sanitizeText(body?.note || "", 600)
  };
  store.results.unshift(result);
  store.results = store.results.slice(0, 1000);
  await queueSave();
  sendJson(res, 200, result);
}

async function handlePhoneAsk(req, res, body) {
  const question = sanitizeText(body?.question || "", 500);
  const actionType = sanitizeText(body?.actionType || "custom", 80);
  const actionPayload = body?.actionPayload && typeof body.actionPayload === "object" ? body.actionPayload : {};
  if (!question) {
    sendJson(res, 400, { message: "question is required." });
    return;
  }
  const q = queuePhoneQuestion(question, actionType, actionPayload);
  await queueSave();
  await sendPhoneNotification(`Question ${q.id}: ${q.question}\nReply YES or NO.`);
  sendJson(res, 200, q);
}

async function handlePhoneMessage(req, res, body) {
  const text = sanitizeText(body?.text || "", 1200);
  if (!text) {
    sendJson(res, 400, { message: "text is required." });
    return;
  }
  const result = await applyPhoneMessage(text);
  await queueSave();
  sendJson(res, 200, { ok: true, result });
}

async function handlePhoneReply(req, res, body) {
  const questionId = sanitizeText(body?.questionId || "", 50);
  const answer = sanitizeText(body?.answer || "", 20).toLowerCase();
  if (!questionId || !["yes", "no", "y", "n"].includes(answer)) {
    sendJson(res, 400, { message: "questionId and answer(yes/no) are required." });
    return;
  }
  const q = store.pendingPhoneQuestions.find((x) => x.id === questionId && x.status === "pending");
  if (!q) {
    sendJson(res, 404, { message: "Pending question not found." });
    return;
  }
  q.status = "answered";
  q.answeredAt = new Date().toISOString();
  q.answer = answer.startsWith("y") ? "yes" : "no";
  let execution = "Skipped action.";
  if (q.answer === "yes") {
    execution = await executePhoneDirective(q.actionPayload || { kind: "none" });
  }
  addPhoneEvent("answer", `Question ${q.id} -> ${q.answer}`);
  await queueSave();
  sendJson(res, 200, { ok: true, execution, question: q });
}

async function handleTwilioWebhook(req, res, url) {
  if (!TWILIO_WEBHOOK_TOKEN || url.searchParams.get("token") !== TWILIO_WEBHOOK_TOKEN) {
    writeSecurityHeaders(res);
    res.writeHead(403, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Forbidden");
    return;
  }

  const raw = await readRawBody(req);
  const form = new URLSearchParams(raw);
  const bodyText = sanitizeText(form.get("Body") || "", 1200);
  const from = sanitizeText(form.get("From") || "", 40);

  if (TWILIO_TO_NUMBER && from && from !== TWILIO_TO_NUMBER) {
    writeSecurityHeaders(res);
    res.writeHead(200, { "Content-Type": "text/xml; charset=utf-8" });
    res.end('<?xml version="1.0" encoding="UTF-8"?><Response><Message>Unauthorized number.</Message></Response>');
    return;
  }

  const result = await applyPhoneMessage(bodyText);
  await queueSave();

  const xml = `<?xml version="1.0" encoding="UTF-8"?><Response><Message>${result.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")}</Message></Response>`;
  writeSecurityHeaders(res);
  res.writeHead(200, { "Content-Type": "text/xml; charset=utf-8" });
  res.end(xml);
}

function buildSwarmConsensus(symbolFilter = "") {
  const now = Date.now();
  const maxAgeMs = 1000 * 60 * 20;
  const filtered = store.botBusEvents.filter((e) => {
    const eventTs = new Date(e.timestamp).getTime();
    if (!Number.isFinite(eventTs)) return false;
    if (now - eventTs > maxAgeMs) return false;
    if (symbolFilter && e.symbol !== symbolFilter) return false;
    return true;
  });

  const grouped = new Map();
  for (const evt of filtered) {
    const key = evt.symbol;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key).push(evt);
  }

  const result = [];
  for (const [symbol, events] of grouped.entries()) {
    let buy = 0;
    let sell = 0;
    let hold = 0;
    for (const evt of events) {
      const w = clamp(toNumber(evt.confidence, 0.5), 0.01, 1);
      if (evt.signal === "BUY") buy += w;
      else if (evt.signal === "SELL") sell += w;
      else hold += w;
    }
    let action = "HOLD";
    if (buy > sell && buy > hold) action = "BUY";
    if (sell > buy && sell > hold) action = "SELL";
    const total = buy + sell + hold || 1;
    const confidence = action === "BUY" ? buy / total : action === "SELL" ? sell / total : hold / total;
    result.push({
      symbol,
      action,
      confidence: Number(confidence.toFixed(4)),
      votes: {
        buy: Number(buy.toFixed(4)),
        sell: Number(sell.toFixed(4)),
        hold: Number(hold.toFixed(4))
      },
      eventCount: events.length
    });
  }
  return result.sort((a, b) => b.eventCount - a.eventCount);
}

async function handleBotMemoryWrite(req, res, body) {
  const botId = sanitizeText(body?.botId || "", 80);
  const symbol = sanitizeText(body?.symbol || "", 24).toUpperCase();
  const chartId = sanitizeText(body?.chartId || "", 40);
  const topic = sanitizeText(body?.topic || "", 80);
  const value = sanitizeText(body?.value || "", 2000);
  const ttlMinutes = clamp(toNumber(body?.ttlMinutes, 240), 1, 60 * 24 * 30);

  if (!botId || !symbol || !topic || !value) {
    sendJson(res, 400, { message: "botId, symbol, topic, and value are required." });
    return;
  }

  const expiresAt = new Date(Date.now() + ttlMinutes * 60_000).toISOString();
  const existing = store.botMemory.find(
    (m) => m.botId === botId && m.symbol === symbol && m.chartId === chartId && m.topic === topic
  );

  const record = {
    id: existing?.id || id("mem"),
    botId,
    symbol,
    chartId,
    topic,
    value,
    tags: Array.isArray(body?.tags) ? body.tags.map((t) => sanitizeText(t, 30)).filter(Boolean).slice(0, 10) : [],
    confidence: clamp(toNumber(body?.confidence, 0.5), 0.01, 1),
    timestamp: new Date().toISOString(),
    expiresAt
  };

  if (existing) {
    Object.assign(existing, record);
  } else {
    store.botMemory.unshift(record);
  }
  store.botMemory = store.botMemory
    .filter((m) => new Date(m.expiresAt).getTime() > Date.now())
    .slice(0, 10_000);

  await queueSave();
  sendJson(res, 200, record);
}

async function handleBotEventPublish(req, res, body) {
  const botId = sanitizeText(body?.botId || "", 80);
  const symbol = sanitizeText(body?.symbol || "", 24).toUpperCase();
  const signal = sanitizeText(body?.signal || "HOLD", 10).toUpperCase();
  const reason = sanitizeText(body?.reason || "", 600);
  const chartId = sanitizeText(body?.chartId || "", 40);
  const confidence = clamp(toNumber(body?.confidence, 0.5), 0.01, 1);

  if (!botId || !symbol || !["BUY", "SELL", "HOLD"].includes(signal)) {
    sendJson(res, 400, { message: "botId, symbol, and valid signal are required." });
    return;
  }

  const event = {
    id: id("bus"),
    botId,
    symbol,
    chartId,
    signal,
    confidence,
    reason,
    timestamp: new Date().toISOString()
  };
  store.botBusEvents.unshift(event);
  store.botBusEvents = store.botBusEvents.slice(0, 20_000);
  await queueSave();

  const consensus = buildSwarmConsensus(symbol).find((x) => x.symbol === symbol) || null;
  sendJson(res, 200, { event, consensus });
}

async function handleChartPlan(req, res, body) {
  const requestedMax = clamp(toNumber(body?.maxCharts, 100), 1, 100);
  const maxCharts = requestedMax;
  const symbols = Array.isArray(body?.symbols)
    ? body.symbols.map((s) => sanitizeText(s, 24).toUpperCase()).filter(Boolean)
    : ["XAUUSD", "XAGUSD"];
  const bots = Array.isArray(body?.bots)
    ? body.bots.map((b) => sanitizeText(b, 80)).filter(Boolean)
    : store.bots.map((b) => b.id);

  if (symbols.length === 0 || bots.length === 0) {
    sendJson(res, 400, { message: "At least one symbol and one bot are required." });
    return;
  }

  const charts = [];
  for (let slot = 1; slot <= maxCharts; slot += 1) {
    const symbol = symbols[(slot - 1) % symbols.length];
    const botId = bots[(slot - 1) % bots.length];
    charts.push({
      slot,
      chartId: `chart-${slot}`,
      symbol,
      botId,
      timeframe: body?.timeframe ? sanitizeText(body.timeframe, 12) : "M15"
    });
  }

  const plan = {
    id: id("plan"),
    createdAt: new Date().toISOString(),
    maxCharts,
    symbols,
    bots,
    charts
  };
  store.chartPlans.unshift(plan);
  store.chartPlans = store.chartPlans.slice(0, 200);
  await queueSave();
  sendJson(res, 200, plan);
}

function calculateScores() {
  const memberScores = store.members.map((member) => {
    const count = store.posts.filter((p) => p.memberId === member.id).length;
    return { label: member.handle, score: count * 8 + 15 };
  });

  const botScores = store.bots.map((bot) => {
    const eventCount = store.smartSwitchEvents.filter((event) => event.botId === bot.id).length;
    const modeValue = bot.mode === "active" ? 22 : bot.mode === "guard" ? 16 : 10;
    return { label: `Bot ${bot.name}`, score: modeValue + eventCount * 5 };
  });

  return [...memberScores, ...botScores].sort((a, b) => b.score - a.score);
}

async function handleMessage(req, res, body) {
  const currentMember = getCurrentMember(req);
  if (!currentMember) {
    sendJson(res, 401, { message: "Login required." });
    return;
  }

  const content = sanitizeText(body?.content, 1000);
  if (!content) {
    sendJson(res, 400, { message: "Missing content." });
    return;
  }

  const post = {
    id: id("post"),
    memberId: currentMember.id,
    content,
    channel: sanitizeText(body?.channel || "execution-log", 40),
    timestamp: new Date().toISOString(),
    tags: []
  };
  store.posts.unshift(post);
  store.posts = store.posts.slice(0, 250);
  await queueSave();
  sendJson(res, 200, post);
}

async function handleSwitch(req, res, body) {
  const currentMember = getCurrentMember(req);
  if (!currentMember) {
    sendJson(res, 401, { message: "Login required." });
    return;
  }

  const botId = sanitizeText(body?.botId || "", 80);
  const action = sanitizeText(body?.action || "engage", 40).toLowerCase();
  const note = sanitizeText(body?.note || "", 180);
  const bot = store.bots.find((b) => b.id === botId);
  if (!bot) {
    sendJson(res, 404, { message: "Bot not found." });
    return;
  }
  if (!["engage", "test", "disengage"].includes(action)) {
    sendJson(res, 400, { message: "Invalid action." });
    return;
  }

  const event = {
    id: id("switch"),
    botId,
    action,
    note,
    memberId: currentMember.id,
    timestamp: new Date().toISOString()
  };
  bot.mode = action === "disengage" ? "rest" : "active";
  store.smartSwitchEvents.unshift(event);
  store.smartSwitchEvents = store.smartSwitchEvents.slice(0, 300);
  await queueSave();
  sendJson(res, 200, event);
}

async function handleLink(req, res, body) {
  const currentMember = getCurrentMember(req);
  if (!currentMember) {
    sendJson(res, 401, { message: "Login required." });
    return;
  }

  const fromBotId = sanitizeText(body?.fromBotId || "", 80);
  const toBotId = sanitizeText(body?.toBotId || "", 80);
  const reason = sanitizeText(body?.reason || "workflow", 180);
  if (!fromBotId || !toBotId || fromBotId === toBotId) {
    sendJson(res, 400, { message: "Invalid bot pairing." });
    return;
  }

  const from = store.bots.find((b) => b.id === fromBotId);
  const to = store.bots.find((b) => b.id === toBotId);
  if (!from || !to) {
    sendJson(res, 404, { message: "Bot not found." });
    return;
  }

  const link = { id: id("link"), from: fromBotId, to: toBotId, reason, timestamp: new Date().toISOString() };
  store.links.unshift(link);
  store.links = store.links.slice(0, 200);
  await queueSave();
  sendJson(res, 200, link);
}

async function handleState(req, res) {
  const currentMember = getCurrentMember(req);
  sendJson(res, 200, {
    currentMember: currentMember || null,
    members: store.members,
    bots: store.bots,
    posts: store.posts.slice(0, 80),
    links: store.links.slice(0, 80),
    smartSwitchEvents: store.smartSwitchEvents.slice(0, 100),
    scores: calculateScores(),
    profile: store.profile,
    latestDecision: store.latestDecision,
    recentDecisions: store.decisions.slice(0, 20),
    commands: store.commands.slice(0, 50),
    results: store.results.slice(0, 50),
    botMemory: store.botMemory.slice(0, 200),
    botBusEvents: store.botBusEvents.slice(0, 200),
    swarmConsensus: buildSwarmConsensus(),
    chartPlans: store.chartPlans.slice(0, 20),
    phoneControlPolicies: store.phoneControlPolicies,
    pendingPhoneQuestions: store.pendingPhoneQuestions.slice(0, 50),
    phoneEvents: store.phoneEvents.slice(0, 100),
    files: {
      mt4QueueFile: MT4_QUEUE_FILE,
      mt4ExecutedFile: MT4_EXECUTED_FILE
    }
  });
}

async function handleAuthConfig(res) {
  sendJson(res, 200, {
    googleEnabled: false,
    allowDevLogin: ALLOW_DEV_LOGIN
  });
}

async function handleAuthMe(req, res) {
  const member = getCurrentMember(req);
  sendJson(res, 200, { authenticated: !!member, member: member || null });
}

async function handleAuthDevLogin(req, res, body) {
  if (!ALLOW_DEV_LOGIN) {
    sendJson(res, 403, { message: "Dev login is disabled." });
    return;
  }

  const handle = sanitizeText(body?.handle || "", 80);
  const email = sanitizeText(body?.email || "", 180).toLowerCase();
  if (!handle) {
    sendJson(res, 400, { message: "Handle is required." });
    return;
  }

  const subject = email || `dev:${handle.toLowerCase()}`;
  let member = store.members.find((m) => m.subject === subject);
  if (!member) {
    member = {
      id: id("member"),
      handle,
      email,
      role: "member",
      subject,
      createdAt: new Date().toISOString()
    };
    store.members.push(member);
  } else {
    member.handle = handle;
    member.email = email;
    member.updatedAt = new Date().toISOString();
  }

  const sessionId = id("sess");
  const expiresAt = Date.now() + SESSION_TTL_MS;
  sessions.set(sessionId, { member, expiresAt });
  setSessionCookie(req, res, signSession(sessionId, expiresAt));
  await queueSave();
  sendJson(res, 200, { ok: true, member });
}

async function handleAuthLogout(req, res) {
  const cookies = parseCookies(req);
  const token = cookies[SESSION_COOKIE_NAME];
  const parsed = verifySessionToken(token);
  if (parsed) {
    sessions.delete(parsed.sessionId);
  }
  clearSessionCookie(req, res);
  sendJson(res, 200, { ok: true });
}

async function serveStatic(req, res) {
  let safePath = decodeURIComponent(new URL(req.url, `http://${req.headers.host || "localhost"}`).pathname);
  if (safePath === "/") safePath = "/index.html";
  const relPath = safePath.replace(/^\/+/, "");
  const filePath = path.resolve(PUBLIC_DIR, relPath);
  if (!filePath.startsWith(PUBLIC_DIR)) {
    writeSecurityHeaders(res);
    res.writeHead(403, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Forbidden.");
    return;
  }
  try {
    const fileBuffer = await fs.readFile(filePath);
    const ext = path.extname(filePath);
    const contentType = mimeTypes[ext] || "application/octet-stream";
    writeSecurityHeaders(res);
    res.writeHead(200, { "Content-Type": `${contentType}; charset=utf-8` });
    res.end(fileBuffer);
  } catch {
    // SPA history fallback: let the frontend router resolve branded route paths.
    if (req.method === "GET" && !safePath.startsWith("/api/")) {
      try {
        const indexBuffer = await fs.readFile(path.join(PUBLIC_DIR, "index.html"));
        writeSecurityHeaders(res);
        res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
        res.end(indexBuffer);
        return;
      } catch {
        // continue with 404 below
      }
    }
    writeSecurityHeaders(res);
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Not found.");
  }
}

const requestHandler = async (req, res) => {
  if (isRateLimited(req)) {
    sendJson(res, 429, { message: "Too many requests." });
    return;
  }

  const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);

  if (req.method === "GET" && url.pathname === "/api/health") {
    sendJson(res, 200, { ok: true, ts: new Date().toISOString() });
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/public-config") {
    sendJson(res, 200, safePublicConfig());
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/phone/sms/webhook") {
    await handleTwilioWebhook(req, res, url);
    return;
  }

  if (url.pathname.startsWith("/api/") && !isApiKeyAuthorized(req)) {
    sendJson(res, 401, { message: "API key unauthorized." });
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/auth/config") {
    await handleAuthConfig(res);
    return;
  }
  if (req.method === "GET" && url.pathname === "/api/auth/me") {
    await handleAuthMe(req, res);
    return;
  }
  if (req.method === "POST" && url.pathname === "/api/auth/dev-login") {
    let body = null;
    try {
      body = await readBody(req);
    } catch {
      sendJson(res, 400, { message: "Invalid request body." });
      return;
    }
    await handleAuthDevLogin(req, res, body || {});
    return;
  }
  if (req.method === "POST" && url.pathname === "/api/auth/logout") {
    await handleAuthLogout(req, res);
    return;
  }

  if (REQUIRE_MEMBER_LOGIN && url.pathname.startsWith("/api/") && !url.pathname.startsWith("/api/auth/")) {
    if (!getCurrentMember(req)) {
      sendJson(res, 401, { message: "Member login required." });
      return;
    }
  }

  if (req.method === "GET" && url.pathname === "/api/state") {
    await handleState(req, res);
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/swarm/consensus") {
    const symbol = sanitizeText(url.searchParams.get("symbol") || "", 24).toUpperCase();
    sendJson(res, 200, { consensus: buildSwarmConsensus(symbol) });
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/swarm/memory") {
    const botId = sanitizeText(url.searchParams.get("botId") || "", 80);
    const symbol = sanitizeText(url.searchParams.get("symbol") || "", 24).toUpperCase();
    const items = store.botMemory.filter((m) => {
      if (botId && m.botId !== botId) return false;
      if (symbol && m.symbol !== symbol) return false;
      if (new Date(m.expiresAt).getTime() <= Date.now()) return false;
      return true;
    });
    sendJson(res, 200, { memory: items.slice(0, 2000) });
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/phone/state") {
    sendJson(res, 200, {
      policies: store.phoneControlPolicies,
      pending: store.pendingPhoneQuestions.slice(0, 50),
      events: store.phoneEvents.slice(0, 100)
    });
    return;
  }

  if (req.method === "POST" && url.pathname.startsWith("/api/")) {
    let body = null;
    try {
      body = await readBody(req);
    } catch (error) {
      if (error instanceof Error && error.message === "PAYLOAD_TOO_LARGE") {
        sendJson(res, 413, { message: "Payload too large." });
        return;
      }
      sendJson(res, 400, { message: "Invalid request body." });
      return;
    }

    if (url.pathname === "/api/decide") {
      await handleDecide(req, res, body);
      return;
    }
    if (url.pathname === "/api/messages") {
      await handleMessage(req, res, body || {});
      return;
    }
    if (url.pathname === "/api/smart-switch") {
      await handleSwitch(req, res, body || {});
      return;
    }
    if (url.pathname === "/api/link-bots") {
      await handleLink(req, res, body || {});
      return;
    }
    if (url.pathname === "/api/commands/queue") {
      await handleQueueCommand(req, res, body);
      return;
    }
    if (url.pathname === "/api/results") {
      await handleResult(req, res, body || {});
      return;
    }
    if (url.pathname === "/api/swarm/memory") {
      await handleBotMemoryWrite(req, res, body || {});
      return;
    }
    if (url.pathname === "/api/swarm/event") {
      await handleBotEventPublish(req, res, body || {});
      return;
    }
    if (url.pathname === "/api/swarm/plan") {
      await handleChartPlan(req, res, body || {});
      return;
    }
    if (url.pathname === "/api/phone/ask") {
      await handlePhoneAsk(req, res, body || {});
      return;
    }
    if (url.pathname === "/api/phone/message") {
      await handlePhoneMessage(req, res, body || {});
      return;
    }
    if (url.pathname === "/api/phone/reply") {
      await handlePhoneReply(req, res, body || {});
      return;
    }
    if (url.pathname.startsWith("/api/commands/") && url.pathname.endsWith("/ack")) {
      const commandId = sanitizeText(url.pathname.split("/")[3] || "", 50);
      await handleAcknowledgeCommand(req, res, commandId, body || {});
      return;
    }
  }

  if (req.method === "GET") {
    await serveStatic(req, res);
    return;
  }

  sendText(res, 404, "Route not supported.");
};

await ensureStorage();
let server;
if (TLS_CERT_PATH && TLS_KEY_PATH) {
  const [cert, key] = await Promise.all([fs.readFile(TLS_CERT_PATH), fs.readFile(TLS_KEY_PATH)]);
  server = https.createServer({ cert, key }, requestHandler);
} else {
  server = http.createServer(requestHandler);
}

server.listen(PORT, HOST, () => {
  const protocol = TLS_CERT_PATH && TLS_KEY_PATH ? "https" : "http";
  console.log(`Trading console listening on ${protocol}://${HOST}:${PORT}`);
  console.log(`MT4 queue file: ${MT4_QUEUE_FILE}`);
  if (!TLS_CERT_PATH || !TLS_KEY_PATH) {
    console.log("TLS disabled. Use reverse proxy TLS in production.");
  }
  if (TELEGRAM_BOT_TOKEN) {
    console.log("Telegram phone-control polling enabled.");
    setInterval(() => {
      pollTelegramLoop();
    }, Math.max(TELEGRAM_POLL_INTERVAL_MS, 2000));
    pollTelegramLoop();
  }
});
