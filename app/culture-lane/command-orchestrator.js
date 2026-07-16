import crypto from "crypto";

export const COMMAND_STATES = Object.freeze({
  CREATED: "CREATED",
  QUEUED: "QUEUED",
  DELIVERED: "DELIVERED",
  ACKNOWLEDGED: "ACKNOWLEDGED",
  EXECUTING: "EXECUTING",
  VERIFYING: "VERIFYING",
  COMPLETED: "COMPLETED",
  PARTIAL_FAILURE: "PARTIAL_FAILURE",
  RETRYING: "RETRYING",
  TIMED_OUT: "TIMED_OUT",
  REJECTED: "REJECTED"
});

export const TARGET_TERMINAL_STATES = new Set(["SUCCESS", "FAILED", "REJECTED", "TIMED_OUT"]);

const nowIso = () => new Date().toISOString();
const makeId = (prefix) => `${prefix}-${crypto.randomBytes(8).toString("hex")}`;

/**
 * In-memory reference implementation for Redis/PostgreSQL-backed delivery.
 * The interfaces are intentionally small so production adapters can replace
 * this class without changing reporter protocol or API handlers.
 */
export class CultureLaneCommandOrchestrator {
  constructor({ publish, persist, lock, maxAttempts = 4, commandTimeoutMs = 30_000 } = {}) {
    this.publish = publish || (async () => {});
    this.persist = persist || (async () => {});
    this.lock = lock || (async (_key, fn) => fn());
    this.maxAttempts = maxAttempts;
    this.commandTimeoutMs = commandTimeoutMs;
    this.commands = new Map();
  }

  async create({ laneId, type, reason, accountIds, payload = {}, freezeEntries = false, idempotencyKey }) {
    if (!laneId || !type || !Array.isArray(accountIds) || accountIds.length === 0) {
      throw new Error("laneId, type, and at least one target account are required");
    }
    const key = idempotencyKey || `${laneId}:${type}:${new Date().toISOString().slice(0, 16)}`;
    const existing = [...this.commands.values()].find((item) => item.idempotencyKey === key && !this.isTerminal(item));
    if (existing) return structuredClone(existing);

    const createdAt = nowIso();
    const command = {
      id: makeId("cmd"),
      laneId,
      type,
      reason: reason || "MANUAL",
      state: COMMAND_STATES.CREATED,
      idempotencyKey: key,
      payload: structuredClone(payload),
      freezeEntries: Boolean(freezeEntries),
      createdAt,
      updatedAt: createdAt,
      expiresAt: new Date(Date.now() + this.commandTimeoutMs).toISOString(),
      targets: accountIds.map((accountId) => ({
        accountId,
        state: "QUEUED",
        attempts: 0,
        lastError: null,
        updatedAt: createdAt
      }))
    };
    this.commands.set(command.id, command);
    await this.transition(command.id, COMMAND_STATES.QUEUED);
    return structuredClone(command);
  }

  async dispatch(commandId) {
    return this.lock(`culture-lane:command:${commandId}`, async () => {
      const command = this.get(commandId);
      if (this.isTerminal(command)) return structuredClone(command);
      const pending = command.targets.filter((target) => !TARGET_TERMINAL_STATES.has(target.state));
      for (const target of pending) {
        if (target.attempts >= this.maxAttempts) {
          target.state = "TIMED_OUT";
          target.lastError = "Maximum delivery attempts exceeded";
          target.updatedAt = nowIso();
          continue;
        }
        target.attempts += 1;
        target.state = "DELIVERED";
        target.updatedAt = nowIso();
        await this.publish(`culture-lane:${command.laneId}:account:${target.accountId}`, {
          commandId: command.id,
          laneId: command.laneId,
          accountId: target.accountId,
          type: command.type,
          reason: command.reason,
          payload: command.payload,
          freezeEntries: command.freezeEntries,
          expiresAt: command.expiresAt
        });
      }
      await this.transition(command.id, COMMAND_STATES.DELIVERED);
      return structuredClone(command);
    });
  }

  async acknowledge(commandId, accountId, acknowledgement = {}) {
    return this.lock(`culture-lane:command:${commandId}`, async () => {
      const command = this.get(commandId);
      const target = command.targets.find((item) => item.accountId === accountId);
      if (!target) throw new Error("Command target not found");
      const nextState = String(acknowledgement.state || "ACKNOWLEDGED").toUpperCase();
      const allowed = new Set(["RECEIVED", "ACKNOWLEDGED", "ACCEPTED", "EXECUTING", "SUCCESS", "FAILED", "REJECTED", "TIMED_OUT"]);
      if (!allowed.has(nextState)) throw new Error(`Unsupported acknowledgement state: ${nextState}`);
      target.state = nextState;
      target.lastError = acknowledgement.error || null;
      target.reporterNodeId = acknowledgement.reporterNodeId || target.reporterNodeId || null;
      target.reporterVersion = acknowledgement.reporterVersion || target.reporterVersion || null;
      target.details = structuredClone(acknowledgement.details || {});
      target.updatedAt = nowIso();
      await this.recalculate(command);
      return structuredClone(command);
    });
  }

  async retry(commandId) {
    const command = this.get(commandId);
    for (const target of command.targets) {
      if (["FAILED", "TIMED_OUT"].includes(target.state) && target.attempts < this.maxAttempts) {
        target.state = "QUEUED";
        target.updatedAt = nowIso();
      }
    }
    await this.transition(commandId, COMMAND_STATES.RETRYING);
    return this.dispatch(commandId);
  }

  async verifyClosed(commandId, openTradeCounts = {}) {
    const command = this.get(commandId);
    await this.transition(commandId, COMMAND_STATES.VERIFYING);
    for (const target of command.targets) {
      if (target.state !== "SUCCESS") continue;
      const remaining = Number(openTradeCounts[target.accountId] || 0);
      if (remaining > 0) {
        target.state = "FAILED";
        target.lastError = `${remaining} open trade(s) remain after close command`;
        target.updatedAt = nowIso();
      }
    }
    await this.recalculate(command);
    return structuredClone(command);
  }

  get(commandId) {
    const command = this.commands.get(commandId);
    if (!command) throw new Error("Command not found");
    return command;
  }

  isTerminal(command) {
    return [COMMAND_STATES.COMPLETED, COMMAND_STATES.PARTIAL_FAILURE, COMMAND_STATES.TIMED_OUT, COMMAND_STATES.REJECTED].includes(command.state);
  }

  async recalculate(command) {
    const states = command.targets.map((target) => target.state);
    if (states.every((state) => state === "SUCCESS")) {
      await this.transition(command.id, COMMAND_STATES.COMPLETED);
      return;
    }
    const terminalCount = states.filter((state) => TARGET_TERMINAL_STATES.has(state)).length;
    if (terminalCount === states.length) {
      await this.transition(command.id, states.every((state) => state === "REJECTED") ? COMMAND_STATES.REJECTED : COMMAND_STATES.PARTIAL_FAILURE);
      return;
    }
    if (states.some((state) => state === "EXECUTING")) {
      await this.transition(command.id, COMMAND_STATES.EXECUTING);
      return;
    }
    if (states.some((state) => ["ACKNOWLEDGED", "ACCEPTED", "RECEIVED"].includes(state))) {
      await this.transition(command.id, COMMAND_STATES.ACKNOWLEDGED);
    }
  }

  async transition(commandId, state) {
    const command = this.get(commandId);
    command.state = state;
    command.updatedAt = nowIso();
    await this.persist(structuredClone(command));
    return command;
  }
}
