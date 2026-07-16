import crypto from "crypto";

export const LANE_PROFILES = Object.freeze({
  COMPOUND: { id: "compound", label: "Compound", harvestMode: "REPEAT", defaultGoalPercent: 2, pauseAfterGoal: false },
  INCOME: { id: "income", label: "Income", harvestMode: "REPEAT", defaultGoalPercent: 1, pauseAfterGoal: false },
  CAPITAL_PRESERVATION: { id: "capital-preservation", label: "Capital Preservation", harvestMode: "ONCE", defaultGoalPercent: 0.75, pauseAfterGoal: true },
  PROP_CHALLENGE: { id: "prop-challenge", label: "Prop Challenge", harvestMode: "ONCE", defaultGoalPercent: 1, pauseAfterGoal: true },
  CUSTOM: { id: "custom", label: "Custom", harvestMode: "ONCE", defaultGoalPercent: 2, pauseAfterGoal: true }
});

const clone = (value) => JSON.parse(JSON.stringify(value));
const nowIso = () => new Date().toISOString();
const id = (prefix) => `${prefix}-${crypto.randomBytes(6).toString("hex")}`;
const num = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;
const round = (value, places = 2) => Number(num(value).toFixed(places));
const normalizeSymbol = (value) => String(value || "").trim().toUpperCase();

export class CultureLaneEngine {
  constructor(seed = {}) {
    this.lanes = new Map();
    for (const lane of seed.lanes || []) this.lanes.set(lane.id, clone(lane));
  }

  createLane(input = {}) {
    const profile = Object.values(LANE_PROFILES).find((item) => item.id === input.profileId) || LANE_PROFILES.COMPOUND;
    const createdAt = nowIso();
    const lane = {
      id: input.id || id("lane"),
      name: input.name || "Culture Lane",
      profileId: profile.id,
      status: "ACTIVE",
      entryPolicy: input.entryPolicy || "ALLOW",
      accounts: [],
      symbolPolicy: {
        mode: "AUTO_DISCOVER",
        allowedGroups: ["FOREX", "INDICES", "METALS", "ENERGY", "CRYPTO"],
        blockedCanonicalSymbols: [],
        aliases: {},
        accountOverrides: {}
      },
      harvest: {
        enabled: true,
        goalType: "PERCENT_EQUITY",
        goalValue: num(input.goalValue, profile.defaultGoalPercent),
        behavior: profile.harvestMode,
        pauseAfterGoal: profile.pauseAfterGoal,
        cycle: 1,
        lockedProfit: 0,
        baselineEquity: 0,
        lastTriggeredAt: null,
        pendingCommandId: null
      },
      mission: { title: input.missionTitle || `Grow ${input.name || "Culture Lane"}`, startedAt: createdAt },
      timeline: [],
      passports: [],
      blackBox: [],
      genomes: [],
      dna: null,
      intelligence: [],
      createdAt,
      updatedAt: createdAt
    };
    this.lanes.set(lane.id, lane);
    this.recordGenome(lane.id, "Initial Culture Lane configuration");
    this.recordEvent(lane.id, "LANE_CREATED", { profileId: lane.profileId });
    return clone(lane);
  }

  getLane(laneId) {
    const lane = this.lanes.get(laneId);
    if (!lane) throw new Error("Culture Lane not found");
    return lane;
  }

  addAccount(laneId, input = {}) {
    const lane = this.getLane(laneId);
    const account = {
      id: input.id || id("acct"),
      name: input.name || "Trading Account",
      role: input.role === "LEADER" ? "LEADER" : "FOLLOWER",
      broker: input.broker || "Unknown",
      login: String(input.login || ""),
      balance: num(input.balance),
      equity: num(input.equity, num(input.balance)),
      floatingProfit: num(input.floatingProfit),
      dailyClosedProfit: num(input.dailyClosedProfit),
      symbols: [...new Set((input.symbols || []).map(normalizeSymbol).filter(Boolean))],
      online: input.online !== false,
      paused: false,
      lastSeen: nowIso()
    };
    lane.accounts.push(account);
    if (!lane.harvest.baselineEquity) lane.harvest.baselineEquity = this.getLaneTotals(laneId).equity;
    this.recordEvent(laneId, "ACCOUNT_ADDED", { accountId: account.id, role: account.role });
    lane.updatedAt = nowIso();
    return clone(account);
  }

