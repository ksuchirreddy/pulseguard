import { DatabaseSync } from "node:sqlite";
import path from "node:path";
import fs from "node:fs";
import { Monitor, Heartbeat, Incident, GlobalStats, MonitorStatus } from "./types";

let dbInstance: DatabaseSync | null = null;

export function getDb(): DatabaseSync {
  if (!dbInstance) {
    const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.NODE_ENV === "production" && !fs.existsSync(process.cwd() + "/package.json"));
    const dbPath = isServerless ? path.join("/tmp", "data.db") : path.join(process.cwd(), "data.db");
    dbInstance = new DatabaseSync(dbPath);
    initSchema(dbInstance);
  }
  return dbInstance;
}

function initSchema(db: DatabaseSync) {
  // Create tables
  db.exec(`
    CREATE TABLE IF NOT EXISTS monitors (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      url TEXT NOT NULL,
      method TEXT NOT NULL DEFAULT 'GET',
      interval INTEGER NOT NULL DEFAULT 60,
      timeout INTEGER NOT NULL DEFAULT 5000,
      expected_status INTEGER NOT NULL DEFAULT 200,
      headers TEXT,
      body TEXT,
      status TEXT NOT NULL DEFAULT 'UP',
      last_checked TEXT,
      last_latency INTEGER,
      alert_email TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS heartbeats (
      id TEXT PRIMARY KEY,
      monitor_id TEXT NOT NULL,
      status TEXT NOT NULL,
      response_time INTEGER NOT NULL,
      status_code INTEGER,
      error TEXT,
      timestamp TEXT NOT NULL,
      FOREIGN KEY (monitor_id) REFERENCES monitors (id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_heartbeats_monitor_time ON heartbeats(monitor_id, timestamp);

    CREATE TABLE IF NOT EXISTS incidents (
      id TEXT PRIMARY KEY,
      monitor_id TEXT NOT NULL,
      title TEXT NOT NULL,
      error_details TEXT,
      started_at TEXT NOT NULL,
      resolved_at TEXT,
      status TEXT NOT NULL DEFAULT 'OPEN',
      FOREIGN KEY (monitor_id) REFERENCES monitors (id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_incidents_status ON incidents(status);
  `);

  // Seed sample monitors if empty
  const countStmt = db.prepare("SELECT COUNT(*) as count FROM monitors");
  const result = countStmt.get() as { count: number };

  if (result.count === 0) {
    seedInitialData(db);
  }
}

