const SERVER_SYNC = {
  catalog: null,
  world: null,
  mesh: null,
  lastNodeSecret: null,
  busy: false
};

bootServerSync();

async function bootServerSync() {
  await waitForWorld();
  const catalogResult = await api("/api/world/catalog");
  if (catalogResult.ok) SERVER_SYNC.catalog = catalogResult.data;

  const worldResult = await api("/api/world/me");
  if (worldResult.ok) {
    SERVER_SYNC.world = worldResult.data;
    writeServerStateToLocalCache();
    syncWorldUi();
    installMeshEntryPoints();
    installServerProgressHooks();
  } else {
    markLocalPreviewMode();
  }
}

async function waitForWorld() {
  for (let i = 0; i < 80; i += 1) {
    if (document.querySelector("[data-world-app]")) return;
    await new Promise((resolve) => setTimeout(resolve, 25));
  }
}

async function api(url, options = {}) {
  try {
    const response = await fetch(url, {
      credentials: "same-origin",
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {})
      }
    });
    const data = await response.json().catch(() => ({}));
    return { ok: response.ok, status: response.status, data };
  } catch (error) {
    return { ok: false, status: 0, data: { message: error?.message || "Network error" } };
  }
}

function writeServerStateToLocalCache() {
  if (!SERVER_SYNC.world) return;
  const profile = SERVER_SYNC.world.worldProfile || {};
  const access = SERVER_SYNC.world.access || {};
  localStorage.setItem(
    "wisdo-world-profile-v1",
    JSON.stringify({
      callsign: profile.callsign || "Commander",
      title: profile.title || "World Explorer",
      avatarStyle: profile.avatarStyle || "vanguard"
    })
  );
  localStorage.setItem(
    "wisdo-world-progress-v1",
    JSON.stringify({
      visited: Array.isArray(profile.visitedDestinations) ? profile.visitedDestinations : [],
      xp: Number(profile.xp || 0)
    })
  );
  localStorage.setItem("wisdo-world-tier-preview-v1", String(Number(access.level || 0)));
}

function syncWorldUi() {
  const world = SERVER_SYNC.world;
  if (!world) return;
  const profile = world.worldProfile || {};
  const access = world.access || {};

  setText("world-callsign", profile.callsign || world.member?.handle || "Commander");
  setText("world-title", profile.title || "World Explorer");
  setText("world-level", `LV ${profile.level || 1}`);
  setText("world-xp", String(profile.xp || 0));
  setText("world-visited", `${profile.visitedDestinations?.length || 0}/${SERVER_SYNC.catalog?.destinations?.length || 13}`);
  setText("world-access-label", access.worldLabel || "Member");

  const fill = document.getElementById("world-progress-fill");
  if (fill instanceof HTMLElement) fill.style.width = `${((Number(profile.xp || 0) % 250) / 250) * 100}%`;

  const tierSelect = document.getElementById("world-tier-preview");
  if (tierSelect instanceof HTMLSelectElement) {
    tierSelect.value = String(Number(access.level || 0));
    tierSelect.dispatchEvent(new Event("change", { bubbles: true }));
    tierSelect.disabled = true;
    tierSelect.setAttribute("aria-label", `Backend access tier: ${access.worldLabel || "Member"}`);
  }

  const field = tierSelect?.closest(".world-field");
  const fieldLabel = field?.querySelector("span");
  if (fieldLabel) fieldLabel.textContent = "Backend access tier";
  const tierCardNote = field?.parentElement?.querySelector(".world-fineprint");
  if (tierCardNote) {
    tierCardNote.textContent = `${access.legacyLabel || "Cadet"} maps to ${access.worldLabel || "Member"}. Server entitlements now control room access; billing is not connected yet.`;
  }

  const pulseNote = document.getElementById("world-pulse-note");
  if (pulseNote) {
    pulseNote.textContent = `World profile and progression are server-backed. Reporter Mesh: ${world.mesh?.nodes || 0} nodes, ${world.mesh?.accounts || 0} accounts.`;
  }

  applyAuthoritativeAccess();
  addServerBadge();
}

