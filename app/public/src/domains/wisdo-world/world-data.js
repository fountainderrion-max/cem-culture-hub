export const ACCESS_TIERS = Object.freeze({
  MEMBER: 0,
  SOVEREIGN: 1,
  ELITE: 2,
  COMMANDER: 3
});

export const ACCESS_TIER_LABELS = Object.freeze([
  "Member",
  "Sovereign",
  "Elite",
  "Commander"
]);

export const WORLD_DESTINATIONS = Object.freeze([
  {
    id: "trading-tower",
    name: "Trading Tower",
    short: "TRADE",
    icon: "↗",
    zone: "north",
    x: 50,
    y: 12,
    tier: ACCESS_TIERS.MEMBER,
    route: "/app/link-vault/analytics",
    eyebrow: "Live account command",
    description: "Enter the account operations floor for Link Vault analytics, account health, copier controls, and trading context.",
    features: ["Link Vault", "Account analytics", "Copier profiles", "Risk protections"]
  },
  {
    id: "academy",
    name: "WISDO Academy",
    short: "LEARN",
    icon: "▤",
    zone: "north-west",
    x: 19,
    y: 21,
    tier: ACCESS_TIERS.MEMBER,
    route: "/app/challenges",
    eyebrow: "Learn • practice • certify",
    description: "The progression wing for education, practice missions, challenges, certifications, and skill-based unlocks.",
    features: ["Learning paths", "Practice missions", "Challenges", "Certification roadmap"]
  },
  {
    id: "vault",
    name: "The Vault",
    short: "OWN",
    icon: "◇",
    zone: "west",
    x: 12,
    y: 46,
    tier: ACCESS_TIERS.SOVEREIGN,
    route: "/app/bot-arena/my-bots",
    eyebrow: "Owned systems & licenses",
    description: "Your protected inventory of bots, presets, licenses, releases, and premium tools.",
    features: ["My Bots", "Presets", "Licenses", "Release access"]
  },
  {
    id: "bot-arena",
    name: "Bot Arena",
    short: "BUILD",
    icon: "⬡",
    zone: "south-west",
    x: 22,
    y: 73,
    tier: ACCESS_TIERS.MEMBER,
    route: "/app/bot-arena/all-bots",
    eyebrow: "Bot families & loadouts",
    description: "Explore bot families, inspect behavior profiles, assemble loadouts, and connect compatible switches.",
    features: ["Bot catalog", "Families", "Loadouts", "Compatibility"]
  },
  {
    id: "switch-lab",
    name: "Switch Lab",
    short: "TUNE",
    icon: "⌁",
    zone: "south",
    x: 42,
    y: 82,
    tier: ACCESS_TIERS.SOVEREIGN,
    route: "/app/switch-lab/explore",
    eyebrow: "Capability unlock laboratory",
    description: "Discover, own, activate, and progress through capability switches without exposing raw technical inputs.",
    features: ["Switch catalog", "My Switches", "Active switches", "Unlock path"]
  },
  {
    id: "growth-chamber",
    name: "Growth Chamber",
    short: "GROW",
    icon: "△",
    zone: "south-east",
    x: 62,
    y: 80,
    tier: ACCESS_TIERS.MEMBER,
    route: "/app/growth-chamber/account-growth",
    eyebrow: "Progression & account growth",
    description: "Track growth, rank path, milestones, rewards, and progression-linked goals.",
    features: ["Growth curves", "Unlock ladder", "Rank path", "Rewards"]
  },
  {
    id: "strategy-lab",
    name: "Strategy Lab",
    short: "ANALYZE",
    icon: "⌬",
    zone: "east",
    x: 84,
    y: 50,
    tier: ACCESS_TIERS.ELITE,
    route: "/app/growth-chamber/milestones",
    eyebrow: "Research & optimization",
    description: "A dedicated research room for campaign autopsy, backtest review, heat maps, optimization workflows, and strategy experiments.",
    features: ["Campaign autopsy", "Backtest review", "Heat maps", "Optimization workspace"]
  },
  {
    id: "coach-center",
    name: "Coach Center",
    short: "COACH",
    icon: "◉",
    zone: "north-east",
    x: 77,
    y: 25,
    tier: ACCESS_TIERS.MEMBER,
    route: "/app/feed",
    eyebrow: "WISDO intelligence layer",
    description: "The home for Coach: account context, guided actions, education, and eventually voice-first command workflows.",
    features: ["Guided account context", "Action suggestions", "Education", "Voice roadmap"]
  },
  {
    id: "culture-arena",
    name: "Culture Arena",
    short: "BELONG",
    icon: "◎",
    zone: "east-north",
    x: 91,
    y: 25,
    tier: ACCESS_TIERS.MEMBER,
    route: "/app/leaderboard",
    eyebrow: "Community & competition",
    description: "Community events, reputation, challenge campaigns, leaderboards, and social progression converge here.",
    features: ["Leaderboard", "Challenges", "Community", "Events roadmap"]
  },
  {
    id: "marketplace",
    name: "Marketplace",
    short: "UNLOCK",
    icon: "▣",
    zone: "west-south",
    x: 8,
    y: 72,
    tier: ACCESS_TIERS.MEMBER,
    route: "/pricing",
    eyebrow: "Plans, tools & access",
    description: "The commerce gateway for plans, products, access tiers, bot availability, and entitlement-driven unlocks.",
    features: ["Plans", "Access tiers", "Product discovery", "Entitlement roadmap"]
  },
  {
    id: "vps-forge",
    name: "VPS Forge",
    short: "RUN",
    icon: "▦",
    zone: "south-far",
    x: 82,
    y: 76,
    tier: ACCESS_TIERS.SOVEREIGN,
    route: "/app/vps-forge/servers",
    eyebrow: "Runtime operations",
    description: "Manage server plans, runtime health, terminal operations, deployment readiness, and infrastructure status.",
    features: ["Servers", "Health", "Terminal manager", "Deployment logs"]
  },
  {
    id: "private-rooms",
    name: "Private Rooms",
    short: "COMMAND",
    icon: "♛",
    zone: "north-far",
    x: 64,
    y: 8,
    tier: ACCESS_TIERS.COMMANDER,
    route: "/app/profile",
    eyebrow: "High-tier personal headquarters",
    description: "A private member headquarters concept for avatar identity, trophies, personal command layouts, and future invite-only rooms.",
    features: ["Private HQ", "Trophy room", "Avatar identity", "Invite-only roadmap"]
  },
  {
    id: "war-room",
    name: "War Room",
    short: "OPERATE",
    icon: "◆",
    zone: "north-far-west",
    x: 34,
    y: 8,
    tier: ACCESS_TIERS.COMMANDER,
    route: "/war-room/overview",
    eyebrow: "Provider & operator command",
    description: "The existing role-gated operations shell for providers and operators. Application RBAC still controls final access.",
    features: ["Provider tools", "Operator tools", "Mission operations", "RBAC enforced"]
  }
]);

export const WORLD_QUICK_LINKS = Object.freeze([
  { label: "Dashboard", route: "/app/feed" },
  { label: "My Accounts", route: "/app/link-vault/my-accounts" },
  { label: "Bot Loadout", route: "/app/bot-arena/loadout" },
  { label: "Squads", route: "/app/squads/my-squads" },
  { label: "Messages", route: "/app/messages" },
  { label: "Profile", route: "/app/profile" }
]);
