import { socialMock } from "../../data/social-mock.js";
import { bindInteractionButtons, renderInteractionBar } from "./social-actions.js";
import { ensureSocialTheme } from "./social-theme.js";
import { esc, renderShellHeader, renderStateCard, timeAgo } from "./social-utils.js";

const LEADERBOARD_TABS = [
  { id: "users", label: "Users" },
  { id: "providers", label: "Providers" },
  { id: "squads", label: "Squads" },
  { id: "bots", label: "Bots" },
  { id: "challenges", label: "Challenges" }
];

function renderRows(rows) {
  if (!rows?.length) return renderStateCard("empty", "Leaderboard is waiting for events.");
  return `
    <table class="social-table">
      <thead>
        <tr>
          <th>Rank</th>
          <th>Name</th>
          <th>Score</th>
          <th>Change</th>
          <th>Signal</th>
        </tr>
      </thead>
      <tbody>
        ${rows
          .map(
            (row) => `
          <tr>
            <td>${esc(row.rank)}</td>
            <td>${esc(row.name)}</td>
            <td>${esc(row.score)}</td>
            <td class="${String(row.delta || "").startsWith("-") ? "social-danger" : "social-kpi"}">${esc(row.delta)}</td>
            <td>${esc(row.metric)}</td>
          </tr>
        `
          )
          .join("")}
      </tbody>
    </table>
  `;
}

function bindLeaderboardTabs(route, views) {
  const tabs = Array.from(route.querySelectorAll("[data-leaderboard-tab]"));
  const output = route.querySelector("[data-leaderboard-table]");
  if (!output) return;

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const target = tab.getAttribute("data-leaderboard-tab");
      tabs.forEach((item) => item.setAttribute("aria-selected", String(item === tab)));
      output.innerHTML = renderRows(views[target] || []);
    });
  });
}

export function createLeaderboardView(options = {}) {
  ensureSocialTheme();
  const data = options.data || socialMock;
  const views = data?.leaderboards?.views || {};
  const route = document.createElement("section");
  route.className = "social-route social-leaderboard";

  route.innerHTML = `
    ${renderShellHeader({
      title: "Leaderboard Matrix",
      chips: [
        { label: "Users / Providers / Squads / Bots / Challenges", kind: "live" },
        { label: "Scores include simulated adapters", kind: "sim" }
      ]
    })}
    <div class="social-panel">
      <div class="social-row">
        <p class="social-panel-subtitle">Updated ${esc(timeAgo(data?.leaderboards?.updatedAt))}</p>
        <span class="social-chip social-chip-sim">Settlement simulated</span>
      </div>
      <div class="social-shell-chip-row" style="margin-top:0.45rem;">
        <span class="social-chip social-chip-sim">Simulation</span>
        <span class="social-chip">Placeholder Integration</span>
      </div>
      <div class="social-tabs" role="tablist" aria-label="Leaderboard views" style="margin-top:0.5rem;">
        ${LEADERBOARD_TABS.map(
          (tab, idx) => `
          <button type="button" class="social-tab" data-leaderboard-tab="${esc(tab.id)}" aria-selected="${idx === 0 ? "true" : "false"}">
            ${esc(tab.label)}
          </button>
        `
        ).join("")}
      </div>
    </div>
    <section class="social-grid social-grid-two" style="margin-top:0.85rem;">
      <div class="social-panel" data-leaderboard-table>
        ${renderRows(views.users || [])}
      </div>
      <div class="social-panel">
        <h3 class="social-panel-title">Engagement Actions</h3>
        <p class="social-panel-subtitle">Shell controls for following and saving leaderboard states.</p>
        ${renderInteractionBar(
          {
            likes: 42,
            comments: 13,
            reposts: 11,
            saves: 29,
            follows: 18
          },
          "leaderboard-actions"
        )}
      </div>
    </section>
  `;

  bindLeaderboardTabs(route, views);
  bindInteractionButtons(route, options);
  return route;
}

export function renderLeaderboardView(container, options = {}) {
  if (!container) return null;
  const view = createLeaderboardView(options);
  container.replaceChildren(view);
  return view;
}
