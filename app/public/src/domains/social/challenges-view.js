import { socialMock } from "../../data/social-mock.js";
import { bindInteractionButtons, renderInteractionBar } from "./social-actions.js";
import { ensureSocialTheme } from "./social-theme.js";
import { esc, renderShellHeader, renderStateCard } from "./social-utils.js";

function renderChallengeCard(challenge, selected) {
  const statusKind = challenge.status === "Live" ? "live" : challenge.status === "Registration" ? "sim" : "";
  return `
    <button
      type="button"
      class="social-panel social-btn-reset ${selected ? "active" : ""}"
      data-challenge-id="${esc(challenge.id)}"
      style="text-align:left; width:100%; border-radius:14px; cursor:pointer;"
    >
      <div class="social-row">
        <p class="social-panel-title">${esc(challenge.name)}</p>
        <span class="social-chip ${statusKind ? `social-chip-${statusKind}` : ""}">${esc(challenge.status)}</span>
      </div>
      <p class="social-panel-subtitle">${esc(challenge.format)}</p>
      <div class="social-shell-chip-row" style="margin-top:0.35rem;">
        <span class="social-tag">${esc(`${challenge.participants} participants`)}</span>
        <span class="social-tag">${esc(challenge.entryCost)}</span>
      </div>
    </button>
  `;
}

function renderChallengeDetail(challenge) {
  if (!challenge) return renderStateCard("empty", "Select a challenge to inspect details.");
  return `
    <article class="social-panel social-panel-strong">
      <h3 class="social-panel-title">${esc(challenge.name)}</h3>
      <p class="social-panel-subtitle">${esc(challenge.objective)}</p>
      <div class="social-shell-chip-row" style="margin-top:0.45rem;">
        <span class="social-tag">${esc(challenge.format)}</span>
        <span class="social-tag">${esc(challenge.rewardPool)}</span>
        <span class="social-tag">${esc(`${challenge.participants} in arena`)}</span>
      </div>
      <div class="social-divider"></div>
      <h4 class="social-panel-title">Rules</h4>
      <ul style="margin:0.35rem 0 0; padding-left:1.1rem;">
        ${(challenge.rules || []).map((rule) => `<li class="social-panel-subtitle">${esc(rule)}</li>`).join("")}
      </ul>
      ${renderInteractionBar(
        {
          likes: Math.round(challenge.participants * 0.6),
          comments: Math.round(challenge.participants * 0.32),
          reposts: Math.round(challenge.participants * 0.2),
          saves: Math.round(challenge.participants * 0.44),
          follows: Math.round(challenge.participants * 0.16)
        },
        challenge.id
      )}
    </article>
  `;
}

function renderLiveBoard(entries) {
  if (!entries?.length) return renderStateCard("empty", "Live board data is not available.");
  return `
    <table class="social-table">
      <thead>
        <tr>
          <th>#</th>
          <th>Trader</th>
          <th>Score</th>
          <th>Quality</th>
          <th>Risk</th>
          <th>Move</th>
        </tr>
      </thead>
      <tbody>
        ${entries
          .map(
            (entry) => `
          <tr>
            <td>${esc(entry.rank)}</td>
            <td>${esc(entry.entry)}</td>
            <td>${esc(entry.score)}</td>
            <td>${esc(entry.quality)}</td>
            <td>${esc(entry.risk)}</td>
            <td>${esc(entry.change)}</td>
          </tr>
        `
          )
          .join("")}
      </tbody>
    </table>
  `;
}

function bindChallengeSelection(route, challenges, detailRoot) {
  route.addEventListener("click", (event) => {
    const trigger = event.target.closest("[data-challenge-id]");
    if (!trigger) return;
    const selectedId = trigger.getAttribute("data-challenge-id");
    route.querySelectorAll("[data-challenge-id]").forEach((item) => item.classList.remove("active"));
    trigger.classList.add("active");
    const selected = challenges.find((challenge) => challenge.id === selectedId);
    detailRoot.innerHTML = renderChallengeDetail(selected);
  });
}

export function createChallengesView(options = {}) {
  ensureSocialTheme();
  const data = options.data || socialMock;
  const route = document.createElement("section");
  route.className = "social-route social-challenges";
  const challenges = data?.challenges?.list || [];
  const selectedChallenge =
    challenges.find((item) => item.id === data?.challenges?.featuredId) || challenges[0] || null;

  route.innerHTML = `
    ${renderShellHeader({
      title: "Challenges Arena",
      chips: [
        { label: "Live board shell", kind: "live" },
        { label: "Reward settlement simulated", kind: "sim" }
      ]
    })}
    <div class="social-panel">
      <p class="social-panel-subtitle">${esc(data?.challenges?.simulatedState || "Challenge settlement currently simulated.")}</p>
    </div>
    <section class="social-grid social-grid-two" style="margin-top:0.8rem;">
      <div class="social-panel">
        <h3 class="social-panel-title">Challenge Listings</h3>
        <div class="social-list" data-challenge-list>
          ${
            challenges.length
              ? challenges
                  .map((item) => renderChallengeCard(item, item.id === selectedChallenge?.id))
                  .join("")
              : renderStateCard("empty", "No challenges available.")
          }
        </div>
      </div>
      <div class="social-list">
        <div class="social-panel" data-challenge-detail>
          ${renderChallengeDetail(selectedChallenge)}
        </div>
        <div class="social-panel">
          <h3 class="social-panel-title">Live Board</h3>
          ${renderLiveBoard(data?.challenges?.liveBoard || [])}
        </div>
      </div>
    </section>
    <section class="social-panel" style="margin-top:0.85rem;">
      <h3 class="social-panel-title">Reward Concepts</h3>
      <div class="social-metric-grid">
        ${(data?.challenges?.rewardConcepts || [])
          .map(
            (reward) => `
          <article class="social-metric-card">
            <p class="social-metric-label">${esc(reward.name)}</p>
            <p class="social-metric-value" style="font-size:0.86rem; font-weight:500;">${esc(reward.detail)}</p>
          </article>
        `
          )
          .join("")}
      </div>
    </section>
  `;

  const detailRoot = route.querySelector("[data-challenge-detail]");
  if (detailRoot) {
    bindChallengeSelection(route, challenges, detailRoot);
  }
  bindInteractionButtons(route, options);
  return route;
}

export function renderChallengesView(container, options = {}) {
  if (!container) return null;
  const view = createChallengesView(options);
  container.replaceChildren(view);
  return view;
}

