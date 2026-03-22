import { createVpsLog, findPlanById, getVpsForgeMock } from "../../data/vps-mock.js";

const STYLE_ID = "vps-forge-domain-style";

function esc(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function statusTone(status) {
  if (status === "running") return "ok";
  if (status === "degraded") return "warn";
  if (status === "critical") return "danger";
  if (status === "restarting" || status === "maintenance" || status === "provisioning") return "info";
  return "neutral";
}

function levelTone(level) {
  if (level === "critical") return "danger";
  if (level === "warning") return "warn";
  if (level === "success") return "ok";
  if (level === "info") return "info";
  return "neutral";
}

function healthScore(server) {
  const metrics = server.metrics || { cpu: 0, memory: 0, disk: 0 };
  const pressure = (metrics.cpu + metrics.memory + metrics.disk) / 3;
  const penalties = (server.alerts || []).length * 8 + (server.status === "running" ? 0 : 18);
  const bonus = server.autoHeal ? 5 : 0;
  return clamp(Math.round(100 - pressure * 0.55 - penalties + bonus), 1, 99);
}

function metricRow(label, value, suffix = "%") {
  const width = clamp(Number(value) || 0, 0, 100);
  return `<div class="vf-metric-row"><span>${esc(label)}</span><span>${esc(width)}${esc(suffix)}</span><div class="vf-meter"><i style="width:${width}%"></i></div></div>`;
}

function formatTimestamp(iso) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "Unknown";
  return date.toLocaleString(undefined, { month: "short", day: "2-digit", hour: "2-digit", minute: "2-digit" });
}

