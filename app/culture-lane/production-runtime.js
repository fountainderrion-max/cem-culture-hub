import { CultureLaneCommandOrchestrator } from "./command-orchestrator.js";
import { PostgresCultureLaneRepository } from "./postgres-repository.js";
import { RedisCultureLaneAdapter } from "./redis-adapter.js";
import { CultureLaneRetryWorker } from "./retry-worker.js";

export async function createProductionCultureLaneRuntime({ engine } = {}) {
  if (!engine) throw new Error("Culture Lane engine is required");
  const repository = new PostgresCultureLaneRepository();
  const redis = new RedisCultureLaneAdapter();
  await Promise.all([repository.connect(), redis.connect()]);

  const orchestrator = new CultureLaneCommandOrchestrator({
    publish: (channel, payload) => redis.publish(channel, payload),
    persist: (command) => repository.saveCommand(command),
    lock: (key, fn) => redis.lock(key, fn),
    maxAttempts: Number(process.env.CULTURE_COMMAND_MAX_ATTEMPTS || 4),
    commandTimeoutMs: Number(process.env.CULTURE_COMMAND_TIMEOUT_MS || 30000)
  });

  const seed = await repository.load();
  for (const command of seed.commands || []) orchestrator.commands.set(command.id, command);

  const retryWorker = new CultureLaneRetryWorker({ orchestrator, redis });
  retryWorker.start();

  const shutdown = async () => {
    retryWorker.stop();
    await Promise.allSettled([redis.close(), repository.close()]);
  };

  return { repository, redis, orchestrator, retryWorker, shutdown };
}
