export function esc(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function compactNumber(value) {
  if (!Number.isFinite(Number(value))) return "0";
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1
  }).format(Number(value));
}

export function formatNumber(value) {
  if (!Number.isFinite(Number(value))) return "0";
  return new Intl.NumberFormat("en-US").format(Number(value));
}

export function formatPercent(value, digits = 1) {
  if (!Number.isFinite(Number(value))) return "0%";
  return `${Number(value).toFixed(digits)}%`;
}

export function timeAgo(isoDate) {
  if (!isoDate) return "Just now";
  const input = new Date(isoDate).getTime();
  if (Number.isNaN(input)) return "Just now";
  const diffMs = Date.now() - input;
  if (diffMs < 0) return "Just now";
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;
  if (diffMs < minute) return "Now";
  if (diffMs < hour) return `${Math.floor(diffMs / minute)}m ago`;
  if (diffMs < day) return `${Math.floor(diffMs / hour)}h ago`;
  return `${Math.floor(diffMs / day)}d ago`;
}

export function renderShellHeader({ title, chips = [] }) {
  return `
    <header class="social-shell-header">
      <h2 class="social-shell-title">${esc(title)}</h2>
      <div class="social-shell-chip-row">
        ${chips
          .map(
            (chip) => `
          <span class="social-chip ${chip.kind ? `social-chip-${esc(chip.kind)}` : ""}">
            ${esc(chip.label)}
          </span>
        `
          )
          .join("")}
      </div>
    </header>
  `;
}

export function renderStateCard(type, message) {
  const safeType = ["loading", "empty", "error"].includes(type) ? type : "empty";
  return `<div class="social-${safeType}">${esc(message)}</div>`;
}

export function normalizeActionLabel(action) {
  if (!action) return "";
  return action.charAt(0).toUpperCase() + action.slice(1);
}

