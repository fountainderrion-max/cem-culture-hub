import { socialMock } from "../../data/social-mock.js";
import { bindInteractionButtons, renderInteractionBar } from "./social-actions.js";
import { ensureSocialTheme } from "./social-theme.js";
import { esc, renderShellHeader, renderStateCard, timeAgo } from "./social-utils.js";

function renderInboxItem(item) {
  return `
    <article class="social-panel">
      <div class="social-row">
        <p class="social-panel-title" style="margin-bottom:0.15rem;">${esc(item.from)}</p>
        ${item.unread ? `<span class="social-chip social-chip-live">Unread</span>` : `<span class="social-chip">Read</span>`}
      </div>
      <p class="social-muted">${esc(item.subject)}</p>
      <p class="social-panel-subtitle" style="margin-top:0.32rem;">${esc(item.preview)}</p>
      <p class="social-muted" style="margin-top:0.45rem;">${esc(timeAgo(item.time))}</p>
    </article>
  `;
}

function renderRequest(item) {
  return `
    <article class="social-panel">
      <p class="social-panel-title">${esc(item.handle)}</p>
      <p class="social-panel-subtitle">${esc(item.reason)}</p>
      <p class="social-muted">${esc(`${item.rank}  |  ${item.mutuals} mutuals`)}</p>
      <div class="social-action-row">
        <button type="button" class="social-btn social-btn-primary" data-social-action="follow" data-social-count="0" aria-pressed="false">Approve <span>0</span></button>
        <button type="button" class="social-btn">Decline</button>
      </div>
    </article>
  `;
}

function renderRoom(room) {
  const statusKind = room.status === "Live" ? "live" : room.status === "Simulated" ? "sim" : "";
  return `
    <article class="social-panel social-panel-strong">
      <div class="social-row">
        <h4 class="social-panel-title" style="margin-bottom:0.12rem;">${esc(room.name)}</h4>
        <span class="social-chip ${statusKind ? `social-chip-${statusKind}` : ""}">${esc(room.status)}</span>
      </div>
      <p class="social-panel-subtitle">${esc(room.topic)}</p>
      <p class="social-muted">${esc(`${room.members} members`)}</p>
      <div class="social-divider"></div>
      <p class="social-panel-subtitle">${esc(room.latest)}</p>
      ${renderInteractionBar(
        {
          likes: Math.max(2, Math.round(room.members * 0.75)),
          comments: Math.max(1, Math.round(room.members * 0.4)),
          reposts: Math.max(0, Math.round(room.members * 0.2)),
          saves: Math.max(1, Math.round(room.members * 0.35)),
          follows: Math.max(0, Math.round(room.members * 0.12))
        },
        room.id
      )}
    </article>
  `;
}

export function createMessagesView(options = {}) {
  ensureSocialTheme();
  const data = options.data || socialMock;
  const route = document.createElement("section");
  route.className = "social-route social-messages";
  const inbox = data?.messages?.inbox || [];
  const requests = data?.messages?.requests || [];
  const rooms = data?.messages?.squadRooms || [];

  route.innerHTML = `
    ${renderShellHeader({
      title: "Messages",
      chips: [
        { label: "Inbox shell", kind: "live" },
        { label: "Realtime transport simulated", kind: "sim" }
      ]
    })}
    <div class="social-panel">
      <p class="social-panel-subtitle">${esc(data?.messages?.simulatedState || "Message state is simulated.")}</p>
    </div>
    <section class="social-grid social-grid-three" style="margin-top:0.85rem;">
      <div class="social-panel">
        <div class="social-row">
          <h3 class="social-panel-title">Inbox</h3>
          <span class="social-chip social-chip-live">${inbox.filter((item) => item.unread).length} unread</span>
        </div>
        <div class="social-list">
          ${
            inbox.length
              ? inbox.map((item) => renderInboxItem(item)).join("")
              : renderStateCard("empty", "Inbox is clear.")
          }
        </div>
      </div>

      <div class="social-panel">
        <h3 class="social-panel-title">Requests</h3>
        <div class="social-list">
          ${
            requests.length
              ? requests.map((item) => renderRequest(item)).join("")
              : renderStateCard("empty", "No pending requests.")
          }
        </div>
      </div>

      <div class="social-panel">
        <h3 class="social-panel-title">Squad Rooms</h3>
        <div class="social-list">
          ${
            rooms.length
              ? rooms.map((room) => renderRoom(room)).join("")
              : renderStateCard("empty", "No rooms joined yet.")
          }
        </div>
      </div>
    </section>
  `;

  bindInteractionButtons(route, options);
  return route;
}

export function renderMessagesView(container, options = {}) {
  if (!container) return null;
  const view = createMessagesView(options);
  container.replaceChildren(view);
  return view;
}

