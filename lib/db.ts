import fs from "node:fs";
import path from "node:path";
import { Monitor, Heartbeat, Incident, GlobalStats, MonitorStatus } from "./types";

interface DbSchema {
  monitors: Monitor[];
  heartbeats: Heartbeat[];
  incidents: Incident[];
}

let inMemoryDb: DbSchema | null = null;

function getDbFilePath(): string {
  const isServerless = Boolean(
    process.env.VERCEL ||
    process.env.AWS_LAMBDA_FUNCTION_NAME ||
    (process.env.NODE_ENV === "production" && !fs.existsSync(path.join(process.cwd(), "package.json")))
  );
  return isServerless ? path.join("/tmp", "pulseguard_data.json") : path.join(process.cwd(), "data.json");
}

function loadDb(): DbSchema {
  if (inMemoryDb) return inMemoryDb;

  const filePath = getDbFilePath();
  try {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, "utf-8");
      inMemoryDb = JSON.parse(content);
      return inMemoryDb!;
    }
  } catch (err) {
    console.warn("Failed to read database file, initializing fresh store:", err);
  }

  // Initialize fresh seeded store
  inMemoryDb = seedInitialStore();
  saveDb(inMemoryDb);
  return inMemoryDb;
}

function saveDb(db: DbSchema) {
  inMemoryDb = db;
  const filePath = getDbFilePath();
  try {
    fs.writeFileSync(filePath, JSON.stringify(db, null, 2), "utf-8");
  } catch (err) {
    // Non-fatal if filesystem is read-only
  }
}

function seedInitialStore(): DbSchema {
  const now = new Date();
  const monitors: Monitor[] = [
    {
      id: "mon-1",
      name: "GitHub API Gateway",
      url: "https://api.github.com",
      method: "GET",
      interval: 60,
      timeout: 5000,
      expectedStatus: 200,
      status: "UP",
      lastChecked: now.toISOString(),
      lastLatency: 142,
      alertEmail: "devops@example.com",
      createdAt: new Date(Date.now() - 86400000 * 7).toISOString(),
      updatedAt: now.toISOString(),
    },
    {
      id: "mon-2",
      name: "Cloudflare 1.1.1.1 DNS",
      url: "https://1.1.1.1",
      method: "GET",
      interval: 60,
      timeout: 3000,
      expectedStatus: 200,
      status: "UP",
      lastChecked: now.toISOString(),
      lastLatency: 28,
      alertEmail: "infra@example.com",
      createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
      updatedAt: now.toISOString(),
    },
    {
      id: "mon-3",
      name: "Supabase Public Health",
      url: "https://supabase.com",
      method: "GET",
      interval: 120,
      timeout: 5000,
      expectedStatus: 200,
      status: "UP",
      lastChecked: now.toISOString(),
      lastLatency: 185,
      alertEmail: "status@company.io",
      createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
      updatedAt: now.toISOString(),
    },
    {
      id: "mon-4",
      name: "HTTPBin Echo Test",
      url: "https://httpbin.org/status/200",
      method: "GET",
      interval: 60,
      timeout: 4000,
      expectedStatus: 200,
      status: "UP",
      lastChecked: now.toISOString(),
      lastLatency: 320,
      alertEmail: "alerts@example.com",
      createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      updatedAt: now.toISOString(),
    },
  ];

  const heartbeats: Heartbeat[] = [];
  for (const m of monitors) {
    for (let i = 29; i >= 0; i--) {
      const hbTime = new Date(Date.now() - i * 48 * 60 * 1000).toISOString();
      const latencyVariance = Math.floor(Math.random() * 40) - 20;
      const latency = Math.max(15, (m.lastLatency || 100) + latencyVariance);
      heartbeats.push({
        id: `hb-${m.id}-${i}`,
        monitorId: m.id,
        status: "UP",
        responseTime: latency,
        statusCode: 200,
        timestamp: hbTime,
      });
    }
  }

  return {
    monitors,
    heartbeats,
    incidents: [],
  };
}

// Database Public Operations
export function getAllMonitors(): Monitor[] {
  const db = loadDb();
  return db.monitors.map((m) => ({
    ...m,
    uptime24h: calculateUptimePercentage(m.id, 24),
    uptime30d: calculateUptimePercentage(m.id, 720),
  }));
}

export function getMonitorById(id: string): Monitor | null {
  const db = loadDb();
  const m = db.monitors.find((item) => item.id === id);
  if (!m) return null;
  return {
    ...m,
    uptime24h: calculateUptimePercentage(m.id, 24),
    uptime30d: calculateUptimePercentage(m.id, 720),
  };
}

export function createMonitor(data: Omit<Monitor, "id" | "status" | "createdAt" | "updatedAt">): Monitor {
  const db = loadDb();
  const id = "mon-" + Math.random().toString(36).substring(2, 9);
  const now = new Date().toISOString();

  const newMonitor: Monitor = {
    id,
    name: data.name,
    url: data.url,
    method: data.method || "GET",
    interval: data.interval || 60,
    timeout: data.timeout || 5000,
    expectedStatus: data.expectedStatus || 200,
    headers: data.headers,
    body: data.body,
    status: "UP",
    alertEmail: data.alertEmail,
    createdAt: now,
    updatedAt: now,
    uptime24h: 100,
    uptime30d: 100,
  };

  db.monitors.unshift(newMonitor);
  saveDb(db);
  return newMonitor;
}

