import { getLinkVaultSummary, linkVaultMockData } from "../../data/link-vault-mock.js";

const LINK_VAULT_STYLE_ID = "link-vault-domain-styles";

const TABS = [
  { id: "my-accounts", label: "My Accounts" },
  { id: "add-account", label: "Add Account" },
  { id: "analytics", label: "Account Analytics" },
  { id: "copier-profiles", label: "Copier Profiles" },
  { id: "protections", label: "Protections" },
  { id: "history", label: "Account History" },
];

function injectStyles() {
  if (document.getElementById(LINK_VAULT_STYLE_ID)) return;

  const style = document.createElement("style");
  style.id = LINK_VAULT_STYLE_ID;
  style.textContent = `
    .lv-wrap {
      color: #e8ecff;
      background: radial-gradient(circle at 12% 6%, rgba(41, 61, 125, 0.32), transparent 45%),
        radial-gradient(circle at 90% 0%, rgba(103, 44, 57, 0.28), transparent 42%),
        linear-gradient(155deg, #0b0f1d, #11172a 55%, #0a0d16);
      border: 1px solid rgba(141, 163, 255, 0.25);
      border-radius: 18px;
      padding: 22px;
      box-shadow: 0 18px 50px rgba(4, 6, 14, 0.52), inset 0 0 0 1px rgba(255, 255, 255, 0.03);
      font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
    }
    .lv-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 16px;
      flex-wrap: wrap;
      margin-bottom: 16px;
    }
    .lv-title {
      margin: 0;
      font-size: 1.26rem;
      letter-spacing: 0.02em;
    }
    .lv-subtitle {
      margin: 6px 0 0;
      color: #bac2ea;
      font-size: 0.92rem;
      max-width: 76ch;
    }
    .lv-trust-pill {
      border: 1px solid rgba(123, 255, 205, 0.38);
      border-radius: 999px;
      background: rgba(43, 120, 95, 0.18);
      color: #a6ffd7;
      padding: 6px 12px;
      font-size: 0.78rem;
      white-space: nowrap;
    }
    .lv-summary-grid,
    .lv-metrics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
      gap: 10px;
      margin: 14px 0 18px;
    }
    .lv-stat,
    .lv-metric {
      background: rgba(8, 12, 25, 0.62);
      border: 1px solid rgba(151, 165, 221, 0.2);
      border-radius: 12px;
      padding: 10px;
    }
    .lv-stat .label,
    .lv-metric .label {
      color: #9ea8d5;
      font-size: 0.74rem;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      margin-bottom: 4px;
    }
    .lv-stat .value,
    .lv-metric .value {
      font-size: 1rem;
      font-weight: 700;
      color: #f2f5ff;
    }
    .lv-tabs {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-bottom: 14px;
    }
    .lv-tab {
      border: 1px solid rgba(166, 179, 235, 0.28);
      background: rgba(7, 10, 20, 0.62);
      color: #cdd5f7;
      border-radius: 999px;
      font-size: 0.82rem;
      padding: 7px 13px;
      cursor: pointer;
    }
    .lv-tab.active {
      border-color: rgba(131, 165, 255, 0.55);
      background: rgba(70, 95, 183, 0.26);
      color: #ffffff;
      box-shadow: 0 0 0 1px rgba(134, 162, 255, 0.22), 0 6px 22px rgba(64, 88, 164, 0.34);
    }
    .lv-panel {
      background: rgba(9, 14, 30, 0.66);
      border: 1px solid rgba(147, 163, 224, 0.2);
      border-radius: 14px;
      padding: 14px;
    }
    .lv-note,
    .lv-empty,
    .lv-error {
      border: 1px solid rgba(158, 177, 255, 0.23);
      background: rgba(12, 19, 39, 0.68);
      border-radius: 12px;
      padding: 12px;
      color: #c9d2fc;
      margin-bottom: 12px;
    }
    .lv-error {
      border-color: rgba(255, 114, 140, 0.42);
      color: #ffd3dc;
      background: rgba(67, 20, 35, 0.5);
    }
    .lv-grid-two {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 12px;
    }
    .lv-card {
      border: 1px solid rgba(140, 160, 224, 0.22);
      background: rgba(12, 18, 37, 0.7);
      border-radius: 12px;
      padding: 12px;
    }
    .lv-card h3,
    .lv-card h4,
    .lv-panel h3 {
      margin: 0 0 8px;
      font-size: 0.97rem;
      color: #f4f7ff;
    }
    .lv-card p {
      margin: 0 0 8px;
      color: #ccd4f9;
      font-size: 0.86rem;
    }
    .lv-chip-row {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin-top: 8px;
    }
    .lv-chip {
      font-size: 0.72rem;
      color: #d8defc;
      border: 1px solid rgba(157, 177, 255, 0.22);
      background: rgba(28, 41, 84, 0.38);
      border-radius: 999px;
      padding: 3px 8px;
    }
    .lv-chip.good {
      border-color: rgba(123, 255, 205, 0.38);
      color: #a2ffcf;
      background: rgba(38, 118, 91, 0.24);
    }
    .lv-chip.warn {
      border-color: rgba(255, 210, 121, 0.45);
      color: #ffe2aa;
      background: rgba(119, 76, 23, 0.27);
    }
    .lv-chip.bad {
      border-color: rgba(255, 141, 159, 0.48);
      color: #ffd6dd;
      background: rgba(130, 34, 56, 0.27);
    }
    .lv-form {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
      gap: 10px;
    }
    .lv-field {
      display: flex;
      flex-direction: column;
      gap: 5px;
    }
    .lv-field.full {
      grid-column: 1 / -1;
    }
    .lv-field label {
      color: #aab5e8;
      font-size: 0.78rem;
    }
    .lv-field input,
    .lv-field select,
    .lv-field textarea {
      border-radius: 10px;
      border: 1px solid rgba(148, 165, 229, 0.26);
      background: rgba(8, 12, 24, 0.82);
      color: #edf1ff;
      padding: 9px 10px;
      font: inherit;
      font-size: 0.86rem;
    }
    .lv-permissions {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 6px;
    }
    .lv-permissions label {
      display: flex;
      align-items: center;
      gap: 7px;
      border: 1px solid rgba(141, 162, 224, 0.2);
      border-radius: 10px;
      background: rgba(15, 21, 43, 0.76);
      padding: 7px 8px;
      color: #dce2ff;
      font-size: 0.82rem;
    }
    .lv-btn-row {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 12px;
    }
    .lv-btn {
      border: 1px solid rgba(152, 170, 236, 0.33);
      border-radius: 10px;
      color: #edf1ff;
      background: rgba(16, 22, 45, 0.9);
      font: inherit;
      padding: 8px 13px;
      cursor: pointer;
    }
    .lv-btn.primary {
      border-color: rgba(115, 150, 255, 0.62);
      background: linear-gradient(160deg, rgba(70, 95, 187, 0.64), rgba(55, 84, 174, 0.45));
      box-shadow: 0 8px 20px rgba(34, 58, 126, 0.4);
    }
    .lv-btn.warn {
      border-color: rgba(255, 146, 166, 0.58);
      background: rgba(139, 31, 54, 0.4);
      color: #ffdbe3;
    }
    .lv-table-wrap {
      overflow-x: auto;
      border: 1px solid rgba(141, 160, 221, 0.2);
      border-radius: 10px;
      background: rgba(10, 15, 31, 0.72);
    }
    .lv-table {
      width: 100%;
      border-collapse: collapse;
      min-width: 860px;
      font-size: 0.82rem;
    }
    .lv-table th,
    .lv-table td {
      border-bottom: 1px solid rgba(141, 160, 221, 0.16);
      padding: 9px 8px;
      text-align: left;
      color: #dbe2ff;
      vertical-align: top;
    }
    .lv-table th {
      color: #aeb9eb;
      font-weight: 600;
      text-transform: uppercase;
      font-size: 0.7rem;
      letter-spacing: 0.03em;
    }
    .lv-timeline {
      list-style: none;
      margin: 0;
      padding: 0;
      display: grid;
      gap: 8px;
    }
    .lv-timeline li {
      border: 1px solid rgba(145, 166, 234, 0.2);
      border-radius: 10px;
      background: rgba(13, 19, 38, 0.74);
      padding: 10px;
      font-size: 0.83rem;
      color: #d3dcff;
    }
    .lv-loading {
      padding: 16px;
      border-radius: 11px;
      border: 1px solid rgba(138, 160, 229, 0.26);
      background: linear-gradient(110deg, rgba(15, 23, 48, 0.55), rgba(24, 34, 68, 0.55));
      color: #d8e0ff;
    }
    @media (max-width: 720px) {
      .lv-wrap {
        padding: 15px;
      }
      .lv-table {
        min-width: 700px;
      }
    }
  `;
  document.head.appendChild(style);
}