function applyAuthoritativeAccess() {
  const accessRows = Array.isArray(SERVER_SYNC.world?.access?.destinations)
    ? SERVER_SYNC.world.access.destinations
    : [];

  for (const access of accessRows) {
    const building = document.querySelector(`.world-building[data-destination="${cssEscape(access.id)}"]`);
    if (building instanceof HTMLElement) {
      building.classList.toggle("is-unlocked", Boolean(access.unlocked));
      building.classList.toggle("is-locked", !access.unlocked);
      building.dataset.serverUnlocked = access.unlocked ? "true" : "false";
      const status = building.querySelector(".world-building__label em");
      if (status) status.textContent = access.unlocked ? "OPEN" : `LOCKED • ${access.minTierLabel}`;
    }

    document.querySelectorAll(`.world-access-row[data-destination="${cssEscape(access.id)}"]`).forEach((row) => {
      const indicator = row.querySelector("strong");
      if (!indicator) return;
      indicator.textContent = access.unlocked ? "Open" : access.minTierLabel;
      indicator.classList.toggle("is-open", Boolean(access.unlocked));
      indicator.classList.toggle("is-locked", !access.unlocked);
    });
  }
}

function addServerBadge() {
  if (document.querySelector(".world-server-badge")) return;
  const badges = document.querySelector(".world-mode-badges");
  if (!badges) return;
  const badge = document.createElement("span");
  badge.className = "world-server-badge";
  badge.textContent = "Server Progression";
  badges.prepend(badge);
}

function markLocalPreviewMode() {
  const note = document.getElementById("world-pulse-note");
  if (note) note.textContent = "Guest/local preview mode. Sign in to persist WISDO progression and Reporter Mesh data on the server.";
}

function installServerProgressHooks() {
  document.addEventListener("click", (event) => {
    const target = event.target instanceof Element ? event.target.closest("[data-destination]") : null;
    if (!(target instanceof HTMLElement)) return;
    const destinationId = target.dataset.destination || "";
    if (!destinationId) return;
    void recordVisit(destinationId);
    if (destinationId === "trading-tower") {
      setTimeout(addTradingTowerMeshAction, 0);
    }
  });

  window.addEventListener("keydown", (event) => {
    const key = event.key.toLowerCase();
    if (key !== "e" && key !== "enter") return;
    const nearby = document.querySelector(".world-building.is-nearby[data-destination]");
    if (!(nearby instanceof HTMLElement)) return;
    const destinationId = nearby.dataset.destination || "";
    if (!destinationId) return;
    void recordVisit(destinationId);
    if (destinationId === "trading-tower") setTimeout(addTradingTowerMeshAction, 0);
  });
}

async function recordVisit(destinationId) {
  if (!SERVER_SYNC.world || SERVER_SYNC.busy) return;
  const access = SERVER_SYNC.world.access?.destinations?.find((item) => item.id === destinationId);
  if (!access?.unlocked) return;

  SERVER_SYNC.busy = true;
  const result = await api("/api/world/visit", {
    method: "POST",
    body: JSON.stringify({ destinationId })
  });
  SERVER_SYNC.busy = false;

  if (!result.ok || !result.data?.state) return;
  SERVER_SYNC.world = result.data.state;
  writeServerStateToLocalCache();
  syncWorldUi();
}

function installMeshEntryPoints() {
  const nav = document.querySelector(".world-topbar__nav");
  if (nav && !document.getElementById("world-mesh-nav")) {
    const button = document.createElement("button");
    button.id = "world-mesh-nav";
    button.type = "button";
    button.textContent = "Reporter Mesh";
    button.addEventListener("click", () => void openMeshConsole());
    nav.appendChild(button);
  }
}

function addTradingTowerMeshAction() {
  const title = document.getElementById("world-modal-title");
  if (!title || title.textContent?.trim() !== "Trading Tower") return;
  const actions = document.querySelector("#world-modal-content .world-modal__actions");
  if (!actions || actions.querySelector("[data-mesh-console]")) return;
  const button = document.createElement("button");
  button.type = "button";
  button.className = "world-secondary-action";
  button.dataset.meshConsole = "true";
  button.textContent = "Reporter Mesh Console";
  button.addEventListener("click", () => void openMeshConsole());
  actions.prepend(button);
}

async function openMeshConsole() {
  const result = await api("/api/world/mesh");
  if (!result.ok) {
    showOwnModal("Reporter Mesh", `<div class="world-empty-state"><strong>Mesh unavailable</strong><span>${escapeHtml(result.data?.message || "Unable to load Reporter Mesh.")}</span></div>`);
    return;
  }
  SERVER_SYNC.mesh = result.data;
  renderMeshConsole();
}