function makeId(prefix) {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

function ensureStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `
    .vps-forge{--bg:#070a12;--soft:#0f1727;--bd:rgba(122,164,255,.16);--tx:#e8eeff;--sub:#9caecc;--ac:#4ec9d8;--ok:#59d8a1;--wr:#ffbd59;--dn:#ff6b7a;color:var(--tx);background:radial-gradient(1000px circle at 8% -10%,rgba(78,201,216,.2),transparent 45%),radial-gradient(950px circle at 95% 5%,rgba(95,121,255,.2),transparent 40%),linear-gradient(165deg,#060910 0%,#080c15 45%,#05070d 100%);border:1px solid var(--bd);border-radius:22px;padding:20px;box-shadow:0 24px 42px rgba(0,0,0,.45);font-family:"Segoe UI","Inter",sans-serif}
    .vps-forge *{box-sizing:border-box}.vf-header{display:flex;justify-content:space-between;align-items:center;gap:14px;flex-wrap:wrap;margin-bottom:16px}.vf-title-wrap h2{margin:0;font-size:1.25rem;letter-spacing:.06em;text-transform:uppercase}.vf-subtitle{margin:6px 0 0;color:var(--sub);font-size:.92rem}
    .vf-pills{display:flex;gap:8px;flex-wrap:wrap}.vf-pill{border:1px solid var(--bd);background:rgba(13,22,38,.85);color:var(--sub);border-radius:999px;padding:6px 10px;font-size:.74rem;letter-spacing:.05em;text-transform:uppercase}
    .vf-grid{display:grid;grid-template-columns:repeat(12,minmax(0,1fr));gap:14px}.vf-card{border:1px solid var(--bd);background:rgba(9,16,29,.84);border-radius:16px;padding:14px;backdrop-filter:blur(8px);box-shadow:inset 0 0 0 1px rgba(128,161,238,.06)}.vf-card h3{margin:0 0 12px;font-size:.88rem;letter-spacing:.09em;text-transform:uppercase}
    .vf-card[data-span="4"]{grid-column:span 4}.vf-card[data-span="5"]{grid-column:span 5}.vf-card[data-span="6"]{grid-column:span 6}.vf-card[data-span="7"]{grid-column:span 7}.vf-card[data-span="12"]{grid-column:span 12}
    .vf-table-wrap{overflow-x:auto}.vf-table{width:100%;border-collapse:collapse;min-width:640px;font-size:.83rem}.vf-table th{text-align:left;color:var(--sub);font-weight:600;border-bottom:1px solid var(--bd);padding:8px 6px}.vf-table td{border-bottom:1px solid rgba(120,160,240,.1);padding:9px 6px;vertical-align:top}
    .vf-actions{display:flex;gap:6px;flex-wrap:wrap}.vf-btn{border:1px solid rgba(138,169,230,.26);background:rgba(18,31,54,.85);color:var(--tx);border-radius:10px;padding:6px 10px;font-size:.75rem;cursor:pointer;transition:transform .2s,border-color .2s,background .2s}.vf-btn:hover{transform:translateY(-1px);border-color:rgba(78,201,216,.58);background:rgba(30,49,80,.92)}.vf-btn[data-kind="danger"]{border-color:rgba(255,107,122,.4);color:#ffdce1}.vf-btn[data-kind="accent"]{border-color:rgba(78,201,216,.58);background:linear-gradient(180deg,rgba(43,107,121,.88),rgba(20,47,61,.88))}
    .vf-status,.vf-level{border-radius:999px;border:1px solid;padding:4px 9px;font-size:.7rem;letter-spacing:.05em;text-transform:uppercase;display:inline-block}.vf-status.ok,.vf-level.ok{border-color:rgba(89,216,161,.55);color:#9cf3cc;background:rgba(37,88,66,.35)}.vf-status.warn,.vf-level.warn{border-color:rgba(255,189,89,.5);color:#ffdb9d;background:rgba(95,67,26,.35)}.vf-status.info,.vf-level.info{border-color:rgba(115,162,252,.52);color:#bfd8ff;background:rgba(36,57,93,.4)}.vf-status.danger,.vf-level.danger{border-color:rgba(255,107,122,.52);color:#ffc4cb;background:rgba(90,34,43,.36)}.vf-status.neutral,.vf-level.neutral{border-color:rgba(138,169,230,.3);color:var(--sub);background:rgba(33,44,67,.36)}
    .vf-plans{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}.vf-plan{border:1px solid rgba(130,167,236,.22);border-radius:14px;padding:12px;background:linear-gradient(180deg,rgba(16,25,41,.92),rgba(10,15,27,.9))}.vf-plan h4{margin:0;font-size:.93rem}.vf-plan-price{margin:8px 0;color:#9de4ef;font-size:1.16rem;font-weight:700}.vf-plan ul{margin:0;padding-left:18px;color:var(--sub);font-size:.8rem;line-height:1.45}
    .vf-form-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.vf-field label{display:block;color:var(--sub);font-size:.76rem;letter-spacing:.05em;text-transform:uppercase;margin-bottom:5px}.vf-field input,.vf-field select{width:100%;border-radius:10px;border:1px solid rgba(140,170,232,.28);background:rgba(10,18,33,.92);color:var(--tx);padding:8px 10px;font-size:.82rem}
    .vf-form-actions{display:flex;gap:8px;align-items:center;margin-top:10px;flex-wrap:wrap}.vf-note{margin:9px 0 0;color:#8fb9ff;font-size:.74rem;letter-spacing:.03em}.vf-alert-list{margin:10px 0 0;padding:0;list-style:none;display:grid;gap:8px}.vf-alert-list li{border:1px solid rgba(120,157,236,.2);border-radius:10px;padding:8px 10px;background:rgba(16,24,42,.76);font-size:.8rem;color:var(--sub)}
    .vf-health-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.vf-health{border:1px solid rgba(129,161,228,.2);border-radius:12px;padding:10px;background:rgba(10,17,31,.8)}.vf-health-head{display:flex;justify-content:space-between;align-items:center;gap:10px;margin-bottom:10px;flex-wrap:wrap}.vf-health h4{margin:0;font-size:.86rem}
    .vf-metric-row{display:grid;grid-template-columns:70px 55px 1fr;align-items:center;gap:7px;margin-bottom:7px;color:var(--sub);font-size:.76rem}.vf-meter{width:100%;height:7px;border-radius:999px;background:rgba(44,63,93,.72);overflow:hidden}.vf-meter i{display:block;height:100%;border-radius:inherit;background:linear-gradient(90deg,#59d8a1,#4ec9d8,#ffbd59,#ff6b7a)}
    .vf-toggle{display:inline-flex;align-items:center;gap:7px;font-size:.76rem;color:var(--sub);cursor:pointer}.vf-toggle input{accent-color:#4ec9d8}
    .vf-logs{margin:0;padding:0;list-style:none;display:grid;gap:8px;max-height:320px;overflow-y:auto}.vf-logs li{border:1px solid rgba(128,160,222,.2);border-radius:10px;background:rgba(8,13,24,.8);padding:9px 10px;display:grid;gap:5px;font-size:.78rem;color:var(--sub)}.vf-log-head{display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap}
    .vf-loading,.vf-empty,.vf-error,.vf-banner{border:1px solid rgba(140,168,230,.22);border-radius:12px;padding:10px 12px;font-size:.8rem;color:var(--sub);background:rgba(8,14,26,.82);margin-bottom:12px}.vf-error{border-color:rgba(255,107,122,.4);color:#ffc4cb;background:rgba(54,19,26,.6)}.vf-banner{border-color:rgba(78,201,216,.35);color:#aceaf2;background:rgba(16,42,47,.65)}
    @media (max-width:1120px){.vf-card[data-span]{grid-column:span 12}.vf-plans{grid-template-columns:1fr}.vf-health-grid{grid-template-columns:1fr}}@media (max-width:780px){.vf-form-grid{grid-template-columns:1fr}.vf-header{align-items:flex-start}}
  `;
  document.head.append(style);
}