function formatUsd(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(Number(value || 0));
}

function formatPct(value) {
  return `${Number(value || 0).toFixed(1)}%`;
}

function formatDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Unknown" : date.toLocaleString();
}

function rowMetric(label, value) {
  return `<div class="lv-metric"><div class="label">${label}</div><div class="value">${value}</div></div>`;
}

function renderSummary(data) {
  const summary = getLinkVaultSummary(data);
  return `
    <section class="lv-summary-grid" aria-label="Link Vault summary metrics">
      <article class="lv-stat">
        <div class="label">Linked Accounts</div>
        <div class="value">${summary.accountCount}</div>
      </article>
      <article class="lv-stat">
        <div class="label">Total Balance</div>
        <div class="value">${formatUsd(summary.balanceUsd)}</div>
      </article>
      <article class="lv-stat">
        <div class="label">Total Equity</div>
        <div class="value">${formatUsd(summary.equityUsd)}</div>
      </article>
      <article class="lv-stat">
        <div class="label">Avg Growth (30d)</div>
        <div class="value">${formatPct(summary.avgGrowthPct30d)}</div>
      </article>
      <article class="lv-stat">
        <div class="label">Avg Drawdown (30d)</div>
        <div class="value">${formatPct(summary.avgDrawdownPct30d)}</div>
      </article>
      <article class="lv-stat">
        <div class="label">Avg Win Rate (30d)</div>
        <div class="value">${formatPct(summary.avgWinRatePct30d)}</div>
      </article>
      <article class="lv-stat">
        <div class="label">Active Bots</div>
        <div class="value">${summary.activeBots}</div>
      </article>
    </section>
  `;
}

