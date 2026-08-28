import { Monitor } from "./types";
import { recordProbeResult, getMonitorById } from "./db";

export interface ProbeResult {
  monitorId: string;
  status: "UP" | "DOWN" | "DEGRADED";
  responseTime: number;
  statusCode?: number;
  error?: string;
  timestamp: string;
}

export async function pingMonitor(monitor: Monitor): Promise<ProbeResult> {
  const startTime = Date.now();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), monitor.timeout || 5000);

  try {
    let headers: Record<string, string> = {};
    if (monitor.headers) {
      try {
        headers = JSON.parse(monitor.headers);
      } catch (e) {
        // ignore malformed headers
      }
    }

    const response = await fetch(monitor.url, {
      method: monitor.method || "GET",
      headers: {
        "User-Agent": "PulseGuard-HealthProbe/1.0",
        ...headers,
      },
      body: monitor.method !== "GET" && monitor.method !== "HEAD" && monitor.body ? monitor.body : undefined,
      signal: controller.signal,
      cache: "no-store",
    });

    clearTimeout(timeoutId);
    const duration = Date.now() - startTime;
    const isExpected = response.status === (monitor.expectedStatus || 200);

    let status: "UP" | "DOWN" | "DEGRADED" = "UP";
    if (!isExpected) {
      status = "DOWN";
    } else if (duration > 1500) {
      // Degraded if slower than 1.5 seconds
      status = "DEGRADED";
    }

    const result: ProbeResult = {
      monitorId: monitor.id,
      status,
      responseTime: duration,
      statusCode: response.status,
      timestamp: new Date().toISOString(),
    };

    recordProbeResult(monitor.id, status, duration, response.status);
    return result;
  } catch (err: any) {
    clearTimeout(timeoutId);
    const duration = Date.now() - startTime;
    const isTimeout = err.name === "AbortError";
    const errorMessage = isTimeout ? `Request timed out after ${monitor.timeout}ms` : (err.message || "Connection refused");

    const result: ProbeResult = {
      monitorId: monitor.id,
      status: "DOWN",
      responseTime: duration,
      error: errorMessage,
      timestamp: new Date().toISOString(),
    };

    recordProbeResult(monitor.id, "DOWN", duration, undefined, errorMessage);
    return result;
  }
}

export async function triggerCheckById(monitorId: string): Promise<ProbeResult | null> {
  const monitor = getMonitorById(monitorId);
  if (!monitor) return null;
  return await pingMonitor(monitor);
}