function renderPlans(state) {
  if (!state.plans.length) return `<div class="vf-empty">No VPS plans available.</div>`;
  return `<div class="vf-plans">${state.plans.map((plan) => `
    <article class="vf-plan">
      <h4>${esc(plan.name)}</h4>
      <p class="vf-plan-price">$${esc(plan.monthlyUsd)}/mo</p>
      <ul>
        <li>${esc(plan.cpu)} | ${esc(plan.memory)}</li>
        <li>${esc(plan.storage)} | ${esc(plan.bandwidth)}</li>
        <li>${esc(plan.maxTerminals)} terminals</li>
        <li>${esc(plan.bestFor)}</li>
      </ul>
    </article>`).join("")}</div>`;
}

function renderServersTable(state) {
  if (!state.servers.length) return `<div class="vf-empty">No servers launched yet.</div>`;
  return `<div class="vf-table-wrap"><table class="vf-table"><thead><tr><th>Server</th><th>Plan / Region</th><th>Status</th><th>Uptime</th><th>IP</th><th>Controls</th></tr></thead><tbody>
    ${state.servers.map((server) => {
      const tone = statusTone(server.status);
      const plan = findPlanById(state.plans, server.planId);
      return `<tr>
        <td><strong>${esc(server.name)}</strong><br /><small>${esc(server.id)}</small></td>
        <td>${esc(plan?.name || "Unknown")}<br /><small>${esc(server.region)}</small></td>
        <td><span class="vf-status ${esc(tone)}">${esc(server.status)}</span></td>
        <td>${esc(server.uptime)}</td>
        <td>${esc(server.publicIp)}</td>
        <td><div class="vf-actions">
          <button class="vf-btn" data-action="restart-server" data-server-id="${esc(server.id)}">Restart</button>
          <button class="vf-btn" data-action="clone-server" data-server-id="${esc(server.id)}">Clone</button>
          <button class="vf-btn" data-kind="danger" data-action="reinstall-server" data-server-id="${esc(server.id)}">Reinstall</button>
          <button class="vf-btn" data-action="resync-server-config" data-server-id="${esc(server.id)}">Resync Config</button>
        </div></td>
      </tr>`;
    }).join("")}
  </tbody></table></div>`;
}
function renderLaunchForm(state) {
  return `<form data-action="launch-server">
    <div class="vf-form-grid">
      <div class="vf-field"><label for="vf-server-name">Server Name</label><input id="vf-server-name" name="serverName" required placeholder="Ex: Atlas Relay" /></div>
      <div class="vf-field"><label for="vf-plan-id">Plan</label><select id="vf-plan-id" name="planId">${state.plans.map((plan) => `<option value="${esc(plan.id)}">${esc(plan.name)}</option>`).join("")}</select></div>
      <div class="vf-field"><label for="vf-region">Region</label><select id="vf-region" name="region">${state.regions.map((region) => `<option value="${esc(region)}">${esc(region)}</option>`).join("")}</select></div>
      <div class="vf-field"><label for="vf-image">Image</label><select id="vf-image" name="image">${state.images.map((image) => `<option value="${esc(image)}">${esc(image)}</option>`).join("")}</select></div>
      <div class="vf-field"><label for="vf-loadout">Terminal Loadout</label><input id="vf-loadout" name="terminalLoadout" placeholder="Ex: MT5 Gold + Index Squad" /></div>
      <div class="vf-field"><label for="vf-notes">Notes</label><input id="vf-notes" name="notes" placeholder="Ex: Switch backup node" /></div>
    </div>
    <div class="vf-form-actions">
      <button class="vf-btn" data-kind="accent" type="submit">Launch Server</button>
      <span class="vf-note">Simulated launch. TODO: wire provisioning API + infrastructure orchestration.</span>
      <span class="vf-note">User-Supplied fields: server name, notes, and loadout.</span>
    </div>
  </form>`;
}