function renderMeshConsole() {
  const mesh = SERVER_SYNC.mesh || { accounts: [], nodes: [], routes: [], summary: {} };
  const accountOptions = mesh.accounts.length
    ? mesh.accounts.map((account) => `<option value="${escapeHtml(account.id)}">${escapeHtml(account.accountName)} • ${escapeHtml(account.login)}</option>`).join("")
    : `<option value="">Add an account first</option>`;
  const nodeOptions = mesh.nodes.length
    ? mesh.nodes.map((node) => `<option value="${escapeHtml(node.id)}" data-account-id="${escapeHtml(node.tradingAccountId)}">${escapeHtml(node.nodeName)} • ${escapeHtml(node.nodeType)}</option>`).join("")
    : `<option value="">Add a reporter node first</option>`;

  showOwnModal(
    "Reporter Mesh",
    `
      <p class="world-modal__description">Every device is a node. Every node belongs to an exact trading account. Registering a route does not enable live execution.</p>
      <div class="mesh-summary-grid">
        ${meshMetric("Accounts", mesh.summary?.accounts || 0)}
        ${meshMetric("Nodes", mesh.summary?.nodes || 0)}
        ${meshMetric("Online", mesh.summary?.onlineNodes || 0)}
        ${meshMetric("Executable routes", mesh.summary?.executableRoutes || 0)}
      </div>

      ${SERVER_SYNC.lastNodeSecret ? `
        <div class="mesh-secret">
          <strong>New node token — shown once</strong>
          <code>${escapeHtml(SERVER_SYNC.lastNodeSecret)}</code>
          <span>Store this securely on the reporter node. It is not returned again.</span>
        </div>
      ` : ""}

      <section class="mesh-section">
        <div class="mesh-section__head"><div><p class="world-kicker">ACCOUNTS</p><h3>Trading accounts</h3></div><span>${mesh.accounts.length}</span></div>
        <div class="mesh-record-list">${mesh.accounts.length ? mesh.accounts.map(renderAccount).join("") : meshEmpty("No trading accounts registered yet.")}</div>
        <form class="mesh-form" id="mesh-account-form">
          <input name="accountName" placeholder="Account name" maxlength="100" required />
          <input name="broker" placeholder="Broker" maxlength="80" required />
          <input name="server" placeholder="Broker server" maxlength="100" required />
          <input name="login" placeholder="MT4/MT5 login" maxlength="80" required />
          <select name="demoLive"><option value="demo">Demo</option><option value="live">Live</option></select>
          <button type="submit">Register account</button>
        </form>
      </section>

      <section class="mesh-section">
        <div class="mesh-section__head"><div><p class="world-kicker">NODES</p><h3>Reporter nodes</h3></div><span>${mesh.nodes.length}</span></div>
        <div class="mesh-record-list">${mesh.nodes.length ? mesh.nodes.map(renderNode).join("") : meshEmpty("No reporter nodes registered yet.")}</div>
        <form class="mesh-form" id="mesh-node-form">
          <select name="accountId" required>${accountOptions}</select>
          <input name="nodeName" placeholder="Node name" maxlength="100" required />
          <select name="nodeType" required>
            <option value="LAPTOP_REPORTER">Laptop Reporter</option>
            <option value="PRIMARY_REPORTER">Primary Reporter</option>
            <option value="VPS_REPORTER">VPS Reporter</option>
            <option value="MOBILE_CELLULAR_NODE">Mobile Cellular Node</option>
            <option value="MOBILE_CONTROLLER">Mobile Controller</option>
            <option value="COPY_FOLLOWER_NODE">Copy Follower</option>
            <option value="COACH_VIEWER_NODE">Coach Viewer</option>
            <option value="BACKUP_REPORTER">Backup Reporter</option>
            <option value="SIGNAL_ONLY_NODE">Signal Only</option>
          </select>
          <button type="submit" ${mesh.accounts.length ? "" : "disabled"}>Generate node</button>
        </form>
      </section>

      <section class="mesh-section">
        <div class="mesh-section__head"><div><p class="world-kicker">ROUTES</p><h3>Execution routes</h3></div><span>${mesh.routes.length}</span></div>
        <div class="mesh-record-list">${mesh.routes.length ? mesh.routes.map(renderRoute).join("") : meshEmpty("No routes registered. Execution is disabled by default.")}</div>
        <form class="mesh-form" id="mesh-route-form">
          <select name="accountId" required>${accountOptions}</select>
          <select name="nodeId" required>${nodeOptions}</select>
          <input name="routeName" placeholder="Route name" maxlength="100" value="Primary execution route" required />
          <select name="routeType" required>
            <option value="LOCAL_REPORTER">Local Reporter</option>
            <option value="VPS_REPORTER">VPS Reporter</option>
            <option value="CLOUD_MT4_NODE">Cloud MT4 Node</option>
            <option value="MANUAL_ONLY">Manual Only</option>
          </select>
          <button type="submit" ${mesh.accounts.length && mesh.nodes.length ? "" : "disabled"}>Register disabled route</button>
        </form>
        <p class="world-fineprint">Broker API and FIX routes exist in the backend contract but are intentionally not offered in this UI until provider support and credentials are verified.</p>
      </section>
    `
  );
  bindMeshForms();
}

