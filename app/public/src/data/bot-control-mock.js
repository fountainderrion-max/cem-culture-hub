const RANK_TIERS = ["Initiate", "Scout", "Runner", "Sniper", "Captain", "Commander", "Elite", "Covenant", "Architect", "Apex"];

export const MISSION_PRESETS = [
  {
    id: "mission-scout",
    name: "Scout",
    focus: "Fast signal discovery across high-liquidity pairs.",
    riskBand: "Low"
  },
  {
    id: "mission-builder",
    name: "Builder",
    focus: "Layered position construction with strict risk bands.",
    riskBand: "Medium"
  },
  {
    id: "mission-attack",
    name: "Attack",
    focus: "Momentum entries during directional expansion.",
    riskBand: "High"
  },
  {
    id: "mission-harvest",
    name: "Harvest",
    focus: "Partial exits and compounding of protected gains.",
    riskBand: "Medium"
  },
  {
    id: "mission-defense",
    name: "Defense",
    focus: "Capital preservation and drawdown containment.",
    riskBand: "Low"
  },
  {
    id: "mission-recovery",
    name: "Recovery",
    focus: "Controlled rebuild sequencing after losses.",
    riskBand: "Medium"
  },
  {
    id: "mission-order-block-only",
    name: "Order Block Only",
    focus: "Order block reaction logic only, no breakout chasing.",
    riskBand: "Medium"
  },
  {
    id: "mission-scalper-assist",
    name: "Scalper Assist",
    focus: "Micro-session support and spread-sensitive entries.",
    riskBand: "High"
  },
  {
    id: "mission-swing-hold",
    name: "Swing Hold",
    focus: "Higher timeframe structure holding and rotation.",
    riskBand: "Medium"
  }
];