function renderMyAccounts(data) {
  if (!data.accounts || data.accounts.length === 0) {
    return `
      <div class="lv-empty">
        <strong>No linked accounts yet.</strong>
        <div>Use Add Account to onboard your first MT4/MT5 profile with read-only scopes.</div>
      </div>
    `;
  }

  return `
    <div class="lv-note">
      Credentials remain encrypted. Link Vault stores permission scope and audit events to protect account control.
    </div>
    <div class="lv-grid-two">
      ${data.accounts
        .map((account) => {
          const statusClass =
            account.status === "Connected"
              ? "good"
              : account.status === "Review"
              ? "warn"
              : "bad";
          return `
            <article class="lv-card">
              <h3>${account.alias}</h3>
              <p>${account.platform} • ${account.broker} • ${account.server}</p>
              <div class="lv-chip-row">
                <span class="lv-chip ${statusClass}">${account.status}</span>
                <span class="lv-chip">${account.accountNumberMasked}</span>
                <span class="lv-chip">Last Sync ${formatDate(account.lastSyncAt)}</span>
              </div>
              <section class="lv-metrics-grid">
                ${rowMetric("Balance", formatUsd(account.metrics.balanceUsd))}
                ${rowMetric("Equity", formatUsd(account.metrics.equityUsd))}
                ${rowMetric("Growth", formatPct(account.metrics.growthPct30d))}
                ${rowMetric("Drawdown", formatPct(account.metrics.drawdownPct30d))}
                ${rowMetric("Win Rate", formatPct(account.metrics.winRatePct30d))}
                ${rowMetric("Best Pair", account.metrics.bestPair)}
                ${rowMetric("Worst Pair", account.metrics.worstPair)}
                ${rowMetric("Active Bots", account.metrics.activeBots)}
                ${rowMetric("Mission Mode", account.metrics.missionMode)}
                ${rowMetric("VPS Status", account.metrics.vpsStatus)}
              </section>
              <p>
                Access: ${account.credentialSecurity.accessMethod} | Rotated ${formatDate(
                  account.credentialSecurity.lastRotatedAt
                )}
              </p>
              <div class="lv-chip-row">
                ${account.permissions.map((scope) => `<span class="lv-chip">${scope}</span>`).join("")}
              </div>
            </article>
          `;
        })
        .join("")}
    </div>
  `;
}

