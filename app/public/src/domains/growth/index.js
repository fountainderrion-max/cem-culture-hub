import {
  GROWTH_ACCOUNT,
  GROWTH_UNLOCK_LADDER,
  RANK_PATH,
  GROWTH_MILESTONES,
  REWARD_CATALOG,
  getGrowthProgress,
  RISK_GUARDRAILS
} from "../../data/bot-control-mock.js";

const DOMAIN_CLASS = "growth-domain";

function esc(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function applyStyles(doc) {
  if (!doc || doc.getElementById("growth-domain-style")) return;
  const style = doc.createElement("style");
  style.id = "growth-domain-style";
  style.textContent = `
    .${DOMAIN_CLASS} {
      --gr-bg: linear-gradient(150deg, rgba(27, 15, 8, 0.95), rgba(16, 9, 6, 0.96));
      --gr-card: linear-gradient(160deg, rgba(44, 25, 14, 0.88), rgba(23, 13, 7, 0.93));
      --gr-line: rgba(244, 170, 102, 0.24);
      --gr-text: #ffe8d6;
      --gr-muted: #d4b89f;
      --gr-accent: #ffc37b;
      display: grid;
      gap: 14px;
      color: var(--gr-text);
    }
    .${DOMAIN_CLASS} .gr-hero {
      border: 1px solid var(--gr-line);
      border-radius: 16px;
      padding: 17px;
      background: radial-gradient(circle at 90% 12%, rgba(255, 195, 123, 0.18), transparent 46%), var(--gr-bg);
      box-shadow: 0 16px 46px rgba(0, 0, 0, 0.34);
    }
    .${DOMAIN_CLASS} .gr-tabs {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 10px;
    }
    .${DOMAIN_CLASS} .gr-tab {
      border: 1px solid rgba(255, 195, 123, 0.34);
      border-radius: 999px;
      padding: 5px 10px;
      font-size: 0.76rem;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: #ffe2bf;
    }
    .${DOMAIN_CLASS} .gr-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
      gap: 12px;
    }
    .${DOMAIN_CLASS} .gr-card {
      border: 1px solid var(--gr-line);
      border-radius: 12px;
      padding: 12px;
      background: var(--gr-card);
      display: grid;
      gap: 8px;
    }
    .${DOMAIN_CLASS} .gr-list {
      display: grid;
      gap: 8px;
    }
    .${DOMAIN_CLASS} .gr-row {
      border: 1px solid rgba(212, 184, 159, 0.28);
      border-radius: 10px;
      padding: 8px 9px;
      background: rgba(23, 11, 6, 0.7);
      display: grid;
      gap: 4px;
    }
    .${DOMAIN_CLASS} .gr-top {
      display: flex;
      justify-content: space-between;
      gap: 10px;
      align-items: baseline;
      font-size: 0.88rem;
    }
    .${DOMAIN_CLASS} .gr-muted {
      color: var(--gr-muted);
      font-size: 0.88rem;
    }
    .${DOMAIN_CLASS} .gr-chip-row {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }
    .${DOMAIN_CLASS} .gr-chip {
      border: 1px solid rgba(255, 195, 123, 0.35);
      border-radius: 999px;
      padding: 3px 8px;
      font-size: 0.71rem;
      color: #ffe5c4;
    }
    .${DOMAIN_CLASS} .gr-metrics {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
      gap: 8px;
    }
    .${DOMAIN_CLASS} .gr-metric {
      border: 1px solid rgba(255, 195, 123, 0.28);
      border-radius: 9px;
      padding: 7px;
      background: rgba(20, 10, 6, 0.74);
    }
    .${DOMAIN_CLASS} .gr-metric .value {
      color: var(--gr-accent);
      font-size: 1.25rem;
      font-weight: 700;
      line-height: 1.1;
    }
    .${DOMAIN_CLASS} .gr-metric .label {
      color: var(--gr-muted);
      font-size: 0.71rem;
      letter-spacing: 0.1em;
      text-transform: uppercase;
    }
    .${DOMAIN_CLASS} .gr-progress {
      width: 100%;
      height: 8px;
      border-radius: 999px;
      overflow: hidden;
      border: 1px solid rgba(255, 195, 123, 0.26);
      background: rgba(40, 19, 11, 0.75);
    }
    .${DOMAIN_CLASS} .gr-progress > span {
      display: block;
      height: 100%;
      background: linear-gradient(90deg, #ffb969, #ffd9a9);
    }
    .${DOMAIN_CLASS} .gr-state {
      border: 1px dashed rgba(255, 195, 123, 0.5);
      border-radius: 12px;
      padding: 14px;
      background: rgba(28, 13, 7, 0.5);
    }
  `;
  doc.head.appendChild(style);
}

function renderState(type, message) {
  const fallback =
    type === "loading"
      ? "Syncing growth profile and reward ladders."
      : type === "error"
        ? "Growth Chamber failed to initialize."
        : "No growth records available.";
  return `
    <section class="${DOMAIN_CLASS}">
      <article class="gr-state">
        <h3>${esc(type.toUpperCase())}</h3>
        <p>${esc(message || fallback)}</p>
      </article>
    </section>
  `;
}

function renderUnlockRows() {
  return GROWTH_UNLOCK_LADDER.map((node) => `
    <article class="gr-row">
      <div class="gr-top">
        <strong>Level ${esc(node.level)}</strong>
        <span>${esc(node.xpRequired)} XP</span>
      </div>
      <div class="gr-chip-row">
        ${node.unlocks.map((entry) => `<span class="gr-chip">${esc(entry)}</span>`).join("")}
      </div>
    </article>
  `).join("");
}

function renderRankRows() {
  return RANK_PATH.map((node) => `
    <article class="gr-row">
      <div class="gr-top">
        <strong>${esc(node.rank)}</strong>
        <span>Growth L${esc(node.minGrowthLevel)}</span>
      </div>
      <p class="gr-muted">Min Growth: ${esc(node.minGrowthPercent)}% | Reward: ${esc(node.reward)}</p>
    </article>
  `).join("");
}

function renderMilestoneRows() {
  return GROWTH_MILESTONES.map((item) => `
    <article class="gr-row">
      <div class="gr-top">
        <strong>${esc(item.label)}</strong>
        <span>${esc(item.progress)}%</span>
      </div>
      <div class="gr-progress"><span style="width:${Math.max(0, Math.min(100, item.progress))}%"></span></div>
      <p class="gr-muted">Reward: ${esc(item.reward)}</p>
    </article>
  `).join("");
}

function renderRewardRows() {
  return REWARD_CATALOG.map((reward) => `
    <article class="gr-row">
      <div class="gr-top">
        <strong>${esc(reward.name)}</strong>
        <span>${esc(reward.cost)} pts</span>
      </div>
      <div class="gr-chip-row">
        <span class="gr-chip">${esc(reward.type)}</span>
      </div>
    </article>
  `).join("");
}

export function renderGrowthDomain(options = {}) {
  const state = options.state || "ready";
  if (state === "loading" || state === "error") return renderState(state, options.message);
  if (!GROWTH_ACCOUNT || !Array.isArray(GROWTH_UNLOCK_LADDER) || GROWTH_UNLOCK_LADDER.length === 0) {
    return renderState("empty", options.message);
  }

  const progress = getGrowthProgress();
  return `
    <section class="${DOMAIN_CLASS}">
      <header class="gr-hero">
        <p class="gr-muted">Growth Chamber</p>
        <h2>Track Account Growth and Unlock Progression</h2>
        <p class="gr-muted">Monitor rank path, unlock ladder, milestones, and reward economy with progression-safe context.</p>
        <div class="gr-chip-row">
          <span class="gr-chip">Simulation</span>
          <span class="gr-chip">Placeholder Integration</span>
        </div>
        <div class="gr-tabs">
          <span class="gr-tab">Account Growth</span>
          <span class="gr-tab">Unlock Ladder</span>
          <span class="gr-tab">Rank Path</span>
          <span class="gr-tab">Milestones</span>
          <span class="gr-tab">Rewards</span>
        </div>
      </header>

      <section class="gr-grid">
        <article class="gr-card" id="growth-account">
          <h3>Account Growth</h3>
          <div class="gr-metrics">
            <div class="gr-metric"><div class="value">${esc(GROWTH_ACCOUNT.accountGrowthPercent)}%</div><div class="label">Growth</div></div>
            <div class="gr-metric"><div class="value">${esc(GROWTH_ACCOUNT.currentRank)}</div><div class="label">Rank</div></div>
            <div class="gr-metric"><div class="value">L${esc(GROWTH_ACCOUNT.growthLevel)}</div><div class="label">Growth Level</div></div>
            <div class="gr-metric"><div class="value">${esc(GROWTH_ACCOUNT.streakDays)}</div><div class="label">Streak Days</div></div>
          </div>
          <div class="gr-list">
            <article class="gr-row">
              <div class="gr-top">
                <strong>Progress to Next Level</strong>
                <span>${progress.progressPercent}% ladder completion</span>
              </div>
              <p class="gr-muted">Current Node: Level ${esc(progress.currentNode.level)} | Next Node: Level ${esc(progress.nextNode.level)}</p>
              <div class="gr-progress"><span style="width:${progress.progressPercent}%"></span></div>
            </article>
            <article class="gr-row">
              <div class="gr-top">
                <strong>Capital Protection</strong>
                <span>${esc(GROWTH_ACCOUNT.protectedCapitalPercent)}%</span>
              </div>
              <p class="gr-muted">Subscription ${esc(GROWTH_ACCOUNT.subscriptionPlan)} | Reward Points ${esc(GROWTH_ACCOUNT.rewardPoints)}</p>
            </article>
          </div>
        </article>

        <article class="gr-card" id="growth-unlock-ladder">
          <h3>Unlock Ladder</h3>
          <p class="gr-muted">Progressive unlock path for switches, missions, and remote profiles.</p>
          <div class="gr-list">${renderUnlockRows()}</div>
        </article>
      </section>

      <section class="gr-grid">
        <article class="gr-card" id="growth-rank-path">
          <h3>Rank Path</h3>
          <p class="gr-muted">Rank advancement model linked to growth level and protected growth percentages.</p>
          <div class="gr-list">${renderRankRows()}</div>
        </article>

        <article class="gr-card" id="growth-milestones">
          <h3>Milestones</h3>
          <p class="gr-muted">Milestone tracker for progression and rewards.</p>
          <div class="gr-list">${renderMilestoneRows()}</div>
        </article>

        <article class="gr-card" id="growth-rewards">
          <h3>Rewards</h3>
          <p class="gr-muted">Redeemable reward catalog for mission credits and unlock points.</p>
          <div class="gr-list">${renderRewardRows()}</div>
          <p class="gr-muted">TODO: Integrate reward redemption with account wallet and unlock service.</p>
        </article>
      </section>

      <section class="gr-grid">
        <article class="gr-card" id="growth-risk-guardrails">
          <h3>Risk Guardrails</h3>
          <p class="gr-muted">Configured policy: Max drawdown ${RISK_GUARDRAILS.maxDrawdownPercent}% and max daily loss ${RISK_GUARDRAILS.maxDailyLossPercent}%.</p>
          <div class="gr-list">
            <article class="gr-row">
              <div class="gr-top"><strong>Caution Trigger</strong><span>${RISK_GUARDRAILS.cautionAtDailyLossLimitPercent}% of daily loss limit</span></div>
              <p class="gr-muted">${RISK_GUARDRAILS.onCautionState.join(" | ")}</p>
            </article>
            <article class="gr-row">
              <div class="gr-top"><strong>Daily Loss Breach</strong><span>100% of daily limit</span></div>
              <p class="gr-muted">${RISK_GUARDRAILS.onDailyLossBreach.join(" | ")}</p>
            </article>
            <article class="gr-row">
              <div class="gr-top"><strong>Drawdown Breach</strong><span>100% drawdown threshold</span></div>
              <p class="gr-muted">${RISK_GUARDRAILS.onDrawdownBreach.join(" | ")}</p>
            </article>
          </div>
        </article>
      </section>
    </section>
  `;
}

export function mountGrowthDomain(container, options = {}) {
  if (!container) return;
  applyStyles(container.ownerDocument || document);
  container.innerHTML = renderGrowthDomain(options);
}

export const growthDomain = {
  id: "growth-chamber",
  title: "Growth Chamber",
  mount: mountGrowthDomain,
  render: renderGrowthDomain
};

export default growthDomain;
