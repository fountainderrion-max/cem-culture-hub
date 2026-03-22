import {
  SWITCH_REGISTRY,
  MY_SWITCH_IDS,
  ACTIVE_SWITCH_IDS,
  GROWTH_ACCOUNT,
  evaluateSwitchUnlock,
  getSwitchUnlockMatrix
} from "../../data/bot-control-mock.js";

const DOMAIN_CLASS = "switch-lab-domain";

function esc(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function applyStyles(doc) {
  if (!doc || doc.getElementById("switch-lab-domain-style")) return;
  const style = doc.createElement("style");
  style.id = "switch-lab-domain-style";
  style.textContent = `
    .${DOMAIN_CLASS} {
      --sl-bg: linear-gradient(150deg, rgba(12, 20, 15, 0.95), rgba(6, 11, 8, 0.96));
      --sl-card: linear-gradient(160deg, rgba(16, 34, 22, 0.88), rgba(9, 20, 14, 0.92));
      --sl-line: rgba(95, 220, 151, 0.24);
      --sl-text: #def8e6;
      --sl-muted: #abd2bb;
      --sl-accent: #7ff0b5;
      display: grid;
      gap: 14px;
      color: var(--sl-text);
    }
    .${DOMAIN_CLASS} .sl-hero {
      border: 1px solid var(--sl-line);
      border-radius: 16px;
      padding: 17px;
      background: radial-gradient(circle at 10% 10%, rgba(127, 240, 181, 0.17), transparent 43%), var(--sl-bg);
      box-shadow: 0 16px 46px rgba(0, 0, 0, 0.34);
    }
    .${DOMAIN_CLASS} .sl-tabs {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 10px;
    }
    .${DOMAIN_CLASS} .sl-tab {
      border: 1px solid rgba(127, 240, 181, 0.35);
      border-radius: 999px;
      padding: 5px 10px;
      font-size: 0.76rem;
      text-transform: uppercase;
      letter-spacing: 0.12em;
      color: #c8fce0;
    }
    .${DOMAIN_CLASS} .sl-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
      gap: 12px;
    }
    .${DOMAIN_CLASS} .sl-card {
      border: 1px solid var(--sl-line);
      border-radius: 12px;
      padding: 12px;
      background: var(--sl-card);
      display: grid;
      gap: 8px;
    }
    .${DOMAIN_CLASS} .sl-list {
      display: grid;
      gap: 8px;
    }
    .${DOMAIN_CLASS} .sl-row {
      border: 1px solid rgba(171, 210, 187, 0.28);
      border-radius: 10px;
      padding: 8px 9px;
      background: rgba(5, 12, 9, 0.7);
      display: grid;
      gap: 4px;
    }
    .${DOMAIN_CLASS} .sl-top {
      display: flex;
      justify-content: space-between;
      gap: 10px;
      align-items: baseline;
      font-size: 0.88rem;
    }
    .${DOMAIN_CLASS} .sl-muted {
      color: var(--sl-muted);
      font-size: 0.88rem;
    }
    .${DOMAIN_CLASS} .sl-chip-row {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }
    .${DOMAIN_CLASS} .sl-chip {
      border: 1px solid rgba(127, 240, 181, 0.35);
      border-radius: 999px;
      padding: 3px 8px;
      font-size: 0.72rem;
      color: #cafde2;
      text-transform: uppercase;
      letter-spacing: 0.08em;
    }
    .${DOMAIN_CLASS} .sl-chip.locked {
      border-color: rgba(255, 151, 106, 0.4);
      color: #ffc5a7;
    }
    .${DOMAIN_CLASS} .sl-chip.unlocked {
      border-color: rgba(127, 240, 181, 0.48);
      color: #ccffe5;
    }
    .${DOMAIN_CLASS} .sl-metrics {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(110px, 1fr));
      gap: 7px;
    }
    .${DOMAIN_CLASS} .sl-metric {
      border: 1px solid rgba(127, 240, 181, 0.26);
      border-radius: 9px;
      padding: 7px;
      background: rgba(6, 15, 10, 0.7);
    }
    .${DOMAIN_CLASS} .sl-metric .value {
      color: var(--sl-accent);
      font-size: 1.2rem;
      font-weight: 700;
      line-height: 1.1;
    }
    .${DOMAIN_CLASS} .sl-metric .label {
      color: var(--sl-muted);
      font-size: 0.71rem;
      text-transform: uppercase;
      letter-spacing: 0.1em;
    }
    .${DOMAIN_CLASS} .sl-state {
      border: 1px dashed rgba(127, 240, 181, 0.45);
      border-radius: 12px;
      padding: 14px;
      background: rgba(8, 22, 14, 0.5);
    }
  `;
  doc.head.appendChild(style);
}

function renderState(type, message) {
  const fallback =
    type === "loading"
      ? "Calibrating switch metadata and unlock matrix."
      : type === "error"
        ? "Switch Lab unavailable right now."
        : "No switch data found.";
  return `
    <section class="${DOMAIN_CLASS}">
      <article class="sl-state">
        <h3>${esc(type.toUpperCase())}</h3>
        <p>${esc(message || fallback)}</p>
      </article>
    </section>
  `;
}

function renderSwitchRow(item) {
  const gate = evaluateSwitchUnlock(item.id, GROWTH_ACCOUNT);
  return `
    <article class="sl-row">
      <div class="sl-top">
        <strong>${esc(item.name)}</strong>
        <span>${esc(item.lane)}</span>
      </div>
      <p class="sl-muted">${esc(item.summary)}</p>
      <div class="sl-chip-row">
        <span class="sl-chip">${esc(gate.gate)}</span>
        <span class="sl-chip ${gate.unlocked ? "unlocked" : "locked"}">${gate.unlocked ? "Unlocked" : "Locked"}</span>
        <span class="sl-chip">Heat ${esc(item.heat)}</span>
      </div>
      <p class="sl-muted">${esc(gate.reason)}</p>
    </article>
  `;
}

function renderUnlockPath() {
  const byType = {
    paid: [],
    rank: [],
    growth: [],
    subscription: []
  };
  for (const item of SWITCH_REGISTRY) {
    byType[item.unlock.type].push(item);
  }
  return Object.keys(byType)
    .map((type) => {
      const list = byType[type];
      return `
        <article class="sl-row">
          <div class="sl-top">
            <strong>${esc(type.toUpperCase())} Unlock Path</strong>
            <span>${list.length} switches</span>
          </div>
          <div class="sl-chip-row">
            ${list.map((item) => `<span class="sl-chip">${esc(item.name)}</span>`).join("")}
          </div>
        </article>
      `;
    })
    .join("");
}

export function renderSwitchLabDomain(options = {}) {
  const state = options.state || "ready";
  if (state === "loading" || state === "error") return renderState(state, options.message);
  if (!Array.isArray(SWITCH_REGISTRY) || SWITCH_REGISTRY.length === 0) return renderState("empty", options.message);

  const mySet = new Set(MY_SWITCH_IDS);
  const activeSet = new Set(ACTIVE_SWITCH_IDS);
  const mine = SWITCH_REGISTRY.filter((item) => mySet.has(item.id));
  const active = SWITCH_REGISTRY.filter((item) => activeSet.has(item.id));
  const unlockMatrix = getSwitchUnlockMatrix(GROWTH_ACCOUNT);
  const unlockedCount = unlockMatrix.filter((item) => item.unlockState.unlocked).length;

  return `
    <section class="${DOMAIN_CLASS}">
      <header class="sl-hero">
        <p class="sl-muted">Switch Lab</p>
        <h2>Control Smart Switch Economy and Unlock Paths</h2>
        <p class="sl-muted">Explore all switch lanes, active stacks, and explicit unlock logic concepts across paid/rank/growth/subscription gates.</p>
        <div class="sl-chip-row">
          <span class="sl-chip">Simulation</span>
          <span class="sl-chip">User-Supplied</span>
          <span class="sl-chip">Placeholder Integration</span>
        </div>
        <div class="sl-tabs">
          <span class="sl-tab">Explore</span>
          <span class="sl-tab">My Switches</span>
          <span class="sl-tab">Active</span>
          <span class="sl-tab">Unlock Path</span>
        </div>
      </header>

      <section class="sl-grid">
        <article class="sl-card" id="switch-lab-explore">
          <h3>Explore Switches</h3>
          <div class="sl-metrics">
            <div class="sl-metric"><div class="value">${SWITCH_REGISTRY.length}</div><div class="label">Total</div></div>
            <div class="sl-metric"><div class="value">${unlockedCount}</div><div class="label">Unlocked</div></div>
            <div class="sl-metric"><div class="value">${SWITCH_REGISTRY.length - unlockedCount}</div><div class="label">Locked</div></div>
          </div>
          <div class="sl-list">${SWITCH_REGISTRY.slice(0, 8).map(renderSwitchRow).join("")}</div>
        </article>

        <article class="sl-card" id="switch-lab-my">
          <h3>My Switches</h3>
          <p class="sl-muted">Owned switches available in your plan.</p>
          <div class="sl-list">${mine.map(renderSwitchRow).join("")}</div>
        </article>

        <article class="sl-card" id="switch-lab-active">
          <h3>Active Stack</h3>
          <p class="sl-muted">Current active switches attached to the live loadout.</p>
          <div class="sl-list">${active.map(renderSwitchRow).join("")}</div>
          <p class="sl-muted">TODO: Wire active stack controls to remote profile runtime and switch toggles API.</p>
        </article>
      </section>

      <section class="sl-grid">
        <article class="sl-card" id="switch-lab-unlock-path">
          <h3>Unlock Path</h3>
          <p class="sl-muted">Gate concepts surfaced by unlock type for progression planning.</p>
          <div class="sl-list">${renderUnlockPath()}</div>
        </article>
      </section>
    </section>
  `;
}

export function mountSwitchLabDomain(container, options = {}) {
  if (!container) return;
  applyStyles(container.ownerDocument || document);
  container.innerHTML = renderSwitchLabDomain(options);
}

export const switchLabDomain = {
  id: "switch-lab",
  title: "Switch Lab",
  mount: mountSwitchLabDomain,
  render: renderSwitchLabDomain
};

export default switchLabDomain;
