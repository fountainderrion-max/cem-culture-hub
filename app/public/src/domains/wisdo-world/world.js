import {
  ACCESS_TIERS,
  ACCESS_TIER_LABELS,
  WORLD_DESTINATIONS,
  WORLD_QUICK_LINKS
} from "./world-data.js";

const root = document.getElementById("wisdo-world-root");

const STORAGE_KEYS = Object.freeze({
  profile: "wisdo-world-profile-v1",
  progress: "wisdo-world-progress-v1",
  tierPreview: "wisdo-world-tier-preview-v1"
});

const DEFAULT_PROFILE = Object.freeze({
  callsign: "Commander",
  title: "World Explorer",
  avatarStyle: "vanguard"
});

const runtime = {
  member: null,
  authenticated: false,
  apiState: null,
  apiStateError: null,
  selectedDestinationId: null,
  nearestDestinationId: null,
  profile: readJson(STORAGE_KEYS.profile, DEFAULT_PROFILE),
  progress: readJson(STORAGE_KEYS.progress, { visited: [], xp: 0 }),
  tier: clampNumber(Number(localStorage.getItem(STORAGE_KEYS.tierPreview) || ACCESS_TIERS.MEMBER), 0, 3),
  avatar: { x: 50, y: 58 },
  keys: new Set(),
  raf: 0,
  lastFrame: 0
};

boot();

async function boot() {
  if (!root) return;
  renderWorld();
  bindWorldEvents();
  await hydratePlatformContext();
  updateIdentityUi();
  updateTelemetryUi();
  runtime.raf = requestAnimationFrame(tick);
}

async function hydratePlatformContext() {
  const authResult = await safeFetchJson("/api/auth/me");
  if (authResult.ok) {
    runtime.authenticated = Boolean(authResult.data?.authenticated);
    runtime.member = authResult.data?.member || null;
  }

  if (!runtime.authenticated) {
    runtime.apiStateError = "Sign in from the dashboard to load member platform state.";
    return;
  }

  const stateResult = await safeFetchJson("/api/state");
  if (stateResult.ok) {
    runtime.apiState = stateResult.data || null;
  } else {
    runtime.apiStateError = "Platform state is unavailable in this session; world navigation still works.";
  }
}

async function safeFetchJson(url) {
  try {
    const response = await fetch(url, { credentials: "same-origin" });
    if (!response.ok) return { ok: false, status: response.status, data: null };
    return { ok: true, status: response.status, data: await response.json() };
  } catch {
    return { ok: false, status: 0, data: null };
  }
}