function renderHealth(state) {
  if (!state.servers.length) return `<div class="vf-empty">No server health telemetry available.</div>`;
  return `<div class="vf-health-grid">${state.servers.map((server) => {
    const score = healthScore(server);
    const tone = score >= 75 ? "ok" : score >= 55 ? "warn" : "danger";
    return `<article class="vf-health">
      <header class="vf-health-head">
        <div><h4>${esc(server.name)}</h4><small>${esc(server.region)} | ${esc(server.publicIp)}</small></div>
        <span class="vf-status ${esc(tone)}">Health ${esc(score)}</span>
      </header>
      ${metricRow("CPU", server.metrics?.cpu)}
      ${metricRow("Memory", server.metrics?.memory)}
      ${metricRow("Disk", server.metrics?.disk)}
      ${metricRow("Latency", clamp((server.metrics?.latencyMs || 0) * 2, 0, 100), "ms x2")}
      <div class="vf-form-actions">
        <label class="vf-toggle"><input type="checkbox" data-action="toggle-auto-heal" data-server-id="${esc(server.id)}" ${server.autoHeal ? "checked" : ""} />Auto-Heal</label>
        <button class="vf-btn" type="button" data-action="resync-server-config" data-server-id="${esc(server.id)}">Resync Config</button>
      </div>
      ${(server.alerts || []).length ? `<ul class="vf-alert-list">${server.alerts.map((alert) => `<li><span class="vf-level ${esc(levelTone(alert.level))}">${esc(alert.level)}</span> ${esc(alert.text)}</li>`).join("")}</ul>` : `<div class="vf-empty">No active alerts.</div>`}
    </article>`;
  }).join("")}</div>`;
}

