import { compactNumber, esc, normalizeActionLabel } from "./social-utils.js";

const ACTION_ICONS = {
  like: "Like",
  comment: "Comment",
  repost: "Repost",
  save: "Save",
  follow: "Follow"
};

export function renderInteractionBar(interactions = {}, contextId = "social") {
  const model = {
    like: Number(interactions.likes || 0),
    comment: Number(interactions.comments || 0),
    repost: Number(interactions.reposts || 0),
    save: Number(interactions.saves || 0),
    follow: Number(interactions.follows || 0)
  };

  return `
    <div class="social-action-row" data-action-context="${esc(contextId)}">
      ${Object.entries(model)
        .map(([action, count]) => {
          const text = ACTION_ICONS[action] || normalizeActionLabel(action);
          return `
            <button
              type="button"
              class="social-btn"
              data-social-action="${esc(action)}"
              data-social-count="${count}"
              aria-pressed="false"
            >
              ${esc(text)} <span>${compactNumber(count)}</span>
            </button>
          `;
        })
        .join("")}
    </div>
  `;
}

export function bindInteractionButtons(root, options = {}) {
  if (!root) return;
  root.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-social-action]");
    if (!button) return;
    const action = button.getAttribute("data-social-action");
    const current = Number(button.getAttribute("data-social-count") || 0);
    const active = button.getAttribute("aria-pressed") === "true";
    const nextActive = !active;
    const nextCount = Math.max(0, current + (nextActive ? 1 : -1));
    button.setAttribute("aria-pressed", String(nextActive));
    button.classList.toggle("active", nextActive);
    button.setAttribute("data-social-count", String(nextCount));
    const label = ACTION_ICONS[action] || normalizeActionLabel(action);
    button.innerHTML = `${esc(label)} <span>${compactNumber(nextCount)}</span>`;

    if (typeof options.onAction === "function") {
      options.onAction({
        action,
        active: nextActive,
        count: nextCount,
        context: button
          .closest("[data-action-context]")
          ?.getAttribute("data-action-context")
      });
    }
  });
}