function renderWorld() {
  root.innerHTML = `
    <div class="world-app" data-world-app>
      <header class="world-topbar">
        <div class="world-brand">
          <a class="world-brand__mark" href="/app/feed" aria-label="Return to CEM CULTURE dashboard">W</a>
          <div>
            <p>CEM CULTURE</p>
            <strong>WISDO WORLD</strong>
          </div>
        </div>

        <nav class="world-topbar__nav" aria-label="WISDO world navigation">
          <a href="/app/feed">Dashboard</a>
          <button type="button" data-action="open-map">Map</button>
          <button type="button" data-action="open-inventory">Inventory</button>
          <button type="button" data-action="open-progress">Progress</button>
        </nav>

        <div class="world-session" id="world-session">
          <span class="world-status-dot" aria-hidden="true"></span>
          <span>Checking session…</span>
        </div>
      </header>

      <section class="world-layout">
        <aside class="world-panel world-panel--left" aria-label="WISDO world status">
          <div class="world-profile-card">
            <div class="world-avatar-bust" aria-hidden="true"><span>W</span></div>
            <div>
              <p class="world-kicker">YOUR AVATAR</p>
              <h2 id="world-callsign">${escapeHtml(runtime.profile.callsign)}</h2>
              <p id="world-title">${escapeHtml(runtime.profile.title)}</p>
            </div>
          </div>

          <section class="world-stat-card">
            <div class="world-stat-card__head">
              <span>World Progress</span>
              <strong id="world-level">LV ${getLevel()}</strong>
            </div>
            <div class="world-progress-track"><span id="world-progress-fill" style="width:${getLevelProgress()}%"></span></div>
            <div class="world-stat-grid">
              <div><span>XP</span><strong id="world-xp">${runtime.progress.xp}</strong></div>
              <div><span>Visited</span><strong id="world-visited">${runtime.progress.visited.length}/${WORLD_DESTINATIONS.length}</strong></div>
            </div>
            <p class="world-fineprint">Device-local preview progression. Backend progression remains the source of truth when connected.</p>
          </section>

          <section class="world-stat-card">
            <p class="world-kicker">ACCESS PREVIEW</p>
            <label class="world-field">
              <span>Preview tier</span>
              <select id="world-tier-preview">
                ${ACCESS_TIER_LABELS.map((label, index) => `<option value="${index}"${runtime.tier === index ? " selected" : ""}>${escapeHtml(label)}</option>`).join("")}
              </select>
            </label>
            <p class="world-fineprint">Preview only. Purchasing and entitlement verification are not connected here yet.</p>
          </section>

          <section class="world-stat-card" id="world-telemetry-card">
            <p class="world-kicker">PLATFORM PULSE</p>
            <div class="world-pulse-row"><span>Session</span><strong id="world-pulse-session">Loading</strong></div>
            <div class="world-pulse-row"><span>Bots</span><strong id="world-pulse-bots">—</strong></div>
            <div class="world-pulse-row"><span>Commands</span><strong id="world-pulse-commands">—</strong></div>
            <div class="world-pulse-row"><span>Reporter Mesh</span><strong>Spec Ready</strong></div>
            <p class="world-fineprint" id="world-pulse-note">Loading available platform state…</p>
          </section>
        </aside>

        <section class="world-stage-shell" aria-label="Interactive WISDO Plaza">
          <div class="world-stage-hud">
            <div>
              <p class="world-kicker">WISDO PLAZA</p>
              <h1>Trade. Learn. Build. Belong.</h1>
            </div>
            <div class="world-mode-badges">
              <span>Browser World</span>
              <span class="is-roadmap">WebXR Roadmap</span>
            </div>
          </div>

          <div class="world-stage" id="world-stage" tabindex="0">
            <div class="world-sky world-sky--one"></div>
            <div class="world-sky world-sky--two"></div>
            <div class="world-horizon"></div>
            <div class="world-grid-floor"></div>
            <div class="world-plaza-ring world-plaza-ring--outer"></div>
            <div class="world-plaza-ring world-plaza-ring--inner"></div>
            <div class="world-core" aria-label="WISDO central plaza">
              <span class="world-core__orb">W</span>
              <strong>WISDO</strong>
              <small>DISCIPLINE CREATES FREEDOM</small>
            </div>

            ${WORLD_DESTINATIONS.map(renderDestination).join("")}

            <button class="world-player" id="world-player" type="button" aria-label="Your WISDO avatar" style="left:${runtime.avatar.x}%; top:${runtime.avatar.y}%">
              <span class="world-player__head"></span>
              <span class="world-player__body">W</span>
              <span class="world-player__shadow"></span>
            </button>

            <div class="world-nearby" id="world-nearby" hidden>
              <span>Nearby</span>
              <strong id="world-nearby-name">Destination</strong>
              <small>Press E / Enter to interact</small>
            </div>
          </div>

          <div class="world-controls" aria-label="World controls">
            <div class="world-control-copy">
              <strong>Move through the plaza</strong>
              <span>WASD / arrows • E or Enter to interact • click any building</span>
            </div>
            <div class="world-dpad" aria-label="Touch movement controls">
              <button type="button" data-move="up" aria-label="Move up">▲</button>
              <button type="button" data-move="left" aria-label="Move left">◀</button>
              <button type="button" data-action="interact" aria-label="Interact">E</button>
              <button type="button" data-move="right" aria-label="Move right">▶</button>
              <button type="button" data-move="down" aria-label="Move down">▼</button>
            </div>
          </div>
        </section>

        <aside class="world-panel world-panel--right" aria-label="World destinations and quick links">
          <section class="world-stat-card world-stat-card--featured">
            <p class="world-kicker">WORLD OBJECTIVE</p>
            <h2>Build your command identity</h2>
            <p>Explore the ecosystem, connect your tools, earn progression, and unlock deeper rooms as access expands.</p>
          </section>

          <section class="world-stat-card">
            <div class="world-stat-card__head"><span>Area Access</span><strong id="world-access-label">${ACCESS_TIER_LABELS[runtime.tier]}</strong></div>
            <div class="world-access-list" id="world-access-list">
              ${WORLD_DESTINATIONS.map(renderAccessRow).join("")}
            </div>
          </section>

          <section class="world-stat-card">
            <p class="world-kicker">QUICK PORTALS</p>
            <div class="world-quick-links">
              ${WORLD_QUICK_LINKS.map((item) => `<a href="${item.route}">${escapeHtml(item.label)}<span>→</span></a>`).join("")}
            </div>
          </section>
        </aside>
      </section>

      <footer class="world-footer">
        <span>WISDO World • Immersive ecosystem shell</span>
        <span>Live integrations remain governed by existing backend permissions and safety checks.</span>
      </footer>

      <div class="world-modal-backdrop" id="world-modal" hidden>
        <section class="world-modal" role="dialog" aria-modal="true" aria-labelledby="world-modal-title">
          <button class="world-modal__close" type="button" data-action="close-modal" aria-label="Close">×</button>
          <div id="world-modal-content"></div>
        </section>
      </div>
    </div>
  `;
}