  updateTelemetry(laneId, accountId, telemetry = {}) {
    const lane = this.getLane(laneId);
    const account = lane.accounts.find((item) => item.id === accountId);
    if (!account) throw new Error("Account not found");
    for (const field of ["balance", "equity", "floatingProfit", "dailyClosedProfit"]) {
      if (field in telemetry) account[field] = num(telemetry[field], account[field]);
    }
    if (Array.isArray(telemetry.symbols)) account.symbols = [...new Set(telemetry.symbols.map(normalizeSymbol).filter(Boolean))];
    if ("online" in telemetry) account.online = Boolean(telemetry.online);
    account.lastSeen = nowIso();
    lane.updatedAt = nowIso();
    return this.evaluateHarvest(laneId);
  }

  configureSymbolPolicy(laneId, patch = {}) {
    const lane = this.getLane(laneId);
    lane.symbolPolicy = {
      ...lane.symbolPolicy,
      ...clone(patch),
      aliases: { ...lane.symbolPolicy.aliases, ...(patch.aliases || {}) },
      accountOverrides: { ...lane.symbolPolicy.accountOverrides, ...(patch.accountOverrides || {}) }
    };
    this.recordGenome(laneId, "Symbol routing policy updated");
    this.recordEvent(laneId, "SYMBOL_POLICY_UPDATED", lane.symbolPolicy);
    lane.updatedAt = nowIso();
    return clone(lane.symbolPolicy);
  }

  routeSymbol(laneId, leaderSymbol, followerAccountId) {
    const lane = this.getLane(laneId);
    const canonical = normalizeSymbol(leaderSymbol);
    const follower = lane.accounts.find((item) => item.id === followerAccountId);
    if (!follower) throw new Error("Follower account not found");
    const override = lane.symbolPolicy.accountOverrides[followerAccountId] || {};
    const blocked = new Set([...(lane.symbolPolicy.blockedCanonicalSymbols || []), ...(override.blockedCanonicalSymbols || [])].map(normalizeSymbol));
    if (blocked.has(canonical)) return { status: "BLOCKED", canonical, accountId: followerAccountId, reason: "Symbol policy blocked this market" };
    const aliases = [canonical, ...(lane.symbolPolicy.aliases[canonical] || []), ...(override.aliases?.[canonical] || [])].map(normalizeSymbol);
    const exact = aliases.find((candidate) => follower.symbols.includes(candidate));
    if (exact) return { status: "ROUTED", canonical, brokerSymbol: exact, accountId: followerAccountId };
    const stripped = (value) => value.replace(/[._-]?(CASH|PRO|RAW|ECN|M|I|R)$/i, "");
    const fuzzy = follower.symbols.find((candidate) => aliases.some((alias) => stripped(candidate) === stripped(alias)));
    if (fuzzy) return { status: "ROUTED", canonical, brokerSymbol: fuzzy, accountId: followerAccountId, matchedBy: "NORMALIZED_ALIAS" };
    return { status: "SKIPPED", canonical, accountId: followerAccountId, reason: "No compatible broker symbol discovered" };
  }

  configureHarvest(laneId, patch = {}) {
    const lane = this.getLane(laneId);
    lane.harvest = { ...lane.harvest, ...clone(patch), goalValue: num(patch.goalValue, lane.harvest.goalValue) };
    if (patch.resetBaseline) lane.harvest.baselineEquity = this.getLaneTotals(laneId).equity;
    delete lane.harvest.resetBaseline;
    this.recordGenome(laneId, "Harvest configuration updated");
    this.recordEvent(laneId, "HARVEST_CONFIG_UPDATED", lane.harvest);
    lane.updatedAt = nowIso();
    return clone(lane.harvest);
  }

  getLaneTotals(laneId) {
    const lane = this.getLane(laneId);
    return lane.accounts.reduce((totals, account) => {
      totals.balance += account.balance;
      totals.equity += account.equity;
      totals.floatingProfit += account.floatingProfit;
      totals.dailyClosedProfit += account.dailyClosedProfit;
      if (account.online) totals.onlineAccounts += 1;
      return totals;
    }, { balance: 0, equity: 0, floatingProfit: 0, dailyClosedProfit: 0, onlineAccounts: 0 });
  }

