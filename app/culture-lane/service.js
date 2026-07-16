import { CultureLaneEngine, LANE_PROFILES } from "./engine.js";
import { buildBrokerInventory, buildAliasMapFromInventories } from "./symbol-catalog.js";

const engine = new CultureLaneEngine();

function json(res, statusCode, payload) {
  res.writeHead(statusCode, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
  res.end(JSON.stringify(payload));
}

async function body(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  if (!chunks.length) return {};
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

function laneIdFrom(pathname) {
  const match = pathname.match(/^\/api\/culture-lanes\/([^/]+)/);
  return match?.[1] || null;
}

export async function handleCultureLaneRequest(req, res, pathname) {
  if (!pathname.startsWith("/api/culture-lanes")) return false;
  try {
    if (req.method === "GET" && pathname === "/api/culture-lanes/profiles") {
      json(res, 200, { profiles: Object.values(LANE_PROFILES) });
      return true;
    }

    if (req.method === "POST" && pathname === "/api/culture-lanes") {
      json(res, 201, { lane: engine.createLane(await body(req)) });
      return true;
    }

    const laneId = laneIdFrom(pathname);
    if (!laneId) {
      json(res, 404, { error: "Culture Lane route not found" });
      return true;
    }

    if (req.method === "GET" && pathname === `/api/culture-lanes/${laneId}`) {
      json(res, 200, { lane: engine.getLane(laneId), missionControl: engine.missionControl(laneId) });
      return true;
    }

    if (req.method === "GET" && pathname === `/api/culture-lanes/${laneId}/mission-control`) {
      json(res, 200, engine.missionControl(laneId));
      return true;
    }

    if (req.method === "POST" && pathname === `/api/culture-lanes/${laneId}/accounts`) {
      json(res, 201, { account: engine.addAccount(laneId, await body(req)) });
      return true;
    }

    if (req.method === "POST" && pathname.match(/\/accounts\/[^/]+\/telemetry$/)) {
      const accountId = pathname.split("/").at(-2);
      json(res, 200, engine.updateTelemetry(laneId, accountId, await body(req)));
      return true;
    }

    if (req.method === "POST" && pathname === `/api/culture-lanes/${laneId}/symbols/discover`) {
      const input = await body(req);
      const inventories = (input.accounts || []).map((account) => ({ accountId: account.accountId, inventory: buildBrokerInventory(account.symbols || []) }));
      const aliases = buildAliasMapFromInventories(inventories.map((item) => item.inventory));
      engine.configureSymbolPolicy(laneId, { aliases });
      json(res, 200, { inventories, aliases });
      return true;
    }

    if (req.method === "POST" && pathname === `/api/culture-lanes/${laneId}/symbols/route`) {
      const input = await body(req);
      json(res, 200, engine.routeSymbol(laneId, input.leaderSymbol, input.followerAccountId));
      return true;
    }

    if (req.method === "PATCH" && pathname === `/api/culture-lanes/${laneId}/symbol-policy`) {
      json(res, 200, { symbolPolicy: engine.configureSymbolPolicy(laneId, await body(req)) });
      return true;
    }

    if (req.method === "PATCH" && pathname === `/api/culture-lanes/${laneId}/harvest`) {
      json(res, 200, { harvest: engine.configureHarvest(laneId, await body(req)) });
      return true;
    }

    if (req.method === "POST" && pathname === `/api/culture-lanes/${laneId}/harvest/evaluate`) {
      json(res, 200, engine.evaluateHarvest(laneId));
      return true;
    }

    if (req.method === "POST" && pathname === `/api/culture-lanes/${laneId}/harvest/complete`) {
      const input = await body(req);
      json(res, 200, { passport: engine.completeHarvest(laneId, input.command, input.results || []) });
      return true;
    }

    if (req.method === "POST" && pathname === `/api/culture-lanes/${laneId}/close-all`) {
      json(res, 202, { command: engine.createCloseAllCommand(laneId, "MANUAL_CLOSE_ALL", await body(req)) });
      return true;
    }

    if (req.method === "POST" && pathname === `/api/culture-lanes/${laneId}/simulate`) {
      const input = await body(req);
      json(res, 200, engine.simulateHarvest(laneId, input.equitySeries || [], input.goalPercent));
      return true;
    }

    if (req.method === "POST" && pathname === `/api/culture-lanes/${laneId}/intelligence`) {
      json(res, 200, engine.generateIntelligence(laneId));
      return true;
    }

    json(res, 404, { error: "Culture Lane route not found" });
    return true;
  } catch (error) {
    json(res, 400, { error: error instanceof Error ? error.message : "Culture Lane request failed" });
    return true;
  }
}

export { engine as cultureLaneEngine };
