const PROFILE_KEY = "cemculture.identityProfile.v1";

export const EXPERIENCE_RANKS = Object.freeze([
  "Awakened",
  "Builder",
  "Architect",
  "Mentor",
  "Master",
  "Legend",
  "Legacy"
]);

export const ACCESS_LEVELS = Object.freeze([
  {
    id: "core",
    label: "Core Access",
    price: 0,
    productUnlocks: ["Wisdo Core", "Focus Mode", "Mission Mode"]
  },
  {
    id: "builder",
    label: "Builder Access",
    price: 49,
    productUnlocks: ["Teach Mode", "Build Mode", "Advanced Presence"]
  },
  {
    id: "architect",
    label: "Architect Access",
    price: 149,
    productUnlocks: ["Culture Band Eligibility", "Harvest Mode Pro", "Lane Intelligence"]
  },
  {
    id: "legend",
    label: "Legend Access",
    price: 399,
    productUnlocks: ["Culture Dock Eligibility", "Holographic Mode Eligibility", "Legacy Tools"]
  }
]);

const DEFAULT_PROFILE = Object.freeze({
  cultureId: "HIGHTOWER",
  permanentNumber: "000001",
  experienceRank: "Builder",
  accessLevel: "core",
  accessSource: "earned",
  updatedAt: null
});

function normalizeCultureId(value) {
  return String(value || "")
    .trim()
    .replace(/^@+/, "")
    .replace(/[^a-zA-Z0-9_]/g, "")
    .slice(0, 20)
    .toUpperCase();
}

export function readCultureIdentity() {
  try {
    const stored = JSON.parse(window.localStorage.getItem(PROFILE_KEY) || "null");
    if (!stored || typeof stored !== "object") return { ...DEFAULT_PROFILE };
    return {
      ...DEFAULT_PROFILE,
      ...stored,
      cultureId: normalizeCultureId(stored.cultureId) || DEFAULT_PROFILE.cultureId
    };
  } catch {
    return { ...DEFAULT_PROFILE };
  }
}

export function updateCultureId(nextId) {
  const cultureId = normalizeCultureId(nextId);
  if (cultureId.length < 3) {
    return { ok: false, message: "Culture ID must contain at least 3 letters or numbers." };
  }

  const profile = {
    ...readCultureIdentity(),
    cultureId,
    updatedAt: new Date().toISOString()
  };
  window.localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  return { ok: true, profile };
}

export function purchaseAccessLevel(levelId) {
  const level = ACCESS_LEVELS.find((item) => item.id === levelId);
  if (!level) return { ok: false, message: "Unknown access level." };

  const profile = {
    ...readCultureIdentity(),
    accessLevel: level.id,
    accessSource: level.price > 0 ? "purchased" : "earned",
    updatedAt: new Date().toISOString()
  };
  window.localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  return { ok: true, profile, level };
}

export function getCurrentAccessLevel(profile = readCultureIdentity()) {
  return ACCESS_LEVELS.find((item) => item.id === profile.accessLevel) || ACCESS_LEVELS[0];
}

export function canAccessProduct(productName, profile = readCultureIdentity()) {
  const currentIndex = ACCESS_LEVELS.findIndex((item) => item.id === profile.accessLevel);
  return ACCESS_LEVELS.slice(0, Math.max(0, currentIndex) + 1).some((item) => item.productUnlocks.includes(productName));
}
