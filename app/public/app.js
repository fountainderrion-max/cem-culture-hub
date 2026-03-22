let state = null;
let latestDecisionId = null;

function esc(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

async function api(path, options = {}) {
  const response = await fetch(path, {
    ...options,
    headers: { "Content-Type": "application/json", ...(options.headers || {}) }
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || "Request failed");
  }
  return response.json();
}

function readDecisionForm() {
  return {
    symbol: document.getElementById("symbol").value.trim(),
    currentPrice: Number(document.getElementById("current-price").value),
    accountBalance: Number(document.getElementById("account-balance").value),
    riskPercent: Number(document.getElementById("risk-percent").value),
    recentWinRate: Number(document.getElementById("recent-win-rate").value),
    recentPnL: Number(document.getElementById("recent-pnl").value),
    spread: Number(document.getElementById("spread").value),
    atr: Number(document.getElementById("atr").value),
    pipValuePerLot: Number(document.getElementById("pip-value").value),
    marketBias: document.getElementById("market-bias").value,
    volatility: document.getElementById("volatility").value,
    structure: document.getElementById("structure").value,
    notes: document.getElementById("notes").value.trim()
  };
}

function renderLatestDecision() {
  const root = document.getElementById("latest-decision");
  if (!state?.latestDecision) {
    root.textContent = "No decision yet.";
    document.getElementById("queue-command").disabled = true;
    return;
  }

  const d = state.latestDecision;
  const s = d.signal;
  latestDecisionId = d.id;

  const warningHtml =
    s.warnings?.length > 0
      ? `<ul>${s.warnings.map((w) => `<li>${esc(w)}</li>`).join("")}</ul>`
      : "<p>No warnings.</p>";

  root.innerHTML = `
    <div class="decision ${esc(s.side.toLowerCase())}">
      <div class="pill">Action: ${esc(s.side)}</div>
      <div class="pill">Confidence: ${esc(Math.round(s.confidence * 100))}%</div>
      <div class="pill">Lot Size: ${esc(s.lotSize)}</div>
      <div class="pill">Risk: $${esc(s.riskUsd)}</div>
      <p><strong>Entry:</strong> ${esc(s.entryPrice)}</p>
      <p><strong>Stop Loss:</strong> ${esc(s.stopLoss)}</p>
      <p><strong>Take Profit:</strong> ${esc(s.takeProfit)}</p>
      <p><strong>R:R:</strong> ${esc(s.rr)}</p>
      <p><strong>Note:</strong> ${esc(s.note)}</p>
      <h4>Warnings</h4>
      ${warningHtml}
    </div>
  `;

  document.getElementById("queue-command").disabled = s.side === "HOLD";
}

function renderCommands() {
  const root = document.getElementById("commands");
  const commands = state?.commands || [];
  if (commands.length === 0) {
    root.textContent = "No commands queued.";
    return;
  }
  root.innerHTML = commands
    .slice(0, 20)
    .map(
      (cmd) => `
      <div class="row">
        <code>${esc(cmd.id)}</code>
        <span>${esc(cmd.symbol)} ${esc(cmd.side)} ${esc(cmd.lotSize)} lots</span>
        <span>${esc(cmd.status)}</span>
      </div>`
    )
    .join("");
}

function renderResults() {
  const root = document.getElementById("results");
  const results = state?.results || [];
  if (results.length === 0) {
    root.textContent = "No results logged.";
    return;
  }
  root.innerHTML = results
    .slice(0, 20)
    .map(
      (r) => `
      <div class="row">
        <code>${esc(r.id)}</code>
        <span>${esc(r.symbol)} ${r.win ? "WIN" : "LOSS"}</span>
        <span>$${esc(r.netPnl)}</span>
      </div>`
    )
    .join("");
}

function renderMemory() {
  const root = document.getElementById("memory-list");
  const memory = state?.botMemory || [];
  if (memory.length === 0) {
    root.textContent = "No memory yet.";
    return;
  }
  root.innerHTML = memory
    .slice(0, 15)
    .map(
      (m) => `
      <div class="row">
        <code>${esc(m.botId)}</code>
        <span>${esc(m.symbol)} / ${esc(m.topic)}</span>
        <span>${esc(m.value.slice(0, 60))}</span>
      </div>`
    )
    .join("");
}

function renderSwarm() {
  const consensusRoot = document.getElementById("swarm-consensus");
  const consensus = state?.swarmConsensus || [];
  if (consensus.length === 0) {
    consensusRoot.textContent = "No consensus yet.";
  } else {
    consensusRoot.innerHTML = consensus
      .slice(0, 10)
      .map(
        (c) => `
        <div class="row">
          <code>${esc(c.symbol)}</code>
          <span>${esc(c.action)} (${Math.round(c.confidence * 100)}%)</span>
          <span>votes ${esc(c.eventCount)}</span>
        </div>`
      )
      .join("");
  }

  const chartPlanRoot = document.getElementById("chart-plan");
  const latestPlan = state?.chartPlans?.[0];
  if (!latestPlan) {
    chartPlanRoot.textContent = "No chart plan yet.";
    return;
  }
  chartPlanRoot.innerHTML = `
    <p><strong>Plan:</strong> ${esc(latestPlan.id)} | ${esc(latestPlan.maxCharts)} charts | ${esc(latestPlan.symbols.join(", "))}</p>
    <div class="row">
      <code>First Slot</code>
      <span>${esc(latestPlan.charts[0]?.chartId || "")}</span>
      <span>${esc((latestPlan.charts[0]?.symbol || "") + " -> " + (latestPlan.charts[0]?.botId || ""))}</span>
    </div>
  `;
}

async function refreshState() {
  state = await api("/api/state");
  renderLatestDecision();
  renderCommands();
  renderResults();
  renderMemory();
  renderSwarm();
}

async function onGenerateDecision(event) {
  event.preventDefault();
  const payload = readDecisionForm();
  await api("/api/decide", {
    method: "POST",
    body: JSON.stringify(payload)
  });
  await refreshState();
}

async function onQueueCommand() {
  if (!latestDecisionId) return;
  await api("/api/commands/queue", {
    method: "POST",
    body: JSON.stringify({ decisionId: latestDecisionId })
  });
  await refreshState();
}

async function onLogResult(event) {
  event.preventDefault();
  await api("/api/results", {
    method: "POST",
    body: JSON.stringify({
      commandId: document.getElementById("result-command-id").value.trim(),
      symbol: document.getElementById("result-symbol").value.trim(),
      netPnl: Number(document.getElementById("result-net-pnl").value),
      win: document.getElementById("result-win").value === "true",
      note: document.getElementById("result-note").value.trim()
    })
  });
  document.getElementById("result-note").value = "";
  document.getElementById("result-command-id").value = "";
  document.getElementById("result-net-pnl").value = "";
  await refreshState();
}

async function onSaveMemory(event) {
  event.preventDefault();
  await api("/api/swarm/memory", {
    method: "POST",
    body: JSON.stringify({
      botId: document.getElementById("mem-bot-id").value.trim(),
      chartId: document.getElementById("mem-chart-id").value.trim(),
      symbol: document.getElementById("mem-symbol").value.trim(),
      topic: document.getElementById("mem-topic").value.trim(),
      value: document.getElementById("mem-value").value.trim(),
      confidence: Number(document.getElementById("mem-confidence").value),
      ttlMinutes: Number(document.getElementById("mem-ttl").value)
    })
  });
  document.getElementById("mem-value").value = "";
  await refreshState();
}

async function onPublishBus(event) {
  event.preventDefault();
  await api("/api/swarm/event", {
    method: "POST",
    body: JSON.stringify({
      botId: document.getElementById("bus-bot-id").value.trim(),
      chartId: document.getElementById("bus-chart-id").value.trim(),
      symbol: document.getElementById("bus-symbol").value.trim(),
      signal: document.getElementById("bus-signal").value,
      confidence: Number(document.getElementById("bus-confidence").value),
      reason: document.getElementById("bus-reason").value.trim()
    })
  });
  document.getElementById("bus-reason").value = "";
  await refreshState();
}

async function onCreatePlan(event) {
  event.preventDefault();
  const symbols = document
    .getElementById("plan-symbols")
    .value.split(",")
    .map((x) => x.trim())
    .filter(Boolean);
  const bots = document
    .getElementById("plan-bots")
    .value.split(",")
    .map((x) => x.trim())
    .filter(Boolean);
  await api("/api/swarm/plan", {
    method: "POST",
    body: JSON.stringify({
      symbols,
      bots,
      maxCharts: Number(document.getElementById("plan-max-charts").value),
      timeframe: document.getElementById("plan-timeframe").value.trim()
    })
  });
  await refreshState();
}

document.addEventListener("DOMContentLoaded", async () => {
  document.getElementById("decision-form").addEventListener("submit", onGenerateDecision);
  document.getElementById("queue-command").addEventListener("click", onQueueCommand);
  document.getElementById("result-form").addEventListener("submit", onLogResult);
  document.getElementById("memory-form").addEventListener("submit", onSaveMemory);
  document.getElementById("bus-form").addEventListener("submit", onPublishBus);
  document.getElementById("plan-form").addEventListener("submit", onCreatePlan);
  await refreshState();
});