function seedInitialData(db: DatabaseSync) {
  const now = new Date();
  const sampleMonitors = [
    {
      id: "mon-1",
      name: "GitHub API Gateway",
      url: "https://api.github.com",
      method: "GET",
      interval: 60,
      timeout: 5000,
      expected_status: 200,
      status: "UP",
      last_checked: now.toISOString(),
      last_latency: 142,
      alert_email: "devops@example.com",
      created_at: new Date(Date.now() - 86400000 * 7).toISOString(),
      updated_at: now.toISOString(),
    },
    {
      id: "mon-2",
      name: "Cloudflare 1.1.1.1 DNS",
      url: "https://1.1.1.1",
      method: "GET",
      interval: 60,
      timeout: 3000,
      expected_status: 200,
      status: "UP",
      last_checked: now.toISOString(),
      last_latency: 28,
      alert_email: "infra@example.com",
      created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
      updated_at: now.toISOString(),
    },
    {
      id: "mon-3",
      name: "Supabase Public Health",
      url: "https://supabase.com",
      method: "GET",
      interval: 120,
      timeout: 5000,
      expected_status: 200,
      status: "UP",
      last_checked: now.toISOString(),
      last_latency: 185,
      alert_email: "status@company.io",
      created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
      updated_at: now.toISOString(),
    },
    {
      id: "mon-4",
      name: "HTTPBin Echo Test",
      url: "https://httpbin.org/status/200",
      method: "GET",
      interval: 60,
      timeout: 4000,
      expected_status: 200,
      status: "UP",
      last_checked: now.toISOString(),
      last_latency: 320,
      alert_email: "alerts@example.com",
      created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
      updated_at: now.toISOString(),
    },
  ];

  const insertMon = db.prepare(`
    INSERT INTO monitors (id, name, url, method, interval, timeout, expected_status, status, last_checked, last_latency, alert_email, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertHeartbeat = db.prepare(`
    INSERT INTO heartbeats (id, monitor_id, status, response_time, status_code, timestamp)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  for (const m of sampleMonitors) {
    insertMon.run(
      m.id,
      m.name,
      m.url,
      m.method,
      m.interval,
      m.timeout,
      m.expected_status,
      m.status,
      m.last_checked,
      m.last_latency,
      m.alert_email,
      m.created_at,
      m.updated_at
    );

    // Generate 30 heartbeats across the last 24h
    for (let i = 29; i >= 0; i--) {
      const hbTime = new Date(Date.now() - i * 48 * 60 * 1000).toISOString();
      const latencyVariance = Math.floor(Math.random() * 40) - 20;
      const latency = Math.max(15, m.last_latency + latencyVariance);
      insertHeartbeat.run(
        `hb-${m.id}-${i}`,
        m.id,
        "UP",
        latency,
        200,
        hbTime
      );
    }
  }
}

// Database Operations
export function getAllMonitors(): Monitor[] {
  const db = getDb();
  const rows = db.prepare(`SELECT * FROM monitors ORDER BY created_at DESC`).all() as any[];
  return rows.map(mapRowToMonitor);
}

export function getMonitorById(id: string): Monitor | null {
  const db = getDb();
  const row = db.prepare(`SELECT * FROM monitors WHERE id = ?`).get(id) as any;
  if (!row) return null;
  return mapRowToMonitor(row);
}

export function createMonitor(data: Omit<Monitor, "id" | "status" | "createdAt" | "updatedAt">): Monitor {
  const db = getDb();
  const id = "mon-" + Math.random().toString(36).substring(2, 9);
  const now = new Date().toISOString();
  
  db.prepare(`
    INSERT INTO monitors (id, name, url, method, interval, timeout, expected_status, headers, body, status, alert_email, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'UP', ?, ?, ?)
  `).run(
    id,
    data.name,
    data.url,
    data.method || "GET",
    data.interval || 60,
    data.timeout || 5000,
    data.expectedStatus || 200,
    data.headers || null,
    data.body || null,
    data.alertEmail || null,
    now,
    now
  );

  return getMonitorById(id)!;
}

export function updateMonitor(id: string, data: Partial<Monitor>): Monitor | null {
  const db = getDb();
  const current = getMonitorById(id);
  if (!current) return null;

  const now = new Date().toISOString();
  db.prepare(`
    UPDATE monitors
    SET name = ?, url = ?, method = ?, interval = ?, timeout = ?, expected_status = ?, headers = ?, body = ?, alert_email = ?, updated_at = ?
    WHERE id = ?
  `).run(
    data.name ?? current.name,
    data.url ?? current.url,
    data.method ?? current.method,
    data.interval ?? current.interval,
    data.timeout ?? current.timeout,
    data.expectedStatus ?? current.expectedStatus,
    data.headers ?? current.headers ?? null,
    data.body ?? current.body ?? null,
    data.alertEmail ?? current.alertEmail ?? null,
    now,
    id
  );

  return getMonitorById(id);
}

export function deleteMonitor(id: string): boolean {
  const db = getDb();
  db.prepare(`DELETE FROM heartbeats WHERE monitor_id = ?`).run(id);
  db.prepare(`DELETE FROM incidents WHERE monitor_id = ?`).run(id);
  const result = db.prepare(`DELETE FROM monitors WHERE id = ?`).run(id);
  return result.changes > 0;
}

export function toggleMonitorStatus(id: string): Monitor | null {
  const db = getDb();
  const current = getMonitorById(id);
  if (!current) return null;

  const newStatus: MonitorStatus = current.status === "PAUSED" ? "UP" : "PAUSED";
  const now = new Date().toISOString();

  db.prepare(`UPDATE monitors SET status = ?, updated_at = ? WHERE id = ?`).run(newStatus, now, id);
  return getMonitorById(id);
}

export function recordProbeResult(
  monitorId: string,
  status: "UP" | "DOWN" | "DEGRADED",
  responseTime: number,
  statusCode?: number,
  error?: string
) {
  const db = getDb();
  const now = new Date().toISOString();
  const hbId = "hb-" + Math.random().toString(36).substring(2, 10);

  // Record Heartbeat
  db.prepare(`
    INSERT INTO heartbeats (id, monitor_id, status, response_time, status_code, error, timestamp)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(hbId, monitorId, status, responseTime, statusCode ?? null, error ?? null, now);

  // Update Monitor status & latency
  db.prepare(`
    UPDATE monitors
    SET status = ?, last_checked = ?, last_latency = ?, updated_at = ?
    WHERE id = ?
  `).run(status, now, responseTime, now, monitorId);

  // Handle Incidents
  if (status === "DOWN") {
    // Check if open incident exists
    const openInc = db.prepare(`
      SELECT * FROM incidents WHERE monitor_id = ? AND status = 'OPEN'
    `).get(monitorId) as any;

    if (!openInc) {
      const incId = "inc-" + Math.random().toString(36).substring(2, 9);
      const title = `Outage detected on ${statusCode ? `HTTP ${statusCode}` : (error || "Connection Timeout")}`;
      db.prepare(`
        INSERT INTO incidents (id, monitor_id, title, error_details, started_at, status)
        VALUES (?, ?, ?, ?, ?, 'OPEN')
      `).run(incId, monitorId, title, error || `Received status ${statusCode}`, now);
    }
  } else if (status === "UP") {
    // Auto-resolve any open incident
    db.prepare(`
      UPDATE incidents
      SET status = 'RESOLVED', resolved_at = ?
      WHERE monitor_id = ? AND status = 'OPEN'
    `).run(now, monitorId);
  }
}

export function getHeartbeatsForMonitor(monitorId: string, limit = 50): Heartbeat[] {
  const db = getDb();
  const rows = db.prepare(`
    SELECT * FROM heartbeats WHERE monitor_id = ? ORDER BY timestamp DESC LIMIT ?
  `).all(monitorId, limit) as any[];

  return rows.reverse().map((r) => ({
    id: r.id,
    monitorId: r.monitor_id,
    status: r.status,
    responseTime: r.response_time,
    statusCode: r.status_code,
    error: r.error,
    timestamp: r.timestamp,
  }));
}

export function getIncidents(status?: "OPEN" | "RESOLVED", limit = 20): Incident[] {
  const db = getDb();
  let query = `
    SELECT i.*, m.name as monitor_name, m.url as monitor_url
    FROM incidents i
    JOIN monitors m ON i.monitor_id = m.id
  `;
  if (status) {
    query += ` WHERE i.status = '${status}'`;
  }
  query += ` ORDER BY i.started_at DESC LIMIT ${limit}`;

  const rows = db.prepare(query).all() as any[];
  return rows.map((r) => ({
    id: r.id,
    monitorId: r.monitor_id,
    monitorName: r.monitor_name,
    monitorUrl: r.monitor_url,
    title: r.title,
    errorDetails: r.error_details,
    startedAt: r.started_at,
    resolvedAt: r.resolved_at,
    status: r.status,
  }));
}

export function calculateUptimePercentage(monitorId: string, hours = 24): number {
  const db = getDb();
  const since = new Date(Date.now() - hours * 3600 * 1000).toISOString();
  
  const stats = db.prepare(`
    SELECT 
      COUNT(*) as total,
      SUM(CASE WHEN status = 'UP' THEN 1 ELSE 0 END) as up_count
    FROM heartbeats
    WHERE monitor_id = ? AND timestamp >= ?
  `).get(monitorId, since) as { total: number; up_count: number | null };

  if (!stats || stats.total === 0) return 100;
  return Number((( (stats.up_count || 0) / stats.total) * 100).toFixed(2));
}

export function getGlobalStats(): GlobalStats {
  const db = getDb();
  const monitors = getAllMonitors();
  
  const totalMonitors = monitors.length;
  const upCount = monitors.filter((m) => m.status === "UP").length;
  const downCount = monitors.filter((m) => m.status === "DOWN").length;
  const degradedCount = monitors.filter((m) => m.status === "DEGRADED").length;
  const pausedCount = monitors.filter((m) => m.status === "PAUSED").length;

  const latencies = monitors.filter((m) => m.lastLatency && m.status !== "PAUSED").map((m) => m.lastLatency!);
  const avgLatency = latencies.length > 0 ? Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length) : 0;

  const openIncCount = (db.prepare(`SELECT COUNT(*) as c FROM incidents WHERE status = 'OPEN'`).get() as any)?.c || 0;

  // Calculate overall uptime
  let totalUptime = 0;
  for (const m of monitors) {
    totalUptime += calculateUptimePercentage(m.id, 24);
  }
  const overallUptime = totalMonitors > 0 ? Number((totalUptime / totalMonitors).toFixed(2)) : 100;

  return {
    totalMonitors,
    upCount,
    downCount,
    degradedCount,
    pausedCount,
    avgLatency,
    overallUptime,
    openIncidentsCount: openIncCount,
  };
}

function mapRowToMonitor(r: any): Monitor {
  const uptime24 = calculateUptimePercentage(r.id, 24);
  const uptime30 = calculateUptimePercentage(r.id, 720);

  return {
    id: r.id,
    name: r.name,
    url: r.url,
    method: r.method,
    interval: r.interval,
    timeout: r.timeout,
    expectedStatus: r.expected_status,
    headers: r.headers,
    body: r.body,
    status: r.status,
    lastChecked: r.last_checked,
    lastLatency: r.last_latency,
    uptime24h: uptime24,
    uptime30d: uptime30,
    alertEmail: r.alert_email,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}