function renderDestination(destination) {
  const unlocked = isUnlocked(destination);
  return `
    <button
      type="button"
      class="world-building ${unlocked ? "is-unlocked" : "is-locked"}"
      data-destination="${destination.id}"
      style="left:${destination.x}%;top:${destination.y}%"
      aria-label="${escapeHtml(destination.name)}${unlocked ? "" : ", locked"}"
    >
      <span class="world-building__tower">
        <span class="world-building__antenna"></span>
        <span class="world-building__glyph">${destination.icon}</span>
      </span>
      <span class="world-building__label">
        <small>${escapeHtml(destination.short)}</small>
        <strong>${escapeHtml(destination.name)}</strong>
        <em>${unlocked ? "OPEN" : `LOCKED • ${ACCESS_TIER_LABELS[destination.tier]}`}</em>
      </span>
    </button>
  `;
}

function renderAccessRow(destination) {
  const unlocked = isUnlocked(destination);
  return `
    <button type="button" class="world-access-row" data-destination="${destination.id}">
      <span class="world-access-row__icon">${destination.icon}</span>
      <span>${escapeHtml(destination.name)}</span>
      <strong class="${unlocked ? "is-open" : "is-locked"}">${unlocked ? "Open" : ACCESS_TIER_LABELS[destination.tier]}</strong>
    </button>
  `;
}

function bindWorldEvents() {
  document.addEventListener("click", (event) => {
    const target = event.target instanceof Element ? event.target : null;
    if (!target) return;

    const destinationTrigger = target.closest("[data-destination]");
    if (destinationTrigger instanceof HTMLElement) {
      openDestination(destinationTrigger.dataset.destination || "");
      return;
    }

    const actionTrigger = target.closest("[data-action]");
    if (actionTrigger instanceof HTMLElement) {
      handleAction(actionTrigger.dataset.action || "");
      return;
    }

    const moveTrigger = target.closest("[data-move]");
    if (moveTrigger instanceof HTMLElement) {
      moveAvatar(moveTrigger.dataset.move || "", 4.5);
    }
  });

  document.addEventListener("change", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLSelectElement)) return;
    if (target.id !== "world-tier-preview") return;
    runtime.tier = clampNumber(Number(target.value), 0, 3);
    localStorage.setItem(STORAGE_KEYS.tierPreview, String(runtime.tier));
    refreshAccessUi();
  });

  window.addEventListener("keydown", (event) => {
    const key = event.key.toLowerCase();
    if (["arrowup", "arrowdown", "arrowleft", "arrowright", "w", "a", "s", "d"].includes(key)) {
      event.preventDefault();
      runtime.keys.add(key);
    }
    if ((key === "e" || key === "enter") && !isModalOpen()) {
      event.preventDefault();
      interactNearest();
    }
    if (key === "escape") closeModal();
  });

  window.addEventListener("keyup", (event) => runtime.keys.delete(event.key.toLowerCase()));
}