function renderAddAccount(data, state) {
  const defaults = data.onboardingDefaults || {};
  return `
    <div class="lv-note">
      Link onboarding is secured with encrypted credential handling and scope-limited permissions.
      Emergency disconnect can be triggered instantly from Protections.
    </div>
    <div class="lv-chip-row" style="margin-bottom:8px;">
      <span class="lv-chip">User-Supplied</span>
      <span class="lv-chip">Placeholder Integration</span>
    </div>
    <form id="lv-add-account-form" class="lv-form" autocomplete="off">
      <div class="lv-field">
        <label for="lv-account-alias">Account Alias</label>
        <input id="lv-account-alias" name="alias" placeholder="Example: Titan London Session" required />
      </div>
      <div class="lv-field">
        <label for="lv-platform">Platform</label>
        <select id="lv-platform" name="platform" required>
          ${defaults.platforms
            .map((platform) => `<option value="${platform}">${platform}</option>`)
            .join("")}
        </select>
      </div>
      <div class="lv-field">
        <label for="lv-broker">Broker</label>
        <input id="lv-broker" name="broker" placeholder="Broker name" required />
      </div>
      <div class="lv-field">
        <label for="lv-server">Server</label>
        <input id="lv-server" name="server" placeholder="Server identifier" required />
      </div>
      <div class="lv-field">
        <label for="lv-account-number">Account Number</label>
        <input id="lv-account-number" name="accountNumber" inputmode="numeric" placeholder="Numeric account ID" required />
      </div>
      <div class="lv-field">
        <label for="lv-access-method">Access Method</label>
        <select id="lv-access-method" name="accessMethod" required>
          ${defaults.accessMethods
            .map((method) => `<option value="${method}">${method}</option>`)
            .join("")}
        </select>
      </div>
      <div class="lv-field">
        <label for="lv-credential">Credential Secret</label>
        <input id="lv-credential" name="credential" type="password" placeholder="Stored encrypted (never shown in plain text)" required />
      </div>
      <div class="lv-field">
        <label for="lv-mission-mode">Mission Mode</label>
        <select id="lv-mission-mode" name="missionMode" required>
          ${defaults.missionModes
            .map((mode) => `<option value="${mode}">${mode}</option>`)
            .join("")}
        </select>
      </div>
      <div class="lv-field">
        <label for="lv-vps-region">VPS Region</label>
        <select id="lv-vps-region" name="vpsRegion" required>
          ${defaults.vpsRegions
            .map((region) => `<option value="${region}">${region}</option>`)
            .join("")}
        </select>
      </div>
      <div class="lv-field full">
        <label>Permission Scope</label>
        <div class="lv-permissions">
          ${defaults.permissionScopes
            .map(
              (scope, index) => `
                <label>
                  <input type="checkbox" name="scope-${index}" ${index < 3 ? "checked" : ""} />
                  <span>${scope}</span>
                </label>
              `
            )
            .join("")}
        </div>
      </div>
      <div class="lv-field full">
        <label for="lv-notes">Onboarding Notes</label>
        <textarea id="lv-notes" name="notes" rows="3" placeholder="Audit note for why this account is being linked"></textarea>
      </div>
      <div class="lv-btn-row">
        <button class="lv-btn primary" type="submit">Start Secure Link</button>
        <button class="lv-btn" type="reset">Clear Form</button>
      </div>
    </form>
    ${
      state.lastFormMessage
        ? `<div class="lv-note" style="margin-top:12px;">${state.lastFormMessage}</div>`
        : ""
    }
  `;
}

