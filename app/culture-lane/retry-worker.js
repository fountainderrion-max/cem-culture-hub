export class CultureLaneRetryWorker {
  constructor({ orchestrator, redis, intervalMs = Number(process.env.CULTURE_RETRY_INTERVAL_MS || 2000), retryDelayMs = Number(process.env.CULTURE_RETRY_DELAY_MS || 3000) }) {
    this.orchestrator = orchestrator;
    this.redis = redis;
    this.intervalMs = intervalMs;
    this.retryDelayMs = retryDelayMs;
    this.timer = null;
    this.running = false;
  }

  start() {
    if (this.timer) return;
    this.timer = setInterval(() => this.tick().catch((error) => console.error("Culture Lane retry worker", error)), this.intervalMs);
    this.timer.unref?.();
  }

  stop() {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }

  async schedule(commandId, delayMs = this.retryDelayMs) {
    await this.redis.enqueue(commandId, Date.now() + delayMs);
  }

  async tick() {
    if (this.running) return;
    this.running = true;
    try {
      for (const commandId of await this.redis.due(100)) {
        try {
          await this.orchestrator.retry(commandId);
          await this.redis.removeDue(commandId);
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          if (/not found|terminal/i.test(message)) {
            await this.redis.removeDue(commandId);
          } else {
            await this.redis.enqueue(commandId, Date.now() + this.retryDelayMs);
          }
        }
      }
    } finally {
      this.running = false;
    }
  }
}