const FAMILY_BLUEPRINTS = [
  {
    id: "aegis-core",
    name: "Recovery / Defense",
    visualTag: "Defensive Grid",
    theme: "Risk-anchored execution with layered protection.",
    unlockBase: 1,
    symbolPairs: ["XAUUSD", "EURUSD", "USDJPY", "GBPUSD"],
    roles: ["Exit/defense bots", "Assist bots", "Anchor bots", "Utility bots"],
    bots: [
      "Aegis Scout One",
      "Aegis Builder One",
      "Aegis Bastion",
      "Aegis Recovery One",
      "Aegis Sentinel",
      "Aegis Harvester",
      "Aegis Counter"
    ]
  },
  {
    id: "atlas-flow",
    name: "Swing / Trend",
    visualTag: "Trend Relay",
    theme: "Multi-session trend continuation engines.",
    unlockBase: 2,
    symbolPairs: ["EURUSD", "US30", "NAS100", "GBPJPY"],
    roles: ["Anchor bots", "Campaign bots", "Assist bots", "Utility bots"],
    bots: [
      "Atlas Scout One",
      "Atlas Builder One",
      "Atlas Attack One",
      "Atlas Harvest One",
      "Atlas Defense One",
      "Atlas Recovery One"
    ]
  },
  {
    id: "obsidian-pulse",
    name: "Order Block",
    visualTag: "Order Block Force",
    theme: "Structure-first decisioning with order block priority.",
    unlockBase: 3,
    symbolPairs: ["XAUUSD", "USDCHF", "AUDUSD", "EURJPY"],
    roles: ["Campaign bots", "Exit/defense bots", "Assist bots", "Anchor bots"],
    bots: [
      "Obsidian Hunter",
      "Obsidian Anchor",
      "Obsidian Mapper",
      "Obsidian Shield",
      "Obsidian Pulse",
      "Obsidian Ranger"
    ]
  },
  {
    id: "nebula-grid",
    name: "Ladder / Builder",
    visualTag: "Grid Precision",
    theme: "Volatility-aware layered entries and exits.",
    unlockBase: 4,
    symbolPairs: ["EURGBP", "AUDJPY", "USDJPY", "XAGUSD"],
    roles: ["Anchor bots", "Assist bots", "Exit/defense bots", "Utility bots"],
    bots: [
      "Nebula Mapper One",
      "Nebula Mapper Two",
      "Nebula Shield One",
      "Nebula Shield Two",
      "Nebula Surge",
      "Nebula Drift",
      "Nebula Anchor"
    ]
  },
  {
    id: "delta-forge",
    name: "Session Specialists",
    visualTag: "Liquidity Forge",
    theme: "Session liquidity sweeps and reclaim logic.",
    unlockBase: 5,
    symbolPairs: ["GBPUSD", "EURUSD", "USOIL", "BTCUSD"],
    roles: ["Campaign bots", "Anchor bots", "Assist bots", "Utility bots"],
    bots: [
      "Delta Scout",
      "Delta Builder",
      "Delta Attack",
      "Delta Harvest",
      "Delta Shield",
      "Delta Recovery"
    ]
  },
  {
    id: "quantum-drift",
    name: "Experimental",
    visualTag: "Session Drift",
    theme: "Cross-session handoff for stable trend carry.",
    unlockBase: 6,
    symbolPairs: ["EURUSD", "USDJPY", "XAUUSD", "NAS100"],
    roles: ["Utility bots", "Campaign bots", "Assist bots", "Exit/defense bots"],
    bots: [
      "Quantum Scout",
      "Quantum Builder",
      "Quantum Attack",
      "Quantum Harvest",
      "Quantum Defense",
      "Quantum Recovery",
      "Quantum Drift"
    ]
  },
  {
    id: "titan-order",
    name: "Order Block Vanguard",
    visualTag: "Macro Order",
    theme: "Macro structure plus execution precision.",
    unlockBase: 7,
    symbolPairs: ["US500", "US30", "EURUSD", "GBPUSD"],
    roles: ["Campaign bots", "Anchor bots", "Exit/defense bots", "Assist bots"],
    bots: [
      "Titan Scout",
      "Titan Builder",
      "Titan Attack",
      "Titan Harvest",
      "Titan Defense",
      "Titan Recovery",
      "Titan Order"
    ]
  },
  {
    id: "helix-scalper",
    name: "Scalping",
    visualTag: "Micro Burst",
    theme: "Latency-sensitive scalping support systems.",
    unlockBase: 8,
    symbolPairs: ["XAUUSD", "EURUSD", "US30", "GBPJPY"],
    roles: ["Campaign bots", "Utility bots", "Anchor bots", "Exit/defense bots"],
    bots: [
      "Helix Scout",
      "Helix Builder",
      "Helix Attack",
      "Helix Harvest",
      "Helix Defense",
      "Helix Recovery",
      "Helix Scalper Prime"
    ]
  }
];

const ROLE_TO_SWITCHES = {
  "Anchor bots": ["switch-trend-guardian", "switch-profit-shield", "switch-adaptive-mission"],
  "Assist bots": ["switch-scalp-assist", "switch-pair-rotation-brain", "switch-session-brain"],
  "Exit/defense bots": ["switch-drawdown-brake", "switch-equity-lock", "switch-reversal-lock"],
  "Campaign bots": ["switch-ladder-authority", "switch-campaign-extension", "switch-structure-exit-logic"],
  "Utility bots": ["switch-vps-auto-heal", "switch-auto-restart", "switch-terminal-clone"]
};

const PROFILE_TEMPLATES = [
  {
    id: "profile-war-room",
    name: "War Room Command",
    host: "Cloud Relay",
    latencyBand: "8ms to 25ms",
    heartbeat: "10s",
    failover: "Auto rebind to secondary VPS region.",
    accessTier: "Legend"
  },
  {
    id: "profile-vps-forge",
    name: "VPS Forge Relay",
    host: "Dedicated VPS",
    latencyBand: "12ms to 35ms",
    heartbeat: "15s",
    failover: "Manual takeover with hot backup profile.",
    accessTier: "Platinum"
  },
  {
    id: "profile-mobile-guardian",
    name: "Mobile Guardian",
    host: "Hybrid",
    latencyBand: "35ms to 80ms",
    heartbeat: "30s",
    failover: "Alert-only fallback with lock switches.",
    accessTier: "Gold"
  },
  {
    id: "profile-provider-broadcast",
    name: "Provider Broadcast",
    host: "Provider Node",
    latencyBand: "18ms to 45ms",
    heartbeat: "12s",
    failover: "Route to approved operator endpoint.",
    accessTier: "Diamond"
  }
];

