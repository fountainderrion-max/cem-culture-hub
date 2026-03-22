export const linkVaultMockData = {
  generatedAt: "2026-03-22T08:45:00Z",
  simulated: true,
  trustCenter: {
    encryption: "Credentials encrypted at rest and in transit (AES-256 + TLS 1.3).",
    policy:
      "Scope-limited permissions only. Withdrawal and profile mutation rights are blocked by default.",
    emergency:
      "Emergency disconnect immediately blocks copier actions and revokes active session tokens.",
  },
  onboardingDefaults: {
    platforms: ["MT4", "MT5"],
    accessMethods: ["Investor Password", "Read-Only API Token"],
    missionModes: ["Steady", "Precision", "Attack", "Recovery"],
    vpsRegions: ["New York", "London", "Frankfurt", "Singapore"],
    permissionScopes: [
      "Read balance and equity",
      "Read open positions",
      "Read trade history",
      "Allow copier allocation",
      "Allow bot command sync",
    ],
  },
  accounts: [
    {
      id: "acc-atlas-001",
      alias: "Atlas Gold Core",
      platform: "MT5",
      broker: "IC Markets Global",
      server: "ICMarketsSC-Demo03",
      accountNumberMasked: "****9042",
      linkedAt: "2026-02-17T10:12:00Z",
      lastSyncAt: "2026-03-22T08:30:00Z",
      status: "Connected",
      permissions: [
        "Read balance and equity",
        "Read open positions",
        "Allow copier allocation",
      ],
      credentialSecurity: {
        encrypted: true,
        accessMethod: "Investor Password",
        lastRotatedAt: "2026-03-05T16:10:00Z",
      },
      metrics: {
        balanceUsd: 25240.9,
        equityUsd: 24891.43,
        growthPct30d: 14.2,
        drawdownPct30d: 5.6,
        winRatePct30d: 63.1,
        bestPair: "XAUUSD",
        worstPair: "GBPJPY",
        activeBots: 4,
        missionMode: "Precision",
        vpsStatus: "Healthy",
      },
    },
    {
      id: "acc-nova-002",
      alias: "Nova FX Sprint",
      platform: "MT4",
      broker: "Pepperstone",
      server: "Pepper-Live-01",
      accountNumberMasked: "****7718",
      linkedAt: "2026-01-26T14:33:00Z",
      lastSyncAt: "2026-03-22T08:28:00Z",
      status: "Connected",
      permissions: [
        "Read balance and equity",
        "Read trade history",
        "Allow bot command sync",
      ],
      credentialSecurity: {
        encrypted: true,
        accessMethod: "Read-Only API Token",
        lastRotatedAt: "2026-03-19T11:45:00Z",
      },
      metrics: {
        balanceUsd: 9110.2,
        equityUsd: 9268.33,
        growthPct30d: 8.7,
        drawdownPct30d: 3.8,
        winRatePct30d: 58.6,
        bestPair: "EURUSD",
        worstPair: "US30",
        activeBots: 2,
        missionMode: "Steady",
        vpsStatus: "Warning",
      },
    },
    {
      id: "acc-delta-003",
      alias: "Delta Recovery Desk",
      platform: "MT5",
      broker: "FTMO",
      server: "FTMO-Demo2",
      accountNumberMasked: "****1184",
      linkedAt: "2026-03-03T09:21:00Z",
      lastSyncAt: "2026-03-22T07:58:00Z",
      status: "Review",
      permissions: ["Read balance and equity", "Read open positions"],
      credentialSecurity: {
        encrypted: true,
        accessMethod: "Investor Password",
        lastRotatedAt: "2026-03-14T08:05:00Z",
      },
      metrics: {
        balanceUsd: 15000,
        equityUsd: 14742.11,
        growthPct30d: 3.2,
        drawdownPct30d: 6.9,
        winRatePct30d: 51.4,
        bestPair: "USDJPY",
        worstPair: "NAS100",
        activeBots: 1,
        missionMode: "Recovery",
        vpsStatus: "Healthy",
      },
    },
  ],
  copierProfiles: [
    {
      id: "copier-squad-alpha",
      name: "Squad Alpha Mirror",
      strategy: "Trend Continuation",
      status: "Active",
      linkedAccounts: 2,
      latencyMs: 182,
      successRatePct: 97.3,
      riskCapPct: 2.3,
      lastRunAt: "2026-03-22T08:31:00Z",
      permissions: ["Copy entries", "Copy stop-loss", "Copy take-profit"],
    },
    {
      id: "copier-squad-orbit",
      name: "Orbit Defensive Copier",
      strategy: "Risk-Off Countertrend",
      status: "Paused",
      linkedAccounts: 1,
      latencyMs: 244,
      successRatePct: 94.1,
      riskCapPct: 1.7,
      lastRunAt: "2026-03-22T07:10:00Z",
      permissions: ["Copy entries", "Copy stop-loss"],
    },
  ],
  protections: {
    maxDailyDrawdownPct: 65,
    maxDailyLossPct: 65,
    cautionAtPctOfDailyLossLimit: 65,
    maxConsecutiveLosses: 5,
    autoDisconnectOnSyncGapMin: 10,
    autoDisconnectOnVpsDegraded: true,
    killSwitchArmed: true,
    emergencyContacts: ["ops@cemculture.tech", "risk@cemculture.tech"],
    lastAuditChecks: [
      {
        at: "2026-03-22T08:00:00Z",
        actor: "Risk Engine",
        action: "Permission scope validation",
        result: "Pass",
      },
      {
        at: "2026-03-22T07:00:00Z",
        actor: "VPS Sentinel",
        action: "Latency threshold scan",
        result: "Pass",
      },
      {
        at: "2026-03-21T21:10:00Z",
        actor: "Operator Console",
        action: "Manual disconnect drill",
        result: "Pass",
      },
    ],
  },
  accountHistory: [
    {
      id: "hist-1001",
      at: "2026-03-22T08:31:00Z",
      accountAlias: "Atlas Gold Core",
      actor: "System",
      action: "Sync completed",
      outcome: "Success",
      detail: "Copier profile Squad Alpha Mirror refreshed.",
    },
    {
      id: "hist-1002",
      at: "2026-03-22T07:42:00Z",
      accountAlias: "Nova FX Sprint",
      actor: "Operator",
      action: "Permission scope updated",
      outcome: "Success",
      detail: "Removed write-risk scope from copier allocation.",
    },
    {
      id: "hist-1003",
      at: "2026-03-22T07:05:00Z",
      accountAlias: "Delta Recovery Desk",
      actor: "System",
      action: "Sync delay alert",
      outcome: "Warning",
      detail: "Data feed delayed by 11 minutes, auto-watch enabled.",
    },
    {
      id: "hist-1004",
      at: "2026-03-21T21:10:00Z",
      accountAlias: "Atlas Gold Core",
      actor: "Operator",
      action: "Emergency disconnect drill",
      outcome: "Success",
      detail: "Dry run completed. Copier session resumed after verification.",
    },
    {
      id: "hist-1005",
      at: "2026-03-20T16:50:00Z",
      accountAlias: "Nova FX Sprint",
      actor: "User",
      action: "Credential rotation",
      outcome: "Success",
      detail: "Read-only API token rotated and old token revoked.",
    },
  ],
};

