import { CultureLaneEngine, LANE_PROFILES } from "./engine.js";
import { buildBrokerInventory, buildAliasMapFromInventories } from "./symbol-catalog.js";
import { CultureLaneRepository } from "./persistence.js";

const repository = new CultureLaneRepository();
const seed = await repository.load();
const engine = new CultureLaneEngine({ lanes: seed.lanes });
const commands = new Map((seed.commands || []).map((command) => [command.id, command]));

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

async function persist() {
  await repository.save({ lanes: [...engine.lanes.values()], commands: [...commands.values()] });
}

function saveCommand(command) {
  commands.set(command.id, command);
  return command;
}

function laneView(laneId) {
  const lane = engine.getLane(laneId);
  return {
    lane,
    missionControl: engine.missionControl(laneId),
    timeline: lane.timeline,
    passports: lane.passports,
    dna: lane.dna,
    genomes: lane.genomes,
    blackBox: lane.blackBox,
    intelligence: lane.intelligence,
    commands: [...commands.values()].filter((command) => command.laneId === laneId)
  };
}

export async function handleCultureLaneRequest(req, res, pathname) {
  if (!pathname.startsWith("/api/culture-lanes")) return false;
  try {
    if (req.method === "GET" && pathname === "/api/culture-lanes/profiles") {
      json(res, 200, { profiles: Object.values(LANE_PROFILES) });
      return true;
    }

    if (req.method === "GET" && pathname === "/api/culture-lanes") {
      json(res, 200, { lanes: [...engine.lanes.values()].map((lane) => engine.missionControl(lane.id)) });
      return true;
    }

    if (req.method === "POST" && pathname === "/api/culture-lanes") {
      const lane = engine.createLane(await body(req));
      await persist();
      json(res, 201, { lane });
      return true;
    }

    const laneId = laneIdFrom(pathname);
    if (!laneId) {
      json(res, 404, { error: "Culture Lane route not found" });
      return true;
    }

    if (req.method === "GET" && pathname === `/api/culture-lanes/${laneId}`) {
      json(res, 200, laneView(laneId));
      return true;
    }

    if (req.method === "GET" && pathname === `/api/culture-lanes/${laneId}/mission-control`) {
      json(res, 200, engine.missionControl(laneId));
      return true;
    }

    for (const section of ["timeline", "passports", "genomes", "black-box", "intelligence"]) {
      if (req.method === "GET" && pathname === `/api/culture-lanes/${laneId}/${section}`) {
        const lane = engine.getLane(laneId);
        const key = section === "black-box" ? "blackBox" : section;
        json(res, 200, { [key]: lane[key] || [] });
        return true;
      }
    }

    if (req.method === "GET" && pathname === `/api/culture-lanes/${laneId}/dna`) {
      json(res, 200, { dna: engine.getLane(laneId).dna });
      return true;
    }

    if (req.method === "POST" && pathname === `/api/culture-lanes/${laneId}/accounts`) {
      const account = engine.addAccount(laneId, await body(req));
      await persist();
      json(res, 201, { account });
      return true;
    }

    if (req.method === "POST" && pathname.match(/\/accounts\/[^/]+\/telemetry$/)) {
      const accountId = pathname.split("/").at(-2);
      const evaluation = engine.updateTelemetry(laneId, accountId, await body(req));
      if (evaluation.command) saveCommand(evaluation.command);
      await persist();
      json(res, 200, evaluation);
      return true;
    }

    if (req.method === "POST" && pathname === `/api/culture-lanes/${laneId}/symbols/discover`) {
      const input = await body(req);
      const inventories = (input.accounts || []).map((account) => ({ accountId: account.accountId, inventory: buildBrokerInventory(account.symbols || []) }));
      const aliases = buildAliasMapFromInventories(inventories.map((item) => item.inventory));
      engine.configureSymbolPolicy(laneId, { aliases });
      await persist();
      json(res, 200, { inventories, aliases });
      return true;
    }

    if (req.method === "POST" && pathname === `/api/culture-lanes/${laneId}/symbols/route`) {
      const input = await body(req);
      json(res, 200, engine.routeSymbol(laneId, input.leaderSymbol, input.followerAccountId));
      return true;
    }

    if (req.method === "PATCH" && pathname === `/api/culture-lanes/${laneId}/symbol-policy`) {
      const symbolPolicy = engine.configureSymbolPolicy(laneId, await body(req));
      await persist();
      json(res, 200, { symbolPolicy });
      return true;
    }

    if (req.method === "PATCH" && pathname === `/api/culture-lanes/${laneId}/harvest`) {
      const harvest = engine.configureHarvest(laneId, await body(req));
      await persist();
      json(res, 200, { harvest });
      return true;
    }

    if (req.method === "POST" && pathname === `/api/culture-lanes/${laneId}/harvest/evaluate`) {
      const evaluation = engine.evaluateHarvest(laneId);
      if (evaluation.command) saveCommand(evaluation.command);
      await persist();
      json(res, 200, evaluation);
      return true;
    }

    if (req.method === "POST" && pathname === `/api/culture-lanes/${laneId}/harvest/complete`) {
      const input = await body(req);
      const command = commands.get(input.command?.id) || input.command;
      const passport = engine.completeHarvest(laneId, command, input.results || []);
      if (command?.id) commands.set(command.id, { ...command, status: "COMPLETED", completedAt: new Date().toISOString(), results: input.results || [] });
      await persist();
      json(res, 200, { passport });
      return true;
    }

    if (req.method === "POST" && pathname === `/api/culture-lanes/${laneId}/close-all`) {
      const command = saveCommand(engine.createCloseAllCommand(laneId, "MANUAL_CLOSE_ALL", await body(req)));
      await persist();
      json(res, 202, { command });
      return true;
    }

    if (req.method === "POST" && pathname.match(/\/commands\/[^/]+\/ack$/)) {
      const commandId = pathname.split("/").at(-2);
      const input = await body(req);
      const command = commands.get(commandId);
      if (!command || command.laneId !== laneId) throw new Error("Culture Lane command not found");
      command.targets = command.targets.map((target) => target.accountId === input.accountId ? {
        ...target,
        status: input.status || "ACKNOWLEDGED",
        acknowledgedAt: new Date().toISOString(),
        brokerResult: input.brokerResult || null
      } : target);
      const terminal = command.targets.every((target) => ["SUCCESS", "FAILED", "OFFLINE"].includes(target.status));
      command.status = terminal ? (command.targets.some((target) => target.status === "FAILED") ? "PARTIAL_FAILURE" : "COMPLETED") : "EXECUTING";
      await persist();
      json(res, 200, { command });
      return true;
    }

    if (req.method === "POST" && pathname === `/api/culture-lanes/${laneId}/pause`) {
      const lane = engine.getLane(laneId);
      lane.status = "PAUSED_BY_USER";
      lane.entryPolicy = "BLOCK";
      engine.recordEvent(laneId, "LANE_PAUSED", {});
      await persist();
      json(res, 200, engine.missionControl(laneId));
      return true;
    }

    if (req.method === "POST" && pathname === `/api/culture-lanes/${laneId}/resume`) {
      const lane = engine.getLane(laneId);
      lane.status = "ACTIVE";
      lane.entryPolicy = "ALLOW";
      engine.recordEvent(laneId, "LANE_RESUMED", {});
      await persist();
      json(res, 200, engine.missionControl(laneId));
      return true;
    }

    if (req.method === "POST" && pathname === `/api/culture-lanes/${laneId}/simulate`) {
      const input = await body(req);
      json(res, 200, engine.simulateHarvest(laneId, input.equitySeries || [], input.goalPercent));
      return true;
    }

    if (req.method === "POST" && pathname === `/api/culture-lanes/${laneId}/intelligence`) {
      const report = engine.generateIntelligence(laneId);
      await persist();
      json(res, 200, report);
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
