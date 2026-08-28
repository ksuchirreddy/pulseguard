-- ==============================================================================
-- PulseGuard — Production Supabase / PostgreSQL Database Schema
-- ==============================================================================

-- 1. Monitors Table
CREATE TABLE IF NOT EXISTS monitors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  method VARCHAR(10) NOT NULL DEFAULT 'GET',
  interval INTEGER NOT NULL DEFAULT 60,
  timeout INTEGER NOT NULL DEFAULT 5000,
  expected_status INTEGER NOT NULL DEFAULT 200,
  headers JSONB,
  body TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'UP',
  last_checked TIMESTAMPTZ,
  last_latency INTEGER,
  alert_email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Heartbeats (Time-Series Telemetry) Table
CREATE TABLE IF NOT EXISTS heartbeats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  monitor_id UUID NOT NULL REFERENCES monitors(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL,
  response_time INTEGER NOT NULL,
  status_code INTEGER,
  error TEXT,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_heartbeats_monitor_time 
ON heartbeats(monitor_id, timestamp DESC);

-- 3. Incidents (Outage Tracker) Table
CREATE TABLE IF NOT EXISTS incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  monitor_id UUID NOT NULL REFERENCES monitors(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  error_details TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  status VARCHAR(20) NOT NULL DEFAULT 'OPEN'
);

CREATE INDEX IF NOT EXISTS idx_incidents_status 
ON incidents(status);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE monitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE heartbeats ENABLE ROW LEVEL SECURITY;
ALTER TABLE incidents ENABLE ROW LEVEL SECURITY;

-- 5. Public read access policy for public status page
CREATE POLICY "Public status page can view monitors" 
ON monitors FOR SELECT USING (true);

CREATE POLICY "Public status page can view heartbeats" 
ON heartbeats FOR SELECT USING (true);

CREATE POLICY "Public status page can view incidents" 
ON incidents FOR SELECT USING (true);
