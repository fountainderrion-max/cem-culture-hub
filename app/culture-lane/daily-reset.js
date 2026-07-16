function dateKey(timeZone, date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
}

export class CultureLaneDailyResetScheduler {
  constructor({ engine, persist, intervalMs = 60_000, defaultTimeZone = process.env.CULTURE_DEFAULT_TIMEZONE || "America/New_York" }) {
    this.engine = engine;
    this.persist = persist;
    this.intervalMs = intervalMs;
    this.defaultTimeZone = defaultTimeZone;
    this.lastResetKeys = new Map();
    this.timer = null;
  }

  start() {
    if (this.timer) return;
    this.timer = setInterval(() => this.tick().catch((error) => console.error("Culture Lane daily reset", error)), this.intervalMs);
    this.timer.unref?.();
  }

  stop() {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }

  async tick(now = new Date()) {
    let changed = false;
    for (const lane of this.engine.lanes.values()) {
      const timeZone = lane.harvest?.resetTimeZone || this.defaultTimeZone;
      const key = dateKey(timeZone, now);
      const previous = this.lastResetKeys.get(lane.id) || lane.harvest?.lastResetDateKey;
      if (!previous) {
        this.lastResetKeys.set(lane.id, key);
        lane.harvest.lastResetDateKey = key;
        changed = true;
        continue;
      }
      if (previous === key) continue;
      const totals = this.engine.getLaneTotals(lane.id);
      lane.harvest.baselineEquity = totals.equity;
      lane.harvest.cycle = 1;
      lane.harvest.lockedProfit = 0;
      lane.harvest.pendingCommandId = null;
      lane.harvest.lastResetDateKey = key;
      lane.status = "ACTIVE";
      lane.entryPolicy = "ALLOW";
      this.engine.recordEvent(lane.id, "DAILY_COMPOUND_RESET", { timeZone, baselineEquity: totals.equity, dateKey: key });
      this.lastResetKeys.set(lane.id, key);
      changed = true;
    }
    if (changed) await this.persist();
  }
}
