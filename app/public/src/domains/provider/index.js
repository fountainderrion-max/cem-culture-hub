import { getProviderMock, resolveProviderSection } from "../../data/provider-admin-mock.js";

function esc(v){return String(v??"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#39;");}
function cards(items){return `<div class="mk-grid mk-grid-4">${items.map((m)=>`<article class="mk-card"><h3>${esc(m.label||m.title||m.segment||m.lane||m.name||"Item")}</h3><p>${esc(m.value||m.detail||m.status||m.state||m.growth||m.amount||m.task||"")}</p></article>`).join("")}</div>`;}
function table(headers,rows){return `<div class="table-wrap"><table class="mk-table"><thead><tr>${headers.map((h)=>`<th>${esc(h)}</th>`).join("")}</tr></thead><tbody>${rows.map((r)=>`<tr>${r.map((c)=>`<td>${esc(c)}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;}

function renderWarRoom(data){
  return `
  <section class="mk-page"><header class="mk-hero"><p class="mk-kicker">War Room</p><h2>Provider and Operator Command Center</h2><p>${esc(data.commandWindow)}</p><div class="chip-row"><span class="chip">Simulation</span><span class="chip">Placeholder Integration</span></div></header>
  ${cards(data.metrics)}
  <div class="mk-grid mk-grid-2">
    <article class="mk-card"><h3>Risk and VPS Alerts</h3>${cards(data.alertFeed)}</article>
    <article class="mk-card"><h3>Operational Checklist</h3>${cards(data.checklist)}</article>
  </div>
  </section>`;
}

function renderProfile(data){
  return `<section class="mk-page"><header class="mk-hero"><p class="mk-kicker">Provider Profile</p><h2>${esc(data.displayName)}</h2><p>${esc(data.verificationStatus)} | Rank ${esc(data.rank)}</p></header>
  ${cards([{label:"Culture Points",value:data.culturePoints},{label:"Followers",value:data.followers},{label:"Active Squads",value:data.squads},{label:"Role",value:data.roleBand}])}
  <div class="mk-grid mk-grid-2"><article class="mk-card"><h3>Policy Cards</h3>${cards(data.policyCards)}</article><article class="mk-card"><h3>Trust Badges</h3><div class="chip-row">${data.trustBadges.map((b)=>`<span class="chip">${esc(b)}</span>`).join("")}</div></article></div>
  <div class="mk-grid mk-grid-2"><article class="mk-card"><h3>Linked Account Footprint</h3>${cards(data.linkedAccounts.map((x)=>({label:x.platform,value:`${x.count} | ${x.status}`})))}</article><article class="mk-card"><h3>Growth Snapshot</h3>${cards(data.growthSnapshot)}</article></div>
  </section>`;
}

function renderFollowers(data){
  return `<section class="mk-page"><header class="mk-hero"><p class="mk-kicker">My Followers</p><h2>Follower Segments and Linked Usage</h2><p>Subscription tier, connected accounts, growth status, squad usage, and risk flags.</p></header>
  ${cards([{label:"Total Followers",value:data.summary.totalFollowers},{label:"Weekly Growth",value:data.summary.weeklyGrowth},{label:"Connected Accounts",value:data.summary.linkedAccounts},{label:"Copied Notional",value:data.summary.copiedNotional}])}
  <div class="mk-grid mk-grid-2"><article class="mk-card"><h3>Segments</h3>${cards(data.segments)}</article><article class="mk-card"><h3>Top Followers</h3>${table(["Handle","Tier","Allocation","Risk","Squads"],data.topFollowers.map((x)=>[x.handle,x.tier,x.allocation,x.riskLane,x.squads]))}</article></div>
  </section>`;
}

function renderSquads(data){
  return `<section class="mk-page"><header class="mk-hero"><p class="mk-kicker">My Squads</p><h2>Provider Squad Operations</h2><p>Assign, monitor, and manage active squads.</p></header>
  ${cards([{label:"Squads",value:data.totals.squads},{label:"Members",value:data.totals.members},{label:"Active Missions",value:data.totals.activeMissions},{label:"Readiness",value:data.totals.readiness}])}
  <article class="mk-card"><h3>Squad Roster</h3>${table(["Name","Archetype","Members","Mission","Loadout","VPS","Readiness"],data.mySquads.map((x)=>[x.name,x.archetype,x.members,x.mission,x.loadout,x.vpsLane,x.readiness]))}</article>
  <article class="mk-card"><h3>Recruitment Queue</h3>${table(["Handle","Role","Requested By","Status"],data.recruitmentQueue.map((x)=>[x.handle,x.role,x.requestedBy,x.status]))}</article>
  </section>`;
}

function renderMissionControl(data){
  return `<section class="mk-page"><header class="mk-hero"><p class="mk-kicker">Mission Control</p><h2>Scout / Attack / Harvest / Defense / Pause</h2><p>Mission state controls, risk alerts, and command queue shells.</p></header>
  <article class="mk-card"><h3>Command Lanes</h3>${table(["Lane","Profile","Active Bots","Squads","Status","Symbols"],data.commandLanes.map((x)=>[x.lane,x.profile,x.activeBots,x.squads,x.status,x.symbols]))}</article>
  <div class="mk-grid mk-grid-2"><article class="mk-card"><h3>Incidents</h3>${table(["Severity","Title","Owner","Age","State"],data.incidents.map((x)=>[x.severity,x.title,x.owner,x.age,x.state]))}</article><article class="mk-card"><h3>Queue</h3>${table(["Action","Target","Approval","ETA"],data.queue.map((x)=>[x.action,x.target,x.approval,x.eta]))}</article></div>
  </section>`;
}

function renderPosts(data){
  return `<section class="mk-page"><header class="mk-hero"><p class="mk-kicker">Provider Posts</p><h2>Publish Mission Updates</h2><p>Post shell with moderation-aware workflow.</p></header>
  ${cards([{label:"Published 7D",value:data.summary.published7d},{label:"Scheduled",value:data.summary.scheduled},{label:"Drafts",value:data.summary.drafts},{label:"Moderation Flags",value:data.summary.moderationFlags}])}
  <div class="mk-grid mk-grid-3"><article class="mk-card"><h3>Drafts</h3>${table(["Title","Audience","Status","Updated"],data.drafts.map((x)=>[x.title,x.audience,x.status,x.updatedAt]))}</article><article class="mk-card"><h3>Scheduled</h3>${table(["Title","Publish","Channel","Moderation"],data.scheduled.map((x)=>[x.title,x.publishAt,x.channel,x.moderation]))}</article><article class="mk-card"><h3>Recent</h3>${table(["Title","Impressions","Engagement","Status"],data.recent.map((x)=>[x.title,x.impressions,x.engagement,x.status]))}</article></div>
  </section>`;
}

function renderPayouts(data){
  return `<section class="mk-page"><header class="mk-hero"><p class="mk-kicker">Payouts</p><h2>Revenue and Settlement Control</h2><p>Subscriptions, switch/VPS revenue concepts, and payout health.</p></header>
  ${cards([{label:"Gross Revenue",value:data.cycle.grossRevenue},{label:"Provider Share",value:data.cycle.providerShare},{label:"Pending Adjustments",value:data.cycle.pendingAdjustments},{label:"Next Payout",value:data.cycle.nextPayoutDate}])}
  <div class="mk-grid mk-grid-2"><article class="mk-card"><h3>Ledger</h3>${table(["Period","Gross","Net","Status","Method"],data.ledger.map((x)=>[x.period,x.gross,x.net,x.status,x.method]))}</article><article class="mk-card"><h3>Exceptions</h3>${table(["Ticket","Reason","Amount","State"],data.exceptions.map((x)=>[x.ticket,x.reason,x.amount,x.state]))}</article></div>
  </section>`;
}

export function renderProviderPage(path){
  const m = getProviderMock();
  const section = resolveProviderSection(path);
  if(section==="provider-profile") return renderProfile(m.profile);
  if(section==="followers") return renderFollowers(m.followers);
  if(section==="squads") return renderSquads(m.squads);
  if(section==="mission-control") return renderMissionControl(m.missionControl);
  if(section==="posts") return renderPosts(m.posts);
  if(section==="payouts") return renderPayouts(m.payouts);
  return renderWarRoom(m.warRoom);
}
