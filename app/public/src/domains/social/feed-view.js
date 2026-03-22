import { socialMock, feedTypeLabels } from "../../data/social-mock.js";
import { bindInteractionButtons, renderInteractionBar } from "./social-actions.js";
import { ensureSocialTheme } from "./social-theme.js";
import { compactNumber, esc, renderShellHeader, renderStateCard, timeAgo } from "./social-utils.js";

function renderFeedPost(post) {
  return `
    <article class="social-panel social-panel-strong">
      <div class="social-row">
        <div class="social-user">
          <span class="social-avatar">${esc(post.author.avatar)}</span>
          <div>
            <p class="social-panel-title" style="margin-bottom:0.1rem;">${esc(post.author.handle)}</p>
            <p class="social-muted">${esc(post.author.rank)}  |  ${esc(timeAgo(post.timestamp))}</p>
          </div>
        </div>
        <div class="social-shell-chip-row">
          <span class="social-chip">${esc(feedTypeLabels[post.type] || "Update")}</span>
          ${
            post.simulated
              ? `<span class="social-chip social-chip-sim">Simulated signal</span>`
              : `<span class="social-chip social-chip-live">Live context</span>`
          }
        </div>
      </div>
      <div class="social-divider"></div>
      <h3 class="social-panel-title">${esc(post.title)}</h3>
      <p class="social-panel-subtitle">${esc(post.body)}</p>
      <div class="social-shell-chip-row" style="margin-top:0.45rem;">
        ${(post.symbols || []).map((symbol) => `<span class="social-tag">${esc(symbol)}</span>`).join("")}
      </div>
      ${
        post.metrics
          ? `
        <div class="social-metric-grid" style="margin-top:0.6rem;">
          ${Object.entries(post.metrics)
            .map(
              ([label, value]) => `
            <div class="social-metric-card">
              <p class="social-metric-label">${esc(label.replaceAll(/([A-Z])/g, " $1"))}</p>
              <p class="social-metric-value">${esc(
                Number.isFinite(value) ? compactNumber(value) : String(value)
              )}</p>
            </div>
          `
            )
            .join("")}
        </div>
      `
          : ""
      }
      ${renderInteractionBar(post.interactions, post.id)}
    </article>
  `;
}

export function createFeedView(options = {}) {
  ensureSocialTheme();
  const data = options.data || socialMock;
  const route = document.createElement("section");
  route.className = "social-route social-feed";
  const posts = data?.feed?.posts || [];

  route.innerHTML = `
    ${renderShellHeader({
      title: "Culture Feed",
      chips: [
        { label: data?.feed?.pulseWindow || "Session pulse", kind: "live" },
        { label: "Social shell interactions active", kind: "live" }
      ]
    })}
    <div class="social-panel">
      <p class="social-panel-subtitle">${esc(data?.simulatedNotice || "Simulated feeds are clearly labeled.")}</p>
    </div>
    <div class="social-grid social-list" style="margin-top:0.8rem;">
      ${
        posts.length === 0
          ? renderStateCard("empty", "No feed events yet. Follow providers and squads to populate your stream.")
          : posts.map((post) => renderFeedPost(post)).join("")
      }
    </div>
  `;

  bindInteractionButtons(route, options);
  return route;
}

export function renderFeedView(container, options = {}) {
  if (!container) return null;
  const view = createFeedView(options);
  container.replaceChildren(view);
  return view;
}

