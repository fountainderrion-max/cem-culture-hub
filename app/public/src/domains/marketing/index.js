function esc(v){return String(v??"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#39;");}

const botFamilies = ["Scalping","Order Block","Ladder / Builder","Swing / Trend","Recovery / Defense","Session Specialists","Experimental"];
const publicNav = [
  ["/","Home"], ["/bots","Bots"], ["/squads","Squads"], ["/providers","Providers"], ["/results","Results"], ["/community","Community"], ["/pricing","Pricing"], ["/faq","FAQ"], ["/contact","Contact"], ["/login","Login"], ["/signup","Sign up"]
];

function pageWrap(title, subtitle, body){
  return `
    <section class="mk-page">
      <header class="mk-hero">
        <p class="mk-kicker">CEM CULTURE Public</p>
        <h2>${esc(title)}</h2>
        <p>${esc(subtitle)}</p>
        <nav class="mk-nav">${publicNav.map(([p,l])=>`<a href="${p}">${esc(l)}</a>`).join("")}</nav>
      </header>
      ${body}
    </section>
  `;
}

function card(title, content){
  return `<article class="mk-card"><h3>${esc(title)}</h3><div>${content}</div></article>`;
}

function home(){
  return pageWrap("CEM CULTURE","Premium Social Trading Operating System",`
    <div class="mk-grid mk-grid-2">
      ${card("Primary Hero: Command the Market","<p><strong>Bot Arena</strong>, <strong>Switch Lab</strong>, and <strong>VPS Forge</strong> lead the platform experience as a premium command center.</p><div class='chip-row'><span class='chip'>Bot Arena</span><span class='chip'>Switch Lab</span><span class='chip'>VPS Forge</span></div>")}
      ${card("Secondary Story: Social + Linked","<p><strong>Link Vault</strong> and <strong>Culture Feed</strong> power account-connected social trading with progression in <strong>Growth Chamber</strong>.</p><div class='chip-row'><span class='chip'>Link Vault</span><span class='chip'>Culture Feed</span><span class='chip'>Growth Chamber</span></div>")}
    </div>

    <div class="mk-grid mk-grid-3">
      ${card("Bot Arena","<p>Browse all 53 bots by family, role, unlock level, pair compatibility, and mission fit.</p><p class='mk-note'>Placeholder Integration</p>")}
      ${card("Switch Lab","<p>Unlock and activate smart switches by rank, growth, subscription, or payment.</p><p class='mk-note'>Simulation</p>")}
      ${card("VPS Forge","<p>Launch MetaTrader VPS lanes, monitor health, and manage terminal deployment states.</p><p class='mk-note'>Simulation</p>")}
      ${card("Link Vault","<p>Connect MT4/MT5 accounts, monitor analytics, and configure protections and copier profiles.</p><p class='mk-note'>Simulation + User-Supplied</p>")}
      ${card("Culture Feed","<p>Result posts, chart posts, mission updates, challenge updates, and provider announcements.</p>")}
      ${card("Growth Chamber","<p>Rank ladder, Culture Points, badges, unlock ladder, milestones, and rewards.</p>")}
    </div>

    <div class="mk-grid mk-grid-2">
      ${card("Featured Squads","<p>Order Block Squad, Gold Pressure Squad, Scalper Squad, Ladder Builder Squad, Swing Hold Squad, Hybrid Pressure Squad.</p>")}
      ${card("Results and Social Proof","<p>Challenge winners, chart snapshots, top providers, and squad highlights with risk context.</p>")}
    </div>

    <footer class="mk-cta">
      <h3>Premium command-center social trading</h3>
      <p>Start as a user, connect Link Vault, build loadouts in Bot Arena, activate Switch Lab modules, and scale in VPS Forge.</p>
      <a href="/signup" class="btn btn-primary">Create Cadet Account</a>
    </footer>
  `);
}

function bots(){
  return pageWrap("Bot Arena Preview","Browse all 53 bots by family, role, pair, tier, unlock ladder, and switch compatibility.",`
    <div class="mk-grid mk-grid-2">
      ${card("Families", `<div class="chip-row">${botFamilies.map((f)=>`<span class="chip">${esc(f)}</span>`).join("")}</div>`) }
      ${card("Filters", "<p>Family, role, pair, command tier, rank requirement, growth unlock, switch compatibility.</p>")}
      ${card("Remote Config Model", "<p>Website-managed mission loadouts with account, squad, switch set, and hosting mode.</p>")}
      ${card("Badging", "<p>Simulation badges for system demo data and user-supplied badges for manual configs.</p>")}
    </div>
  `);
}

function squads(){
  return pageWrap("Public Squads","Curated and custom squads with risk grade, market fit, unlock requirements, and provider context.",`
    <div class="mk-grid mk-grid-3">
      ${["Order Block Squad","Gold Pressure Squad","Scalper Squad","Ladder Builder Squad","Swing Hold Squad","Hybrid Pressure Squad"].map((n)=>card(n,"<p>Included bots, supported pairs, mission style, risk grade, account fit, and unlock path.</p>")).join("")}
    </div>
  `);
}

