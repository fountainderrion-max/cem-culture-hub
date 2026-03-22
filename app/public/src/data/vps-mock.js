const vpsForgeSeed = {
  generatedAt: "2026-03-22T09:15:00.000Z",
  plans: [
    {
      id: "forge-starter",
      name: "Forge Starter",
      monthlyUsd: 39,
      cpu: "2 vCPU",
      memory: "4 GB RAM",
      storage: "80 GB NVMe",
      bandwidth: "2 TB",
      maxTerminals: 2,
      bestFor: "Single bot pilots and first deploys"
    },
    {
      id: "forge-pro",
      name: "Forge Pro",
      monthlyUsd: 89,
      cpu: "4 vCPU",
      memory: "8 GB RAM",
      storage: "160 GB NVMe",
      bandwidth: "5 TB",
      maxTerminals: 6,
      bestFor: "Multi-terminal squads with switch backups"
    },
    {
      id: "forge-warroom",
      name: "Forge War Room",
      monthlyUsd: 179,
      cpu: "8 vCPU",
      memory: "16 GB RAM",
      storage: "320 GB NVMe",
      bandwidth: "10 TB",
      maxTerminals: 14,
      bestFor: "Provider stacks and high-frequency operations"
    }
  ],
  regions: ["New York", "Frankfurt", "Singapore", "Sao Paulo"],
  images: ["Windows Server 2022", "Windows Server 2019", "Ubuntu 24.04 LTS"],
  servers: [
    {
      id: "srv-nyc-01",
      name: "Alpha Forge",
      planId: "forge-pro",
      region: "New York",
      image: "Windows Server 2022",
      status: "running",
      uptime: "18d 04h",
      publicIp: "104.24.17.11",
      autoHeal: true,
      terminals: 4,
      metrics: { cpu: 62, memory: 58, disk: 41, latencyMs: 28 },
      alerts: [
        { id: "a-101", level: "warning", text: "CPU over 60% for 15m" }
      ]
    },
    {
      id: "srv-fra-02",
      name: "Delta Relay",
      planId: "forge-starter",
      region: "Frankfurt",
      image: "Windows Server 2019",
      status: "degraded",
      uptime: "6d 12h",
      publicIp: "185.44.3.77",
      autoHeal: false,
      terminals: 2,
      metrics: { cpu: 78, memory: 71, disk: 67, latencyMs: 43 },
      alerts: [
        { id: "a-205", level: "critical", text: "Disk pressure reached 67%" },
        { id: "a-206", level: "warning", text: "Latency spike above 40ms" }
      ]
    },
    {
      id: "srv-sin-03",
      name: "Night Switch",
      planId: "forge-warroom",
      region: "Singapore",
      image: "Ubuntu 24.04 LTS",
      status: "provisioning",
      uptime: "22m",
      publicIp: "43.120.28.9",
      autoHeal: true,
      terminals: 0,
      metrics: { cpu: 17, memory: 23, disk: 14, latencyMs: 31 },
      alerts: [{ id: "a-310", level: "info", text: "Initial deployment in progress" }]
    }
  ],
  terminals: [
    {
      id: "term-01",
      name: "XAU Scalper Prime",
      family: "Scalp Commander",
      serverId: "srv-nyc-01",
      platform: "MT5",
      profile: "London Breakout",
      syncState: "synced",
      lastSync: "2026-03-22T08:50:00.000Z",
      autoRestart: true
    },
    {
      id: "term-02",
      name: "US30 Momentum",
      family: "Index Hunter",
      serverId: "srv-fra-02",
      platform: "MT4",
      profile: "Macro Volatility",
      syncState: "out-of-sync",
      lastSync: "2026-03-22T07:20:00.000Z",
      autoRestart: false
    },
    {
      id: "term-03",
      name: "EURUSD Session Bot",
      family: "Session Pilot",
      serverId: "srv-nyc-01",
      platform: "MT5",
      profile: "NY Fade",
      syncState: "synced",
      lastSync: "2026-03-22T08:58:00.000Z",
      autoRestart: true
    }
  ],
  logs: [
    {
      id: "log-9001",
      at: "2026-03-22T08:59:00.000Z",
      level: "success",
      source: "Terminal Manager",
      message: "Resync completed for XAU Scalper Prime."
    },
    {
      id: "log-9002",
      at: "2026-03-22T08:43:00.000Z",
      level: "warning",
      source: "Server Health",
      message: "Delta Relay latency breached soft threshold."
    },
    {
      id: "log-9003",
      at: "2026-03-22T08:08:00.000Z",
      level: "info",
      source: "Launch Server",
      message: "Night Switch provisioning started (simulated)."
    }
  ]
};

export function getVpsForgeMock() {
  if (typeof structuredClone === "function") {
    return structuredClone(vpsForgeSeed);
  }
  return JSON.parse(JSON.stringify(vpsForgeSeed));
}

export function createVpsLog(level, source, message) {
  return {
    id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    at: new Date().toISOString(),
    level,
    source,
    message
  };
}

export function findPlanById(plans, planId) {
  return plans.find((plan) => plan.id === planId) || null;
}