function renderTerminals(state) {
  if (!state.terminals.length) return `<div class="vf-empty">No terminal loadouts registered.</div>`;
  return `<div class="vf-table-wrap"><table class="vf-table"><thead><tr><th>Terminal</th><th>Server</th><th>Profile</th><th>Sync</th><th>Controls</th></tr></thead><tbody>
    ${state.terminals.map((terminal) => {
      const server = state.servers.find((item) => item.id === terminal.serverId);
      const syncTone = terminal.syncState === "synced" ? "ok" : terminal.syncState === "syncing" ? "info" : "warn";
      return `<tr>
        <td><strong>${esc(terminal.name)}</strong><br /><small>${esc(terminal.platform)} | ${esc(terminal.family)}</small></td>
        <td>${esc(server?.name || terminal.serverId)}</td>
        <td>${esc(terminal.profile)}</td>
        <td><span class="vf-status ${esc(syncTone)}">${esc(terminal.syncState)}</span><br /><small>${esc(formatTimestamp(terminal.lastSync))}</small></td>
        <td><div class="vf-actions">
          <button class="vf-btn" data-action="resync-terminal" data-terminal-id="${esc(terminal.id)}">Resync Config</button>
          <button class="vf-btn" data-action="duplicate-terminal" data-terminal-id="${esc(terminal.id)}">Duplicate Terminal</button>
        </div></td>
      </tr>`;
    }).join("")}
  </tbody></table></div>`;
}

function renderLogs(state) {
  if (!state.logs.length) return `<div class="vf-empty">Deployment logs are empty.</div>`;
  return `<ul class="vf-logs">${state.logs.slice(0, 40).map((log) => `
    <li>
      <div class="vf-log-head"><span><strong>${esc(log.source)}</strong></span><span class="vf-level ${esc(levelTone(log.level))}">${esc(log.level)}</span></div>
      <div>${esc(log.message)}</div>
      <small>${esc(formatTimestamp(log.at))}</small>
    </li>`).join("")}</ul>`;
}

function createInitialState(seed) {
  return { ...seed, loading: true, error: "", notice: "", simulatedBadge: "Simulated Infrastructure" };
}

function addLog(state, level, source, message) {
  state.logs.unshift(createVpsLog(level, source, message));
  if (state.logs.length > 120) state.logs.length = 120;
}

function mutateServer(state, serverId, updater) {
  const server = state.servers.find((item) => item.id === serverId);
  if (!server) return false;
  updater(server);
  return true;
}

