const defaultConfig = {
  app: {
    name: "CEM CULTURE",
    appUrl: "",
    siteUrl: "",
    apiUrl: "",
    tagline: "Trade the culture. Link the squad. Rank up."
  },
  hero: {
    mode: "command",
    primary: "Bot Arena",
    secondary: "Switch Lab",
    tertiary: "VPS Forge",
    support: ["Link Vault", "Culture Feed", "Growth Chamber"]
  },
  roleDefaults: {
    defaultSignupRole: "user",
    allowSelfProviderSignup: false,
    allowSelfOperatorSignup: false,
    requireAdminProviderApproval: true,
    requireAdminOperatorApproval: true
  },
  featureFlags: {
    socialFeed: true,
    linkVault: true,
    botArena: true,
    switchLab: true,
    vpsForge: true,
    growthChamber: true,
    providerTools: true,
    adminTools: true
  },
  labels: {
    simulationEnabled: true,
    userSuppliedEnabled: true,
    simulation: "Simulation",
    userSupplied: "User-Supplied",
    placeholderIntegration: "Placeholder Integration"
  },
  riskGuardrails: {
    maxDrawdownPercent: 65,
    maxDailyLossPercent: 65,
    dailyLossCautionPercent: 42.25,
    disableNewEntriesAtDailyLimit: true,
    pauseAutomationOnDrawdownBreach: true,
    disableLadderOnDailyLimit: true,
    downgradeScalpingToMonitorOnCaution: true
  },
  tiers: {
    cadet: { name: "Cadet", price: 0 },
    operator: { name: "Operator", price: 150 },
    squadron: { name: "Squadron", price: 500 },
    command: { name: "Command", price: 0 }
  }
};

function merge(base, incoming) {
  if (!incoming || typeof incoming !== "object") return base;
  const out = { ...base };
  for (const [k, v] of Object.entries(incoming)) {
    if (v && typeof v === "object" && !Array.isArray(v) && base[k] && typeof base[k] === "object") {
      out[k] = merge(base[k], v);
    } else {
      out[k] = v;
    }
  }
  return out;
}

export async function loadPublicConfig() {
  try {
    const response = await fetch("/api/public-config", { headers: { Accept: "application/json" } });
    if (!response.ok) return { ...defaultConfig };
    const payload = await response.json();
    return merge(defaultConfig, payload);
  } catch {
    return { ...defaultConfig };
  }
}

export function getPublicConfig() {
  const value = globalThis.__CEM_PUBLIC_CONFIG;
  if (!value || typeof value !== "object") return { ...defaultConfig };
  return merge(defaultConfig, value);
}