function tick(timestamp) {
  const delta = Math.min(32, timestamp - (runtime.lastFrame || timestamp));
  runtime.lastFrame = timestamp;
  const speed = 0.018 * delta;

  let dx = 0;
  let dy = 0;
  if (runtime.keys.has("arrowup") || runtime.keys.has("w")) dy -= speed;
  if (runtime.keys.has("arrowdown") || runtime.keys.has("s")) dy += speed;
  if (runtime.keys.has("arrowleft") || runtime.keys.has("a")) dx -= speed;
  if (runtime.keys.has("arrowright") || runtime.keys.has("d")) dx += speed;

  if (dx || dy) {
    runtime.avatar.x = clampNumber(runtime.avatar.x + dx, 6, 94);
    runtime.avatar.y = clampNumber(runtime.avatar.y + dy, 9, 88);
    positionAvatar();
    updateNearestDestination();
  }

  runtime.raf = requestAnimationFrame(tick);
}

function moveAvatar(direction, amount) {
  const vector = {
    up: [0, -amount],
    down: [0, amount],
    left: [-amount, 0],
    right: [amount, 0]
  }[direction];
  if (!vector) return;
  runtime.avatar.x = clampNumber(runtime.avatar.x + vector[0], 6, 94);
  runtime.avatar.y = clampNumber(runtime.avatar.y + vector[1], 9, 88);
  positionAvatar();
  updateNearestDestination();
}

function positionAvatar() {
  const player = document.getElementById("world-player");
  if (!(player instanceof HTMLElement)) return;
  player.style.left = `${runtime.avatar.x}%`;
  player.style.top = `${runtime.avatar.y}%`;
}

function updateNearestDestination() {
  let nearest = null;
  let nearestDistance = Infinity;

  for (const destination of WORLD_DESTINATIONS) {
    const distance = Math.hypot(runtime.avatar.x - destination.x, runtime.avatar.y - destination.y);
    if (distance < nearestDistance) {
      nearestDistance = distance;
      nearest = destination;
    }
  }

  runtime.nearestDestinationId = nearest && nearestDistance <= 14 ? nearest.id : null;
  document.querySelectorAll(".world-building.is-nearby").forEach((el) => el.classList.remove("is-nearby"));

  const nearby = document.getElementById("world-nearby");
  const name = document.getElementById("world-nearby-name");
  if (!(nearby instanceof HTMLElement) || !(name instanceof HTMLElement)) return;

  if (!runtime.nearestDestinationId) {
    nearby.hidden = true;
    return;
  }

  const building = document.querySelector(`[data-destination="${runtime.nearestDestinationId}"].world-building`);
  if (building instanceof HTMLElement) building.classList.add("is-nearby");
  name.textContent = nearest?.name || "Destination";
  nearby.hidden = false;
}

function interactNearest() {
  if (!runtime.nearestDestinationId) {
    openMapModal();
    return;
  }
  openDestination(runtime.nearestDestinationId);
}

function openDestination(id) {
  const destination = WORLD_DESTINATIONS.find((item) => item.id === id);
  if (!destination) return;
  runtime.selectedDestinationId = id;

  const unlocked = isUnlocked(destination);
  markVisited(destination, unlocked);

  const featureTags = destination.features.map((feature) => `<span>${escapeHtml(feature)}</span>`).join("");
  const action = unlocked
    ? `<a class="world-primary-action" href="${destination.route}">Enter ${escapeHtml(destination.name)} <span>→</span></a>`
    : `<a class="world-primary-action world-primary-action--locked" href="/pricing">View access options <span>→</span></a>`;

  showModal(`
    <div class="world-modal__hero ${unlocked ? "is-open" : "is-locked"}">
      <span class="world-modal__glyph">${destination.icon}</span>
      <div>
        <p class="world-kicker">${escapeHtml(destination.eyebrow)}</p>
        <h2 id="world-modal-title">${escapeHtml(destination.name)}</h2>
      </div>
    </div>
    <p class="world-modal__description">${escapeHtml(destination.description)}</p>
    <div class="world-feature-tags">${featureTags}</div>
    <div class="world-access-banner ${unlocked ? "is-open" : "is-locked"}">
      <strong>${unlocked ? "Access preview: open" : `Requires ${ACCESS_TIER_LABELS[destination.tier]} access`}</strong>
      <span>${unlocked ? "Existing app permissions still make the final authorization decision." : "This lock is a front-end preview until billing entitlements are wired."}</span>
    </div>
    ${destination.id === "coach-center" ? renderCoachRoadmap() : ""}
    ${destination.id === "trading-tower" ? renderTradingTowerContext() : ""}
    <div class="world-modal__actions">
      ${action}
      <button type="button" class="world-secondary-action" data-action="close-modal">Stay in Plaza</button>
    </div>
  `);
}