function renderShell(root, state) {
  if (state.loading) {
    root.innerHTML = `<section class="vps-forge"><div class="vf-loading">Loading VPS Forge command center...</div></section>`;
    return;
  }
  if (state.error) {
    root.innerHTML = `<section class="vps-forge"><div class="vf-error">VPS Forge render error: ${esc(state.error)}</div></section>`;
    return;
  }

  const serverCount = state.servers.length;
  const alertCount = state.servers.reduce((acc, item) => acc + (item.alerts || []).length, 0);
  const terminalCount = state.terminals.length;

  root.innerHTML = `
    <section class="vps-forge" aria-label="VPS Forge">
      <header class="vf-header">
        <div class="vf-title-wrap">
          <h2>VPS Forge</h2>
          <p class="vf-subtitle">Premium server operations command center for launch, health, and terminal control.</p>
        </div>
        <div class="vf-pills">
          <span class="vf-pill">${esc(serverCount)} servers</span>
          <span class="vf-pill">${esc(terminalCount)} terminals</span>
          <span class="vf-pill">${esc(alertCount)} active alerts</span>
          <span class="vf-pill">${esc(state.simulatedBadge)}</span>
          <span class="vf-pill">User-Supplied</span>
          <span class="vf-pill">Placeholder Integration</span>
        </div>
      </header>
      ${state.notice ? `<div class="vf-banner">${esc(state.notice)}</div>` : `<div class="vf-note">TODO: Real provisioning, infrastructure telemetry, and remote execution APIs remain pending integration.</div>`}
      <div class="vf-grid">
        <section class="vf-card" data-span="12"><h3>VPS Plans</h3>${renderPlans(state)}</section>
        <section class="vf-card" data-span="12"><h3>My Servers</h3>${renderServersTable(state)}</section>
        <section class="vf-card" data-span="5"><h3>Launch Server</h3>${renderLaunchForm(state)}</section>
        <section class="vf-card" data-span="7"><h3>Server Health</h3>${renderHealth(state)}</section>
        <section class="vf-card" data-span="6"><h3>Terminal Manager</h3>${renderTerminals(state)}</section>
        <section class="vf-card" data-span="6"><h3>Deployment Logs</h3>${renderLogs(state)}</section>
      </div>
    </section>`;
}
function handleClick(state, target) {
  const button = target.closest("[data-action]");
  if (!button) return false;

  const action = button.getAttribute("data-action");
  const serverId = button.getAttribute("data-server-id");
  const terminalId = button.getAttribute("data-terminal-id");

  if (action === "restart-server" && serverId) {
    const changed = mutateServer(state, serverId, (server) => {
      server.status = "restarting";
      server.uptime = "00d 00h";
      server.metrics.cpu = clamp((server.metrics.cpu || 0) - 12, 5, 100);
      server.alerts = (server.alerts || []).filter((alert) => alert.level !== "critical");
    });
    if (changed) {
      addLog(state, "info", "My Servers", `Restart queued for ${serverId} (simulated). TODO: connect host reboot endpoint.`);
      state.notice = "Restart command sent to selected server.";
    }
    return changed;
  }

  if (action === "clone-server" && serverId) {
    const source = state.servers.find((server) => server.id === serverId);
    if (!source) return false;
    state.servers.unshift({
      ...source,
      id: makeId("srv-clone"),
      name: `${source.name} Clone`,
      status: "provisioning",
      uptime: "00d 00h",
      publicIp: "Pending",
      terminals: 0,
      alerts: [{ id: makeId("alert"), level: "info", text: "Clone provisioning initiated (simulated)." }]
    });
    addLog(state, "info", "My Servers", `Clone job created from ${source.name}. TODO: wire image snapshot and clone APIs.`);
    state.notice = `Clone started from ${source.name}.`;
    return true;
  }

  if (action === "reinstall-server" && serverId) {
    const changed = mutateServer(state, serverId, (server) => {
      server.status = "maintenance";
      server.uptime = "00d 00h";
      server.alerts = [{ id: makeId("alert"), level: "warning", text: "Reinstall requested. Trading terminals paused." }];
    });
    if (changed) {
      addLog(state, "warning", "My Servers", `Reinstall command submitted for ${serverId} (simulated). TODO: add safe wipe + restore flow.`);
      state.notice = "Reinstall command queued.";
    }
    return changed;
  }

  if (action === "resync-server-config" && serverId) {
    const changed = mutateServer(state, serverId, (server) => {
      server.alerts = (server.alerts || []).filter((alert) => alert.level !== "info");
      server.alerts.unshift({ id: makeId("alert"), level: "info", text: "Config resync completed (simulated)." });
    });
    if (changed) {
      addLog(state, "success", "Server Health", `Server config resync triggered for ${serverId}. TODO: connect central config service.`);
      state.notice = "Server config resynced.";
    }
    return changed;
  }

  if (action === "resync-terminal" && terminalId) {
    const terminal = state.terminals.find((item) => item.id === terminalId);
    if (!terminal) return false;
    terminal.syncState = "synced";
    terminal.lastSync = new Date().toISOString();
    addLog(state, "success", "Terminal Manager", `Terminal ${terminal.name} resynced (simulated). TODO: wire remote terminal config push.`);
    state.notice = `${terminal.name} resynced.`;
    return true;
  }

  if (action === "duplicate-terminal" && terminalId) {
    const source = state.terminals.find((item) => item.id === terminalId);
    if (!source) return false;
    const cloned = {
      ...source,
      id: makeId("term"),
      name: `${source.name} Copy`,
      syncState: "syncing",
      lastSync: new Date().toISOString(),
      autoRestart: false
    };
    state.terminals.unshift(cloned);
    const server = state.servers.find((item) => item.id === source.serverId);
    if (server) server.terminals += 1;
    addLog(state, "info", "Terminal Manager", `Terminal duplicated from ${source.name}. TODO: clone strategy profile in terminal service.`);
    state.notice = `Terminal duplicate created from ${source.name}.`;
    return true;
  }

  return false;
}

