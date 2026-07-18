import { socialMock } from "../../data/social-mock.js";
import { bindInteractionButtons, renderInteractionBar } from "./social-actions.js";
import { ensureSocialTheme } from "./social-theme.js";
import { compactNumber, esc, formatPercent, renderShellHeader, renderStateCard, timeAgo } from "./social-utils.js";
import {
  ACCESS_LEVELS,
  getCurrentAccessLevel,
  purchaseAccessLevel,
  readCultureIdentity,
  updateCultureId
} from "./culture-access.js";

function renderTabPanel(profile, tabId) {
  if (tabId === "missions") {
    return `
      <div class="social-metric-grid">
        <div class="social-metric-card"><p class="social-metric-label">Mission consistency</p><p class="social-metric-value social-kpi">92 / 100</p></div>
        <div class="social-metric-card"><p class="social-metric-label">Current streak</p><p class="social-metric-value">11 weeks</p></div>
        <div class="social-metric-card"><p class="social-metric-label">Drawdown cap</p><p class="social-metric-value social-warning">${esc(formatPercent(profile.drawdownCap))}</p></div>
      </div>`;
  }
  if (tabId === "bots") {
    return `<div class="social-list"><div class="social-panel"><p class="social-panel-title">Scalp Hydra v10</p><p class="social-panel-subtitle">Paper route promoted, live deploy simulated.</p></div><div class="social-panel"><p class="social-panel-title">Echo Trend Grid</p><p class="social-panel-subtitle">Needs volatility retune before mission unlock.</p></div></div>`;
  }
  if (tabId === "vault") {
    return `<div class="social-panel"><p class="social-panel-title">Link Vault Snapshot</p><p class="social-panel-subtitle">Broker sync and copier impact remain simulated until adapters are connected.</p></div>`;
  }
  return `<div class="social-metric-grid">${(profile.highlights || []).map((item) => `<div class="social-metric-card"><p class="social-metric-label">${esc(item.label)}</p><p class="social-metric-value">${esc(item.value)}</p></div>`).join("")}</div>`;
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

function renderIdentityPanel(identity) {
  const access = getCurrentAccessLevel(identity);
  return `
    <section class="social-grid social-grid-two" style="margin-top:0.85rem;">
      <div class="social-panel">
        <h3 class="social-panel-title">Culture Identity</h3>
        <p class="social-panel-subtitle">Your Culture ID can be updated. Your permanent Culture Number never changes.</p>
        <div class="social-metric-grid" style="margin-top:0.7rem;">
          <div class="social-metric-card"><p class="social-metric-label">Culture ID</p><p class="social-metric-value" data-culture-id-display>@${esc(identity.cultureId)}</p></div>
          <div class="social-metric-card"><p class="social-metric-label">Culture Number</p><p class="social-metric-value">#${esc(identity.permanentNumber)}</p></div>
          <div class="social-metric-card"><p class="social-metric-label">Experience Rank</p><p class="social-metric-value">${esc(identity.experienceRank)}</p></div>
          <div class="social-metric-card"><p class="social-metric-label">Access Rank</p><p class="social-metric-value" data-access-level-display>${esc(access.label)}</p></div>
        </div>
        <form data-culture-id-form style="margin-top:0.8rem;display:grid;grid-template-columns:1fr auto;gap:0.6rem;">
          <input class="social-input" name="cultureId" maxlength="20" value="${esc(identity.cultureId)}" aria-label="Culture ID" />
          <button class="social-btn social-btn-primary" type="submit">Update ID</button>
        </form>
        <p class="social-muted" data-culture-id-message style="margin-top:0.45rem;">Letters, numbers, and underscores only.</p>
      </div>
      <div class="social-panel">
        <h3 class="social-panel-title">Unlocked Products</h3>
        <p class="social-panel-subtitle">Access can be earned through rank progression or purchased early.</p>
        <div class="social-list" data-product-unlocks style="margin-top:0.7rem;">
          ${access.productUnlocks.map((item) => `<div class="social-panel"><p class="social-panel-title">${esc(item)}</p><p class="social-panel-subtitle">Unlocked through ${esc(identity.accessSource)} access.</p></div>`).join("")}
        </div>
      </div>
    </section>`;
}

function renderAccessStore(identity) {
  return `
    <section class="social-panel" style="margin-top:0.85rem;">
      <h3 class="social-panel-title">Access Upgrade Store</h3>
      <p class="social-panel-subtitle">Members may bypass the access wait by purchasing an upgrade. Experience Rank remains earned and is never replaced by payment.</p>
      <div class="social-grid social-grid-two" style="margin-top:0.75rem;">
        ${ACCESS_LEVELS.map((level) => {
          const active = level.id === identity.accessLevel;
          return `<article class="social-panel">
            <div class="social-row"><div><h4 class="social-panel-title">${esc(level.label)}</h4><p class="social-panel-subtitle">${level.price ? `$${level.price} one-time access upgrade` : "Included"}</p></div><span class="social-chip ${active ? "social-chip-live" : ""}">${active ? "Active" : "Available"}</span></div>
            <div class="social-shell-chip-row" style="margin-top:0.55rem;">${level.productUnlocks.map((item) => `<span class="social-tag">${esc(item)}</span>`).join("")}</div>
            <button type="button" class="social-btn social-btn-primary" data-access-purchase="${esc(level.id)}" ${active ? "disabled" : ""} style="margin-top:0.7rem;">${active ? "Current Access" : level.price ? `Buy for $${level.price}` : "Activate"}</button>
          </article>`;
        }).join("")}
      </div>
      <p class="social-muted" data-access-message style="margin-top:0.6rem;">Payment checkout is represented as a shell until billing is connected.</p>
    </section>`;
}

function bindCultureAccess(route) {
  const form = route.querySelector("[data-culture-id-form]");
  const message = route.querySelector("[data-culture-id-message]");
  form?.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = new FormData(form);
    const result = updateCultureId(data.get("cultureId"));
    if (!result.ok) {
      if (message) message.textContent = result.message;
      return;
    }
    const display = route.querySelector("[data-culture-id-display]");
    if (display) display.textContent = `@${result.profile.cultureId}`;
    if (message) message.textContent = "Culture ID updated successfully.";
  });

  route.querySelectorAll("[data-access-purchase]").forEach((button) => {
    button.addEventListener("click", () => {
      const result = purchaseAccessLevel(button.getAttribute("data-access-purchase"));
      const accessMessage = route.querySelector("[data-access-message]");
      if (!result.ok) {
        if (accessMessage) accessMessage.textContent = result.message;
        return;
      }
      if (accessMessage) accessMessage.textContent = `${result.level.label} activated. Connect billing before production release.`;
      const display = route.querySelector("[data-access-level-display]");
      if (display) display.textContent = result.level.label;
      route.querySelectorAll("[data-access-purchase]").forEach((item) => {
        const isActive = item.getAttribute("data-access-purchase") === result.level.id;
        item.disabled = isActive;
        item.textContent = isActive ? "Current Access" : item.textContent;
      });
    });
  });
}