function renderCoachRoadmap() {
  return `
    <section class="world-inline-module">
      <div><span class="world-inline-module__status"></span><strong>Coach shell ready</strong></div>
      <p>Account-aware AI and “Hey Coach” voice actions belong here. The current world does not claim those command integrations are live.</p>
    </section>
  `;
}

function renderTradingTowerContext() {
  const accountCount = Array.isArray(runtime.apiState?.members) ? runtime.apiState.members.length : null;
  const botCount = Array.isArray(runtime.apiState?.bots) ? runtime.apiState.bots.length : null;
  return `
    <section class="world-inline-module">
      <div><span class="world-inline-module__status"></span><strong>Platform context</strong></div>
      <p>${runtime.authenticated ? "Member session detected." : "Sign in to the main dashboard for member context."} ${botCount === null ? "" : `${botCount} bot records are currently visible to the existing state endpoint.`} ${accountCount === null ? "" : `${accountCount} member records are present in the current prototype store.`}</p>
    </section>
  `;
}

function markVisited(destination, unlocked) {
  if (!unlocked || runtime.progress.visited.includes(destination.id)) return;
  runtime.progress.visited = [...runtime.progress.visited, destination.id];
  runtime.progress.xp += 50;
  localStorage.setItem(STORAGE_KEYS.progress, JSON.stringify(runtime.progress));
  updateProgressUi();
}

function handleAction(action) {
  if (action === "close-modal") closeModal();
  if (action === "interact") interactNearest();
  if (action === "open-map") openMapModal();
  if (action === "open-inventory") openInventoryModal();
  if (action === "open-progress") openProgressModal();
}

function openMapModal() {
  showModal(`
    <div class="world-modal__hero is-open">
      <span class="world-modal__glyph">⌖</span>
      <div><p class="world-kicker">WORLD MAP</p><h2 id="world-modal-title">Choose a destination</h2></div>
    </div>
    <div class="world-map-list">
      ${WORLD_DESTINATIONS.map((destination) => `
        <button type="button" data-destination="${destination.id}">
          <span>${destination.icon}</span>
          <div><strong>${escapeHtml(destination.name)}</strong><small>${escapeHtml(destination.eyebrow)}</small></div>
          <em>${isUnlocked(destination) ? "OPEN" : `LVL • ${ACCESS_TIER_LABELS[destination.tier]}`}</em>
        </button>
      `).join("")}
    </div>
  `);
}

function openInventoryModal() {
  showModal(`
    <div class="world-modal__hero is-open">
      <span class="world-modal__glyph">▣</span>
      <div><p class="world-kicker">INVENTORY</p><h2 id="world-modal-title">Your WISDO inventory</h2></div>
    </div>
    <p class="world-modal__description">This room is ready to display owned bots, presets, licenses, switches, badges, and access passes once a billing/entitlement ledger is connected.</p>
    <div class="world-empty-state">
      <strong>Entitlement service pending</strong>
      <span>No ownership data is fabricated in this preview.</span>
    </div>
    <div class="world-modal__actions"><a class="world-primary-action" href="/app/bot-arena/my-bots">Open My Bots <span>→</span></a></div>
  `);
}

function openProgressModal() {
  const visitedNames = runtime.progress.visited
    .map((id) => WORLD_DESTINATIONS.find((item) => item.id === id)?.name)
    .filter(Boolean);
  showModal(`
    <div class="world-modal__hero is-open">
      <span class="world-modal__glyph">★</span>
      <div><p class="world-kicker">PROGRESSION</p><h2 id="world-modal-title">World Level ${getLevel()}</h2></div>
    </div>
    <p class="world-modal__description">You have ${runtime.progress.xp} local preview XP and have explored ${runtime.progress.visited.length} of ${WORLD_DESTINATIONS.length} destinations.</p>
    <div class="world-progress-track world-progress-track--large"><span style="width:${getLevelProgress()}%"></span></div>
    <div class="world-feature-tags">${visitedNames.length ? visitedNames.map((name) => `<span>${escapeHtml(name)}</span>`).join("") : "<span>No rooms visited yet</span>"}</div>
    <p class="world-fineprint">This local progression demonstrates the world loop; it is intentionally separate from production ranks and purchases until the backend ledger exists.</p>
  `);
}