  evaluateHarvest(laneId) {
    const lane = this.getLane(laneId);
    const totals = this.getLaneTotals(laneId);
    const baseline = lane.harvest.baselineEquity || totals.equity || 1;
    const gain = totals.equity - baseline;
    const gainPercent = baseline ? gain / baseline * 100 : 0;
    const progress = lane.harvest.goalType === "DOLLAR_GAIN" ? gain : gainPercent;
    const reached = lane.harvest.enabled && progress >= lane.harvest.goalValue && !lane.harvest.pendingCommandId;
    const state = { laneId, totals, baseline, gain: round(gain), gainPercent: round(gainPercent, 3), goalValue: lane.harvest.goalValue, reached };
    if (!reached) return state;
    const command = this.createCloseAllCommand(laneId, "HARVEST_GOAL_REACHED", state);
    lane.harvest.pendingCommandId = command.id;
    lane.harvest.lastTriggeredAt = nowIso();
    this.recordEvent(laneId, "HARVEST_TRIGGERED", { commandId: command.id, ...state });
    return { ...state, command };
  }

  createCloseAllCommand(laneId, reason = "MANUAL", context = {}) {
    const lane = this.getLane(laneId);
    const command = {
      id: id("cmd"),
      laneId,
      type: "CLOSE_ALL",
      reason,
      status: "QUEUED",
      targets: lane.accounts.map((account) => ({ accountId: account.id, role: account.role, status: account.online ? "QUEUED" : "OFFLINE" })),
      pauseAfterClose: lane.harvest.pauseAfterGoal || lane.harvest.behavior === "ONCE",
      createdAt: nowIso(),
      context: clone(context)
    };
    lane.blackBox.push({ id: id("bb"), type: "COMMAND_CREATED", command: clone(command), at: nowIso() });
    return command;
  }

  completeHarvest(laneId, command, results = []) {
    const lane = this.getLane(laneId);
    const totals = this.getLaneTotals(laneId);
    const successful = results.filter((item) => item.status === "SUCCESS");
    const failed = results.filter((item) => item.status !== "SUCCESS");
    const passport = {
      id: id("passport"),
      laneId,
      type: "BASKET",
      harvestCycle: lane.harvest.cycle,
      commandId: command.id,
      reason: command.reason,
      profit: round(totals.equity - lane.harvest.baselineEquity),
      accountCount: lane.accounts.length,
      successfulCloses: successful.length,
      failedCloses: failed.length,
      executionResults: clone(results),
      genomeVersion: lane.genomes.at(-1)?.version || "v1.0",
      closedAt: nowIso()
    };
    lane.passports.push(passport);
    lane.harvest.lockedProfit = round(lane.harvest.lockedProfit + passport.profit);
    lane.harvest.pendingCommandId = null;
    if (command.pauseAfterClose) {
      lane.status = "PAUSED_DAILY_GOAL";
      lane.entryPolicy = "BLOCK";
    } else {
      lane.harvest.cycle += 1;
      lane.harvest.baselineEquity = totals.equity;
      lane.entryPolicy = "ALLOW";
    }
    lane.blackBox.push({ id: id("bb"), type: "HARVEST_COMPLETED", passportId: passport.id, results: clone(results), at: nowIso() });
    this.recordEvent(laneId, "HARVEST_COMPLETED", { passportId: passport.id, profit: passport.profit, paused: command.pauseAfterClose });
    this.recalculateDNA(laneId);
    this.generateIntelligence(laneId);
    lane.updatedAt = nowIso();
    return clone(passport);
  }

  recordEvent(laneId, type, payload = {}) {
    const lane = this.getLane(laneId);
    const event = { id: id("evt"), type, payload: clone(payload), at: nowIso() };
    lane.timeline.push(event);
    if (lane.timeline.length > 5000) lane.timeline.splice(0, lane.timeline.length - 5000);
    return event;
  }

