const PROVIDER_SECTION_BY_PATH = Object.freeze({
  "/war-room/overview": "war-room",
  "/war-room/provider-profile": "provider-profile",
  "/war-room/followers": "followers",
  "/war-room/squads": "squads",
  "/war-room/mission-control": "mission-control",
  "/mission-control": "mission-control",
  "/war-room/posts": "posts",
  "/war-room/payouts": "payouts",
  "/war-room/alerts": "mission-control"
});

const ADMIN_SECTION_BY_PATH = Object.freeze({
  "/admin": "overview",
  "/admin/users": "users",
  "/admin/providers": "providers",
  "/admin/bots": "bots",
  "/admin/squads": "squads",
  "/admin/switches": "switches",
  "/admin/vps": "vps",
  "/admin/accounts": "accounts",
  "/admin/payments": "payments",
  "/admin/moderation": "moderation",
  "/admin/analytics": "analytics"
});

export const PROVIDER_ROUTES = Object.freeze([
  { id: "war-room", label: "War Room", path: "/war-room/overview" },
  { id: "provider-profile", label: "Provider Profile", path: "/war-room/provider-profile" },
  { id: "followers", label: "My Followers", path: "/war-room/followers" },
  { id: "squads", label: "My Squads", path: "/war-room/squads" },
  { id: "mission-control", label: "Mission Control", path: "/war-room/mission-control" },
  { id: "posts", label: "Posts", path: "/war-room/posts" },
  { id: "payouts", label: "Payouts", path: "/war-room/payouts" }
]);

export const ADMIN_ROUTES = Object.freeze([
  { id: "overview", label: "Overview", path: "/admin" },
  { id: "users", label: "Users", path: "/admin/users" },
  { id: "providers", label: "Providers", path: "/admin/providers" },
  { id: "bots", label: "Bots", path: "/admin/bots" },
  { id: "squads", label: "Squads", path: "/admin/squads" },
  { id: "switches", label: "Switches", path: "/admin/switches" },
  { id: "vps", label: "VPS", path: "/admin/vps" },
  { id: "accounts", label: "Accounts", path: "/admin/accounts" },
  { id: "payments", label: "Payments", path: "/admin/payments" },
  { id: "moderation", label: "Moderation", path: "/admin/moderation" },
  { id: "analytics", label: "Analytics", path: "/admin/analytics" }
]);

