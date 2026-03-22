const baseInteractions = (overrides = {}) => ({
  likes: 0,
  comments: 0,
  reposts: 0,
  saves: 0,
  follows: 0,
  ...overrides
});

export const socialMock = {
  simulatedNotice:
    "Some social, challenge, and leaderboard events are simulated while live broker, copier, and VPS services are staged.",
  viewer: {
    id: "user-opslead",
    handle: "OpsLead",
    rank: "War Room Captain",
    squad: "Alpha Vectors"
  },
  feed: {
    pulseWindow: "London + NY overlap",
    posts: [
      {
        id: "feed-result-001",
        type: "result",
        simulated: false,
        author: {
          handle: "AriaQuant",
          rank: "Gold Hawk",
          avatar: "AQ"
        },
        title: "XAUUSD precision exit closed at +2.7R",
        body: "Risk stayed inside mission lane. Cut half at first imbalance, held runner through US open volatility.",
        symbols: ["XAUUSD"],
        timestamp: "2026-03-22T07:35:00-04:00",
        metrics: {
          pnlUsd: 1240,
          rr: "2.7R",
          winRateDelta: "+4.1%"
        },
        interactions: baseInteractions({
          likes: 148,
          comments: 26,
          reposts: 12,
          saves: 39,
          follows: 8
        })
      },
      {
        id: "feed-chart-001",
        type: "chart",
        simulated: true,
        author: {
          handle: "LunaFX",
          rank: "Signal Architect",
          avatar: "LF"
        },
        title: "EURUSD structure map before CPI drift",
        body: "Projected liquidity sweep into prior session high, then continuation lower if momentum fades.",
        symbols: ["EURUSD"],
        timestamp: "2026-03-22T06:50:00-04:00",
        metrics: {
          confidence: "74%",
          horizon: "4H",
          context: "Simulated chart replay"
        },
        interactions: baseInteractions({
          likes: 92,
          comments: 33,
          reposts: 21,
          saves: 57,
          follows: 4
        })
      },
      {
        id: "feed-mission-001",
        type: "mission",
        simulated: false,
        author: {
          handle: "MissionControl",
          rank: "Control Desk",
          avatar: "MC"
        },
        title: "Squad mission unlocked: Drawdown Discipline Week",
        body: "Hold max intraday drawdown below 2.2% for five sessions to unlock Switch Lab tier points.",
        symbols: ["Portfolio"],
        timestamp: "2026-03-22T05:40:00-04:00",
        metrics: {
          reward: "450 Culture Points",
          squadsJoined: 37,
          duration: "5 trading days"
        },
        interactions: baseInteractions({
          likes: 201,
          comments: 67,
          reposts: 54,
          saves: 91,
          follows: 0
        })
      },
      {
        id: "feed-bot-001",
        type: "bot",
        simulated: true,
        author: {
          handle: "BotArena",
          rank: "System Relay",
          avatar: "BA"
        },
        title: "Scalp Hydra v10 promoted to active loadout",
        body: "Promotion passed paper mission lane. Awaiting live capital gate in VPS Forge.",
        symbols: ["NAS100", "XAUUSD"],
        timestamp: "2026-03-22T04:58:00-04:00",
        metrics: {
          status: "Paper verified",
          expectedRisk: "0.9% / trade",
          automation: "Simulated deploy path"
        },
        interactions: baseInteractions({
          likes: 133,
          comments: 19,
          reposts: 9,
          saves: 44,
          follows: 3
        })
      },
      {
        id: "feed-milestone-001",
        type: "milestone",
        simulated: false,
        author: {
          handle: "NikoPrime",
          rank: "Diamond Raider",
          avatar: "NP"
        },
        title: "Culture Points crossed 25,000",
        body: "Reached Elite command tier after consistent risk hygiene and mission completion streak.",
        symbols: ["Account"],
        timestamp: "2026-03-22T03:47:00-04:00",
        metrics: {
          points: 25080,
          streak: "11 weeks",
          badgesUnlocked: 3
        },
        interactions: baseInteractions({
          likes: 311,
          comments: 72,
          reposts: 41,
          saves: 66,
          follows: 15
        })
      },
      {
        id: "feed-provider-001",
        type: "provider",
        simulated: true,
        author: {
          handle: "ProviderDesk",
          rank: "Provider Ops",
          avatar: "PD"
        },
        title: "Provider briefing: Session risk map refreshed",
        body: "Signal basket updated with volatility guardrails. Live copier route remains pending integration.",
        symbols: ["GBPJPY", "US30", "BTCUSD"],
        timestamp: "2026-03-22T02:29:00-04:00",
        metrics: {
          packs: 4,
          expectedVolatility: "High",
          integration: "Simulated distribution"
        },
        interactions: baseInteractions({
          likes: 120,
          comments: 22,
          reposts: 17,
          saves: 70,
          follows: 12
        })
      },
      {
        id: "feed-challenge-001",
        type: "challenge",
        simulated: false,
        author: {
          handle: "ChallengeHost",
          rank: "Arena Marshal",
          avatar: "CH"
        },
        title: "War Room Sprint: 3-day execution challenge",
        body: "Highest quality setup score wins. Penalties apply for overtrading and rule breaks.",
        symbols: ["Multi-asset"],
        timestamp: "2026-03-22T01:20:00-04:00",
        metrics: {
          participants: 164,
          topReward: "Legend badge + 900 CP",
          mode: "Live score updates"
        },
        interactions: baseInteractions({
          likes: 184,
          comments: 48,
          reposts: 29,
          saves: 103,
          follows: 9
        })
      },
      {
        id: "feed-vps-001",
        type: "vps",
        simulated: true,
        author: {
          handle: "VPSForge",
          rank: "Infra Sentinel",
          avatar: "VF"
        },
        title: "Node Atlas-EU-12 recovered from latency spike",
        body: "Restart and health checks completed in staging. Live infrastructure hooks are still pending.",
        symbols: ["Infra"],
        timestamp: "2026-03-22T00:05:00-04:00",
        metrics: {
          uptime: "99.42%",
          incidentWindow: "14 minutes",
          status: "Simulated alert stream"
        },
        interactions: baseInteractions({
          likes: 76,
          comments: 11,
          reposts: 6,
          saves: 23,
          follows: 2
        })
      }
    ]
  },
  profile: {
    id: "profile-ariaquant",
    handle: "AriaQuant",
    displayName: "Aria Quant",
    avatar: "AQ",
    bannerTitle: "Precision over noise",
    bannerSubtitle: "Mission-first trader focused on controlled aggression.",
    rank: "Gold Hawk",
    squad: "Alpha Vectors",
    culturePoints: 18420,
    followers: 1240,
    following: 186,
    winRate: 68.4,
    drawdownCap: 2.1,
    simulatedStats: "Growth and copier impact are simulated pending live link sync.",
    badges: [
      { id: "badge-risk", name: "Risk Sentinel", tier: "Platinum" },
      { id: "badge-streak", name: "11-Week Discipline", tier: "Gold" },
      { id: "badge-mentor", name: "Squad Mentor", tier: "Silver" },
      { id: "badge-arena", name: "Bot Arena Tester", tier: "Bronze" }
    ],
    tabs: [
      { id: "overview", label: "Overview" },
      { id: "missions", label: "Missions" },
      { id: "bots", label: "Bot Arena" },
      { id: "vault", label: "Link Vault" }
    ],
    highlights: [
      { label: "30-Day PnL", value: "+$8,540" },
      { label: "Mission Score", value: "92 / 100" },
      { label: "Squad Reliability", value: "A+" },
      { label: "Switch Lab Tier", value: "Tier IV" }
    ],
    recentActivity: [
      {
        id: "activity-1",
        title: "Published risk reset playbook",
        detail: "Shared a mission-safe framework for volatile CPI sessions.",
        time: "2026-03-21T20:12:00-04:00",
        interactions: baseInteractions({
          likes: 92,
          comments: 14,
          reposts: 11,
          saves: 37,
          follows: 0
        })
      },
      {
        id: "activity-2",
        title: "Completed Drawdown Discipline Week",
        detail: "Finished all five sessions under the mission drawdown cap.",
        time: "2026-03-20T17:05:00-04:00",
        interactions: baseInteractions({
          likes: 133,
          comments: 22,
          reposts: 18,
          saves: 41,
          follows: 0
        })
      }
    ]
  },
  messages: {
    simulatedState:
      "Message delivery and room presence are simulated until realtime transport is connected.",
    inbox: [
      {
        id: "msg-001",
        from: "LunaFX",
        subject: "Chart sweep before London open",
        preview: "I dropped a clean map for EURUSD if you want to mirror levels.",
        time: "2026-03-22T07:20:00-04:00",
        unread: true
      },
      {
        id: "msg-002",
        from: "ProviderDesk",
        subject: "Provider pack review",
        preview: "Can you validate risk lane tags before we publish at 09:00?",
        time: "2026-03-22T06:10:00-04:00",
        unread: true
      },
      {
        id: "msg-003",
        from: "NikoPrime",
        subject: "Mission debrief",
        preview: "Your drawdown framework helped. I shared my execution log.",
        time: "2026-03-21T21:35:00-04:00",
        unread: false
      }
    ],
    requests: [
      {
        id: "req-001",
        handle: "PulseOperator",
        reason: "Follow request from provider candidate",
        mutuals: 5,
        rank: "Signal Operator"
      },
      {
        id: "req-002",
        handle: "KaiMomentum",
        reason: "Wants to join Alpha Vectors chat lane",
        mutuals: 2,
        rank: "Silver Hawk"
      }
    ],
    squadRooms: [
      {
        id: "room-001",
        name: "Alpha Vectors - War Room",
        members: 14,
        status: "Live",
        topic: "US session execution discipline",
        latest: "MissionControl pinned revised challenge scoring lanes."
      },
      {
        id: "room-002",
        name: "Switch Lab Operators",
        members: 9,
        status: "Standby",
        topic: "Unlock ladder balancing",
        latest: "Tier IV unlock thresholds need provider review."
      },
      {
        id: "room-003",
        name: "VPS Forge Watch",
        members: 6,
        status: "Simulated",
        topic: "Node health and failover drills",
        latest: "Atlas-EU-12 incident replay is ready for training."
      }
    ]
  },
  challenges: {
    simulatedState:
      "Reward payouts and anti-cheat verification are simulated while service connectors are staged.",
    featuredId: "challenge-001",
    list: [
      {
        id: "challenge-001",
        name: "War Room Sprint",
        format: "3-Day Quality Sprint",
        participants: 164,
        entryCost: "Free",
        rewardPool: "2,700 Culture Points",
        status: "Live",
        objective:
          "Maximize quality score with strict risk compliance and zero revenge trades.",
        rules: [
          "Max 5 trades per session.",
          "Drawdown above 2.5% applies a 30-point penalty.",
          "At least one setup must include a written mission rationale."
        ]
      },
      {
        id: "challenge-002",
        name: "Provider Precision Cup",
        format: "Provider vs Provider",
        participants: 28,
        entryCost: "120 CP",
        rewardPool: "Legend Provider Emblem",
        status: "Registration",
        objective:
          "Deliver the highest consistency score across three strategy baskets.",
        rules: [
          "Signals must include risk lane tags.",
          "No more than two correlated pairs per basket.",
          "Missed updates reduce reliability score."
        ]
      },
      {
        id: "challenge-003",
        name: "Squad Discipline Trial",
        format: "7-Day Squad Mission",
        participants: 42,
        entryCost: "50 CP / squad",
        rewardPool: "Squad Banner + Tier Boost",
        status: "Upcoming",
        objective:
          "Keep squad average drawdown below 2% while maintaining positive mission score.",
        rules: [
          "Every squad member must submit daily check-ins.",
          "One rule breach creates a global squad penalty.",
          "Final score blends risk hygiene and net result."
        ]
      }
    ],
    liveBoard: [
      {
        rank: 1,
        entry: "AriaQuant",
        score: 942,
        quality: 96,
        risk: "A+",
        change: "+2"
      },
      {
        rank: 2,
        entry: "LunaFX",
        score: 925,
        quality: 95,
        risk: "A",
        change: "+1"
      },
      {
        rank: 3,
        entry: "NikoPrime",
        score: 903,
        quality: 93,
        risk: "A",
        change: "-1"
      },
      {
        rank: 4,
        entry: "PulseOperator",
        score: 874,
        quality: 89,
        risk: "B+",
        change: "+3"
      },
      {
        rank: 5,
        entry: "KaiMomentum",
        score: 851,
        quality: 88,
        risk: "B+",
        change: "-2"
      }
    ],
    rewardConcepts: [
      {
        id: "reward-001",
        name: "Command Crest",
        detail: "Premium profile crest awarded to top 3 finishers."
      },
      {
        id: "reward-002",
        name: "Switch Lab Priority",
        detail:
          "Early access to advanced switch templates and unlock previews."
      },
      {
        id: "reward-003",
        name: "VPS Forge Credit",
        detail:
          "Simulated operational credits reserved for future infrastructure launch."
      }
    ]
  },
  leaderboards: {
    updatedAt: "2026-03-22T07:45:00-04:00",
    views: {
      users: [
        {
          rank: 1,
          name: "AriaQuant",
          score: 1820,
          delta: "+45",
          metric: "Mission score 96"
        },
        {
          rank: 2,
          name: "LunaFX",
          score: 1762,
          delta: "+38",
          metric: "Execution quality 95"
        },
        {
          rank: 3,
          name: "NikoPrime",
          score: 1714,
          delta: "+21",
          metric: "Risk compliance 94"
        }
      ],
      providers: [
        {
          rank: 1,
          name: "ProviderDesk",
          score: 940,
          delta: "+9",
          metric: "Reliability 98%"
        },
        {
          rank: 2,
          name: "PulseOperator",
          score: 901,
          delta: "+6",
          metric: "Signal quality 93%"
        },
        {
          rank: 3,
          name: "CairoMacro",
          score: 884,
          delta: "-2",
          metric: "Risk lane alignment 91%"
        }
      ],
      squads: [
        {
          rank: 1,
          name: "Alpha Vectors",
          score: 2330,
          delta: "+64",
          metric: "Discipline streak 17 days"
        },
        {
          rank: 2,
          name: "Titan Flux",
          score: 2278,
          delta: "+20",
          metric: "Mission average 90"
        },
        {
          rank: 3,
          name: "Nova Grid",
          score: 2189,
          delta: "+11",
          metric: "Drawdown control A"
        }
      ],
      bots: [
        {
          rank: 1,
          name: "Scalp Hydra v10",
          score: 812,
          delta: "+18",
          metric: "Paper route only"
        },
        {
          rank: 2,
          name: "Phoenix Reversal",
          score: 801,
          delta: "+14",
          metric: "Mission-safe pass"
        },
        {
          rank: 3,
          name: "Echo Trend Grid",
          score: 774,
          delta: "-4",
          metric: "Needs volatility retune"
        }
      ],
      challenges: [
        {
          rank: 1,
          name: "War Room Sprint",
          score: 164,
          delta: "+24",
          metric: "Active participants"
        },
        {
          rank: 2,
          name: "Provider Precision Cup",
          score: 28,
          delta: "+8",
          metric: "Registrations"
        },
        {
          rank: 3,
          name: "Squad Discipline Trial",
          score: 42,
          delta: "+12",
          metric: "Watchlist adds"
        }
      ]
    }
  }
};

export const feedTypeLabels = {
  result: "Result",
  chart: "Chart",
  mission: "Mission",
  bot: "Bot",
  milestone: "Milestone",
  provider: "Provider",
  challenge: "Challenge",
  vps: "VPS"
};