const SWITCHES = [
  { id: "switch-trend-guardian", name: "Trend Guardian", lane: "Protection", unlock: { type: "subscription", minimumSubscription: "Core" }, summary: "Maintains trend integrity and blocks low-confidence reversals." },
  { id: "switch-reversal-lock", name: "Reversal Lock", lane: "Protection", unlock: { type: "rank", minimumRank: "Runner" }, summary: "Blocks entries against dominant market structure shifts." },
  { id: "switch-profit-shield", name: "Profit Shield", lane: "Protection", unlock: { type: "growth", minimumGrowthLevel: 3 }, summary: "Growth gate concept: +10% growth unlock equivalent for profit preservation." },
  { id: "switch-drawdown-brake", name: "Drawdown Brake", lane: "Protection", unlock: { type: "subscription", minimumSubscription: "Pro" }, summary: "Progressively slows exposure during drawdown spikes." },
  { id: "switch-session-freeze", name: "Session Freeze", lane: "Protection", unlock: { type: "paid", pack: "Protection Pack", priceUsd: 39 }, summary: "Locks execution during restricted session windows." },
  { id: "switch-equity-lock", name: "Equity Lock", lane: "Protection", unlock: { type: "rank", minimumRank: "Captain" }, summary: "Hard equity stop with emergency flatten protocol." },
  { id: "switch-ladder-authority", name: "Ladder Authority", lane: "Execution", unlock: { type: "growth", minimumGrowthLevel: 6 }, summary: "Growth gate concept: +25% growth unlock equivalent for ladder control." },
  { id: "switch-order-block-only", name: "Order Block Only", lane: "Execution", unlock: { type: "paid", pack: "Structure Pack", priceUsd: 89 }, summary: "Restricts entries to validated order block structures." },
  { id: "switch-scalp-assist", name: "Scalp Assist", lane: "Execution", unlock: { type: "subscription", minimumSubscription: "Pro" }, summary: "Latency-sensitive scalping assistance and spread checks." },
  { id: "switch-campaign-extension", name: "Campaign Extension", lane: "Execution", unlock: { type: "rank", minimumRank: "Commander" }, summary: "Extends campaigns while preserving risk envelope." },
  { id: "switch-add-zone-confirm", name: "Add Zone Confirm", lane: "Execution", unlock: { type: "rank", minimumRank: "Sniper" }, summary: "Requires zone confirmation before add-on entries." },
  { id: "switch-precision-entry-filter", name: "Precision Entry Filter", lane: "Execution", unlock: { type: "paid", pack: "Precision Pack", priceUsd: 49 }, summary: "Filters entries by confluence and confidence thresholds." },
  { id: "switch-adaptive-mission", name: "Adaptive Mission", lane: "Intelligence", unlock: { type: "growth", minimumGrowthLevel: 10 }, summary: "Growth gate concept: +50% growth unlock equivalent for adaptive mission routing." },
  { id: "switch-volatility-adaptor", name: "Volatility Adaptor", lane: "Intelligence", unlock: { type: "subscription", minimumSubscription: "Core" }, summary: "Adapts bot behavior by volatility regime." },
  { id: "switch-structure-exit-logic", name: "Structure Exit Logic", lane: "Intelligence", unlock: { type: "rank", minimumRank: "Captain" }, summary: "Dynamic exits based on structure transitions." },
  { id: "switch-pair-rotation-brain", name: "Pair Rotation Brain", lane: "Intelligence", unlock: { type: "rank", minimumRank: "Commander" }, summary: "Commander rank concept unlocking multi-pair rotation." },
  { id: "switch-session-brain", name: "Session Brain", lane: "Intelligence", unlock: { type: "subscription", minimumSubscription: "Elite" }, summary: "Session-aware optimization for strategy handoff." },
  { id: "switch-confidence-gate", name: "Confidence Gate", lane: "Intelligence", unlock: { type: "paid", pack: "Intelligence Pack", priceUsd: 59 }, summary: "Entry/exit gating by confidence thresholds." },
  { id: "switch-vps-auto-heal", name: "VPS Auto-Heal", lane: "Hosting", unlock: { type: "subscription", minimumSubscription: "Premium" }, summary: "Auto-heal MetaTrader hosting incidents." },
  { id: "switch-auto-restart", name: "Auto Restart", lane: "Hosting", unlock: { type: "subscription", minimumSubscription: "Premium" }, summary: "Automatic restart on terminal crash/disconnect." },
  { id: "switch-terminal-clone", name: "Terminal Clone", lane: "Hosting", unlock: { type: "rank", minimumRank: "Commander" }, summary: "Fast duplicate terminal deployment for redundancy." },
  { id: "switch-smart-recovery", name: "Smart Recovery", lane: "Hosting", unlock: { type: "paid", pack: "Hosting Pack", priceUsd: 79 }, summary: "Recovery workflows for broken deployments." },
  { id: "switch-backup-sync", name: "Backup Sync", lane: "Hosting", unlock: { type: "subscription", minimumSubscription: "Elite" }, summary: "Scheduled backup sync and failover staging." }
];

