import { socialMock } from "../../data/social-mock.js";
import { createChallengesView, renderChallengesView } from "./challenges-view.js";
import { createFeedView, renderFeedView } from "./feed-view.js";
import { createLeaderboardView, renderLeaderboardView } from "./leaderboard-view.js";
import { createMessagesView, renderMessagesView } from "./messages-view.js";
import { createProfileView, renderProfileView } from "./profile-view.js";

export {
  createFeedView,
  renderFeedView,
  createProfileView,
  renderProfileView,
  createMessagesView,
  renderMessagesView,
  createChallengesView,
  renderChallengesView,
  createLeaderboardView,
  renderLeaderboardView
};

export function createSocialRoutes(options = {}) {
  const data = options.data || socialMock;
  return {
    feed: () => createFeedView({ ...options, data }),
    profile: () => createProfileView({ ...options, data }),
    messages: () => createMessagesView({ ...options, data }),
    challenges: () => createChallengesView({ ...options, data }),
    leaderboard: () => createLeaderboardView({ ...options, data })
  };
}