function showModal(html) {
  const backdrop = document.getElementById("world-modal");
  const content = document.getElementById("world-modal-content");
  if (!(backdrop instanceof HTMLElement) || !(content instanceof HTMLElement)) return;
  content.innerHTML = html;
  backdrop.hidden = false;
  document.body.classList.add("world-modal-open");
}

function closeModal() {
  const backdrop = document.getElementById("world-modal");
  if (!(backdrop instanceof HTMLElement)) return;
  backdrop.hidden = true;
  document.body.classList.remove("world-modal-open");
}

function isModalOpen() {
  const modal = document.getElementById("world-modal");
  return modal instanceof HTMLElement && !modal.hidden;
}

function refreshAccessUi() {
  const accessLabel = document.getElementById("world-access-label");
  if (accessLabel) accessLabel.textContent = ACCESS_TIER_LABELS[runtime.tier];

  document.querySelectorAll(".world-building[data-destination]").forEach((element) => {
    if (!(element instanceof HTMLElement)) return;
    const destination = WORLD_DESTINATIONS.find((item) => item.id === element.dataset.destination);
    if (!destination) return;
    const unlocked = isUnlocked(destination);
    element.classList.toggle("is-unlocked", unlocked);
    element.classList.toggle("is-locked", !unlocked);
    const status = element.querySelector(".world-building__label em");
    if (status) status.textContent = unlocked ? "OPEN" : `LOCKED • ${ACCESS_TIER_LABELS[destination.tier]}`;
  });

  const list = document.getElementById("world-access-list");
  if (list) list.innerHTML = WORLD_DESTINATIONS.map(renderAccessRow).join("");
}

function updateIdentityUi() {
  const callsign = document.getElementById("world-callsign");
  const title = document.getElementById("world-title");
  const session = document.getElementById("world-session");

  const memberHandle = runtime.member?.handle ? String(runtime.member.handle) : "";
  if (callsign) callsign.textContent = memberHandle || runtime.profile.callsign;
  if (title) title.textContent = runtime.authenticated ? runtime.profile.title : "Guest Explorer";
  if (session) {
    session.innerHTML = runtime.authenticated
      ? `<span class="world-status-dot is-online" aria-hidden="true"></span><span>${escapeHtml(memberHandle || "Member")} • Connected</span>`
      : `<span class="world-status-dot" aria-hidden="true"></span><a href="/login">Sign in for member context</a>`;
  }
}

function updateTelemetryUi() {
  const session = document.getElementById("world-pulse-session");
  const bots = document.getElementById("world-pulse-bots");
  const commands = document.getElementById("world-pulse-commands");
  const note = document.getElementById("world-pulse-note");

  if (session) session.textContent = runtime.authenticated ? "Connected" : "Guest";
  if (bots) bots.textContent = Array.isArray(runtime.apiState?.bots) ? String(runtime.apiState.bots.length) : "—";
  if (commands) commands.textContent = Array.isArray(runtime.apiState?.commands) ? String(runtime.apiState.commands.length) : "—";
  if (note) {
    note.textContent = runtime.apiState
      ? "Using the existing app state endpoint for available prototype telemetry."
      : runtime.apiStateError || "No platform state loaded.";
  }
}

function updateProgressUi() {
  const level = document.getElementById("world-level");
  const fill = document.getElementById("world-progress-fill");
  const xp = document.getElementById("world-xp");
  const visited = document.getElementById("world-visited");
  if (level) level.textContent = `LV ${getLevel()}`;
  if (fill instanceof HTMLElement) fill.style.width = `${getLevelProgress()}%`;
  if (xp) xp.textContent = String(runtime.progress.xp);
  if (visited) visited.textContent = `${runtime.progress.visited.length}/${WORLD_DESTINATIONS.length}`;
}

function isUnlocked(destination) {
  return runtime.tier >= destination.tier;
}

function getLevel() {
  return Math.max(1, Math.floor(runtime.progress.xp / 250) + 1);
}

function getLevelProgress() {
  return ((runtime.progress.xp % 250) / 250) * 100;
}

function readJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return structuredCloneSafe(fallback);
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : structuredCloneSafe(fallback);
  } catch {
    return structuredCloneSafe(fallback);
  }
}

function structuredCloneSafe(value) {
  return JSON.parse(JSON.stringify(value));
}

function clampNumber(value, min, max) {
  return Math.min(max, Math.max(min, Number.isFinite(value) ? value : min));
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