const SUBSCRIPTION_ORDER = ["Free", "Core", "Pro", "Premium", "Elite"];

function rankIndex(rank) {
  return RANK_TIERS.indexOf(rank);
}

function normalizeRole(role) {
  return role && ROLE_TO_SWITCHES[role] ? role : "Anchor bots";
}

function computeUnlockLevel(family, index) {
  return family.unlockBase + (index % 5);
}

function pickRole(family, index) {
  return family.roles[index % family.roles.length];
}

function pickMissionForRole(role) {
  const missionMap = {
    "Anchor bots": "Builder",
    "Assist bots": "Scout",
    "Exit/defense bots": "Defense",
    "Campaign bots": "Attack",
    "Utility bots": "Recovery"
  };
  return missionMap[role] || "Scout";
}

function buildBotRegistry() {
  const bots = [];
  let sequence = 1;
  for (const family of FAMILY_BLUEPRINTS) {
    for (let idx = 0; idx < family.bots.length; idx += 1) {
      const role = pickRole(family, idx);
      const unlockLevel = computeUnlockLevel(family, idx);
      const rankGate = RANK_TIERS[Math.min(RANK_TIERS.length - 1, Math.floor((unlockLevel + 1) / 2))];
      const growthGate = Math.min(12, unlockLevel + 1);
      const symbolPair = family.symbolPairs[idx % family.symbolPairs.length];
      const altPair = family.symbolPairs[(idx + 1) % family.symbolPairs.length];
      const profileA = PROFILE_TEMPLATES[idx % PROFILE_TEMPLATES.length].id;
      const profileB = PROFILE_TEMPLATES[(idx + 2) % PROFILE_TEMPLATES.length].id;

      bots.push({
        id: `bot-${String(sequence).padStart(3, "0")}`,
        code: `CEM-${String(sequence).padStart(3, "0")}`,
        name: family.bots[idx],
        familyId: family.id,
        familyName: family.name,
        familyVisualTag: family.visualTag,
        role,
        unlockLevel,
        rankGate,
        growthGate,
        missionPreset: pickMissionForRole(role),
        compatibilitySwitchIds: ROLE_TO_SWITCHES[normalizeRole(role)].slice(),
        symbolPairs: [symbolPair, altPair],
        riskBias: unlockLevel >= 8 ? "Aggressive" : unlockLevel >= 5 ? "Balanced" : "Conservative",
        remoteProfileIds: [profileA, profileB],
        status: unlockLevel > 9 ? "prototype" : "stable"
      });
      sequence += 1;
    }
  }

  for (let idx = 0; idx < bots.length; idx += 1) {
    const buddy = bots[(idx + 1) % bots.length];
    const cross = bots[(idx + 7) % bots.length];
    bots[idx].companionBotIds = [buddy.id, cross.id];
  }

  return bots;
}

export const BOT_REGISTRY = buildBotRegistry();

