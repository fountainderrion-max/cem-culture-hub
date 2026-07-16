const clean = (value) => String(value || "").trim().toUpperCase().replace(/\s+/g, "");

export const SYMBOL_FAMILIES = Object.freeze({
  SP500: {
    label: "S&P 500",
    group: "INDICES",
    patterns: [/^SPX(USD|500)?/, /^US500/, /^SP500/, /^USA500/, /^S&P500/]
  },
  NASDAQ: {
    label: "NASDAQ",
    group: "INDICES",
    patterns: [/^NAS(USD|100)?/, /^USTEC/, /^US100/, /^NASDAQ/, /^NDX/]
  },
  DOW: {
    label: "Dow Jones",
    group: "INDICES",
    patterns: [/^US30/, /^DJI/, /^DJ30/, /^DOW/]
  },
  DAX: {
    label: "DAX",
    group: "INDICES",
    patterns: [/^GER40/, /^DE40/, /^DAX/]
  },
  GOLD: {
    label: "Gold",
    group: "METALS",
    patterns: [/^XAUUSD/, /^GOLD/]
  },
  SILVER: {
    label: "Silver",
    group: "METALS",
    patterns: [/^XAGUSD/, /^SILVER/]
  },
  OIL_WTI: {
    label: "WTI Oil",
    group: "ENERGY",
    patterns: [/^USOIL/, /^WTI/, /^XTIUSD/, /^OILUSD/]
  },
  OIL_BRENT: {
    label: "Brent Oil",
    group: "ENERGY",
    patterns: [/^UKOIL/, /^BRENT/, /^XBRUSD/]
  },
  BTC: {
    label: "Bitcoin",
    group: "CRYPTO",
    patterns: [/^BTCUSD/, /^BITCOIN/]
  },
  ETH: {
    label: "Ethereum",
    group: "CRYPTO",
    patterns: [/^ETHUSD/, /^ETHEREUM/]
  }
});

const stripBrokerDecoration = (symbol) => clean(symbol)
  .replace(/^[#.]+/, "")
  .replace(/[._-](CASH|PRO|RAW|ECN|STD|M|I|R|A|B|C|MINI|MICRO)$/i, "")
  .replace(/(CASH|PRO|RAW|ECN)$/i, "");

export function identifySymbolFamily(symbol) {
  const normalized = stripBrokerDecoration(symbol);
  for (const [id, family] of Object.entries(SYMBOL_FAMILIES)) {
    if (family.patterns.some((pattern) => pattern.test(normalized))) {
      return { id, label: family.label, group: family.group, normalized };
    }
  }
  if (/^[A-Z]{6}$/.test(normalized)) {
    return { id: normalized, label: `${normalized.slice(0, 3)}/${normalized.slice(3)}`, group: "FOREX", normalized };
  }
  return { id: normalized || "UNKNOWN", label: normalized || "Unknown", group: "UNKNOWN", normalized };
}

export function buildFamilyInventory(symbols = []) {
  const families = new Map();
  for (const brokerSymbol of symbols) {
    const family = identifySymbolFamily(brokerSymbol);
    const current = families.get(family.id) || { ...family, brokerSymbols: [] };
    if (!current.brokerSymbols.includes(clean(brokerSymbol))) current.brokerSymbols.push(clean(brokerSymbol));
    families.set(family.id, current);
  }
  return [...families.values()].sort((a, b) => a.label.localeCompare(b.label));
}

export function routeByFamily({ leaderSymbol, followerSymbols = [], blockedFamilies = [], allowedFamilies = [], mode = "COPY_ALL_EXCEPT_BLOCKED" }) {
  const leaderFamily = identifySymbolFamily(leaderSymbol);
  const blocked = new Set(blockedFamilies.map(clean));
  const allowed = new Set(allowedFamilies.map(clean));

  if (blocked.has(leaderFamily.id)) {
    return { status: "BLOCKED", family: leaderFamily, reason: `${leaderFamily.label} is blocked for this lane/account` };
  }
  if (mode === "SELECTED_FAMILIES_ONLY" && !allowed.has(leaderFamily.id)) {
    return { status: "BLOCKED", family: leaderFamily, reason: `${leaderFamily.label} is not in the selected family list` };
  }

  const matches = followerSymbols
    .map((brokerSymbol) => ({ brokerSymbol: clean(brokerSymbol), family: identifySymbolFamily(brokerSymbol) }))
    .filter((item) => item.family.id === leaderFamily.id);

  if (matches.length === 0) {
    return { status: mode === "ASK_UNKNOWN" ? "REQUIRES_APPROVAL" : "SKIPPED", family: leaderFamily, reason: "No compatible broker symbol discovered" };
  }

  const leaderNormalized = stripBrokerDecoration(leaderSymbol);
  const exact = matches.find((item) => stripBrokerDecoration(item.brokerSymbol) === leaderNormalized);
  return {
    status: "ROUTED",
    family: leaderFamily,
    brokerSymbol: (exact || matches[0]).brokerSymbol,
    matchedBy: exact ? "NORMALIZED_EXACT" : "SYMBOL_FAMILY"
  };
}