function providers(){
  return pageWrap("Providers","Provider cards with rank, follower count, active squads, and profile CTA.",`
    <div class="mk-grid mk-grid-3">
      ${["Atlas Desk","Vector Prime","Gold Pulse"].map((n)=>card(n,"<p>Rank: Commander | Followers: 2k+ | Active Squads: 6 | Profile CTA.</p>")).join("")}
    </div>
  `);
}

function results(){
  return pageWrap("Results","Challenge winners, chart snapshots, squad highlights, and top providers.",`
    <div class="mk-grid mk-grid-2">
      ${card("Challenge Winners","<p>Growth, drawdown, and consistency snapshot cards.</p>")}
      ${card("Top Providers","<p>Provider performance cards with social engagement context.</p>")}
      ${card("Squad Highlights","<p>Risk-grade aware squad cards with mission states.</p>")}
      ${card("Chart Snapshots","<p>Public result cards designed for social trust and transparency.</p>")}
    </div>
  `);
}

function community(){
  return pageWrap("Community","Culture Feed preview with trending posts, top members, badge showcase, and challenges.",`
    <div class="mk-grid mk-grid-2">
      ${card("Trending Posts","<p>Result posts, chart posts, provider announcements, mission updates.</p>")}
      ${card("Top Members","<p>Most-followed members, providers, and challenge hosts.</p>")}
      ${card("Badge Showcase","<p>Identity, performance, social, and unlock badges.</p>")}
      ${card("Challenges Preview","<p>Live boards, reward badges, and participation states.</p>")}
    </div>
  `);
}

function pricing(){
  return pageWrap("Command Tiers","Command-tier access model aligned to branded progression.",`
    <div class="mk-grid mk-grid-4">
      ${card("Cadet — $0","<p>Feed + profile + rank/badge, limited Link Vault preview, 1 account shell, analytics preview, limited switches, no VPS launch, follow providers/squads, apply for provider status.</p>")}
      ${card("Operator — $150/mo","<p>Full Link Vault analytics, 1 live account slot, Bot Arena, 1–2 loadouts, basic squads/switches, Growth Chamber progression, Starter VPS add-on, basic copier/link settings.</p>")}
      ${card("Squadron — $500/mo","<p>Up to 3 linked accounts, advanced analytics/loadouts, custom squad builder, more switches, full Growth ladder, VPS Forge Pro/Squad lanes, advanced protections and mission presets.</p>")}
      ${card("Command — Invite Only","<p>Multi-account/multi-squad, full VPS Forge lanes, elite switches, private squads, provider/operator tools if approved, priority support, advanced routing/internal beta tools.</p>")}
    </div>
    <p class="mk-note">All advanced role access remains approval-gated through admin review.</p>
  `);
}

function faq(){
  return pageWrap("FAQ","Account linking, smart switches, bots/squads, VPS, provider following, MT4/MT5 basics, trust UX, unlocks, ranks, badges.",`
    <div class="mk-grid mk-grid-2">
      ${["How does MT4/MT5 linking work?","How do smart switches unlock?","How do bots and squads differ?","How does VPS Forge operate?","How does provider following work?","How do role approvals work?","How are simulation and user-supplied data labeled?","How do ranks and badges progress?"].map((q)=>card(q,"<p>Answer shells are present with explicit placeholder integration notes where services are not live.</p>")).join("")}
    </div>
  `);
}

function contact(){
  return pageWrap("Contact","Reach support, provider onboarding, and operations teams.",`
    <div class="mk-grid mk-grid-2">
      ${card("Support","<p>support@cemculture.tech</p>")}
      ${card("Provider Access Requests","<p>providers@cemculture.tech</p>")}
      ${card("Operations","<p>ops@cemculture.tech</p>")}
      ${card("Trust and Safety","<p>trust@cemculture.tech</p>")}
    </div>
  `);
}

function accessRequestBlock(){
  return `
    <article class="mk-card">
      <h3>Apply for Provider / Operator Access</h3>
      <p>Default account role is <strong>User</strong>. Elevated roles require manual admin vetting before access is granted.</p>
      <div class="chip-row"><span class="chip">User Default</span><span class="chip">Manual Vetting Required</span></div>
      <p class="mk-note">Placeholder Integration: approval workflow UI exists, live approval service pending.</p>
    </article>
  `;
}

function auth(name){
  return pageWrap(name, "Secure login and onboarding gate for Command-tier access.",`
    <div class="mk-grid mk-grid-2">
      <div class="mk-card">
        <h3>${esc(name)} Shell</h3>
        <p>Sign in starts in User role by default. Provider/operator/admin routes unlock only after manual approval.</p>
        <div class="chip-row"><span class="chip">Simulation</span><span class="chip">Placeholder Integration</span></div>
        <p class="mk-note">TODO: production SSO + registration verification + approval routing.</p>
        <div class="mk-actions"><a href="/app/feed" class="btn btn-gold">Enter App</a></div>
      </div>
      ${accessRequestBlock()}
    </div>
  `);
}

export function renderMarketingPage(path){
  if(path==="/") return home();
  if(path==="/bots") return bots();
  if(path==="/squads") return squads();
  if(path==="/providers") return providers();
  if(path==="/results") return results();
  if(path==="/community") return community();
  if(path==="/pricing") return pricing();
  if(path==="/faq") return faq();
  if(path==="/contact") return contact();
  if(path==="/login") return auth("Login");
  if(path==="/signup") return auth("Sign up");
  return home();
}