export const BOT_FAMILIES = FAMILY_BLUEPRINTS.map((family) => {
  const familyBots = BOT_REGISTRY.filter((bot) => bot.familyId === family.id);
  const unlockMin = Math.min(...familyBots.map((bot) => bot.unlockLevel));
  const unlockMax = Math.max(...familyBots.map((bot) => bot.unlockLevel));
  return {
    id: family.id,
    name: family.name,
    visualTag: family.visualTag,
    theme: family.theme,
    unlockBand: `${unlockMin}-${unlockMax}`,
    roles: family.roles.slice(),
    botCount: familyBots.length,
    symbols: family.symbolPairs.slice()
  };
});

export const MY_BOT_IDS = [
  "bot-001",
  "bot-003",
  "bot-006",
  "bot-009",
  "bot-012",
  "bot-016",
  "bot-021",
  "bot-024",
  "bot-028",
  "bot-031",
  "bot-035",
  "bot-039",
  "bot-043",
  "bot-048",
  "bot-053"
];

export const REMOTE_CONTROL_PROFILES = PROFILE_TEMPLATES.map((profile, index) => ({
  ...profile,
  activeBots: 8 + index * 5,
  healthScore: 98 - index * 4,
  operator: ["OpsLead", "SquadPilot", "ProviderAlpha", "MissionHost"][index]
}));

export const SWITCH_REGISTRY = SWITCHES.map((item, index) => ({
  ...item,
  heat: ["Cold", "Warm", "Hot"][index % 3],
  usageRate: 42 + index * 3
}));

export const MY_SWITCH_IDS = [
  "switch-trend-guardian", "switch-profit-shield", "switch-ladder-authority", "switch-adaptive-mission", "switch-vps-auto-heal"
];

export const ACTIVE_SWITCH_IDS = [
  "switch-trend-guardian", "switch-profit-shield", "switch-vps-auto-heal"
];

export const SQUAD_REGISTRY = [
  {
    id: "squad-aurora-v",
    name: "Aurora V",
    archetype: "Trend Relay",
    missionPreset: "Scout",
    rankRequirement: "Silver",
    growthRequirement: 3,
    memberBotIds: ["bot-002", "bot-008", "bot-014", "bot-023", "bot-031"],
    switchIds: ["switch-signal-lens", "switch-session-handoff"],
    openSlots: 2,
    visibility: "Public",
    summary: "High-liquidity scout squad for session opener mapping."
  },
  {
    id: "squad-iron-citadel",
    name: "Iron Citadel",
    archetype: "Drawdown Defense",
    missionPreset: "Defense",
    rankRequirement: "Gold",
    growthRequirement: 4,
    memberBotIds: ["bot-003", "bot-006", "bot-018", "bot-030", "bot-045"],
    switchIds: ["switch-risk-sentry", "switch-drawdown-firewall"],
    openSlots: 1,
    visibility: "Private",
    summary: "Capital shield squad for uncertain volatility phases."
  },
  {
    id: "squad-neon-rush",
    name: "Neon Rush",
    archetype: "Momentum Strike",
    missionPreset: "Attack",
    rankRequirement: "Platinum",
    growthRequirement: 5,
    memberBotIds: ["bot-010", "bot-017", "bot-033", "bot-040", "bot-049"],
    switchIds: ["switch-momentum-rush", "switch-killzone-sync"],
    openSlots: 1,
    visibility: "Public",
    summary: "Pressure squad for controlled trend expansion attacks."
  },
  {
    id: "squad-cinder-grid",
    name: "Cinder Grid",
    archetype: "Builder Matrix",
    missionPreset: "Builder",
    rankRequirement: "Gold",
    growthRequirement: 5,
    memberBotIds: ["bot-004", "bot-011", "bot-019", "bot-026", "bot-037"],
    switchIds: ["switch-grid-rebalance", "switch-compound-engine"],
    openSlots: 0,
    visibility: "Private",
    summary: "Slow-build squad for resilient compounding cycles."
  },
  {
    id: "squad-obsidian-ward",
    name: "Obsidian Ward",
    archetype: "Order Block Hold",
    missionPreset: "Order Block Only",
    rankRequirement: "Diamond",
    growthRequirement: 7,
    memberBotIds: ["bot-013", "bot-015", "bot-020", "bot-041", "bot-047"],
    switchIds: ["switch-order-block-filter", "switch-risk-sentry"],
    openSlots: 2,
    visibility: "Public",
    summary: "Structure-bound squad for disciplined block reactions."
  },
  {
    id: "squad-helix-gamma",
    name: "Helix Gamma",
    archetype: "Scalper Cover",
    missionPreset: "Scalper Assist",
    rankRequirement: "Diamond",
    growthRequirement: 8,
    memberBotIds: ["bot-042", "bot-044", "bot-046", "bot-050", "bot-053"],
    switchIds: ["switch-spread-guard", "switch-micro-timing"],
    openSlots: 1,
    visibility: "Public",
    summary: "Micro-session speed squad with spread discipline."
  },
  {
    id: "squad-horizon-hold",
    name: "Horizon Hold",
    archetype: "Swing Command",
    missionPreset: "Swing Hold",
    rankRequirement: "Platinum",
    growthRequirement: 6,
    memberBotIds: ["bot-022", "bot-027", "bot-034", "bot-036", "bot-052"],
    switchIds: ["switch-swing-buffer", "switch-profit-lock"],
    openSlots: 0,
    visibility: "Private",
    summary: "Higher timeframe hold squad with controlled buffering."
  },
  {
    id: "squad-revival-kappa",
    name: "Revival Kappa",
    archetype: "Recovery Line",
    missionPreset: "Recovery",
    rankRequirement: "Platinum",
    growthRequirement: 7,
    memberBotIds: ["bot-005", "bot-012", "bot-025", "bot-029", "bot-038"],
    switchIds: ["switch-recovery-clutch", "switch-drawdown-firewall"],
    openSlots: 2,
    visibility: "Public",
    summary: "Measured recovery squad for post-loss stabilization."
  }
];

