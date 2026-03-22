/**
 * Shared frontend model contracts for CEM CULTURE shell scaffolding.
 * These JSDoc typedefs are designed for reuse across domains while backend services are pending.
 */

/**
 * @typedef {"visitor" | "user" | "provider" | "operator" | "admin"} UserRole
 * @typedef {"active" | "paused" | "disabled" | "pending" | "archived"} EntityStatus
 * @typedef {"MT4" | "MT5"} TradingPlatform
 * @typedef {"bronze" | "silver" | "gold" | "platinum" | "diamond"} Tier
 */

/**
 * @typedef UserModel
 * @property {string} id
 * @property {string} handle
 * @property {string} email
 * @property {UserRole} role
 * @property {EntityStatus} status
 * @property {string} rankId
 * @property {ReadonlyArray<string>} badgeIds
 * @property {ReadonlyArray<string>} squadIds
 * @property {number} xp
 * @property {string} joinedAt
 * @property {string=} avatarUrl
 */

/**
 * @typedef BotModel
 * @property {string} id
 * @property {string} name
 * @property {string} family
 * @property {string} ownerId
 * @property {EntityStatus} status
 * @property {number} riskScore
 * @property {ReadonlyArray<string>} compatibleSwitchIds
 * @property {ReadonlyArray<TradingPlatform>} supportedPlatforms
 * @property {boolean} simulated
 * @property {string} updatedAt
 */

/**
 * @typedef SquadModel
 * @property {string} id
 * @property {string} name
 * @property {string} captainId
 * @property {ReadonlyArray<string>} memberIds
 * @property {ReadonlyArray<string>} botIds
 * @property {EntityStatus} status
 * @property {string} createdAt
 * @property {string=} summary
 */

/**
 * @typedef SwitchModel
 * @property {string} id
 * @property {string} name
 * @property {Tier} tier
 * @property {EntityStatus} status
 * @property {number} unlockLevel
 * @property {ReadonlyArray<string>} unlockDependencies
 * @property {ReadonlyArray<string>} compatibleBotIds
 * @property {boolean} simulated
 * @property {string} updatedAt
 */

/**
 * @typedef AccountModel
 * @property {string} id
 * @property {string} userId
 * @property {TradingPlatform} platform
 * @property {string} brokerLabel
 * @property {string} accountMask
 * @property {EntityStatus} status
 * @property {number} balance
 * @property {number} equity
 * @property {number} drawdownPercent
 * @property {boolean} simulated
 * @property {string} lastSyncAt
 */

/**
 * @typedef VpsModel
 * @property {string} id
 * @property {string} userId
 * @property {string} plan
 * @property {string} region
 * @property {EntityStatus} status
 * @property {number} cpuPercent
 * @property {number} memoryPercent
 * @property {number} uptimePercent
 * @property {boolean} simulated
 * @property {string} lastHeartbeatAt
 */

/**
 * @typedef PostModel
 * @property {string} id
 * @property {string} authorId
 * @property {string} body
 * @property {"public" | "squad" | "private"} visibility
 * @property {number} likeCount
 * @property {number} commentCount
 * @property {boolean} pinned
 * @property {boolean} simulated
 * @property {string} createdAt
 */

/**
 * @typedef BadgeModel
 * @property {string} id
 * @property {string} name
 * @property {Tier} tier
 * @property {string} description
 * @property {string} icon
 * @property {string} unlockedAt
 */

/**
 * @typedef RankModel
 * @property {string} id
 * @property {string} name
 * @property {number} level
 * @property {number} requiredXp
 * @property {ReadonlyArray<string>} rewards
 * @property {string} accent
 */

/**
 * @typedef UnlockModel
 * @property {string} id
 * @property {string} key
 * @property {string} name
 * @property {"bot" | "switch" | "squad" | "vps" | "feature"} domain
 * @property {EntityStatus} status
 * @property {string=} requiredRankId
 * @property {ReadonlyArray<string>} requiredBadgeIds
 * @property {ReadonlyArray<string>} requiredUnlockIds
 * @property {string} description
 */

/**
 * @typedef ModelStore
 * @property {Array<UserModel>} users
 * @property {Array<BotModel>} bots
 * @property {Array<SquadModel>} squads
 * @property {Array<SwitchModel>} switches
 * @property {Array<AccountModel>} accounts
 * @property {Array<VpsModel>} vps
 * @property {Array<PostModel>} posts
 * @property {Array<BadgeModel>} badges
 * @property {Array<RankModel>} ranks
 * @property {Array<UnlockModel>} unlocks
 */

/**
 * Canonical collection names for route-domain interoperability.
 * @type {ReadonlyArray<keyof ModelStore>}
 */
export const MODEL_COLLECTION_KEYS = Object.freeze([
  "users",
  "bots",
  "squads",
  "switches",
  "accounts",
  "vps",
  "posts",
  "badges",
  "ranks",
  "unlocks"
]);

/**
 * TODO: replace scaffolding-only model store with API-backed data adapters.
 * @returns {ModelStore}
 */
export function createEmptyModelStore() {
  return {
    users: [],
    bots: [],
    squads: [],
    switches: [],
    accounts: [],
    vps: [],
    posts: [],
    badges: [],
    ranks: [],
    unlocks: []
  };
}

/**
 * Integration readiness notes used by placeholder routes.
 * @type {Readonly<Record<keyof ModelStore, string>>}
 */
export const MODEL_INTEGRATION_TODOS = Object.freeze({
  users: "TODO: backend member directory and RBAC claims service pending.",
  bots: "TODO: backend bot registry and release pipeline pending.",
  squads: "TODO: backend squad orchestration and membership service pending.",
  switches: "TODO: backend switch economy and unlock service pending.",
  accounts: "TODO: backend MT4/MT5 link verification and telemetry sync pending.",
  vps: "TODO: backend VPS provisioning and heartbeat monitoring pending.",
  posts: "TODO: backend social posting and moderation queue pending.",
  badges: "TODO: backend progression badge award engine pending.",
  ranks: "TODO: backend rank calculation and promotion events pending.",
  unlocks: "TODO: backend entitlement and unlock dependency graph pending."
});