export function updateMonitor(id: string, data: Partial<Monitor>): Monitor | null {
  const db = loadDb();
  const index = db.monitors.findIndex((m) => m.id === id);
  if (index === -1) return null;

  const current = db.monitors[index];
  const now = new Date().toISOString();

  const updated: Monitor = {
    ...current,
    ...data,
    updatedAt: now,
  };

  db.monitors[index] = updated;
  saveDb(db);
  return getMonitorById(id);
}

export function deleteMonitor(id: string): boolean {
  const db = loadDb();
  const initialLen = db.monitors.length;
  db.monitors = db.monitors.filter((m) => m.id !== id);
  db.heartbeats = db.heartbeats.filter((hb) => hb.monitorId !== id);
  db.incidents = db.incidents.filter((inc) => inc.monitorId !== id);
  saveDb(db);
  return db.monitors.length < initialLen;
}

export function toggleMonitorStatus(id: string): Monitor | null {
  const db = loadDb();
  const monitor = db.monitors.find((m) => m.id === id);
  if (!monitor) return null;

  monitor.status = monitor.status === "PAUSED" ? "UP" : "PAUSED";
  monitor.updatedAt = new Date().toISOString();
  saveDb(db);
  return getMonitorById(id);
}

export function recordProbeResult(
  monitorId: string,
  status: "UP" | "DOWN" | "DEGRADED",
  responseTime: number,
  statusCode?: number,
  error?: string
) {
  const db = loadDb();
  const now = new Date().toISOString();
  const hbId = "hb-" + Math.random().toString(36).substring(2, 10);

  // 1. Add heartbeat
  db.heartbeats.push({
    id: hbId,
    monitorId,
    status,
    responseTime,
    statusCode,
    error,
    timestamp: now,
  });

  // Limit heartbeats store size to prevent memory growth
  if (db.heartbeats.length > 2000) {
    db.heartbeats = db.heartbeats.slice(-1000);
  }

  // 2. Update monitor
  const monitor = db.monitors.find((m) => m.id === monitorId);
  if (monitor) {
    monitor.status = status;
    monitor.lastChecked = now;
    monitor.lastLatency = responseTime;
    monitor.updatedAt = now;
  }

  // 3. Handle incidents
  if (status === "DOWN") {
    const hasOpen = db.incidents.some((inc) => inc.monitorId === monitorId && inc.status === "OPEN");
    if (!hasOpen) {
      db.incidents.unshift({
        id: "inc-" + Math.random().toString(36).substring(2, 9),
        monitorId,
        title: `Outage detected on ${statusCode ? `HTTP ${statusCode}` : (error || "Timeout")}`,
        errorDetails: error || `Received unexpected status code ${statusCode}`,
        startedAt: now,
        status: "OPEN",
      });
    }
  } else if (status === "UP") {
    for (const inc of db.incidents) {
      if (inc.monitorId === monitorId && inc.status === "OPEN") {
        inc.status = "RESOLVED";
        inc.resolvedAt = now;
      }
    }
  }

  saveDb(db);
}

export function getHeartbeatsForMonitor(monitorId: string, limit = 50): Heartbeat[] {
  const db = loadDb();
  return db.heartbeats
    .filter((hb) => hb.monitorId === monitorId)
    .slice(-limit);
}

export function getIncidents(status?: "OPEN" | "RESOLVED", limit = 20): Incident[] {
  const db = loadDb();
  let list = db.incidents.map((inc) => {
    const m = db.monitors.find((mon) => mon.id === inc.monitorId);
    return {
      ...inc,
      monitorName: m?.name || "Unknown Service",
      monitorUrl: m?.url || "",
    };
  });

  if (status) {
    list = list.filter((inc) => inc.status === status);
  }

  return list.slice(0, limit);
}

export function calculateUptimePercentage(monitorId: string, hours = 24): number {
  const db = loadDb();
  const since = Date.now() - hours * 3600 * 1000;
  const filtered = db.heartbeats.filter(
    (hb) => hb.monitorId === monitorId && new Date(hb.timestamp).getTime() >= since
  );

  if (filtered.length === 0) return 100;
  const upCount = filtered.filter((hb) => hb.status === "UP").length;
  return Number(((upCount / filtered.length) * 100).toFixed(2));
}

export function getGlobalStats(): GlobalStats {
  const db = loadDb();
  const monitors = getAllMonitors();

  const totalMonitors = monitors.length;
  const upCount = monitors.filter((m) => m.status === "UP").length;
  const downCount = monitors.filter((m) => m.status === "DOWN").length;
  const degradedCount = monitors.filter((m) => m.status === "DEGRADED").length;
  const pausedCount = monitors.filter((m) => m.status === "PAUSED").length;

  const latencies = monitors.filter((m) => m.lastLatency && m.status !== "PAUSED").map((m) => m.lastLatency!);
  const avgLatency = latencies.length > 0 ? Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length) : 0;

  const openIncidentsCount = db.incidents.filter((inc) => inc.status === "OPEN").length;

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
    openIncidentsCount,
  };
}
