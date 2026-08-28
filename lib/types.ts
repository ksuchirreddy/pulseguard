export type MonitorStatus = "UP" | "DOWN" | "DEGRADED" | "PAUSED";
export type IncidentStatus = "OPEN" | "RESOLVED";

export interface Monitor {
  id: string;
  name: string;
  url: string;
  method: "GET" | "POST" | "HEAD" | "PUT";
  interval: number; // in seconds (e.g. 60, 300)
  timeout: number; // in ms (e.g. 5000)
  expectedStatus: number; // e.g. 200
  headers?: string; // JSON string
  body?: string;
  status: MonitorStatus;
  lastChecked?: string; // ISO string
  lastLatency?: number; // in ms
  uptime24h?: number; // percentage
  uptime30d?: number;
  alertEmail?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Heartbeat {
  id: string;
  monitorId: string;
  status: "UP" | "DOWN" | "DEGRADED";
  responseTime: number; // in ms
  statusCode?: number;
  error?: string;
  timestamp: string; // ISO string
}

export interface Incident {
  id: string;
  monitorId: string;
  monitorName?: string;
  monitorUrl?: string;
  title: string;
  errorDetails?: string;
  startedAt: string;
  resolvedAt?: string;
  status: IncidentStatus;
}

export interface GlobalStats {
  totalMonitors: number;
  upCount: number;
  downCount: number;
  degradedCount: number;
  pausedCount: number;
  avgLatency: number;
  overallUptime: number;
  openIncidentsCount: number;
}