function renderAnalytics(data) {
  const accounts = data.accounts || [];
  if (accounts.length === 0) {
    return '<div class="lv-empty">Account analytics will appear once accounts are linked.</div>';
  }

  return `
    <div class="lv-note">
      Analytics below are simulated from mock account telemetry. Live pipeline wiring is pending.
    </div>
    <div class="lv-table-wrap">
      <table class="lv-table" aria-label="Account analytics table">
        <thead>
          <tr>
            <th>Account</th>
            <th>Balance</th>
            <th>Equity</th>
            <th>Growth</th>
            <th>Drawdown</th>
            <th>Win Rate</th>
            <th>Best Pair</th>
            <th>Worst Pair</th>
            <th>Active Bots</th>
            <th>Mission Mode</th>
            <th>VPS Status</th>
          </tr>
        </thead>
        <tbody>
          ${accounts
            .map(
              (account) => `
            <tr>
              <td>${account.alias}</td>
              <td>${formatUsd(account.metrics.balanceUsd)}</td>
              <td>${formatUsd(account.metrics.equityUsd)}</td>
              <td>${formatPct(account.metrics.growthPct30d)}</td>
              <td>${formatPct(account.metrics.drawdownPct30d)}</td>
              <td>${formatPct(account.metrics.winRatePct30d)}</td>
              <td>${account.metrics.bestPair}</td>
              <td>${account.metrics.worstPair}</td>
              <td>${account.metrics.activeBots}</td>
              <td>${account.metrics.missionMode}</td>
              <td>${account.metrics.vpsStatus}</td>
            </tr>
          `
            )
            .join("")}
        </tbody>
      </table>
    </div>
  `;
}

function renderCopierProfiles(data) {
  const copiers = data.copierProfiles || [];
  if (copiers.length === 0) {
    return '<div class="lv-empty">No copier profiles configured yet.</div>';
  }
  return `
    <div class="lv-note">
      Copier permissions are restricted to trade mirroring only. Funds movement remains locked by policy.
    </div>
    <div class="lv-grid-two">
      ${copiers
        .map((copier) => {
          const statusClass = copier.status === "Active" ? "good" : "warn";
          return `
            <article class="lv-card">
              <h3>${copier.name}</h3>
              <p>${copier.strategy}</p>
              <div class="lv-chip-row">
                <span class="lv-chip ${statusClass}">${copier.status}</span>
                <span class="lv-chip">Linked Accounts ${copier.linkedAccounts}</span>
                <span class="lv-chip">Latency ${copier.latencyMs}ms</span>
              </div>
              <section class="lv-metrics-grid">
                ${rowMetric("Success Rate", formatPct(copier.successRatePct))}
                ${rowMetric("Risk Cap", formatPct(copier.riskCapPct))}
                ${rowMetric("Last Run", formatDate(copier.lastRunAt))}
              </section>
              <div class="lv-chip-row">
                ${copier.permissions.map((scope) => `<span class="lv-chip">${scope}</span>`).join("")}
              </div>
            </article>
          `;
        })
        .join("")}
    </div>
  `;
}