  recordGenome(laneId, reason) {
    const lane = this.getLane(laneId);
    const version = `v1.${lane.genomes.length}`;
    const genome = {
      id: id("genome"), version, reason,
      profileId: lane.profileId,
      harvest: clone(lane.harvest),
      symbolPolicy: clone(lane.symbolPolicy),
      createdAt: nowIso()
    };
    lane.genomes.push(genome);
    return genome;
  }

  recalculateDNA(laneId) {
    const lane = this.getLane(laneId);
    const passports = lane.passports;
    const profits = passports.map((item) => item.profit);
    const wins = profits.filter((value) => value > 0).length;
    const successRates = passports.map((item) => item.accountCount ? item.successfulCloses / item.accountCount * 100 : 0);
    lane.dna = {
      laneId,
      sampleSize: passports.length,
      harvestAccuracy: round(successRates.reduce((a, b) => a + b, 0) / Math.max(successRates.length, 1)),
      winRate: round(wins / Math.max(profits.length, 1) * 100),
      averageHarvest: round(profits.reduce((a, b) => a + b, 0) / Math.max(profits.length, 1)),
      largestHarvest: round(Math.max(0, ...profits)),
      consistency: round(Math.max(0, 100 - this.standardDeviation(profits))),
      updatedAt: nowIso()
    };
    return clone(lane.dna);
  }

  generateIntelligence(laneId) {
    const lane = this.getLane(laneId);
    const totals = this.getLaneTotals(laneId);
    const latest = lane.passports.at(-1);
    const insights = [];
    if (latest) insights.push(`Harvest cycle ${latest.harvestCycle} locked ${latest.profit.toFixed(2)} across ${latest.accountCount} accounts.`);
    if (latest?.failedCloses) insights.push(`${latest.failedCloses} account close confirmations require review in the Black Box.`);
    const offline = lane.accounts.filter((account) => !account.online).length;
    if (offline) insights.push(`${offline} lane account${offline === 1 ? " is" : "s are"} offline.`);
    if (lane.dna?.sampleSize >= 3 && lane.dna.winRate < 60) insights.push("Lane DNA shows inconsistent harvest outcomes; test a lower goal in Lane Simulator before changing live settings.");
    const report = { id: id("intel"), laneId, totals, insights, generatedAt: nowIso() };
    lane.intelligence.push(report);
    return clone(report);
  }

  missionControl(laneId) {
    const lane = this.getLane(laneId);
    const totals = this.getLaneTotals(laneId);
    const baseline = lane.harvest.baselineEquity || totals.equity || 1;
    const gainPercent = (totals.equity - baseline) / baseline * 100;
    return {
      laneId,
      name: lane.name,
      mission: clone(lane.mission),
      status: lane.status,
      entryPolicy: lane.entryPolicy,
      sync: { online: totals.onlineAccounts, total: lane.accounts.length, healthy: totals.onlineAccounts === lane.accounts.length },
      harvest: { ...clone(lane.harvest), currentGainPercent: round(gainPercent, 3), progressPercent: round(Math.max(0, gainPercent / Math.max(lane.harvest.goalValue, 0.0001) * 100)) },
      totals,
      dna: clone(lane.dna),
      latestIntelligence: clone(lane.intelligence.at(-1) || null),
      latestBlackBox: clone(lane.blackBox.at(-1) || null),
      updatedAt: nowIso()
    };
  }

  simulateHarvest(laneId, equitySeries = [], proposedGoalPercent = 2) {
    const lane = this.getLane(laneId);
    const start = num(equitySeries[0]?.equity, lane.harvest.baselineEquity || 1);
    let baseline = start;
    let lockedProfit = 0;
    let cycles = 0;
    for (const point of equitySeries) {
      const equity = num(point.equity, baseline);
      const gainPercent = baseline ? (equity - baseline) / baseline * 100 : 0;
      if (gainPercent >= proposedGoalPercent) {
        lockedProfit += equity - baseline;
        baseline = equity;
        cycles += 1;
      }
    }
    return { laneId, proposedGoalPercent, cycles, lockedProfit: round(lockedProfit), startEquity: round(start), endBaseline: round(baseline) };
  }

  standardDeviation(values) {
    if (!values.length) return 0;
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    return Math.sqrt(values.reduce((sum, value) => sum + ((value - mean) ** 2), 0) / values.length);
  }
}
