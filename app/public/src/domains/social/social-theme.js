const SOCIAL_THEME_ID = "cem-social-domain-theme";

const THEME_CSS = `
.social-route {
  --social-bg: radial-gradient(circle at 12% 8%, rgba(31, 44, 77, 0.42), transparent 38%),
    radial-gradient(circle at 86% 12%, rgba(122, 75, 32, 0.34), transparent 36%),
    linear-gradient(160deg, #090d17 0%, #0e1524 56%, #0b101b 100%);
  --social-panel: rgba(15, 20, 33, 0.9);
  --social-panel-strong: rgba(19, 26, 42, 0.94);
  --social-border: rgba(143, 171, 227, 0.18);
  --social-text: #dce6ff;
  --social-muted: #94a7cc;
  --social-accent: #5cc8ff;
  --social-gold: #f2bf6f;
  --social-danger: #f4838f;
  --social-success: #7ae3b1;
  position: relative;
  color: var(--social-text);
  background: var(--social-bg);
  border: 1px solid var(--social-border);
  border-radius: 18px;
  padding: 1.1rem;
  overflow: hidden;
}

.social-route::before {
  content: "";
  position: absolute;
  inset: -20% auto auto -10%;
  width: 260px;
  height: 260px;
  background: radial-gradient(circle, rgba(92, 200, 255, 0.14), transparent 62%);
  pointer-events: none;
}

.social-shell-header {
  display: flex;
  justify-content: space-between;
  gap: 0.8rem;
  align-items: center;
  margin-bottom: 1rem;
}

.social-shell-title {
  margin: 0;
  font-size: clamp(1.05rem, 1.5vw, 1.3rem);
  letter-spacing: 0.02em;
}

.social-shell-chip-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
}

.social-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.32rem;
  padding: 0.25rem 0.55rem;
  border-radius: 999px;
  font-size: 0.75rem;
  color: var(--social-muted);
  background: rgba(25, 33, 53, 0.75);
  border: 1px solid rgba(120, 146, 198, 0.24);
}

.social-chip-live {
  color: #baf5d8;
  border-color: rgba(122, 227, 177, 0.4);
}

.social-chip-sim {
  color: #ffd8a1;
  border-color: rgba(242, 191, 111, 0.4);
}

.social-grid {
  display: grid;
  gap: 0.85rem;
}

.social-grid-two {
  grid-template-columns: 1fr;
}

.social-grid-three {
  grid-template-columns: 1fr;
}

.social-panel {
  position: relative;
  background: linear-gradient(180deg, rgba(24, 31, 50, 0.78), rgba(17, 23, 37, 0.86));
  border: 1px solid var(--social-border);
  border-radius: 14px;
  padding: 0.85rem;
  box-shadow: 0 10px 26px rgba(4, 7, 12, 0.34);
}

.social-panel-strong {
  background: linear-gradient(180deg, rgba(26, 34, 56, 0.92), rgba(15, 21, 35, 0.96));
}

.social-panel-title {
  margin: 0 0 0.5rem;
  font-size: 0.95rem;
}

.social-panel-subtitle,
.social-muted {
  color: var(--social-muted);
  margin: 0;
  font-size: 0.8rem;
}

.social-metric-grid {
  display: grid;
  gap: 0.55rem;
  grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
}

.social-metric-card {
  background: rgba(12, 18, 30, 0.75);
  border: 1px solid rgba(131, 162, 220, 0.2);
  border-radius: 12px;
  padding: 0.55rem;
}

.social-metric-label {
  margin: 0;
  font-size: 0.73rem;
  color: var(--social-muted);
}

.social-metric-value {
  margin: 0.2rem 0 0;
  font-size: 1rem;
  font-weight: 650;
}

.social-list {
  display: grid;
  gap: 0.7rem;
}

.social-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.6rem;
}

.social-user {
  display: flex;
  align-items: center;
  gap: 0.55rem;
}

.social-avatar {
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 700;
  color: #081020;
  background: linear-gradient(145deg, #66d8ff, #f4c174);
}

.social-avatar-lg {
  width: 3.25rem;
  height: 3.25rem;
  font-size: 1rem;
}

.social-btn {
  appearance: none;
  background: rgba(16, 23, 39, 0.88);
  color: var(--social-text);
  border: 1px solid rgba(142, 171, 230, 0.28);
  border-radius: 999px;
  padding: 0.34rem 0.65rem;
  font-size: 0.75rem;
  cursor: pointer;
  transition: all 180ms ease;
}

.social-btn:hover {
  border-color: rgba(93, 201, 255, 0.55);
  transform: translateY(-1px);
}

.social-btn[aria-pressed="true"],
.social-btn.active {
  color: #061224;
  background: linear-gradient(135deg, #66d9ff, #f3c57f);
  border-color: rgba(243, 197, 127, 0.8);
}

.social-btn-primary {
  color: #071326;
  background: linear-gradient(125deg, #5fd4ff, #f2bf6f);
  border-color: rgba(242, 191, 111, 0.8);
  font-weight: 700;
}

.social-action-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
  margin-top: 0.6rem;
}

.social-tag {
  padding: 0.18rem 0.42rem;
  border-radius: 8px;
  font-size: 0.7rem;
  background: rgba(26, 35, 54, 0.8);
  border: 1px solid rgba(140, 167, 222, 0.24);
  color: var(--social-muted);
}

.social-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 0.42rem;
}

.social-tab {
  appearance: none;
  border-radius: 999px;
  border: 1px solid rgba(137, 168, 230, 0.26);
  background: rgba(12, 18, 31, 0.8);
  color: var(--social-muted);
  padding: 0.36rem 0.66rem;
  font-size: 0.75rem;
  cursor: pointer;
}

.social-tab[aria-selected="true"] {
  background: rgba(94, 210, 255, 0.15);
  border-color: rgba(94, 210, 255, 0.5);
  color: var(--social-text);
}

.social-tab-panel {
  display: none;
}

.social-tab-panel.active {
  display: block;
}

.social-kpi {
  color: var(--social-success);
}

.social-warning {
  color: var(--social-gold);
}

.social-danger {
  color: var(--social-danger);
}

.social-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.82rem;
}

.social-table th,
.social-table td {
  text-align: left;
  padding: 0.42rem 0.28rem;
  border-bottom: 1px solid rgba(124, 151, 204, 0.16);
}

.social-table th {
  color: var(--social-muted);
  font-weight: 600;
}

.social-empty,
.social-loading,
.social-error {
  border: 1px dashed rgba(136, 166, 228, 0.3);
  border-radius: 12px;
  padding: 0.75rem;
  text-align: center;
  color: var(--social-muted);
  background: rgba(12, 18, 29, 0.55);
}

.social-error {
  color: #ffc1cb;
  border-color: rgba(244, 131, 143, 0.46);
}

.social-banner {
  position: relative;
  border-radius: 14px;
  padding: 0.95rem;
  border: 1px solid rgba(140, 167, 226, 0.27);
  background:
    radial-gradient(circle at 85% 20%, rgba(242, 191, 111, 0.28), transparent 40%),
    linear-gradient(130deg, rgba(16, 26, 48, 0.95), rgba(31, 48, 80, 0.85));
}

.social-divider {
  height: 1px;
  background: linear-gradient(to right, transparent, rgba(136, 166, 225, 0.38), transparent);
  margin: 0.72rem 0;
}

@media (min-width: 860px) {
  .social-grid-two {
    grid-template-columns: 1.15fr 0.85fr;
  }

  .social-grid-three {
    grid-template-columns: 1.2fr 0.9fr 0.9fr;
  }
}
`;

export function ensureSocialTheme() {
  if (typeof document === "undefined") return;
  if (document.getElementById(SOCIAL_THEME_ID)) return;
  const style = document.createElement("style");
  style.id = SOCIAL_THEME_ID;
  style.textContent = THEME_CSS;
  document.head.appendChild(style);
}