function handleToggle(state, target) {
  if (target.getAttribute("data-action") !== "toggle-auto-heal") return false;
  const serverId = target.getAttribute("data-server-id");
  if (!serverId) return false;

  const changed = mutateServer(state, serverId, (server) => {
    server.autoHeal = Boolean(target.checked);
    if (server.autoHeal) {
      server.alerts = server.alerts || [];
      if (!server.alerts.find((alert) => alert.text.includes("Auto-heal"))) {
        server.alerts.unshift({ id: makeId("alert"), level: "info", text: "Auto-heal policy armed." });
      }
    }
  });

  if (changed) {
    addLog(state, "info", "Server Health", `Auto-heal ${target.checked ? "enabled" : "disabled"} for ${serverId}. TODO: persist policy in infra monitor.`);
    state.notice = `Auto-heal ${target.checked ? "enabled" : "disabled"}.`;
  }
  return changed;
}

function handleLaunch(state, form) {
  const formData = new FormData(form);
  const serverName = String(formData.get("serverName") || "").trim();
  const planId = String(formData.get("planId") || "");
  const region = String(formData.get("region") || "");
  const image = String(formData.get("image") || "");
  const terminalLoadout = String(formData.get("terminalLoadout") || "").trim();
  const notes = String(formData.get("notes") || "").trim();

  if (!serverName) {
    state.notice = "Server name is required before launch.";
    return false;
  }

  const plan = findPlanById(state.plans, planId);
  if (!plan) {
    state.notice = "Selected plan is invalid.";
    return false;
  }

  state.servers.unshift({
    id: makeId("srv"),
    name: serverName,
    planId,
    region,
    image,
    status: "provisioning",
    uptime: "00d 00h",
    publicIp: "Pending",
    autoHeal: true,
    terminals: 0,
    metrics: { cpu: 8, memory: 14, disk: 9, latencyMs: 25 },
    alerts: [{ id: makeId("alert"), level: "info", text: "Provisioning pipeline queued (simulated)." }]
  });

  addLog(state, "info", "Launch Server", `Launch requested for ${serverName} on ${plan.name}. TODO: integrate real VPS provisioning + secrets bootstrap.`);
  addLog(state, "info", "Launch Server", `Loadout "${terminalLoadout || "None"}" attached. Notes: ${notes || "n/a"} (simulated).`);
  state.notice = `Launch request accepted for ${serverName}.`;
  form.reset();
  return true;
}

export function mountVpsForge(root, options = {}) {
  if (!root) throw new Error("mountVpsForge requires a root element");
  ensureStyles();

  const state = createInitialState(options.data || getVpsForgeMock());

  const onClick = (event) => {
    const changed = handleClick(state, event.target);
    if (changed) renderShell(root, state);
  };

  const onChange = (event) => {
    const changed = handleToggle(state, event.target);
    if (changed) renderShell(root, state);
  };

  const onSubmit = (event) => {
    const form = event.target;
    if (form?.getAttribute("data-action") !== "launch-server") return;
    event.preventDefault();
    const changed = handleLaunch(state, form);
    if (changed) renderShell(root, state);
  };

  root.addEventListener("click", onClick);
  root.addEventListener("change", onChange);
  root.addEventListener("submit", onSubmit);

  renderShell(root, state);
  setTimeout(() => {
    state.loading = false;
    try {
      renderShell(root, state);
    } catch (error) {
      state.error = String(error?.message || error);
      renderShell(root, state);
    }
  }, 120);

  return {
    destroy() {
      root.removeEventListener("click", onClick);
      root.removeEventListener("change", onChange);
      root.removeEventListener("submit", onSubmit);
    },
    getState() {
      return state;
    }
  };
}

export const startVpsForge = mountVpsForge;
export default mountVpsForge;
