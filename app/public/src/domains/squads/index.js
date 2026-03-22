import {
  SQUAD_REGISTRY,
  MY_SQUAD_IDS,
  BOT_REGISTRY,
  MISSION_PRESETS,
  REMOTE_CONTROL_PROFILES,
  getBotControlMockData
} from "../../data/bot-control-mock.js";

const DOMAIN_CLASS = "squads-domain";

function esc(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function applyStyles(doc) {
  if (!doc || doc.getElementById("squads-domain-style")) return;
  const style = doc.createElement("style");
  style.id = "squads-domain-style";
  style.textContent = `
    .${DOMAIN_CLASS} {
      --sq-bg: linear-gradient(150deg, rgba(15, 14, 25, 0.95), rgba(8, 7, 17, 0.95));
      --sq-card: linear-gradient(160deg, rgba(25, 20, 43, 0.86), rgba(14, 11, 27, 0.92));
      --sq-line: rgba(178, 132, 255, 0.22);
      --sq-text: #e5ddff;
      --sq-muted: #b1a8d9;
      --sq-accent: #d5a6ff;
      display: grid;
      gap: 14px;
      color: var(--sq-text);
    }
    .${DOMAIN_CLASS} .sq-hero {
      border: 1px solid var(--sq-line);
      border-radius: 16px;
      padding: 17px;
      background: radial-gradient(circle at 85% 15%, rgba(213, 166, 255, 0.14), transparent 44%), var(--sq-bg);
      box-shadow: 0 16px 44px rgba(0, 0, 0, 0.34);
    }
    .${DOMAIN_CLASS} .sq-tabs {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 10px;
    }
    .${DOMAIN_CLASS} .sq-tab {
      border: 1px solid rgba(213, 166, 255, 0.34);
      border-radius: 999px;
      padding: 5px 10px;
      font-size: 0.76rem;
      text-transform: uppercase;
      letter-spacing: 0.12em;
    }
    .${DOMAIN_CLASS} .sq-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 12px;
    }
    .${DOMAIN_CLASS} .sq-card {
      border: 1px solid var(--sq-line);
      border-radius: 12px;
      padding: 12px;
      background: var(--sq-card);
      display: grid;
      gap: 8px;
    }
    .${DOMAIN_CLASS} .sq-list {
      display: grid;
      gap: 8px;
    }
    .${DOMAIN_CLASS} .sq-row {
      border: 1px solid rgba(177, 168, 217, 0.28);
      border-radius: 10px;
      padding: 8px 9px;
      display: grid;
      gap: 4px;
      background: rgba(8, 8, 19, 0.66);
    }
    .${DOMAIN_CLASS} .sq-top {
      display: flex;
      justify-content: space-between;
      gap: 10px;
      font-size: 0.88rem;
      align-items: baseline;
    }
    .${DOMAIN_CLASS} .sq-muted {
      color: var(--sq-muted);
      font-size: 0.88rem;
    }
    .${DOMAIN_CLASS} .sq-chip-row {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }
    .${DOMAIN_CLASS} .sq-chip {
      border: 1px solid rgba(213, 166, 255, 0.34);
      border-radius: 999px;
      padding: 3px 8px;
      font-size: 0.71rem;
      color: #efd7ff;
    }
    .${DOMAIN_CLASS} .sq-metrics {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
      gap: 8px;
    }
    .${DOMAIN_CLASS} .sq-metric {
      border: 1px solid rgba(213, 166, 255, 0.26);
      border-radius: 9px;
      padding: 7px;
      background: rgba(9, 8, 21, 0.74);
    }
    .${DOMAIN_CLASS} .sq-metric .value {
      color: var(--sq-accent);
      font-size: 1.25rem;
      font-weight: 700;
      line-height: 1.1;
    }
    .${DOMAIN_CLASS} .sq-metric .label {
      color: var(--sq-muted);
      font-size: 0.73rem;
      text-transform: uppercase;
      letter-spacing: 0.1em;
    }
    .${DOMAIN_CLASS} .sq-state {
      border: 1px dashed rgba(213, 166, 255, 0.5);
      border-radius: 12px;
      padding: 15px;
      background: rgba(30, 17, 48, 0.4);
    }
  `;
  doc.head.appendChild(style);
}

function renderState(type, message) {
  const fallback =
    type === "loading"
      ? "Syncing squad roster and role compositions."
      : type === "error"
        ? "Squad surface failed to load."
        : "No squads available yet.";
  return `
    <section class="${DOMAIN_CLASS}">
      <article class="sq-state">
        <h3>${esc(type.toUpperCase())}</h3>
        <p>${esc(message || fallback)}</p>
      </article>
    </section>
  `;
}

function renderSquadRow(squad) {
  const bots = squad.memberBotIds
    .map((id) => BOT_REGISTRY.find((bot) => bot.id === id)?.name || id)
    .slice(0, 3);
  return `
    <article class="sq-row">
      <div class="sq-top">
        <strong>${esc(squad.name)}</strong>
        <span>${esc(squad.visibility)}</span>
      </div>
      <p class="sq-muted">${esc(squad.summary)}</p>
      <div class="sq-chip-row">
        <span class="sq-chip">${esc(squad.archetype)}</span>
        <span class="sq-chip">Preset: ${esc(squad.missionPreset)}</span>
        <span class="sq-chip">Open Slots ${esc(squad.openSlots)}</span>
      </div>
      <p class="sq-muted">Key Bots: ${esc(bots.join(", "))}</p>
      <p class="sq-muted">Rank ${esc(squad.rankRequirement)} | Growth L${esc(squad.growthRequirement)}</p>
    </article>
  `;
}

function renderProfileRows() {
  return REMOTE_CONTROL_PROFILES.map((profile) => `
    <article class="sq-row">
      <div class="sq-top">
        <strong>${esc(profile.name)}</strong>
        <span>Tier ${esc(profile.accessTier)}</span>
      </div>
      <p class="sq-muted">Host ${esc(profile.host)} | Latency ${esc(profile.latencyBand)}</p>
      <p class="sq-muted">Failover: ${esc(profile.failover)}</p>
    </article>
  `).join("");
}

function renderBuilderPanel() {
  const payload = getBotControlMockData();
  const candidateBots = payload.bots
    .filter((bot) => ["Scout", "Builder", "Defense"].includes(bot.role))
    .slice(0, 9);
  return `
    <article class="sq-card" id="squads-builder">
      <h3>Squad Builder</h3>
      <p class="sq-muted">Compose mission packs by role, unlock gate, and profile compatibility.</p>
      <div class="sq-list">
        ${candidateBots.map((bot) => `
          <article class="sq-row">
            <div class="sq-top">
              <strong>${esc(bot.name)}</strong>
              <span>${esc(bot.role)}</span>
            </div>
            <div class="sq-chip-row">
              <span class="sq-chip">Unlock L${esc(bot.unlockLevel)}</span>
              <span class="sq-chip">${esc(bot.familyName)}</span>
              <span class="sq-chip">Mission ${esc(bot.missionPreset)}</span>
            </div>
          </article>
        `).join("")}
      </div>
      <p class="sq-muted">TODO: Connect builder save/create actions to squad orchestration service and profile persistence.</p>
    </article>
  `;
}

export function renderSquadsDomain(options = {}) {
  const state = options.state || "ready";
  if (state === "loading" || state === "error") return renderState(state, options.message);
  if (!Array.isArray(SQUAD_REGISTRY) || SQUAD_REGISTRY.length === 0) return renderState("empty", options.message);

  const mine = new Set(MY_SQUAD_IDS);
  const mySquads = SQUAD_REGISTRY.filter((squad) => mine.has(squad.id));
  const publicCount = SQUAD_REGISTRY.filter((squad) => squad.visibility === "Public").length;
  const averageOpenSlots = (
    SQUAD_REGISTRY.reduce((sum, squad) => sum + squad.openSlots, 0) / SQUAD_REGISTRY.length
  ).toFixed(1);

  return `
    <section class="${DOMAIN_CLASS}">
      <header class="sq-hero">
        <p class="sq-muted">Squads</p>
        <h2>Build and Operate Mission Squads</h2>
        <p class="sq-muted">Explore, track, and configure bot squad formations with profile-aware execution concepts.</p>
        <div class="sq-tabs">
          <span class="sq-tab">Explore</span>
          <span class="sq-tab">My Squads</span>
          <span class="sq-tab">Profiles</span>
          <span class="sq-tab">Builder</span>
        </div>
      </header>

      <section class="sq-grid">
        <article class="sq-card" id="squads-explore">
          <h3>Explore Squads</h3>
          <div class="sq-metrics">
            <div class="sq-metric"><div class="value">${SQUAD_REGISTRY.length}</div><div class="label">Total Squads</div></div>
            <div class="sq-metric"><div class="value">${publicCount}</div><div class="label">Public</div></div>
            <div class="sq-metric"><div class="value">${averageOpenSlots}</div><div class="label">Avg Open Slots</div></div>
          </div>
          <div class="sq-list">${SQUAD_REGISTRY.slice(0, 6).map(renderSquadRow).join("")}</div>
        </article>

        <article class="sq-card" id="squads-my">
          <h3>My Squads</h3>
          <p class="sq-muted">Your active squads and readiness context.</p>
          <div class="sq-list">${mySquads.map(renderSquadRow).join("")}</div>
        </article>
      </section>

      <section class="sq-grid">
        <article class="sq-card" id="squads-profiles">
          <h3>Squad Profiles</h3>
          <p class="sq-muted">Remote control profiles available for squad deployment lanes.</p>
          <div class="sq-list">${renderProfileRows()}</div>
          <div class="sq-list">
            ${MISSION_PRESETS.slice(0, 5).map((mission) => `
              <article class="sq-row">
                <div class="sq-top">
                  <strong>${esc(mission.name)}</strong>
                  <span>${esc(mission.riskBand)} Risk</span>
                </div>
                <p class="sq-muted">${esc(mission.focus)}</p>
              </article>
            `).join("")}
          </div>
        </article>
        ${renderBuilderPanel()}
      </section>
    </section>
  `;
}

export function mountSquadsDomain(container, options = {}) {
  if (!container) return;
  applyStyles(container.ownerDocument || document);
  container.innerHTML = renderSquadsDomain(options);
}

export const squadsDomain = {
  id: "squads",
  title: "Squads",
  mount: mountSquadsDomain,
  render: renderSquadsDomain
};

export default squadsDomain;
