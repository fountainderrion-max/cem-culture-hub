import { getPublicConfig } from "../../core/config.js";

function esc(v){return String(v??"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#39;");}

const botFamilies = ["Scalping","Order Block","Ladder / Builder","Swing / Trend","Recovery / Defense","Session Specialists","Experimental"];
const publicNav = [
  ["/","Home"], ["/bots","Bots"], ["/squads","Squads"], ["/providers","Providers"], ["/results","Results"], ["/community","Community"], ["/pricing","Pricing"], ["/faq","FAQ"], ["/contact","Contact"], ["/legal/privacy","Privacy"], ["/legal/terms","Terms"], ["/login","Login"], ["/signup","Sign up"]
];

function renderNav(){
  return `<nav class="mk-nav">${publicNav.map(([p,l])=>`<a href="${p}">${esc(l)}</a>`).join("")}</nav>`;
}

function cfg(){ return getPublicConfig(); }

function pageWrap(title, subtitle, body){
  return `
    <section class="mk-page">
      <header class="mk-hero">
        <p class="mk-kicker">${esc(cfg().app.name)} Public</p>
        <h2>${esc(title)}</h2>
        <p>${esc(subtitle)}</p>
        ${renderNav()}
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
  const support = c.hero.support;
  return `
    <section class="mk-page mk-marketing-shell">
      <header class="mk-hero">
        <div class="mk-hero-top">
          <img src="/assets/brand/cem-logo-white.png" alt="${esc(c.app.name)}" class="mk-hero-logo" />
          <div>
            <p class="mk-kicker">Mission Control</p>
            <h1>Bot Arena, Switch Lab, VPS Forge fused for premium command-center control.</h1>
            <p class="mk-hero-copy">Remote website-managed bot config, squads, and switches live inside a polished social trading OS shell.</p>
            <div class="mk-hero-actions">
              <a href="/signup" class="btn btn-gold">Launch ${esc(c.app.name)}</a>
              <span class="mk-hero-meta">${esc(c.labels.simulation)} + ${esc(c.labels.placeholderIntegration)}</span>
            </div>
          </div>
        </div>
        ${renderNav()}
        <div class="mk-hero-trio">
          <article class="mk-hero-card">
            <h3>${esc(c.hero.primary)}</h3>
            <p>Command 53 bots across families, assign squads, and publish missions with remote loadout sets.</p>
            <p class="mk-note">TODO: wire live bot telemetry.</p>
            <div class="mk-hero-card-foot">
              <span class="mk-tag mk-tag-sim">${esc(c.labels.simulation)}</span>
            </div>
          </article>
          <article class="mk-hero-card">
            <h3>${esc(c.hero.secondary)}</h3>
            <p>Smart switches, economy states, and unlock ladders roll out with progression-aware gating.</p>
            <p class="mk-note">Simulation-only until switch policy API lands.</p>
            <div class="mk-hero-card-foot">
              <span class="mk-tag mk-tag-sim">${esc(c.labels.simulation)}</span>
            </div>
          </article>
          <article class="mk-hero-card">
            <h3>${esc(c.hero.tertiary)}</h3>
            <p>VPS Forge launch lanes and health dashboards keep MetaTrader terminals ready from the Growth Chamber.</p>
            <p class="mk-note">${esc(c.labels.placeholderIntegration)}</p>
            <div class="mk-hero-card-foot">
              <span class="mk-tag mk-tag-placeholder">${esc(c.labels.placeholderIntegration)}</span>
            </div>
          </article>
        </div>
      </header>

      <section class="mk-section mk-about" id="About">
        <div class="mk-section-head">
          <p class="mk-kicker">About CEM Culture</p>
          <h2>Command center for social trading operators, providers, and builders.</h2>
        </div>
        <p>We keep remote website-managed bot config, observer-grade dashboards, and mission-focused social tools in one dark-luxury shell. Backend connectors remain labeled as Simulation or Placeholder until each integration hits production.</p>
        <div class="mk-about-grid">
          <article>
            <h3>Remote bot config</h3>
            <p>Mission Control orchestrates bots through Config Profiles, switch overlays, and squad assignments without revealing raw variables.</p>
            <p class="mk-note">TODO: hook remote config service and reveal live squads.</p>
          </article>
          <article>
            <h3>Squads & progress</h3>
            <p>Squads stay central: Cadets, Operators, Providers, and Admins move through ranks, unlock ladders, and Culture Points.</p>
            <p class="mk-note">Roles remain visitor -> user -> provider -> operator -> admin. Promotions await admin approval.</p>
          </article>
        </div>
      </section>

      <section class="mk-section mk-services" id="Services">
        <div class="mk-section-head">
          <p class="mk-kicker">Services & Platform Capabilities</p>
          <h2>Every branded room tuned for command and culture.</h2>
        </div>
        <div class="mk-service-grid mk-service-grid-hero">
          <article>
            <div class="mk-service-title">
              <h3>${esc(c.hero.primary)}</h3>
              <span class="mk-tag mk-tag-sim">${esc(c.labels.simulation)}</span>
            </div>
            <p>Bot Arena surfaces families, pair guides, and mission fit so squads pick the right bots without exposure to raw variables.</p>
          </article>
          <article>
            <div class="mk-service-title">
              <h3>${esc(c.hero.secondary)}</h3>
              <span class="mk-tag mk-tag-sim">${esc(c.labels.simulation)}</span>
            </div>
            <p>Switch Lab hosts the smart switch economy, growth pricing, and status states for operators and providers.</p>
          </article>
          <article>
            <div class="mk-service-title">
              <h3>${esc(c.hero.tertiary)}</h3>
              <span class="mk-tag mk-tag-placeholder">${esc(c.labels.placeholderIntegration)}</span>
            </div>
            <p>VPS Forge manages launch sequences, health checks, and terminal lanes for every VPS lane.</p>
          </article>
        </div>
        <div class="mk-support-group">
          <h3>Support pillars</h3>
          <div class="mk-service-grid mk-service-grid-support">
            <article>
              <div class="mk-service-title">
                <h3>${esc(support[0])}</h3>
                <span class="mk-tag mk-tag-user">${esc(c.labels.userSupplied)}</span>
              </div>
              <p>Link Vault previews MT4/MT5 analytics, copier profiles, and tracking without overstating live accounts.</p>
              <p class="mk-note">Placeholder and Simulation data present until account linking is live.</p>
            </article>
            <article>
              <div class="mk-service-title">
                <h3>${esc(support[1])}</h3>
              </div>
              <p>Culture Feed surfaces results, Chart Calls, and announcements so operators can follow providers and squads.</p>
            </article>
            <article>
              <div class="mk-service-title">
                <h3>${esc(support[2])}</h3>
                <span class="mk-tag">Progression</span>
              </div>
              <p>Growth Chamber tracks ranks, badges, unlock ladders, and Culture Points with clear risk context.</p>
            </article>
          </div>
        </div>
        <div class="mk-service-actions">
          <a href="/bots" class="btn btn-secondary">Learn more</a>
          <a href="/contact" class="btn btn-secondary">Book now</a>
        </div>
      </section>

      <section class="mk-section mk-gallery" id="Gallery">
        <div class="mk-section-head">
          <p class="mk-kicker">Gallery + Visual proof</p>
          <h2>Command center snapshots from the shell.</h2>
        </div>
        <div class="mk-gallery-strip">
          <figure style="--mk-gallery-image:url('/assets/marketing/img-9306.png')">
            <span class="mk-tag mk-tag-sim">${esc(c.labels.simulation)}</span>
            <p>Project A | Squad map and mission loadouts</p>
          </figure>
          <figure style="--mk-gallery-image:url('/assets/marketing/img-9308.png')">
            <span class="mk-tag mk-tag-placeholder">${esc(c.labels.placeholderIntegration)}</span>
            <p>Project B | VPS health and deployment</p>
          </figure>
          <figure style="--mk-gallery-image:url('/assets/marketing/img-9310.png')">
            <span class="mk-tag">Leaderboard</span>
            <p>Project C | Culture Feed badges and ranks</p>
          </figure>
          <figure style="--mk-gallery-image:url('/assets/marketing/img-9312.png')">
            <span class="mk-tag mk-tag-sim">${esc(c.labels.simulation)}</span>
            <p>Project D | Link Vault analytics strip</p>
          </figure>
        </div>
        <div class="mk-service-actions">
          <a href="/results" class="btn btn-secondary">Learn more</a>
        </div>
      </section>

      <section class="mk-section mk-testimonials" id="Testimonials">
        <div class="mk-section-head">
          <p class="mk-kicker">Testimonials + Results</p>
          <h2>Provider, operator, and squad sentiment.</h2>
        </div>
        <div class="mk-testimonial-grid">
          <article>
            <p>"Bot Arena and Switch Lab keep teams aligned before we even hit live copier lanes."</p>
            <p class="mk-note">Source: simulated mission replay.</p>
          </article>
          <article>
            <p>"Link Vault plus VPS Forge lets our provider ops team prep launches with health drills."</p>
            <p class="mk-note">Provider voice, placeholder data.</p>
          </article>
        </div>
      </section>

      <section class="mk-section mk-features" id="Features">
        <div class="mk-section-head">
          <p class="mk-kicker">Features</p>
          <h2>Command-grade functions keep the OS grounded.</h2>
        </div>
        <ul class="mk-feature-list">
          <li>Smart switch economy that balances cost, growth unlocks, and operator tiers.</li>
          <li>Squads, bot families, and loadouts stay central to mission orchestration.</li>
          <li>MT4/MT5 tracking, copier analytics, and risk guardrails remain visible but labeled as simulation until integrated.</li>
          <li>VPS Forge monitors launches, health, and terminal channels with remote watchers.</li>
          <li>Role boundaries (visitor, user, provider, operator, admin) stay explicit and gated by admin approval.</li>
        </ul>
      </section>

      <section class="mk-section mk-social" id="Social">
        <div class="mk-section-head">
          <p class="mk-kicker">Social follow + community</p>
          <h2>Culture Feed keeps operators connected.</h2>
        </div>
        <div class="mk-social-grid">
          <article>
            <h3>Culture Feed</h3>
            <p>Field updates, chart drops, live badges, and social challenges for every mission.</p>
            <a href="/community" class="btn btn-secondary">View Culture Feed</a>
          </article>
          <article>
            <h3>Leaderboard & Mission Control</h3>
            <p>Track Growth Chamber ranks, operator progress, and provider signals.</p>
            <a href="/results" class="btn btn-secondary">See Leaderboard</a>
          </article>
        </div>
      </section>

      <section class="mk-section mk-contact-cta mk-cta" id="footer">
        <div>
          <p class="mk-kicker">Contact CTA</p>
          <h2>Need provider, operator, or admin access?</h2>
          <p>Start as a visitor or user, then apply for higher tiers. Every elevated role is manually reviewed.</p>
          <div class="mk-hero-actions">
            <a href="/contact" class="btn btn-primary">Talk to Mission Control</a>
            <span class="mk-note">Support, provider, and operations queues are ready.</span>
          </div>
          <p class="mk-note">
            <a href="/legal/privacy">Privacy</a> | <a href="/legal/terms">Terms</a> | <a href="/legal/risk-disclosure">Risk Disclosure</a>
          </p>
        </div>
      </section>

      <section class="mk-section mk-stats">
        <div class="mk-section-head">
          <p class="mk-kicker">Launch momentum</p>
          <h2>Stats + countdown for the next build push.</h2>
        </div>
        <div class="mk-stats-grid">
          <article>
            <span class="mk-stat-number">14</span>
            <p>Squads queued for onboarding</p>
          </article>
          <article>
            <span class="mk-stat-number">23</span>
            <p>Operators awaiting invite</p>
          </article>
          <article>
            <span class="mk-stat-number">08</span>
            <p>Provider lanes in staging</p>
          </article>
        </div>
        <div class="mk-countdown">
          <div>
            <span>Days</span>
            <strong>32</strong>
          </div>
          <div>
            <span>Hours</span>
            <strong>11</strong>
          </div>
          <div>
            <span>Minutes</span>
            <strong>58</strong>
          </div>
          <div>
            <span>Seconds</span>
            <strong>42</strong>
          </div>
        </div>
        <p class="mk-note">Countdown and stats are simulated until launch telemetry is wired.</p>
      </section>
    </section>
  `;
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
      ${card(`${esc(c.tiers.cadet.name)}  -  $${esc(c.tiers.cadet.price)}`,"<p>Social feed + profile/rank/badges, limited Link Vault preview, 1 account shell, analytics preview, limited switch preview, provider follow.</p>")}
      ${card(`${esc(c.tiers.operator.name)}  -  $${esc(c.tiers.operator.price)}/mo`,"<p>Full Link Vault analytics, 1 live account slot, Bot Arena access, 1-2 loadouts, basic squads/switches, Starter VPS add-on.</p>")}
      ${card(`${esc(c.tiers.squadron.name)}  -  $${esc(c.tiers.squadron.price)}/mo`,"<p>Up to 3 linked accounts, advanced analytics/loadouts, custom squad builder, full growth ladder, VPS Pro/Squad lanes.</p>")}
      ${card(`${esc(c.tiers.command.name)}  -  invite-only`,"<p>Multi-account and multi-squad lanes, elite switches, provider/operator tools if approved, advanced routing concepts.</p>")}
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

function legalPage(title, subtitle, bullets){
  return pageWrap(title, subtitle, `
    <article class="mk-card">
      <h3>${esc(title)}</h3>
      <ul class="mk-feature-list">
        ${bullets.map((item)=>`<li>${esc(item)}</li>`).join("")}
      </ul>
      <p class="mk-note">Placeholder Integration: legal acceptance logging and evidence retention service are not yet connected.</p>
    </article>
  `);
}

function privacyPolicy(){
  return legalPage("Privacy Policy", "How CEM CULTURE handles profile, social, account, and telemetry data in this shell release.", [
    "We only present simulated or user-supplied data in this shell unless explicitly marked as live.",
    "Credentials and broker-link fields are shown as secure-input UX patterns; storage and encryption integrations remain placeholder-labeled.",
    "Role elevation requests (provider/operator/admin) are manually reviewed by admins before activation.",
    "Operational logs, switch actions, and risk events are retained for audit visibility once backend logging is wired."
  ]);
}

function termsOfService(){
  return legalPage("Terms of Service", "Usage terms for public pages, app shell, and provider/operator role pathways.", [
    "Trading tools shown in this release are UX shells and do not guarantee execution performance.",
    "Automated trading controls can be paused by risk guardrails and admin policy at any time.",
    "Provider and operator roles are approval-gated and can be restricted for trust or policy breaches.",
    "Billing tiers define access rights only; live payment settlement integration is pending."
  ]);
}

function riskDisclosure(){
  return legalPage("Risk Disclosure", "Remote bot control and social trading involve market risk and infrastructure risk.", [
    "Max drawdown and daily loss guardrails are configurable policy limits, not profit guarantees.",
    "At 65% of the configured daily loss limit, the shell enters Caution state and can downgrade scalping behavior.",
    "At daily-loss breach, no new automated entries are allowed and ladder/add permissions are disabled.",
    "At drawdown-threshold breach, automated bots and squads pause until manual acknowledgment."
  ]);
}

function securityTrust(){
  return legalPage("Security and Trust", "How permissions, audit trails, and safeguards are represented in the current release.", [
    "Role permissions are segregated across visitor, user, provider, operator, and admin surfaces.",
    "Link Vault and bot control actions are presented with audit-log concepts and emergency disconnect pathways.",
    "VPS health, switch activation history, and bot action history are visible as trust UX placeholders.",
    "Security hardening claims are limited to what is implemented in this release."
  ]);
}

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
  if(path==="/privacy") return privacyPolicy();
  if(path==="/terms") return termsOfService();
  if(path==="/risk") return riskDisclosure();
  if(path==="/security") return securityTrust();
  if(path==="/legal/privacy") return privacyPolicy();
  if(path==="/legal/terms") return termsOfService();
  if(path==="/legal/risk-disclosure") return riskDisclosure();
  if(path==="/login") return auth("Login");
  if(path==="/signup") return auth("Sign up");
  return home();
}
