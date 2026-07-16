import test from "node:test";
import assert from "node:assert/strict";
import { CultureLaneEngine } from "./engine.js";

function setup() {
  const engine = new CultureLaneEngine();
  const lane = engine.createLane({ name: "Alpha", goalValue: 2 });
  const leader = engine.addAccount(lane.id, { name: "Leader", role: "LEADER", balance: 10000, equity: 10000, symbols: ["SPXUSD", "NASUSD"] });
  const follower = engine.addAccount(lane.id, { name: "Follower", role: "FOLLOWER", balance: 5000, equity: 5000, symbols: ["US500.cash", "NAS100"] });
  return { engine, lane, leader, follower };
}

test("routes canonical leader symbol to discovered follower alias", () => {
  const { engine, lane, follower } = setup();
  engine.configureSymbolPolicy(lane.id, { aliases: { SPXUSD: ["US500.cash", "SPX500"] } });
  const result = engine.routeSymbol(lane.id, "SPXUSD", follower.id);
  assert.equal(result.status, "ROUTED");
  assert.equal(result.brokerSymbol, "US500.CASH");
});

test("blocks a symbol for one follower without requiring a full whitelist", () => {
  const { engine, lane, follower } = setup();
  engine.configureSymbolPolicy(lane.id, { accountOverrides: { [follower.id]: { blockedCanonicalSymbols: ["SPXUSD"] } } });
  const result = engine.routeSymbol(lane.id, "SPXUSD", follower.id);
  assert.equal(result.status, "BLOCKED");
});

test("combined lane equity triggers harvest close all", () => {
  const { engine, lane, leader, follower } = setup();
  engine.configureHarvest(lane.id, { goalValue: 2, behavior: "REPEAT", pauseAfterGoal: false, resetBaseline: true });
  engine.updateTelemetry(lane.id, leader.id, { equity: 10250 });
  const result = engine.updateTelemetry(lane.id, follower.id, { equity: 5075 });
  assert.equal(result.reached, true);
  assert.equal(result.command.type, "CLOSE_ALL");
  assert.equal(result.command.targets.length, 2);
});

test("repeat harvest resets baseline and opens next compound cycle", () => {
  const { engine, lane, leader, follower } = setup();
  engine.configureHarvest(lane.id, { goalValue: 1, behavior: "REPEAT", pauseAfterGoal: false, resetBaseline: true });
  engine.updateTelemetry(lane.id, leader.id, { equity: 10100 });
  const trigger = engine.updateTelemetry(lane.id, follower.id, { equity: 5050 });
  const passport = engine.completeHarvest(lane.id, trigger.command, [
    { accountId: leader.id, status: "SUCCESS", latencyMs: 55 },
    { accountId: follower.id, status: "SUCCESS", latencyMs: 71 }
  ]);
  assert.equal(passport.successfulCloses, 2);
  assert.equal(engine.getLane(lane.id).harvest.cycle, 2);
  assert.equal(engine.getLane(lane.id).entryPolicy, "ALLOW");
});

test("once mode pauses entries after goal", () => {
  const { engine, lane } = setup();
  engine.configureHarvest(lane.id, { behavior: "ONCE", pauseAfterGoal: true });
  const command = engine.createCloseAllCommand(lane.id, "HARVEST_GOAL_REACHED");
  engine.completeHarvest(lane.id, command, []);
  assert.equal(engine.getLane(lane.id).status, "PAUSED_DAILY_GOAL");
  assert.equal(engine.getLane(lane.id).entryPolicy, "BLOCK");
});
