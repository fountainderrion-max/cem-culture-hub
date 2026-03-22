import { socialMock } from "../../data/social-mock.js";
import { bindInteractionButtons, renderInteractionBar } from "./social-actions.js";
import { ensureSocialTheme } from "./social-theme.js";
import { compactNumber, esc, formatPercent, renderShellHeader, renderStateCard, timeAgo } from "./social-utils.js";

function renderTabPanel(profile, tabId) {
  if (tabId === "missions") {
    return `
      <div class="social-metric-grid">
        <div class="social-metric-card">
          <p class="social-metric-label">Mission consistency</p>
          <p class="social-metric-value social-kpi">92 / 100</p>
        </div>
        <div class="social-metric-card">
          <p class="social-metric-label">Current streak</p>
          <p class="social-metric-value">11 weeks</p>
        </div>
        <div class="social-metric-card">
          <p class="social-metric-label">Drawdown cap</p>
          <p class="social-metric-value social-warning">${esc(formatPercent(profile.drawdownCap))}</p>
        </div>
      </div>
    `;
  }

  if (tabId === "bots") {
    return `
      <div class="social-list">
        <div class="social-panel">
          <p class="social-panel-title">Scalp Hydra v10</p>
          <p class="social-panel-subtitle">Paper route promoted, live deploy simulated.</p>
        </div>
        <div class="social-panel">
          <p class="social-panel-title">Echo Trend Grid</p>
          <p class="social-panel-subtitle">Needs volatility retune before mission unlock.</p>
        </div>
      </div>
    `;
  }

  if (tabId === "vault") {
    return `
      <div class="social-panel">
        <p class="social-panel-title">Link Vault Snapshot</p>
        <p class="social-panel-subtitle">Broker sync and copier impact remain simulated until adapters are connected.</p>
      </div>
    `;
  }

  return `
    <div class="social-metric-grid">
      ${(profile.highlights || [])
        .map(
          (item) => `
        <div class="social-metric-card">
          <p class="social-metric-label">${esc(item.label)}</p>
          <p class="social-metric-value">${esc(item.value)}</p>
        </div>
      `
        )
        .join("")}
    </div>
  `;
}

function bindProfileTabs(route) {
  const tabs = Array.from(route.querySelectorAll("[data-social-tab]"));
  const panels = Array.from(route.querySelectorAll("[data-social-panel]"));
  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const id = tab.getAttribute("data-social-tab");
      tabs.forEach((btn) => btn.setAttribute("aria-selected", String(btn === tab)));
      panels.forEach((panel) => panel.classList.toggle("active", panel.getAttribute("data-social-panel") === id));
    });
  });
}

