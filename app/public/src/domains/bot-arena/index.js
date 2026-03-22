import {
  BOT_REGISTRY,
  BOT_FAMILIES,
  MISSION_PRESETS,
  REMOTE_CONTROL_PROFILES,
  SWITCH_REGISTRY,
  getMyBots,
  getSwitchUnlockMatrix,
  getCompatibleSwitches
} from "../../data/bot-control-mock.js";

const DOMAIN_CLASS = "bot-arena-domain";

function esc(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function applyStyles(doc) {
  if (!doc || doc.getElementById("bot-arena-domain-style")) return;
  const style = doc.createElement("style");
  style.id = "bot-arena-domain-style";
  style.textContent = `
    .${DOMAIN_CLASS} {
      --arena-bg: linear-gradient(150deg, rgba(11, 16, 26, 0.96), rgba(6, 10, 17, 0.96));
      --arena-card: linear-gradient(160deg, rgba(18, 27, 43, 0.86), rgba(12, 18, 30, 0.9));
      --arena-line: rgba(123, 169, 255, 0.24);
      --arena-text: #dce9ff;
      --arena-muted: #9fb4d4;
      --arena-accent: #6be7cb;
      --arena-accent-2: #7da2ff;
      color: var(--arena-text);
      display: grid;
      gap: 16px;
    }
    .${DOMAIN_CLASS} .arena-hero {
      background: radial-gradient(circle at top right, rgba(125, 162, 255, 0.16), transparent 46%), var(--arena-bg);
      border: 1px solid var(--arena-line);
      border-radius: 18px;
      padding: 18px;
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.34);
    }
    .${DOMAIN_CLASS} h2,
    .${DOMAIN_CLASS} h3,
    .${DOMAIN_CLASS} h4 {
      margin: 0;
      font-family: "Trebuchet MS", "Segoe UI", sans-serif;
      letter-spacing: 0.01em;
    }
    .${DOMAIN_CLASS} p {
      margin: 0;
    }
    .${DOMAIN_CLASS} .arena-muted {
      color: var(--arena-muted);
      font-size: 0.92rem;
    }
    .${DOMAIN_CLASS} .arena-tabs {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      margin-top: 14px;
    }
    .${DOMAIN_CLASS} .arena-tab {
      border: 1px solid rgba(107, 231, 203, 0.32);
      border-radius: 999px;
      padding: 6px 12px;
      font-size: 0.78rem;
      text-transform: uppercase;
      letter-spacing: 0.11em;
      color: #c7f9ea;
      background: rgba(10, 19, 30, 0.6);
    }
    .${DOMAIN_CLASS} .arena-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
      gap: 14px;
    }
    .${DOMAIN_CLASS} .arena-card {
      background: var(--arena-card);
      border: 1px solid var(--arena-line);
      border-radius: 14px;
      padding: 14px;
      display: grid;
      gap: 10px;
    }
    .${DOMAIN_CLASS} .arena-metrics {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
      gap: 10px;
    }
    .${DOMAIN_CLASS} .arena-metric {
      border: 1px solid rgba(125, 162, 255, 0.35);
      border-radius: 12px;
      background: rgba(10, 18, 29, 0.74);
      padding: 10px;
    }
    .${DOMAIN_CLASS} .arena-metric .value {
      font-size: 1.4rem;
      font-weight: 700;
      color: var(--arena-accent);
      line-height: 1.15;
    }
    .${DOMAIN_CLASS} .arena-metric .label {
      font-size: 0.77rem;
      text-transform: uppercase;
      letter-spacing: 0.12em;
      color: var(--arena-muted);
    }
    .${DOMAIN_CLASS} .arena-list {
      display: grid;
      gap: 8px;
    }
    .${DOMAIN_CLASS} .arena-row {
      border: 1px solid rgba(125, 162, 255, 0.2);
      border-radius: 10px;
      padding: 9px 10px;
      background: rgba(6, 12, 21, 0.68);
      display: grid;
      gap: 4px;
    }
    .${DOMAIN_CLASS} .arena-row-top {
      display: flex;
      justify-content: space-between;
      gap: 10px;
      align-items: baseline;
      font-size: 0.88rem;
    }
    .${DOMAIN_CLASS} .arena-chip-row {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }
    .${DOMAIN_CLASS} .arena-chip {
      border-radius: 999px;
      border: 1px solid rgba(107, 231, 203, 0.28);
      padding: 3px 9px;
      font-size: 0.73rem;
      color: #bdfbe9;
      background: rgba(15, 35, 40, 0.44);
    }
    .${DOMAIN_CLASS} .arena-kv {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
      gap: 8px;
      font-size: 0.82rem;
      color: var(--arena-muted);
    }
    .${DOMAIN_CLASS} .arena-state {
      border: 1px dashed rgba(107, 231, 203, 0.5);
      border-radius: 14px;
      padding: 16px;
      color: #c3f7eb;
      background: rgba(10, 23, 24, 0.5);
    }
  `;
  doc.head.appendChild(style);
}

function renderState(type, message) {
  const defaultMessage =
    type === "loading"
      ? "Syncing Bot Arena telemetry and remote profiles."
      : type === "error"
        ? "Bot Arena failed to load. Please retry."
        : "No bots are available in this environment yet.";
  return `
    <section class="${DOMAIN_CLASS}">
      <article class="arena-state">
        <h3>${esc(type.toUpperCase())}</h3>
        <p>${esc(message || defaultMessage)}</p>
      </article>
    </section>
  `;
}

function renderBotRow(bot) {
  return `
    <article class="arena-row">
      <div class="arena-row-top">
        <strong>${esc(bot.name)}</strong>
        <span>${esc(bot.code)}</span>
      </div>
      <div class="arena-chip-row">
        <span class="arena-chip">${esc(bot.familyName)}</span>
        <span class="arena-chip">${esc(bot.role)}</span>
        <span class="arena-chip">Unlock L${esc(bot.unlockLevel)}</span>
      </div>
      <div class="arena-kv">
        <span>Pair Focus: ${esc(bot.symbolPairs.join(" / "))}</span>
        <span>Mission: ${esc(bot.missionPreset)}</span>
        <span>Risk Bias: ${esc(bot.riskBias)}</span>
      </div>
    </article>
  `;
}

function renderFamilyCards() {
  return BOT_FAMILIES.map((family) => {
    const familyBots = BOT_REGISTRY.filter((bot) => bot.familyId === family.id);
    return `
      <article class="arena-card">
        <h4>${esc(family.name)}</h4>
        <p class="arena-muted">${esc(family.visualTag)} | Unlock ${esc(family.unlockBand)}</p>
        <p class="arena-muted">${esc(family.theme)}</p>
        <div class="arena-chip-row">
          ${family.roles.map((role) => `<span class="arena-chip">${esc(role)}</span>`).join("")}
        </div>
        <div class="arena-kv">
          <span>Bot Count: ${familyBots.length}</span>
          <span>Symbols: ${esc(family.symbols.join(", "))}</span>
        </div>
      </article>
    `;
  }).join("");
}

function renderCompatibilityPanel() {
  return getMyBots()
    .slice(0, 8)
    .map((bot) => {
      const compatible = getCompatibleSwitches(bot.id).slice(0, 3);
      return `
        <article class="arena-row">
          <div class="arena-row-top">
            <strong>${esc(bot.name)}</strong>
            <span>${esc(bot.role)}</span>
          </div>
          <div class="arena-chip-row">
            ${compatible.map((item) => `<span class="arena-chip">${esc(item.name)}</span>`).join("")}
          </div>
        </article>
      `;
    })
    .join("");
}

function renderProfilePanel() {
  return REMOTE_CONTROL_PROFILES.map((profile) => `
    <article class="arena-row">
      <div class="arena-row-top">
        <strong>${esc(profile.name)}</strong>
        <span>Health ${esc(profile.healthScore)}%</span>
      </div>
      <div class="arena-kv">
        <span>Host: ${esc(profile.host)}</span>
        <span>Latency: ${esc(profile.latencyBand)}</span>
        <span>Heartbeat: ${esc(profile.heartbeat)}</span>
        <span>Operator: ${esc(profile.operator)}</span>
      </div>
      <p class="arena-muted">${esc(profile.failover)}</p>
    </article>
  `).join("");
}

function renderLoadoutPanel() {
  const unlockMatrix = getSwitchUnlockMatrix();
  const unlockedCount = unlockMatrix.filter((item) => item.unlockState.unlocked).length;
  return `
    <article class="arena-card" id="bot-arena-loadout">
      <h3>Loadout Bay</h3>
      <p class="arena-muted">Remote profile concepts, mission presets, and switch gate awareness.</p>
      <div class="arena-metrics">
        <div class="arena-metric">
          <div class="value">${MISSION_PRESETS.length}</div>
          <div class="label">Mission Presets</div>
        </div>
        <div class="arena-metric">
          <div class="value">${unlockedCount}/${SWITCH_REGISTRY.length}</div>
          <div class="label">Switches Unlocked</div>
        </div>
      </div>
      <div class="arena-list">
        ${MISSION_PRESETS.map((mission) => `
          <article class="arena-row">
            <div class="arena-row-top">
              <strong>${esc(mission.name)}</strong>
              <span>${esc(mission.riskBand)} Risk</span>
            </div>
            <p class="arena-muted">${esc(mission.focus)}</p>
          </article>
        `).join("")}
      </div>
      <p class="arena-muted">TODO: Bind loadout actions to backend profile save + MT4/MT5 remote command dispatch.</p>
      <div class="arena-chip-row"><span class="arena-chip">User-Supplied</span></div>
    </article>
  `;
}

export function renderBotArenaDomain(options = {}) {
  const state = options.state || "ready";
  if (state === "loading" || state === "error") return renderState(state, options.message);
  if (!Array.isArray(BOT_REGISTRY) || BOT_REGISTRY.length === 0) return renderState("empty", options.message);

  const myBots = getMyBots();
  const prototypeCount = BOT_REGISTRY.filter((bot) => bot.status === "prototype").length;
  const missionCoverage = new Set(myBots.map((bot) => bot.missionPreset)).size;

  return `
    <section class="${DOMAIN_CLASS}">
      <header class="arena-hero">
        <p class="arena-muted">Bot Arena</p>
        <h2>Command Bot Families, Loadouts, and Remote Profiles</h2>
        <p class="arena-muted">53 bots organized by family, role, unlock level, compatibility, and mission presets.</p>
        <div class="arena-chip-row">
          <span class="arena-chip">Simulation</span>
          <span class="arena-chip">User-Supplied</span>
          <span class="arena-chip">Placeholder Integration</span>
        </div>
        <div class="arena-tabs">
          <span class="arena-tab">All Bots</span>
          <span class="arena-tab">My Bots</span>
          <span class="arena-tab">Profiles</span>
          <span class="arena-tab">Families</span>
          <span class="arena-tab">Compatible Switches</span>
          <span class="arena-tab">Loadout</span>
        </div>
      </header>

      <section class="arena-grid">
        <article class="arena-card" id="bot-arena-all-bots">
          <h3>All Bots</h3>
          <p class="arena-muted">Scalable grouped structure across eight families.</p>
          <div class="arena-metrics">
            <div class="arena-metric"><div class="value">${BOT_REGISTRY.length}</div><div class="label">Total Bots</div></div>
            <div class="arena-metric"><div class="value">${BOT_FAMILIES.length}</div><div class="label">Families</div></div>
            <div class="arena-metric"><div class="value">${prototypeCount}</div><div class="label">Prototype Tier</div></div>
          </div>
          <div class="arena-list">${BOT_REGISTRY.slice(0, 12).map(renderBotRow).join("")}</div>
          <p class="arena-muted">Showing 12 of ${BOT_REGISTRY.length} bots in shell preview.</p>
        </article>

        <article class="arena-card" id="bot-arena-my-bots">
          <h3>My Bots</h3>
          <p class="arena-muted">Owned bot deck with mission coverage summary.</p>
          <div class="arena-metrics">
            <div class="arena-metric"><div class="value">${myBots.length}</div><div class="label">Owned Bots</div></div>
            <div class="arena-metric"><div class="value">${missionCoverage}</div><div class="label">Mission Coverage</div></div>
          </div>
          <div class="arena-list">${myBots.slice(0, 10).map(renderBotRow).join("")}</div>
        </article>

        <article class="arena-card" id="bot-arena-profiles">
          <h3>Remote Profiles</h3>
          <p class="arena-muted">Website-managed profiles for remote bot control.</p>
          <div class="arena-list">${renderProfilePanel()}</div>
          <p class="arena-muted">TODO: Replace mock health telemetry with VPS Forge and Mission Control service feeds.</p>
        </article>
      </section>

      <section class="arena-grid">
        <article class="arena-card" id="bot-arena-families">
          <h3>Families</h3>
          <p class="arena-muted">Grouped by identity, roles, unlock band, and pair context.</p>
          <div class="arena-grid">${renderFamilyCards()}</div>
        </article>

        <article class="arena-card" id="bot-arena-compatible-switches">
          <h3>Compatible Switches</h3>
          <p class="arena-muted">Top compatible switches for active owned bots.</p>
          <div class="arena-list">${renderCompatibilityPanel()}</div>
        </article>

        ${renderLoadoutPanel()}
      </section>
    </section>
  `;
}

export function mountBotArenaDomain(container, options = {}) {
  if (!container) return;
  applyStyles(container.ownerDocument || document);
  container.innerHTML = renderBotArenaDomain(options);
}

export const botArenaDomain = {
  id: "bot-arena",
  title: "Bot Arena",
  mount: mountBotArenaDomain,
  render: renderBotArenaDomain
};

export default botArenaDomain;