function bindMeshForms() {
  const accountForm = document.getElementById("mesh-account-form");
  const nodeForm = document.getElementById("mesh-node-form");
  const routeForm = document.getElementById("mesh-route-form");

  accountForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const payload = formObject(accountForm);
    const result = await api("/api/world/mesh/account", { method: "POST", body: JSON.stringify(payload) });
    await handleMeshMutation(result);
  });

  nodeForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const payload = formObject(nodeForm);
    const result = await api("/api/world/mesh/node", { method: "POST", body: JSON.stringify(payload) });
    if (result.ok && result.data?.nodeToken) SERVER_SYNC.lastNodeSecret = result.data.nodeToken;
    await handleMeshMutation(result);
  });

  routeForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const payload = formObject(routeForm);
    const selectedNode = SERVER_SYNC.mesh?.nodes?.find((node) => node.id === payload.nodeId);
    if (selectedNode && selectedNode.tradingAccountId !== payload.accountId) {
      showMeshMessage("That node belongs to a different account. WISDO will not cross-route execution.", true);
      return;
    }
    const result = await api("/api/world/mesh/route", { method: "POST", body: JSON.stringify(payload) });
    await handleMeshMutation(result);
  });
}

async function handleMeshMutation(result) {
  if (!result.ok) {
    showMeshMessage(result.data?.message || "Mesh update failed.", true);
    return;
  }
  const refresh = await api("/api/world/mesh");
  if (refresh.ok) {
    SERVER_SYNC.mesh = refresh.data;
    if (SERVER_SYNC.world) SERVER_SYNC.world.mesh = refresh.data.summary;
    renderMeshConsole();
    syncWorldUi();
  }
}

function showMeshMessage(message, isError = false) {
  const modal = document.getElementById("world-modal-content");
  if (!modal) return;
  let notice = modal.querySelector(".mesh-notice");
  if (!notice) {
    notice = document.createElement("div");
    notice.className = "mesh-notice";
    modal.prepend(notice);
  }
  notice.classList.toggle("is-error", isError);
  notice.textContent = message;
}

function formObject(form) {
  return Object.fromEntries(new FormData(form).entries());
}

function renderAccount(account) {
  return `<article class="mesh-record"><div><strong>${escapeHtml(account.accountName)}</strong><span>${escapeHtml(account.broker)} • ${escapeHtml(account.server)}</span></div><em>${escapeHtml(account.login)} • ${escapeHtml(account.demoLive)}</em></article>`;
}

function renderNode(node) {
  return `<article class="mesh-record"><div><strong>${escapeHtml(node.nodeName)}</strong><span>${escapeHtml(node.nodeType)} • ${escapeHtml(node.pairCode)}</span></div><em>${escapeHtml(node.status)} • execute ${node.canExecuteTrades ? "on" : "off"}</em></article>`;
}

function renderRoute(route) {
  return `<article class="mesh-record"><div><strong>${escapeHtml(route.routeName)}</strong><span>${escapeHtml(route.routeType)} • ${escapeHtml(route.status)}</span></div><em>execute ${route.canExecute ? "on" : "off"} • confirmation ${route.requiresConfirmation ? "required" : "not required"}</em></article>`;
}

function meshEmpty(message) {
  return `<div class="mesh-empty">${escapeHtml(message)}</div>`;
}

function meshMetric(label, value) {
  return `<div><span>${escapeHtml(label)}</span><strong>${escapeHtml(String(value))}</strong></div>`;
}

function showOwnModal(title, content) {
  const backdrop = document.getElementById("world-modal");
  const modalContent = document.getElementById("world-modal-content");
  if (!(backdrop instanceof HTMLElement) || !(modalContent instanceof HTMLElement)) return;
  modalContent.innerHTML = `
    <div class="world-modal__hero is-open">
      <span class="world-modal__glyph">⌘</span>
      <div><p class="world-kicker">TRADING TOWER NETWORK</p><h2 id="world-modal-title">${escapeHtml(title)}</h2></div>
    </div>
    ${content}
    <div class="world-modal__actions"><button type="button" class="world-secondary-action" data-action="close-modal">Return to Plaza</button></div>
  `;
  backdrop.hidden = false;
  document.body.classList.add("world-modal-open");
}

function setText(id, value) {
  const element = document.getElementById(id);
  if (element) element.textContent = value;
}

function cssEscape(value) {
  if (globalThis.CSS?.escape) return CSS.escape(value);
  return String(value).replace(/[^a-zA-Z0-9_-]/g, "");
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