export function createProfileView(options = {}) {
  ensureSocialTheme();
  const data = options.data || socialMock;
  const profile = data?.profile;
  const route = document.createElement("section");
  route.className = "social-route social-profile";

  if (!profile) {
    route.innerHTML = renderStateCard("error", "Profile data unavailable. Try refreshing the social domain data source.");
    return route;
  }

  route.innerHTML = `
    ${renderShellHeader({
      title: "Profile Command Deck",
      chips: [
        { label: `Rank: ${profile.rank}`, kind: "live" },
        { label: "Simulated growth sync", kind: "sim" }
      ]
    })}
    <section class="social-banner">
      <div class="social-row">
        <div class="social-user">
          <span class="social-avatar social-avatar-lg">${esc(profile.avatar)}</span>
          <div>
            <h3 class="social-panel-title" style="margin-bottom:0.1rem;">${esc(profile.displayName)}</h3>
            <p class="social-panel-subtitle">@${esc(profile.handle)}  |  ${esc(profile.squad)}</p>
            <p class="social-panel-subtitle">${esc(profile.bannerSubtitle)}</p>
          </div>
        </div>
        <button type="button" class="social-btn social-btn-primary" data-social-action="follow" data-social-count="${Number(
          profile.followers || 0
        )}" aria-pressed="false">Follow <span>${compactNumber(profile.followers)}</span></button>
      </div>
      <div class="social-divider"></div>
      <p class="social-muted">${esc(profile.simulatedStats)}</p>
      <div class="social-shell-chip-row">
        <span class="social-chip social-chip-sim">Simulation</span>
        <span class="social-chip">User-Supplied</span>
        <span class="social-chip">Placeholder Integration</span>
      </div>
      <div class="social-shell-chip-row" style="margin-top:0.45rem;">
        ${(profile.badges || [])
          .map((badge) => `<span class="social-tag">${esc(`${badge.name}  |  ${badge.tier}`)}</span>`)
          .join("")}
      </div>
    </section>

    <section class="social-grid social-grid-two" style="margin-top:0.85rem;">
      <div class="social-panel">
        <h3 class="social-panel-title">Profile Metrics</h3>
        <div class="social-metric-grid">
          <div class="social-metric-card">
            <p class="social-metric-label">Culture Points</p>
            <p class="social-metric-value social-kpi">${compactNumber(profile.culturePoints)}</p>
          </div>
          <div class="social-metric-card">
            <p class="social-metric-label">Followers</p>
            <p class="social-metric-value">${compactNumber(profile.followers)}</p>
          </div>
          <div class="social-metric-card">
            <p class="social-metric-label">Following</p>
            <p class="social-metric-value">${compactNumber(profile.following)}</p>
          </div>
          <div class="social-metric-card">
            <p class="social-metric-label">Win Rate</p>
            <p class="social-metric-value">${formatPercent(profile.winRate)}</p>
          </div>
        </div>
      </div>
      <div class="social-panel">
        <h3 class="social-panel-title">Action Shell</h3>
        <p class="social-panel-subtitle">Interaction controls are UI shells until messaging and follow mutations are wired.</p>
        ${renderInteractionBar(
          {
            likes: 48,
            comments: 10,
            reposts: 6,
            saves: 22,
            follows: 9
          },
          "profile-shell-actions"
        )}
      </div>
    </section>

    <section class="social-panel" style="margin-top:0.85rem;">
      <div class="social-tabs" role="tablist" aria-label="Profile sections">
        ${(profile.tabs || [])
          .map(
            (tab, index) => `
          <button type="button" class="social-tab" data-social-tab="${esc(tab.id)}" aria-selected="${index === 0 ? "true" : "false"}">
            ${esc(tab.label)}
          </button>
        `
          )
          .join("")}
      </div>
      <div style="margin-top:0.75rem;">
        ${(profile.tabs || [])
          .map(
            (tab, index) => `
          <div class="social-tab-panel ${index === 0 ? "active" : ""}" data-social-panel="${esc(tab.id)}">
            ${renderTabPanel(profile, tab.id)}
          </div>
        `
          )
          .join("")}
      </div>
    </section>

    <section class="social-panel" style="margin-top:0.85rem;">
      <h3 class="social-panel-title">Access Upgrade Request</h3>
      <p class="social-panel-subtitle">Apply for Provider / Operator access. Elevated roles are manually vetted by Admin before activation.</p>
      <div class="social-shell-chip-row">
        <span class="social-chip">User Default</span>
        <span class="social-chip">Admin Approval Required</span>
      </div>
    </section>

    <section class="social-panel" style="margin-top:0.85rem;">
      <h3 class="social-panel-title">Recent Activity</h3>
      <div class="social-list">
        ${
          profile.recentActivity?.length
            ? profile.recentActivity
                .map(
                  (item) => `
                <article class="social-panel">
                  <h4 class="social-panel-title" style="margin-bottom:0.15rem;">${esc(item.title)}</h4>
                  <p class="social-panel-subtitle">${esc(item.detail)}</p>
                  <p class="social-muted" style="margin-top:0.35rem;">${esc(timeAgo(item.time))}</p>
                  ${renderInteractionBar(item.interactions, item.id)}
                </article>
              `
                )
                .join("")
            : renderStateCard("empty", "No profile activity yet.")
        }
      </div>
    </section>
  `;

  bindProfileTabs(route);
  bindInteractionButtons(route, options);
  return route;
}

export function renderProfileView(container, options = {}) {
  if (!container) return null;
  const view = createProfileView(options);
  container.replaceChildren(view);
  return view;
}