export const MY_SQUAD_IDS = ["squad-iron-citadel", "squad-cinder-grid", "squad-horizon-hold"];

export const GROWTH_ACCOUNT = {
  accountId: "LV-1148-OPS",
  currentRank: "Commander",
  growthLevel: 6,
  accountGrowthPercent: 38.4,
  protectedCapitalPercent: 81.2,
  streakDays: 17,
  missionCredits: 540,
  rewardPoints: 14250,
  subscriptionPlan: "Elite",
  paidPacks: ["Rush Pack", "Structure Pack"],
  ownedSwitchIds: MY_SWITCH_IDS.slice()
};

export const GROWTH_UNLOCK_LADDER = [
  { level: 1, xpRequired: 0, unlocks: ["Bot Arena base access", "Scout preset"] },
  { level: 2, xpRequired: 250, unlocks: ["Trend Guardian", "Squad Explorer"] },
  { level: 3, xpRequired: 700, unlocks: ["Profit Shield (+10% growth concept)", "Builder preset"] },
  { level: 4, xpRequired: 1200, unlocks: ["Drawdown Brake", "Defense preset"] },
  { level: 5, xpRequired: 1800, unlocks: ["Campaign Extension", "Attack preset"] },
  { level: 6, xpRequired: 2600, unlocks: ["Ladder Authority (+25% growth concept)", "Growth Chamber rewards tier 2"] },
  { level: 7, xpRequired: 3500, unlocks: ["Structure Exit Logic", "Recovery preset"] },
  { level: 8, xpRequired: 4700, unlocks: ["Switch Lab active lane", "Scalper Assist preset"] },
  { level: 9, xpRequired: 6100, unlocks: ["Order Block Only preset", "Squad Builder advanced lane"] },
  { level: 10, xpRequired: 7700, unlocks: ["Adaptive Mission (+50% growth concept)", "Mission slots +2"] },
  { level: 11, xpRequired: 9500, unlocks: ["Apex candidate ladder", "VPS Forge high-speed profile"] },
  { level: 12, xpRequired: 11500, unlocks: ["Mission Control elite rewards", "Family mastery badge"] }
];

