export class PostgresCultureLaneRepository {
  constructor({ connectionString = process.env.DATABASE_URL, ssl = process.env.PGSSL === "false" ? false : { rejectUnauthorized: false } } = {}) {
    if (!connectionString) throw new Error("DATABASE_URL is required for PostgreSQL Culture Lane storage");
    this.connectionString = connectionString;
    this.ssl = ssl;
    this.pool = null;
  }

  async connect() {
    if (this.pool) return this.pool;
    const { Pool } = await import("pg");
    this.pool = new Pool({ connectionString: this.connectionString, ssl: this.ssl, max: Number(process.env.PG_POOL_MAX || 10) });
    await this.pool.query("select 1");
    return this.pool;
  }

  async close() {
    if (this.pool) await this.pool.end();
    this.pool = null;
  }

  async load() {
    const pool = await this.connect();
    const [lanes, commands] = await Promise.all([
      pool.query("select snapshot from culture_lanes order by created_at asc"),
      pool.query("select snapshot from lane_commands order by created_at asc")
    ]);
    return { lanes: lanes.rows.map((row) => row.snapshot), commands: commands.rows.map((row) => row.snapshot) };
  }

  async save(snapshot) {
    const pool = await this.connect();
    const client = await pool.connect();
    try {
      await client.query("begin");
      for (const lane of snapshot.lanes || []) {
        await client.query(
          `insert into culture_lanes (id, name, status, profile_id, snapshot, created_at, updated_at)
           values ($1,$2,$3,$4,$5::jsonb,coalesce($6::timestamptz,now()),coalesce($7::timestamptz,now()))
           on conflict (id) do update set name=excluded.name,status=excluded.status,profile_id=excluded.profile_id,snapshot=excluded.snapshot,updated_at=now()`,
          [lane.id, lane.name, lane.status, lane.profileId, JSON.stringify(lane), lane.createdAt || null, lane.updatedAt || null]
        );
      }
      for (const command of snapshot.commands || []) {
        await client.query(
          `insert into lane_commands (id, lane_id, command_type, state, idempotency_key, snapshot, created_at, updated_at)
           values ($1,$2,$3,$4,$5,$6::jsonb,coalesce($7::timestamptz,now()),coalesce($8::timestamptz,now()))
           on conflict (id) do update set state=excluded.state,snapshot=excluded.snapshot,updated_at=now()`,
          [command.id, command.laneId, command.type, command.state || command.status || "QUEUED", command.idempotencyKey || null, JSON.stringify(command), command.createdAt || null, command.updatedAt || null]
        );
      }
      await client.query("commit");
    } catch (error) {
      await client.query("rollback");
      throw error;
    } finally {
      client.release();
    }
  }

  async saveCommand(command) {
    const pool = await this.connect();
    await pool.query(
      `insert into lane_commands (id,lane_id,command_type,state,idempotency_key,snapshot,created_at,updated_at)
       values ($1,$2,$3,$4,$5,$6::jsonb,coalesce($7::timestamptz,now()),now())
       on conflict (id) do update set state=excluded.state,snapshot=excluded.snapshot,updated_at=now()`,
      [command.id, command.laneId, command.type, command.state || command.status, command.idempotencyKey || null, JSON.stringify(command), command.createdAt || null]
    );
  }
}
