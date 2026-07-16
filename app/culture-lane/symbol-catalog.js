export const CANONICAL_SYMBOLS = Object.freeze({
  EURUSD: { group: "FOREX", aliases: ["EURUSD", "EURUSD.M", "EURUSDm", "EURUSD.pro", "EURUSD.raw"] },
  EURJPY: { group: "FOREX", aliases: ["EURJPY", "EURJPY.M", "EURJPYm", "EURJPY.pro", "EURJPY.raw"] },
  GBPUSD: { group: "FOREX", aliases: ["GBPUSD", "GBPUSD.M", "GBPUSDm", "GBPUSD.pro", "GBPUSD.raw"] },
  XAUUSD: { group: "METALS", aliases: ["XAUUSD", "GOLD", "XAUUSD.cash", "XAUUSDm", "GOLD.pro"] },
  XAGUSD: { group: "METALS", aliases: ["XAGUSD", "SILVER", "XAGUSD.cash", "XAGUSDm"] },
  NASUSD: { group: "INDICES", aliases: ["NASUSD", "NAS100", "USTEC", "US100", "NASDAQ", "NAS100.cash", "USTEC.cash"] },
  SPXUSD: { group: "INDICES", aliases: ["SPXUSD", "SPX500", "US500", "SP500", "US500.cash", "SPX500.i"] },
  US30: { group: "INDICES", aliases: ["US30", "DJ30", "WS30", "DOW", "US30.cash"] },
  USOUSD: { group: "ENERGY", aliases: ["USOUSD", "USOIL", "WTI", "WTICOUSD", "USOIL.cash", "XTIUSD"] },
  UKOUSD: { group: "ENERGY", aliases: ["UKOUSD", "UKOIL", "BRENT", "XBRUSD"] },
  BTCUSD: { group: "CRYPTO", aliases: ["BTCUSD", "BTCUSDm", "BTCUSD.pro", "BITCOIN"] }
});

const normalize = (value) => String(value || "").trim().toUpperCase();
const compact = (value) => normalize(value).replace(/[^A-Z0-9]/g, "").replace(/(CASH|PRO|RAW|ECN|MINI|MICRO|M|I)$/i, "");

export function discoverCanonicalSymbol(brokerSymbol) {
  const raw = normalize(brokerSymbol);
  const reduced = compact(raw);
  for (const [canonical, meta] of Object.entries(CANONICAL_SYMBOLS)) {
    if (meta.aliases.some((alias) => normalize(alias) === raw || compact(alias) === reduced)) {
      return { canonical, brokerSymbol: raw, group: meta.group, confidence: normalize(canonical) === raw ? 1 : 0.9 };
    }
  }
  return { canonical: raw, brokerSymbol: raw, group: "OTHER", confidence: 0.5 };
}

export function buildBrokerInventory(symbols = []) {
  return symbols.map(discoverCanonicalSymbol).reduce((inventory, item) => {
    inventory[item.canonical] ||= { canonical: item.canonical, group: item.group, brokerSymbols: [] };
    if (!inventory[item.canonical].brokerSymbols.includes(item.brokerSymbol)) inventory[item.canonical].brokerSymbols.push(item.brokerSymbol);
    return inventory;
  }, {});
}

export function buildAliasMapFromInventories(inventories = []) {
  const aliases = {};
  for (const inventory of inventories) {
    for (const [canonical, item] of Object.entries(inventory || {})) {
      aliases[canonical] ||= [];
      for (const brokerSymbol of item.brokerSymbols || []) {
        if (!aliases[canonical].includes(brokerSymbol)) aliases[canonical].push(brokerSymbol);
      }
    }
  }
  return aliases;
}
