BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS culture_lanes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id text NOT NULL,
  name text NOT NULL,
  profile_id text NOT NULL DEFAULT 'compound',
  status text NOT NULL DEFAULT 'ACTIVE',
  entry_policy text NOT NULL DEFAULT 'ALLOW',
  timezone text NOT NULL DEFAULT 'UTC',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS culture_lane_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lane_id uuid NOT NULL REFERENCES culture_lanes(id) ON DELETE CASCADE,
  external_account_id text NOT NULL,
  name text NOT NULL,
  role text NOT NULL CHECK (role IN ('LEADER','FOLLOWER')),
  broker text,
  server text,
  login text,
  online boolean NOT NULL DEFAULT false,
  paused boolean NOT NULL DEFAULT false,
  last_seen timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (lane_id, external_account_id)
);

CREATE TABLE IF NOT EXISTS lane_telemetry_snapshots (
  id bigserial PRIMARY KEY,
  lane_id uuid NOT NULL REFERENCES culture_lanes(id) ON DELETE CASCADE,
  account_id uuid NOT NULL REFERENCES culture_lane_accounts(id) ON DELETE CASCADE,
  balance numeric(20,2) NOT NULL DEFAULT 0,
  equity numeric(20,2) NOT NULL DEFAULT 0,
  floating_profit numeric(20,2) NOT NULL DEFAULT 0,
  daily_closed_profit numeric(20,2) NOT NULL DEFAULT 0,
  open_trade_count integer NOT NULL DEFAULT 0,
  trading_enabled boolean NOT NULL DEFAULT true,
  captured_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS lane_telemetry_account_time_idx ON lane_telemetry_snapshots(account_id, captured_at DESC);

CREATE TABLE IF NOT EXISTS lane_harvest_settings (
  lane_id uuid PRIMARY KEY REFERENCES culture_lanes(id) ON DELETE CASCADE,
  enabled boolean NOT NULL DEFAULT true,
  goal_type text NOT NULL DEFAULT 'PERCENT_EQUITY',
  goal_value numeric(12,4) NOT NULL DEFAULT 2,
  behavior text NOT NULL DEFAULT 'ONCE',
  pause_after_goal boolean NOT NULL DEFAULT true,
  max_cycles_per_day integer NOT NULL DEFAULT 1,
  baseline_mode text NOT NULL DEFAULT 'DAILY_START_EQUITY',
  measurement_mode text NOT NULL DEFAULT 'CLOSED_PLUS_FLOATING',
  reset_time_local time NOT NULL DEFAULT '00:00',
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS harvest_cycles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lane_id uuid NOT NULL REFERENCES culture_lanes(id) ON DELETE CASCADE,
  cycle_number integer NOT NULL,
  state text NOT NULL DEFAULT 'ARMED',
  baseline_equity numeric(20,2) NOT NULL DEFAULT 0,
  trigger_equity numeric(20,2),
  locked_profit numeric(20,2) NOT NULL DEFAULT 0,
  goal_value numeric(12,4) NOT NULL,
  triggered_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(lane_id, cycle_number)
);

CREATE TABLE IF NOT EXISTS broker_symbol_inventories (
  id bigserial PRIMARY KEY,
  account_id uuid NOT NULL REFERENCES culture_lane_accounts(id) ON DELETE CASCADE,
  reporter_version text,
  symbols jsonb NOT NULL DEFAULT '[]'::jsonb,
  discovered_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS lane_symbol_policies (
  lane_id uuid PRIMARY KEY REFERENCES culture_lanes(id) ON DELETE CASCADE,
  mode text NOT NULL DEFAULT 'COPY_ALL_EXCEPT_BLOCKED',
  blocked_families jsonb NOT NULL DEFAULT '[]'::jsonb,
  allowed_families jsonb NOT NULL DEFAULT '[]'::jsonb,
  aliases jsonb NOT NULL DEFAULT '{}'::jsonb,
  account_overrides jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS lane_commands (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lane_id uuid NOT NULL REFERENCES culture_lanes(id) ON DELETE CASCADE,
  type text NOT NULL,
  reason text NOT NULL,
  state text NOT NULL DEFAULT 'CREATED',
  idempotency_key text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  freeze_entries boolean NOT NULL DEFAULT false,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(lane_id, idempotency_key)
);
CREATE INDEX IF NOT EXISTS lane_commands_lane_state_idx ON lane_commands(lane_id, state, created_at DESC);

CREATE TABLE IF NOT EXISTS lane_command_targets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  command_id uuid NOT NULL REFERENCES lane_commands(id) ON DELETE CASCADE,
  account_id uuid NOT NULL REFERENCES culture_lane_accounts(id) ON DELETE CASCADE,
  state text NOT NULL DEFAULT 'QUEUED',
  attempt_count integer NOT NULL DEFAULT 0,
  last_error text,
  delivered_at timestamptz,
  acknowledged_at timestamptz,
  executed_at timestamptz,
  completed_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(command_id, account_id)
);

CREATE TABLE IF NOT EXISTS command_acknowledgements (
  id bigserial PRIMARY KEY,
  command_target_id uuid NOT NULL REFERENCES lane_command_targets(id) ON DELETE CASCADE,
  state text NOT NULL,
  reporter_node_id text,
  reporter_version text,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  received_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS trade_passports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lane_id uuid NOT NULL REFERENCES culture_lanes(id) ON DELETE CASCADE,
  command_id uuid REFERENCES lane_commands(id) ON DELETE SET NULL,
  harvest_cycle_id uuid REFERENCES harvest_cycles(id) ON DELETE SET NULL,
  profit numeric(20,2) NOT NULL DEFAULT 0,
  account_count integer NOT NULL DEFAULT 0,
  successful_closes integer NOT NULL DEFAULT 0,
  failed_closes integer NOT NULL DEFAULT 0,
  genome_version text,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  closed_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS lane_timeline_events (
  id bigserial PRIMARY KEY,
  lane_id uuid NOT NULL REFERENCES culture_lanes(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS lane_timeline_lane_time_idx ON lane_timeline_events(lane_id, created_at DESC);

CREATE TABLE IF NOT EXISTS lane_genomes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lane_id uuid NOT NULL REFERENCES culture_lanes(id) ON DELETE CASCADE,
  version text NOT NULL,
  reason text NOT NULL,
  configuration jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(lane_id, version)
);

CREATE TABLE IF NOT EXISTS lane_dna_snapshots (
  id bigserial PRIMARY KEY,
  lane_id uuid NOT NULL REFERENCES culture_lanes(id) ON DELETE CASCADE,
  metrics jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS culture_intelligence_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lane_id uuid NOT NULL REFERENCES culture_lanes(id) ON DELETE CASCADE,
  period_start timestamptz,
  period_end timestamptz,
  summary jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS black_box_events (
  id bigserial PRIMARY KEY,
  lane_id uuid NOT NULL REFERENCES culture_lanes(id) ON DELETE CASCADE,
  command_id uuid REFERENCES lane_commands(id) ON DELETE SET NULL,
  severity text NOT NULL DEFAULT 'INFO',
  event_type text NOT NULL,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS black_box_lane_time_idx ON black_box_events(lane_id, created_at DESC);

COMMIT;