function renderProtections(data) {
  const protections = data.protections || {};
  const audits = protections.lastAuditChecks || [];
  return `
    <div class="lv-note">
      Emergency disconnect instantly pauses copiers, blocks command sync, and flags all sessions for re-authentication.
    </div>
    <div class="lv-grid-two">
      <article class="lv-card">
        <h3>Protection Rules</h3>
        <section class="lv-metrics-grid">
          ${rowMetric("Daily Drawdown Cap", formatPct(protections.maxDailyDrawdownPct))}
          ${rowMetric("Daily Loss Cap", formatPct(protections.maxDailyLossPct))}
          ${rowMetric("Caution Trigger", `${protections.cautionAtPctOfDailyLossLimit}% of daily loss limit`)}
          ${rowMetric("Max Consecutive Losses", protections.maxConsecutiveLosses)}
          ${rowMetric("Sync Gap Auto Cutoff", `${protections.autoDisconnectOnSyncGapMin} min`)}
          ${rowMetric("Kill Switch", protections.killSwitchArmed ? "Armed" : "Disarmed")}
          ${rowMetric(
            "VPS Degraded Auto Disconnect",
            protections.autoDisconnectOnVpsDegraded ? "Enabled" : "Disabled"
          )}
        </section>
        <div class="lv-btn-row">
          <button id="lv-kill-switch" class="lv-btn warn" type="button">Emergency Disconnect All</button>
        </div>
        <p class="lv-subtitle" style="margin-top:10px;">
          Risk policy: at 65% of daily loss limit -> Caution and scalping downgraded to monitor-only. At 100% daily loss -> no new automated entries, managed exit only, ladder/add permissions disabled. At 100% drawdown breach -> pause all automated bots/squads until manual acknowledgment.
        </p>
      </article>
      <article class="lv-card">
        <h3>Audit and Action History</h3>
        <ul class="lv-timeline">
          ${
            audits.length === 0
              ? "<li>No audits recorded.</li>"
              : audits
                  .map(
                    (item) => `
                <li>
                  <strong>${item.action}</strong><br />
                  ${item.actor} • ${item.result} • ${formatDate(item.at)}
                </li>
              `
                  )
                  .join("")
          }
        </ul>
      </article>
    </div>
  `;
}

function renderAccountHistory(data) {
  const history = data.accountHistory || [];
  if (history.length === 0) {
    return '<div class="lv-empty">No account history yet. Actions will appear here after onboarding.</div>';
  }

  return `
    <div class="lv-note">
      Account history is immutable and intended for trust verification, compliance review, and operator transparency.
    </div>
    <div class="lv-btn-row" style="margin-bottom:10px;">
      <button id="lv-export-history" class="lv-btn" type="button">Export Audit CSV</button>
    </div>
    <div class="lv-table-wrap">
      <table class="lv-table" aria-label="Account action history">
        <thead>
          <tr>
            <th>Time</th>
            <th>Account</th>
            <th>Actor</th>
            <th>Action</th>
            <th>Outcome</th>
            <th>Details</th>
          </tr>
        </thead>
        <tbody>
          ${history
            .map(
              (item) => `
            <tr>
              <td>${formatDate(item.at)}</td>
              <td>${item.accountAlias}</td>
              <td>${item.actor}</td>
              <td>${item.action}</td>
              <td>${item.outcome}</td>
              <td>${item.detail}</td>
            </tr>
          `
            )
            .join("")}
        </tbody>
      </table>
    </div>
  `;
}

function renderActiveTab(data, tabId, state) {
  if (tabId === "my-accounts") return renderMyAccounts(data);
  if (tabId === "add-account") return renderAddAccount(data, state);
  if (tabId === "analytics") return renderAnalytics(data);
  if (tabId === "copier-profiles") return renderCopierProfiles(data);
  if (tabId === "protections") return renderProtections(data);
  if (tabId === "history") return renderAccountHistory(data);
  return '<div class="lv-error">Unknown Link Vault section.</div>';
}