export const providerAdminMock = {
  simulatedNotice:
    "Provider and admin surfaces use mock data. Broker linking, copier execution, payout processing, and VPS provisioning remain staged until backend integrations are complete.",
  provider: {
    warRoom: {
      commandWindow: "London and New York overlap",
      metrics: [
        { label: "Active Followers", value: "2,148" },
        { label: "Squads Online", value: "9 / 12" },
        { label: "Mission Incidents", value: "3 Open" },
        { label: "Payout Health", value: "On Track" }
      ],
      alertFeed: [
        {
          level: "High",
          title: "Latency spike on VPS lane EU-3",
          detail: "Execution lane crossed 89 ms for 7 minutes. Auto-heal staged in simulation.",
          time: "2026-03-22T10:12:00-04:00"
        },
        {
          level: "Medium",
          title: "Follower drawdown cluster warning",
          detail: "17 linked accounts exceeded preferred intraday drawdown lane in simulated monitor.",
          time: "2026-03-22T09:28:00-04:00"
        },
        {
          level: "Low",
          title: "Mission post awaiting moderator review",
          detail: "One scheduled post is queued for moderation before publish.",
          time: "2026-03-22T08:47:00-04:00"
        }
      ],
      checklist: [
        { label: "Risk caps synced", status: "Complete" },
        { label: "Loadout fallback validation", status: "Pending" },
        { label: "VPS heartbeat confirm", status: "In Progress" },
        { label: "Payout exception review", status: "Pending" }
      ]
    },
    profile: {
      providerHandle: "CEM_AtlasDesk",
      displayName: "Atlas Provider Desk",
      roleBand: "Provider and Operator",
      verificationStatus: "Verified identity (simulated record)",
      rank: "War Room Architect",
      culturePoints: 34920,
      followers: 2148,
      squads: 12,
      trustBadges: ["Risk Sentinel", "KYC Complete", "Bot Steward", "Squad Mentor"],
      policyCards: [
        { label: "Max intraday drawdown lane", value: "2.4%" },
        { label: "Risk policy version", value: "v3.7" },
        { label: "Last disclosure refresh", value: "March 20, 2026" },
        { label: "Mission brief SLA", value: "Every 4 hours" }
      ],
      linkedAccounts: [
        { platform: "MT4", count: 38, status: "Simulated sync healthy" },
        { platform: "MT5", count: 46, status: "Simulated sync healthy" }
      ],
      growthSnapshot: [
        { label: "30D Gross PnL", value: "$84,210" },
        { label: "30D Net PnL", value: "$71,940" },
        { label: "Follower retention", value: "93.2%" },
        { label: "Median risk score", value: "A-" }
      ]
    },
    followers: {
      summary: {
        totalFollowers: 2148,
        weeklyGrowth: "+7.4%",
        linkedAccounts: 84,
        copiedNotional: "$6.42M"
      },
      segments: [
        { segment: "Core disciplined", followers: 816, growth: "+4.1%", riskBias: "Low to Medium" },
        { segment: "Aggressive scalpers", followers: 602, growth: "+10.8%", riskBias: "High" },
        { segment: "Swing allocators", followers: 438, growth: "+5.5%", riskBias: "Medium" },
        { segment: "New trial followers", followers: 292, growth: "+13.3%", riskBias: "Unknown" }
      ],
      topFollowers: [
        { handle: "LunaOps", tier: "Diamond", allocation: "$184k", riskLane: "Medium", squads: 2 },
        { handle: "QuantRidge", tier: "Elite", allocation: "$163k", riskLane: "Low", squads: 1 },
        { handle: "NexPilot", tier: "Platinum", allocation: "$149k", riskLane: "High", squads: 3 },
        { handle: "AstraUnit", tier: "Gold", allocation: "$133k", riskLane: "Medium", squads: 2 }
      ],
      onboardingFunnel: [
        { stage: "Profile visits", count: 12280 },
        { stage: "Follow intent", count: 3260 },
        { stage: "Trial start", count: 712 },
        { stage: "Active follower", count: 2148 }
      ]
    },
    squads: {
      totals: {
        squads: 12,
        members: 94,
        activeMissions: 21,
        readiness: "86%"
      },
      mySquads: [
        {
          name: "Vector Command",
          archetype: "Momentum and Recovery",
          members: 12,
          mission: "Session Momentum Ladder",
          loadout: "Hydra + Aegis stack",
          vpsLane: "US-East cluster",
          readiness: "Healthy"
        },
        {
          name: "Gold Pulse Unit",
          archetype: "Metals precision",
          members: 9,
          mission: "XAUUSD Discipline Sprint",
          loadout: "Obsidian stack",
          vpsLane: "EU-London cluster",
          readiness: "Monitoring"
        },
        {
          name: "Macro Sentinel",
          archetype: "Swing defense",
          members: 8,
          mission: "Drawdown Containment",
          loadout: "Titan + Aegis stack",
          vpsLane: "NY failover pair",
          readiness: "Healthy"
        }
      ],
      recruitmentQueue: [
        { handle: "EchoKite", role: "Scout", requestedBy: "Vector Command", status: "Reviewing" },
        { handle: "RhoMatrix", role: "Risk Analyst", requestedBy: "Macro Sentinel", status: "Approved" },
        { handle: "NovaTrail", role: "Operator", requestedBy: "Gold Pulse Unit", status: "Pending docs" }
      ]
    },
    missionControl: {
      commandLanes: [
        {
          lane: "Lane A",
          profile: "London Precision",
          activeBots: 7,
          squads: 3,
          status: "Armed",
          symbols: "XAUUSD, EURUSD"
        },
        {
          lane: "Lane B",
          profile: "NY Volatility Guard",
          activeBots: 5,
          squads: 2,
          status: "Staged",
          symbols: "US30, NAS100"
        },
        {
          lane: "Lane C",
          profile: "Asia Defense",
          activeBots: 4,
          squads: 2,
          status: "Monitoring",
          symbols: "USDJPY, AUDJPY"
        }
      ],
      incidents: [
        {
          severity: "Critical",
          title: "Switch rollback required on Lane B",
          owner: "Operator Desk",
          age: "14m",
          state: "Escalated"
        },
        {
          severity: "High",
          title: "MT5 sync drift detected in follower cohort",
          owner: "Link Vault Monitor",
          age: "28m",
          state: "Investigating"
        },
        {
          severity: "Medium",
          title: "Bot family release pending approval",
          owner: "Bot Arena Governance",
          age: "42m",
          state: "Awaiting review"
        }
      ],
      queue: [
        { action: "Push loadout v2.9", target: "Vector Command", approval: "Required", eta: "5m" },
        { action: "Enable fallback profile", target: "Gold Pulse Unit", approval: "Granted", eta: "2m" },
        { action: "Pause high-risk lane", target: "Lane B", approval: "Required", eta: "Immediate" }
      ]
    },
    posts: {
      summary: {
        published7d: 22,
        scheduled: 9,
        drafts: 6,
        moderationFlags: 2
      },
      drafts: [
        {
          title: "Pre-NY session risk map",
          audience: "Followers",
          status: "Draft",
          updatedAt: "2026-03-22T08:54:00-04:00"
        },
        {
          title: "Squad recruitment update",
          audience: "Squad leaders",
          status: "Needs approval",
          updatedAt: "2026-03-22T07:40:00-04:00"
        }
      ],
      scheduled: [
        {
          title: "Mission debrief and expectancy notes",
          publishAt: "2026-03-22T13:15:00-04:00",
          channel: "Culture Feed",
          moderation: "Queued"
        },
        {
          title: "Weekly payout explainers",
          publishAt: "2026-03-22T18:40:00-04:00",
          channel: "Provider subscribers",
          moderation: "Approved"
        }
      ],
      recent: [
        { title: "London open plan", impressions: 12840, engagement: "9.3%", status: "Live" },
        { title: "Drawdown discipline challenge", impressions: 10420, engagement: "11.1%", status: "Live" },
        { title: "Bot lane incident postmortem", impressions: 6320, engagement: "7.4%", status: "Archived" }
      ]
    },
    payouts: {
      cycle: {
        grossRevenue: "$58,320",
        providerShare: "$37,908",
        pendingAdjustments: "$1,240",
        nextPayoutDate: "March 26, 2026"
      },
      ledger: [
        {
          period: "Mar 15 - Mar 21",
          gross: "$58,320",
          net: "$37,908",
          status: "Processing",
          method: "USDC payout rail"
        },
        {
          period: "Mar 08 - Mar 14",
          gross: "$54,090",
          net: "$35,448",
          status: "Paid",
          method: "Wire transfer"
        },
        {
          period: "Mar 01 - Mar 07",
          gross: "$49,770",
          net: "$32,847",
          status: "Paid",
          method: "USDC payout rail"
        }
      ],
      exceptions: [
        { ticket: "PX-4182", reason: "Chargeback reserve hold", amount: "$420", state: "Open" },
        { ticket: "PX-4176", reason: "Tax form validation", amount: "$180", state: "In review" }
      ]
    }
  },
  admin: {
    overview: {
      headlineMetrics: [
        { label: "Active Users", value: "18,420" },
        { label: "Active Providers", value: "214" },
        { label: "Live Squads", value: "486" },
        { label: "Open Incidents", value: "12" }
      ],
      riskSignals: [
        { level: "Critical", title: "Payment dispute cluster in Tier Pro", owner: "Payments Ops", age: "18m" },
        { level: "High", title: "Moderation queue backlog exceeded SLA", owner: "Trust and Safety", age: "39m" },
        { level: "Medium", title: "VPS heartbeat drop in APAC region", owner: "Infra Operations", age: "51m" }
      ],
      audits: [
        {
          area: "Provider verification",
          action: "Identity policy update applied",
          actor: "Admin-Ops-3",
          time: "2026-03-22T09:31:00-04:00"
        },
        {
          area: "Switch governance",
          action: "Unlock threshold adjusted for Tier C",
          actor: "Admin-Risk-2",
          time: "2026-03-22T08:44:00-04:00"
        },
        {
          area: "VPS operations",
          action: "Failover drill simulated",
          actor: "Admin-Infra-1",
          time: "2026-03-22T07:16:00-04:00"
        }
      ]
    },
    users: {
      totals: {
        total: 18420,
        active7d: 13228,
        flagged: 138,
        suspended: 29
      },
      rows: [
        { handle: "OpsLead", role: "Operator", status: "Active", kyc: "Verified", riskScore: "A", lastSeen: "8m ago" },
        { handle: "LunaFX", role: "User", status: "Active", kyc: "Verified", riskScore: "B+", lastSeen: "14m ago" },
        { handle: "AriaQuant", role: "Provider", status: "Review", kyc: "Pending", riskScore: "B", lastSeen: "23m ago" },
        { handle: "NovaTrace", role: "User", status: "Suspended", kyc: "Verified", riskScore: "D", lastSeen: "2h ago" }
      ]
    },
    providers: {
      totals: {
        active: 214,
        onboarding: 32,
        pendingCompliance: 17,
        highRiskWatch: 9
      },
      rows: [
        { provider: "Atlas Provider Desk", status: "Active", verification: "Verified", followers: 2148, payoutState: "On track" },
        { provider: "Vector Prime", status: "Onboarding", verification: "KYC pending", followers: 0, payoutState: "Not started" },
        { provider: "Gold Pulse Studio", status: "Review", verification: "Policy review", followers: 1210, payoutState: "Exception" }
      ],
      queues: [
        { ticket: "PR-2291", task: "Manual KYC document check", owner: "Compliance", due: "Today" },
        { ticket: "PR-2284", task: "Strategy disclosure refresh", owner: "Provider Ops", due: "Today" },
        { ticket: "PR-2278", task: "Payout route verification", owner: "Finance Ops", due: "Tomorrow" }
      ]
    },
    bots: {
      totals: {
        registered: 53,
        active: 41,
        staged: 8,
        frozen: 4
      },
      families: [
        { family: "Aegis Core", active: 9, incidents: 1, releaseState: "Stable" },
        { family: "Obsidian Pulse", active: 7, incidents: 2, releaseState: "Guarded" },
        { family: "Helix Scalper", active: 5, incidents: 3, releaseState: "Restricted" }
      ],
      releaseQueue: [
        { bot: "Hydra V12", lane: "Staging", riskGate: "Pending", owner: "Bot Governance" },
        { bot: "Titan Sentinel", lane: "Canary", riskGate: "Approved", owner: "Platform Ops" }
      ]
    },
    squads: {
      totals: {
        squads: 486,
        private: 304,
        public: 182,
        moderationCases: 14
      },
      rows: [
        { squad: "Vector Command", members: 12, policyState: "Healthy", missionState: "Active", moderation: "None" },
        { squad: "Apex War Unit", members: 18, policyState: "Watch", missionState: "Paused", moderation: "Warning" },
        { squad: "Delta Learners", members: 44, policyState: "Healthy", missionState: "Active", moderation: "None" }
      ]
    },
    switches: {
      totals: {
        catalog: 39,
        active: 21,
        locked: 12,
        deprecated: 6
      },
      rows: [
        { switchName: "Volatility Guard", tier: "A", owners: 4182, state: "Active", lastPolicyChange: "Mar 20" },
        { switchName: "Recovery Burst", tier: "B", owners: 2511, state: "Active", lastPolicyChange: "Mar 18" },
        { switchName: "Hyper Scalper", tier: "S", owners: 388, state: "Restricted", lastPolicyChange: "Mar 22" }
      ]
    },
    vps: {
      totals: {
        servers: 932,
        healthy: 901,
        degraded: 23,
        offline: 8
      },
      regions: [
        { region: "US-East", latency: "18 ms", uptime: "99.94%", incidents: 2, status: "Healthy" },
        { region: "EU-London", latency: "21 ms", uptime: "99.81%", incidents: 4, status: "Monitoring" },
        { region: "APAC-Singapore", latency: "33 ms", uptime: "99.63%", incidents: 6, status: "At risk" }
      ]
    },
    accounts: {
      totals: {
        linkedAccounts: 8421,
        mt4: 3948,
        mt5: 4473,
        anomaliesOpen: 31
      },
      anomalies: [
        { account: "ACC-44891", platform: "MT5", issue: "Ownership mismatch", severity: "High", state: "Investigating" },
        { account: "ACC-44107", platform: "MT4", issue: "Drawdown threshold breach", severity: "Medium", state: "Open" },
        { account: "ACC-43982", platform: "MT5", issue: "Sync stale over 15m", severity: "Low", state: "Monitoring" }
      ]
    },
    payments: {
      totals: {
        grossVolume: "$2.48M",
        payoutsProcessing: "$312k",
        disputesOpen: 27,
        failedSettlements: 6
      },
      settlements: [
        { batch: "SET-9032", amount: "$184,200", channel: "Wire", status: "Processing", eta: "4h" },
        { batch: "SET-9031", amount: "$166,480", channel: "USDC", status: "Completed", eta: "Done" },
        { batch: "SET-9029", amount: "$149,900", channel: "Wire", status: "Exception", eta: "Manual review" }
      ],
      disputes: [
        { ticket: "DP-4411", amount: "$2,480", reason: "Chargeback", owner: "Finance Ops", state: "Open" },
        { ticket: "DP-4398", amount: "$1,120", reason: "Duplicate billing", owner: "Billing Desk", state: "Resolved" }
      ]
    },
    moderation: {
      totals: {
        openItems: 86,
        slaBreaches: 4,
        autoResolved: 312,
        escalated: 12
      },
      queue: [
        { caseId: "MOD-7420", type: "Post", severity: "High", status: "Escalated", owner: "Trust Lead" },
        { caseId: "MOD-7417", type: "Profile", severity: "Medium", status: "Reviewing", owner: "Moderator 2" },
        { caseId: "MOD-7411", type: "Comment", severity: "Low", status: "Queued", owner: "Auto Queue" }
      ]
    },
    analytics: {
      totals: {
        dau: 9240,
        wau: 31280,
        retention30d: "61.4%",
        providerConversion: "17.8%"
      },
      growthSeries: [
        { label: "Week 1", users: 8240, providers: 192, payouts: 208000 },
        { label: "Week 2", users: 8610, providers: 198, payouts: 219400 },
        { label: "Week 3", users: 8930, providers: 205, payouts: 231100 },
        { label: "Week 4", users: 9240, providers: 214, payouts: 244700 }
      ]
    }
  }
};

function normalizePath(pathname) {
  if (!pathname) return "";
  const stripped = String(pathname).split("?")[0].split("#")[0].trim();
  if (!stripped) return "";
  return stripped.endsWith("/") && stripped.length > 1 ? stripped.slice(0, -1) : stripped;
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

export function resolveProviderSection(pathname) {
  const normalized = normalizePath(pathname);
  return PROVIDER_SECTION_BY_PATH[normalized] || "war-room";
}

export function resolveAdminSection(pathname) {
  const normalized = normalizePath(pathname);
  return ADMIN_SECTION_BY_PATH[normalized] || "overview";
}

export function getProviderAdminMock() {
  return clone(providerAdminMock);
}

export function getProviderMock() {
  return clone(providerAdminMock.provider);
}

export function getAdminMock() {
  return clone(providerAdminMock.admin);
}