export function createProfileView(options = {}) {
  ensureSocialTheme();
  const data = options.data || socialMock;
  const profile = data?.profile;
  const identity = readCultureIdentity();
  const route = document.createElement("section");
  route.className = "social-route social-profile";

  if (!profile) {
    route.innerHTML = renderStateCard("error", "Profile data unavailable. Try refreshing the social domain data source.");
    return route;
  }

  route.innerHTML = `
    ${renderShellHeader({ title: "Profile Command Deck", chips: [{ label: `Rank: ${profile.rank}`, kind: "live" }, { label: `@${identity.cultureId}`, kind: "sim" }] })}
    <section class="social-banner">
      <div class="social-row"><div class="social-user"><span class="social-avatar social-avatar-lg">${esc(profile.avatar)}</span><div><h3 class="social-panel-title" style="margin-bottom:0.1rem;">${esc(profile.displayName)}</h3><p class="social-panel-subtitle">@${esc(identity.cultureId)} | ${esc(profile.squad)}</p><p class="social-panel-subtitle">${esc(profile.bannerSubtitle)}</p></div></div><button type="button" class="social-btn social-btn-primary" data-social-action="follow" data-social-count="${Number(profile.followers || 0)}" aria-pressed="false">Follow <span>${compactNumber(profile.followers)}</span></button></div>
      <div class="social-divider"></div><p class="social-muted">${esc(profile.simulatedStats)}</p>
      <div class="social-shell-chip-row"><span class="social-chip social-chip-sim">Simulation</span><span class="social-chip">User-Supplied</span><span class="social-chip">Placeholder Integration</span></div>
      <div class="social-shell-chip-row" style="margin-top:0.45rem;">${(profile.badges || []).map((badge) => `<span class="social-tag">${esc(`${badge.name} | ${badge.tier}`)}</span>`).join("")}</div>
    </section>
    ${renderIdentityPanel(identity)}
    ${renderAccessStore(identity)}
    <section class="social-grid social-grid-two" style="margin-top:0.85rem;"><div class="social-panel"><h3 class="social-panel-title">Profile Metrics</h3><div class="social-metric-grid"><div class="social-metric-card"><p class="social-metric-label">Culture Points</p><p class="social-metric-value social-kpi">${compactNumber(profile.culturePoints)}</p></div><div class="social-metric-card"><p class="social-metric-label">Followers</p><p class="social-metric-value">${compactNumber(profile.followers)}</p></div><div class="social-metric-card"><p class="social-metric-label">Following</p><p class="social-metric-value">${compactNumber(profile.following)}</p></div><div class="social-metric-card"><p class="social-metric-label">Win Rate</p><p class="social-metric-value">${formatPercent(profile.winRate)}</p></div></div></div><div class="social-panel"><h3 class="social-panel-title">Action Shell</h3><p class="social-panel-subtitle">Interaction controls are UI shells until messaging and follow mutations are wired.</p>${renderInteractionBar({ likes: 48, comments: 10, reposts: 6, saves: 22, follows: 9 }, "profile-shell-actions")}</div></section>
    <section class="social-panel" style="margin-top:0.85rem;"><div class="social-tabs" role="tablist" aria-label="Profile sections">${(profile.tabs || []).map((tab, index) => `<button type="button" class="social-tab" data-social-tab="${esc(tab.id)}" aria-selected="${index === 0 ? "true" : "false"}">${esc(tab.label)}</button>`).join("")}</div><div style="margin-top:0.75rem;">${(profile.tabs || []).map((tab, index) => `<div class="social-tab-panel ${index === 0 ? "active" : ""}" data-social-panel="${esc(tab.id)}">${renderTabPanel(profile, tab.id)}</div>`).join("")}</div></section>
    <section class="social-panel" style="margin-top:0.85rem;"><h3 class="social-panel-title">Recent Activity</h3><div class="social-list">${profile.recentActivity?.length ? profile.recentActivity.map((item) => `<article class="social-panel"><h4 class="social-panel-title" style="margin-bottom:0.15rem;">${esc(item.title)}</h4><p class="social-panel-subtitle">${esc(item.detail)}</p><p class="social-muted" style="margin-top:0.35rem;">${esc(timeAgo(item.time))}</p>${renderInteractionBar(item.interactions, item.id)}</article>`).join("") : renderStateCard("empty", "No profile activity yet.")}</div></section>`;

  bindProfileTabs(route);
  bindCultureAccess(route);
  bindInteractionButtons(route, options);
  return route;
}

export function renderProfileView(container, options = {}) {
  if (!container) return null;
  const view = createProfileView(options);
  container.replaceChildren(view);
  return view;
}