export const RISK_GUARDRAILS = {
  maxDrawdownPercent: 65,
  maxDailyLossPercent: 65,
  cautionAtDailyLossLimitPercent: 65,
  onCautionState: [
    "Switch state to Caution",
    "Downgrade scalping to monitor-only",
    "Log threshold event in risk dashboard"
  ],
  onDailyLossBreach: [
    "No new automated entries",
    "Existing positions set to monitor / managed exit only",
    "Disable ladder and add permissions",
    "Log breach event in risk dashboard"
  ],
  onDrawdownBreach: [
    "Pause all automated bots and squads",
    "Require manual acknowledgment before restart",
    "Log breach event in risk dashboard and docs"
  ]
};

export const RANK_PATH = [
  { rank: "Initiate", minGrowthLevel: 1, minGrowthPercent: 0, reward: "Base social access" },
  { rank: "Scout", minGrowthLevel: 2, minGrowthPercent: 5, reward: "First switch lane" },
  { rank: "Runner", minGrowthLevel: 3, minGrowthPercent: 10, reward: "Profit Shield unlock concept" },
  { rank: "Sniper", minGrowthLevel: 4, minGrowthPercent: 15, reward: "Precision entry controls" },
  { rank: "Captain", minGrowthLevel: 5, minGrowthPercent: 20, reward: "Advanced squad slots" },
  { rank: "Commander", minGrowthLevel: 6, minGrowthPercent: 25, reward: "Multi-pair and terminal controls" },
  { rank: "Elite", minGrowthLevel: 7, minGrowthPercent: 35, reward: "Premium rooms and advanced protections" },
  { rank: "Covenant", minGrowthLevel: 8, minGrowthPercent: 45, reward: "Provider mission access" },
  { rank: "Architect", minGrowthLevel: 10, minGrowthPercent: 60, reward: "War Room elite panels" },
  { rank: "Apex", minGrowthLevel: 12, minGrowthPercent: 80, reward: "Top-tier mission privileges" }
];

export const GROWTH_MILESTONES = [
  {
    id: "milestone-first-10",
    label: "First 10% Growth",
    progress: 100,
    reward: "500 mission credits + Builder badge"
  },
  {
    id: "milestone-25-streak",
    label: "25 Trade Discipline Streak",
    progress: 72,
    reward: "Switch token x1"
  },
  {
    id: "milestone-30-growth",
    label: "30% Protected Growth",
    progress: 100,
    reward: "Recovery Clutch discount"
  },
  {
    id: "milestone-50-growth",
    label: "50% Growth Horizon",
    progress: 61,
    reward: "Legend ladder fast-track token"
  }
];

export const REWARD_CATALOG = [
  { id: "reward-credits-boost", name: "Mission Credits Boost", cost: 900, type: "growth" },
  { id: "reward-switch-token", name: "Switch Unlock Token", cost: 1600, type: "switch" },
  { id: "reward-bot-skin", name: "Family Signature Skin", cost: 1200, type: "cosmetic" },
  { id: "reward-vps-priority", name: "VPS Priority Queue", cost: 2400, type: "operations" },
  { id: "reward-squad-slot", name: "Extra Squad Slot", cost: 3100, type: "squad" }
];

export function getBotsByFamily() {
  return BOT_FAMILIES.map((family) => ({
    ...family,
    bots: BOT_REGISTRY.filter((bot) => bot.familyId === family.id)
  }));
}

export function getMyBots() {
  const owned = new Set(MY_BOT_IDS);
  return BOT_REGISTRY.filter((bot) => owned.has(bot.id));
}

export function getCompatibleSwitches(botId) {
  const bot = BOT_REGISTRY.find((entry) => entry.id === botId);
  if (!bot) return [];
  const wanted = new Set(bot.compatibilitySwitchIds);
  return SWITCH_REGISTRY.filter((item) => wanted.has(item.id));
}

export function getSwitchById(switchId) {
  return SWITCH_REGISTRY.find((item) => item.id === switchId) || null;
}

function accountRankAllows(requiredRank, rank) {
  return rankIndex(rank) >= rankIndex(requiredRank);
}

function subscriptionAllows(requiredPlan, plan) {
  const have = SUBSCRIPTION_ORDER.indexOf(plan);
  const need = SUBSCRIPTION_ORDER.indexOf(requiredPlan);
  if (have < 0 || need < 0) return false;
  return have >= need;
}

