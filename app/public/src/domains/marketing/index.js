import { getPublicConfig } from "../../core/config.js";

function esc(v){return String(v??"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#39;");}

const botFamilies = ["Scalping","Order Block","Ladder / Builder","Swing / Trend","Recovery / Defense","Session Specialists","Experimental"];
const publicNav = [
  ["/","Home"], ["/bots","Bots"], ["/squads","Squads"], ["/providers","Providers"], ["/results","Results"], ["/community","Community"], ["/pricing","Pricing"], ["/faq","FAQ"], ["/contact","Contact"], ["/login","Login"], ["/signup","Sign up"]
];

function cfg(){ return getPublicConfig(); }

function pageWrap(title, subtitle, body){
  return `
    <section class="mk-page">
      <header class="mk-hero">
        <p class="mk-kicker">${esc(cfg().app.name)} Public</p>
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
  const c = cfg();
  return pageWrap(c.app.name, c.app.tagline,`
    <div class="mk-grid mk-grid-2">
      ${card("Primary Hero: Command the Market",`<p><strong>${esc(c.hero.primary)}</strong>, <strong>${esc(c.hero.secondary)}</strong>, and <strong>${esc(c.hero.tertiary)}</strong> lead the premium command-center experience.</p><div class='chip-row'><span class='chip'>${esc(c.hero.primary)}</span><span class='chip'>${esc(c.hero.secondary)}</span><span class='chip'>${esc(c.hero.tertiary)}</span></div>`) }
      ${card("Secondary Story: Social + Linked", `<p><strong>${esc(c.hero.support[0])}</strong> and <strong>${esc(c.hero.support[1])}</strong> keep the app social and account-connected, with progression in <strong>${esc(c.hero.support[2])}</strong>.</p><div class='chip-row'><span class='chip'>${esc(c.hero.support[0])}</span><span class='chip'>${esc(c.hero.support[1])}</span><span class='chip'>${esc(c.hero.support[2])}</span></div>`) }
    </div>

    <div class="mk-grid mk-grid-3">
      ${card("Bot Arena","<p>Browse all 53 bots by family, role, unlock level, pair compatibility, and mission fit.</p><p class='mk-note'>Placeholder Integration</p>")}
      ${card("Switch Lab","<p>Unlock and activate smart switches by rank, growth, subscription, or payment.</p><p class='mk-note'>"+esc(c.labels.simulation)+"</p>")}
      ${card("VPS Forge","<p>Launch MetaTrader VPS lanes, monitor health, and manage terminal deployment states.</p><p class='mk-note'>"+esc(c.labels.simulation)+"</p>")}
      ${card("Link Vault","<p>Connect MT4/MT5 accounts, monitor analytics, and configure protections and copier profiles.</p><p class='mk-note'>"+esc(c.labels.simulation)+" + "+esc(c.labels.userSupplied)+"</p>")}
      ${card("Culture Feed","<p>Result posts, chart posts, mission updates, challenge updates, and provider announcements.</p>")}
      ${card("Growth Chamber","<p>Rank ladder, Culture Points, badges, unlock ladder, milestones, and rewards.</p>")}
    </div>

    <footer class="mk-cta">
      <h3>Premium command-center social trading</h3>
      <p>Start as a ${esc(c.roleDefaults.defaultSignupRole)}, then apply for elevated access through admin vetting.</p>
      <a href="/signup" class="btn btn-primary">Create ${esc(c.tiers.cadet.name)} Account</a>
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

function pricing(){
  const c = cfg();
  return pageWrap("Command Tiers","Command-tier access model aligned to branded progression.",`
    <div class="mk-grid mk-grid-4">
      ${card(`${esc(c.tiers.cadet.name)} — $${esc(c.tiers.cadet.price)}`,"<p>Social feed + profile/rank/badges, limited Link Vault preview, 1 account shell, analytics preview, limited switch preview, provider follow.</p>")}
      ${card(`${esc(c.tiers.operator.name)} — $${esc(c.tiers.operator.price)}/mo`,"<p>Full Link Vault analytics, 1 live account slot, Bot Arena access, 1-2 loadouts, basic squads/switches, Starter VPS add-on.</p>")}
      ${card(`${esc(c.tiers.squadron.name)} — $${esc(c.tiers.squadron.price)}/mo`,"<p>Up to 3 linked accounts, advanced analytics/loadouts, custom squad builder, full growth ladder, VPS Pro/Squad lanes.</p>")}
      ${card(`${esc(c.tiers.command.name)} — invite-only`,"<p>Multi-account and multi-squad lanes, elite switches, provider/operator tools if approved, advanced routing concepts.</p>")}
    </div>
    <p class="mk-note">Default role: ${esc(c.roleDefaults.defaultSignupRole)}. Elevated roles require admin approval.</p>
  `);
}

function simple(title, subtitle, cardsData){
  return pageWrap(title, subtitle, `<div class="mk-grid mk-grid-2">${cardsData.map(([a,b])=>card(a,b)).join("")}</div>`);
}

function squads(){ return simple("Public Squads","Curated and custom squads with risk grade, market fit, unlock requirements, and provider context.",[["Explore Squads","<p>Included bots, supported pairs, mission style, risk grade, account fit, and unlock path.</p>"],["My Squads","<p>Track active squads and account assignments.</p>"],["Squad Profiles","<p>Provider-backed and community squads with visibility controls.</p>"],["Squad Builder","<p>Build custom squads with mission presets and switch overlays.</p>"]]); }
function providers(){ return simple("Providers","Provider cards with rank, follower count, active squads, and profile CTA.",[["Provider Directory","<p>Ranked providers with follower and squad context.</p>"],["Profile CTA","<p>Open provider profile and follow workflow.</p>"]]); }
function results(){ return simple("Results","Challenge winners, chart snapshots, squad highlights, and top providers.",[["Challenge Winners","<p>Growth, drawdown, and consistency snapshot cards.</p>"],["Top Providers","<p>Provider performance cards with social engagement context.</p>"]]); }
function community(){ return simple("Community","Culture Feed preview with trending posts, top members, badge showcase, and challenges.",[["Trending Posts","<p>Result posts, chart posts, provider announcements, mission updates.</p>"],["Badge Showcase","<p>Identity, performance, social, and unlock badges.</p>"]]); }
function faq(){ return simple("FAQ","Account linking, smart switches, bots/squads, VPS, provider following, MT4/MT5 basics, trust UX, unlocks, ranks, badges.",[["How does MT linking work?","<p>UI flow is ready. Live broker integration is placeholder-labeled.</p>"],["How do role upgrades work?","<p>Apply request + manual admin approval.</p>"]]); }
function contact(){ return simple("Contact","Reach support, provider onboarding, and operations teams.",[["Support","<p>support@cemculture.tech</p>"],["Provider Access","<p>providers@cemculture.tech</p>"],["Operations","<p>ops@cemculture.tech</p>"]]); }

function auth(name){
  const c = cfg();
  return pageWrap(name, "Secure login and onboarding gate for Command-tier access.",`
    <div class="mk-grid mk-grid-2">
      <div class="mk-card">
        <h3>${esc(name)} Shell</h3>
        <p>Default signup role is <strong>${esc(c.roleDefaults.defaultSignupRole)}</strong>. Provider/operator/admin access is manually vetted.</p>
        <div class="chip-row"><span class="chip">${esc(c.labels.simulation)}</span><span class="chip">${esc(c.labels.placeholderIntegration)}</span></div>
        <div class="mk-actions"><a href="/app/feed" class="btn btn-gold">Enter App</a></div>
      </div>
      <article class="mk-card">
        <h3>Apply for Provider / Operator Access</h3>
        <p>Low-friction request flow with admin approval gate.</p>
      </article>
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