export function createLinkVaultDomain(options = {}) {
  injectStyles();

  const state = {
    status: "loading",
    activeTab: TABS.some((tab) => tab.id === options.initialTab) ? options.initialTab : "my-accounts",
    lastFormMessage: "",
    // TODO(link-vault-backend): replace local mock data with Link Vault API response when backend is available.
    data: options.data || linkVaultMockData,
  };

  const root = document.createElement("section");
  root.className = "lv-wrap";

  const render = () => {
    root.innerHTML = `
      <header class="lv-header">
        <div>
          <h2 class="lv-title">Link Vault</h2>
          <p class="lv-subtitle">
            Secure account linking with scoped permissions, audit visibility, and operational safety checks.
          </p>
        </div>
        <span class="lv-trust-pill">Encrypted Credential Handling</span>
      </header>
      <div class="lv-chip-row" style="margin-bottom:10px;">
        <span class="lv-chip">Simulation</span>
        <span class="lv-chip">User-Supplied</span>
        <span class="lv-chip">Placeholder Integration</span>
      </div>
      ${renderSummary(state.data)}
      <nav class="lv-tabs" aria-label="Link Vault sections">
        ${TABS.map(
          (tab) =>
            `<button class="lv-tab ${tab.id === state.activeTab ? "active" : ""}" type="button" data-tab="${
              tab.id
            }">${tab.label}</button>`
        ).join("")}
      </nav>
      <section class="lv-panel" id="lv-panel">
        ${
          state.status === "loading"
            ? '<div class="lv-loading">Loading Link Vault telemetry and security state...</div>'
            : state.status === "error"
            ? '<div class="lv-error">Failed to load Link Vault data. Retry to fetch latest account snapshots.</div><div class="lv-btn-row"><button id="lv-retry-load" class="lv-btn primary" type="button">Retry Load</button></div>'
            : renderActiveTab(state.data, state.activeTab, state)
        }
      </section>
    `;

    root.querySelectorAll(".lv-tab").forEach((tabButton) => {
      tabButton.addEventListener("click", () => {
        state.activeTab = tabButton.getAttribute("data-tab") || "my-accounts";
        render();
      });
    });

    const retryButton = root.querySelector("#lv-retry-load");
    if (retryButton) {
      retryButton.addEventListener("click", () => {
        state.status = "loading";
        render();
        window.setTimeout(() => {
          state.status = "ready";
          render();
        }, 350);
      });
    }

    const addForm = root.querySelector("#lv-add-account-form");
    if (addForm) {
      addForm.addEventListener("submit", (event) => {
        event.preventDefault();
        const formData = new FormData(addForm);
        const alias = String(formData.get("alias") || "New Account");
        state.lastFormMessage = `Secure link request staged for "${alias}". Credentials are queued for encrypted backend processing and audit logging.`;
        // TODO(link-vault-backend): POST /api/link-vault/accounts to create account link and return canonical account id.
        // TODO(link-vault-backend): append persisted audit event from API response to accountHistory feed.
        render();
      });
    }

    const killSwitchButton = root.querySelector("#lv-kill-switch");
    if (killSwitchButton) {
      killSwitchButton.addEventListener("click", () => {
        state.lastFormMessage =
          "Emergency disconnect request staged. Pending operator confirmation and backend execution.";
        // TODO(link-vault-backend): POST /api/link-vault/disconnect-all and surface job status updates.
        state.activeTab = "add-account";
        render();
      });
    }

    const exportHistoryButton = root.querySelector("#lv-export-history");
    if (exportHistoryButton) {
      exportHistoryButton.addEventListener("click", () => {
        state.lastFormMessage =
          "Audit export requested. File generation is pending backend implementation.";
        // TODO(link-vault-backend): GET /api/link-vault/history/export?format=csv and stream signed download URL.
        state.activeTab = "add-account";
        render();
      });
    }
  };

  render();

  window.setTimeout(() => {
    if (options.simulateError) {
      state.status = "error";
      render();
      return;
    }
    state.status = "ready";
    render();
  }, Number(options.loadingDelayMs ?? 320));

  return root;
}

export function mountLinkVaultDomain(container, options = {}) {
  if (!container) return null;
  container.innerHTML = "";
  const view = createLinkVaultDomain(options);
  container.appendChild(view);
  return view;
}
