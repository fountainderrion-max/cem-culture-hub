const token = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`;

export class RedisCultureLaneAdapter {
  constructor({ url = process.env.REDIS_URL, lockTtlMs = Number(process.env.CULTURE_LOCK_TTL_MS || 15000) } = {}) {
    if (!url) throw new Error("REDIS_URL is required for Redis Culture Lane orchestration");
    this.url = url;
    this.lockTtlMs = lockTtlMs;
    this.client = null;
    this.subscriber = null;
  }

  async connect() {
    if (this.client) return this.client;
    const { createClient } = await import("redis");
    this.client = createClient({ url: this.url });
    this.client.on("error", (error) => console.error("Culture Lane Redis error", error));
    await this.client.connect();
    return this.client;
  }

  async publish(channel, payload) {
    const client = await this.connect();
    await client.publish(channel, JSON.stringify(payload));
    await client.lPush("culture-lane:delivery-log", JSON.stringify({ channel, payload, at: new Date().toISOString() }));
    await client.lTrim("culture-lane:delivery-log", 0, 9999);
  }

  async enqueue(commandId, runAt = Date.now()) {
    const client = await this.connect();
    await client.zAdd("culture-lane:retry-queue", [{ score: runAt, value: commandId }]);
  }

  async due(limit = 100) {
    const client = await this.connect();
    return client.zRangeByScore("culture-lane:retry-queue", 0, Date.now(), { LIMIT: { offset: 0, count: limit } });
  }

  async removeDue(commandId) {
    const client = await this.connect();
    await client.zRem("culture-lane:retry-queue", commandId);
  }

  async heartbeat(nodeId, payload, ttlSeconds = 30) {
    const client = await this.connect();
    await client.set(`culture-lane:heartbeat:${nodeId}`, JSON.stringify({ ...payload, seenAt: new Date().toISOString() }), { EX: ttlSeconds });
  }

  async getHeartbeat(nodeId) {
    const client = await this.connect();
    const raw = await client.get(`culture-lane:heartbeat:${nodeId}`);
    return raw ? JSON.parse(raw) : null;
  }

  async lock(key, fn) {
    const client = await this.connect();
    const lockKey = `lock:${key}`;
    const lockToken = token();
    const acquired = await client.set(lockKey, lockToken, { NX: true, PX: this.lockTtlMs });
    if (!acquired) throw new Error(`Culture Lane lock busy: ${key}`);
    try {
      return await fn();
    } finally {
      const current = await client.get(lockKey);
      if (current === lockToken) await client.del(lockKey);
    }
  }

  async subscribe(channel, handler) {
    await this.connect();
    if (!this.subscriber) {
      this.subscriber = this.client.duplicate();
      await this.subscriber.connect();
    }
    await this.subscriber.subscribe(channel, async (message) => handler(JSON.parse(message)));
  }

  async close() {
    if (this.subscriber) await this.subscriber.quit();
    if (this.client) await this.client.quit();
    this.subscriber = null;
    this.client = null;
  }
}
