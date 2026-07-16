const $ = (id) => document.getElementById(id);
const money = (value) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(Number(value || 0));
let laneId = null;

async function api(path, options = {}) {
  const response = await fetch(path, {
    ...options,
    headers: { "Content-Type": "application/json", ...(options.headers || {}) }
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || payload.message || "Request failed");
  return payload;
}

function render(view) {
  const lane = view.lane;
  const mission = view.missionControl;
  const totals = mission.totals || {};
  $("laneName").textContent = `${lane.name} · ${lane.profileId} · Genome ${lane.genomes.at(-1)?.version || "v1.0"}`;
  $("balance").textContent = money(totals.balance);
  $("equity").textContent = money(totals.equity);
  $("closed").textContent = money(totals.dailyClosedProfit);
  $("floating").textContent = money(totals.floatingProfit);
  $("online").textContent = `${totals.onlineAccounts || 0} / ${lane.accounts.length}`;
  $("status").textContent = lane.status;

  const harvest = mission.harvest || lane.harvest;
  const baseline = Number(harvest.baselineEquity || totals.equity || 1);
  const gainPercent = baseline ? ((Number(totals.equity || 0) - baseline) / baseline) * 100 : 0;
  const goal = Number(harvest.goalValue || 0);
  const progress = goal > 0 ? Math.max(0, Math.min(100, gainPercent / goal * 100)) : 0;
  $("progressBar").style.width = `${progress}%`;
  $("progressText").textContent = `${gainPercent.toFixed(2)}% / ${goal.toFixed(2)}%`;
  $("harvestText").textContent = `${harvest.behavior} cycle ${harvest.cycle}; ${harvest.pauseAfterGoal ? "lock the day after goal" : "continue to the next goal"}.`;

  $("symbols").textContent = JSON.stringify({ policy: lane.symbolPolicy, accounts: lane.accounts.map(({ id, name, symbols }) => ({ id, name, symbols })) }, null, 2);
  $("blackBox").textContent = JSON.stringify((view.blackBox || []).slice(-12).reverse(), null, 2);
  $("dna").textContent = JSON.stringify(view.dna || { status: "Learning from completed Trade Passports" }, null, 2);
  $("timeline").textContent = JSON.stringify((view.timeline || []).slice(-15).reverse(), null, 2);
}

async function loadLane(id) {
  laneId = id;
  render(await api(`/api/culture-lanes/${id}`));
}

async function boot() {
  const result = await api("/api/culture-lanes");
  const select = $("laneSelect");
  select.innerHTML = "";
  for (const item of result.lanes || []) {
    const option = document.createElement("option");
    option.value = item.laneId;
    option.textContent = item.name || item.mission?.title || item.laneId;
    select.append(option);
  }
  if (!result.lanes?.length) {
    const created = await api("/api/culture-lanes", { method: "POST", body: JSON.stringify({ name: "Culture Lane Alpha", profileId: "compound", goalValue: 2 }) });
    const option = document.createElement("option");
    option.value = created.lane.id;
    option.textContent = created.lane.name;
    select.append(option);
  }
  await loadLane(select.value);
}

$("laneSelect").addEventListener("change", (event) => loadLane(event.target.value));
$("evaluate").addEventListener("click", async () => {
  await api(`/api/culture-lanes/${laneId}/harvest/evaluate`, { method: "POST", body: "{}" });
  await loadLane(laneId);
});
$("harvestNow").addEventListener("click", async () => {
  if (!confirm("Send Close All to every account in this Culture Lane?")) return;
  await api(`/api/culture-lanes/${laneId}/close-all`, { method: "POST", body: JSON.stringify({ source: "MISSION_CONTROL" }) });
  await loadLane(laneId);
});
$("pause").addEventListener("click", async () => {
  await api(`/api/culture-lanes/${laneId}/pause`, { method: "POST", body: "{}" });
  await loadLane(laneId);
});
$("resume").addEventListener("click", async () => {
  await api(`/api/culture-lanes/${laneId}/resume`, { method: "POST", body: "{}" });
  await loadLane(laneId);
});

boot().catch((error) => {
  $("laneName").textContent = error.message;
});