export function evaluateSwitchUnlock(switchId, account) {
  const switchItem = getSwitchById(switchId);
  if (!switchItem) {
    return { unlocked: false, reason: "Switch not found", gate: "unknown" };
  }

  const gate = switchItem.unlock.type;
  const profile = account || GROWTH_ACCOUNT;

  if (gate === "paid") {
    const unlocked = Boolean(profile.paidPacks?.includes(switchItem.unlock.pack));
    return {
      unlocked,
      gate,
      reason: unlocked ? "Paid pack active." : `Requires ${switchItem.unlock.pack} ($${switchItem.unlock.priceUsd}).`
    };
  }

  if (gate === "rank") {
    const unlocked = accountRankAllows(switchItem.unlock.minimumRank, profile.currentRank);
    return {
      unlocked,
      gate,
      reason: unlocked
        ? `Rank gate met (${profile.currentRank}).`
        : `Requires rank ${switchItem.unlock.minimumRank}.`
    };
  }

  if (gate === "growth") {
    const unlocked = profile.growthLevel >= switchItem.unlock.minimumGrowthLevel;
    return {
      unlocked,
      gate,
      reason: unlocked
        ? `Growth gate met (level ${profile.growthLevel}).`
        : `Requires growth level ${switchItem.unlock.minimumGrowthLevel}.`
    };
  }

  if (gate === "subscription") {
    const unlocked = subscriptionAllows(switchItem.unlock.minimumSubscription, profile.subscriptionPlan);
    return {
      unlocked,
      gate,
      reason: unlocked
        ? `Subscription gate met (${profile.subscriptionPlan}).`
        : `Requires ${switchItem.unlock.minimumSubscription} subscription.`
    };
  }

  return { unlocked: false, gate: "unknown", reason: "Unsupported gate type." };
}

export function getSwitchUnlockMatrix(account) {
  return SWITCH_REGISTRY.map((item) => ({
    ...item,
    unlockState: evaluateSwitchUnlock(item.id, account)
  }));
}

export function getMissionPresetByName(name) {
  return MISSION_PRESETS.find((mission) => mission.name === name) || null;
}

export function getRemoteProfileById(profileId) {
  return REMOTE_CONTROL_PROFILES.find((profile) => profile.id === profileId) || null;
}

export function getSquadsByVisibility(visibility) {
  return SQUAD_REGISTRY.filter((squad) => squad.visibility.toLowerCase() === String(visibility || "").toLowerCase());
}

export function getMySquads() {
  const mine = new Set(MY_SQUAD_IDS);
  return SQUAD_REGISTRY.filter((squad) => mine.has(squad.id));
}

export function getGrowthProgress() {
  const current = GROWTH_ACCOUNT.growthLevel;
  const currentNode = GROWTH_UNLOCK_LADDER.find((node) => node.level === current) || GROWTH_UNLOCK_LADDER[0];
  const nextNode =
    GROWTH_UNLOCK_LADDER.find((node) => node.level === current + 1) ||
    GROWTH_UNLOCK_LADDER[GROWTH_UNLOCK_LADDER.length - 1];
  const progressPercent = Math.round((current / GROWTH_UNLOCK_LADDER.length) * 100);
  return { currentNode, nextNode, progressPercent };
}

export function getBotControlMockData() {
  return {
    bots: BOT_REGISTRY,
    families: BOT_FAMILIES,
    missions: MISSION_PRESETS,
    switches: SWITCH_REGISTRY,
    squads: SQUAD_REGISTRY,
    growthAccount: GROWTH_ACCOUNT,
    growthLadder: GROWTH_UNLOCK_LADDER,
    rankPath: RANK_PATH,
    milestones: GROWTH_MILESTONES,
    rewards: REWARD_CATALOG,
    remoteProfiles: REMOTE_CONTROL_PROFILES,
    myBotIds: MY_BOT_IDS,
    mySwitchIds: MY_SWITCH_IDS,
    mySquadIds: MY_SQUAD_IDS,
    activeSwitchIds: ACTIVE_SWITCH_IDS
  };
}

export const BOT_CONTROL_MOCK_VERSION = "2026.03.22";





