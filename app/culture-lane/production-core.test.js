import test from "node:test";
import assert from "node:assert/strict";
import { CultureLaneCommandOrchestrator } from "./command-orchestrator.js";
import { CultureLaneEngine } from "./engine.js";
import { CultureLaneDailyResetScheduler } from "./daily-reset.js";

test("command orchestration publishes every account and completes after acknowledgements", async () => {
  const published = [];
  const saved = [];
  const orchestrator = new CultureLaneCommandOrchestrator({
    publish: async (channel, payload) => published.push({ channel, payload }),
    persist: async (command) => saved.push(command),
    lock: async (_key, fn) => fn()
  });
  const command = await orchestrator.create({ laneId: "lane-1", type: "CLOSE_ALL", accountIds: ["a", "b"], freezeEntries: true, idempotencyKey: "test-1" });
  await orchestrator.dispatch(command.id);
  assert.equal(published.length, 2);
  await orchestrator.acknowledge(command.id, "a", { state: "SUCCESS" });
  const completed = await orchestrator.acknowledge(command.id, "b", { state: "SUCCESS" });
  assert.equal(completed.state, "COMPLETED");
  assert.ok(saved.length >= 3);
});

test("daily reset establishes a new baseline and re-enables entries", async () => {
  const engine = new CultureLaneEngine();
  const lane = engine.createLane({ id: "lane-reset", name: "Reset" });
  engine.addAccount(lane.id, { id: "account-1", balance: 1000, equity: 1100 });
  const internal = engine.getLane(lane.id);
  internal.status = "PAUSED_DAILY_GOAL";
  internal.entryPolicy = "BLOCK";
  internal.harvest.lastResetDateKey = "7/15/2026";
  let persisted = false;
  const scheduler = new CultureLaneDailyResetScheduler({ engine, persist: async () => { persisted = true; }, defaultTimeZone: "America/New_York" });
  await scheduler.tick(new Date("2026-07-16T16:00:00Z"));
  assert.equal(internal.harvest.baselineEquity, 1100);
  assert.equal(internal.status, "ACTIVE");
  assert.equal(internal.entryPolicy, "ALLOW");
  assert.equal(persisted, true);
});