export function getLinkVaultSummary(data = linkVaultMockData) {
  const accounts = Array.isArray(data.accounts) ? data.accounts : [];
  const totals = accounts.reduce(
    (acc, account) => {
      const metrics = account.metrics || {};
      acc.balanceUsd += Number(metrics.balanceUsd || 0);
      acc.equityUsd += Number(metrics.equityUsd || 0);
      acc.activeBots += Number(metrics.activeBots || 0);
      acc.growthPctTotal += Number(metrics.growthPct30d || 0);
      acc.drawdownPctTotal += Number(metrics.drawdownPct30d || 0);
      acc.winRatePctTotal += Number(metrics.winRatePct30d || 0);
      return acc;
    },
    {
      balanceUsd: 0,
      equityUsd: 0,
      activeBots: 0,
      growthPctTotal: 0,
      drawdownPctTotal: 0,
      winRatePctTotal: 0,
    }
  );

  const count = accounts.length || 1;
  return {
    accountCount: accounts.length,
    balanceUsd: totals.balanceUsd,
    equityUsd: totals.equityUsd,
    activeBots: totals.activeBots,
    avgGrowthPct30d: totals.growthPctTotal / count,
    avgDrawdownPct30d: totals.drawdownPctTotal / count,
    avgWinRatePct30d: totals.winRatePctTotal / count,
  };
}
