"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import LatencyChart from "@/components/LatencyChart";
import { Monitor, Heartbeat } from "@/lib/types";
import { ArrowLeft, RefreshCw, Globe, Clock, Shield, CheckCircle2, AlertTriangle, XCircle, Play, Pause } from "lucide-react";

export default function MonitorDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [monitor, setMonitor] = useState<Monitor | null>(null);
  const [heartbeats, setHeartbeats] = useState<Heartbeat[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isChecking, setIsChecking] = useState(false);

  const fetchDetail = async () => {
    try {
      const res = await fetch(`/api/monitors/${id}`);
      const data = await res.json();
      if (data.monitor) setMonitor(data.monitor);
      if (data.heartbeats) setHeartbeats(data.heartbeats);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
    const interval = setInterval(fetchDetail, 15000);
    return () => clearInterval(interval);
  }, [id]);

  const handlePing = async () => {
    setIsChecking(true);
    try {
      await fetch(`/api/monitors/${id}/check`, { method: "POST" });
      await fetchDetail();
    } catch (err) {
      console.error(err);
    } finally {
      setIsChecking(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#090d16] text-white">
        <Navbar />
        <div className="flex h-96 items-center justify-center text-xs text-slate-500 animate-pulse">
          Loading monitor metrics...
        </div>
      </div>
    );
  }

  if (!monitor) {
    return (
      <div className="min-h-screen bg-[#090d16] text-white">
        <Navbar />
        <div className="mx-auto max-w-7xl px-4 py-16 text-center">
          <h2 className="text-lg font-bold text-slate-300">Monitor Not Found</h2>
          <Link href="/" className="mt-4 inline-block text-xs text-blue-400 hover:underline">
            ← Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#090d16]">
      <Navbar />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
        {/* Header Breadcrumb */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="rounded-lg border border-slate-800 bg-slate-900/60 p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl font-bold text-white">{monitor.name}</h1>
                <span className="rounded bg-slate-800 px-2 py-0.5 text-xs font-mono font-semibold text-blue-400 border border-slate-700">
                  {monitor.method}
                </span>
              </div>
              <p className="text-xs font-mono text-slate-400 mt-1 truncate max-w-xl">{monitor.url}</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={handlePing}
              disabled={isChecking || monitor.status === "PAUSED"}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white shadow-md shadow-blue-600/30 hover:bg-blue-500 transition-all disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isChecking ? "animate-spin" : ""}`} />
              <span>{isChecking ? "Pinging..." : "Test Probe Now"}</span>
            </button>
          </div>
        </div>

        {/* Metrics Row */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
            <span className="text-xs font-medium text-slate-400">Current Health</span>
            <div className="mt-2 flex items-center gap-2">
              <span className={`h-2.5 w-2.5 rounded-full ${
                monitor.status === "UP" ? "bg-emerald-400" : monitor.status === "DOWN" ? "bg-rose-400" : "bg-amber-400"
              }`} />
              <span className="text-xl font-bold text-white">{monitor.status}</span>
            </div>
            <p className="mt-1 text-[10px] text-slate-500">Expected HTTP {monitor.expectedStatus}</p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
            <span className="text-xs font-medium text-slate-400">24-Hour Uptime</span>
            <div className="mt-2 text-xl font-bold text-emerald-400">{monitor.uptime24h ?? 100}%</div>
            <p className="mt-1 text-[10px] text-slate-500">30-day average: {monitor.uptime30d ?? 100}%</p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
            <span className="text-xs font-medium text-slate-400">Last Response Latency</span>
            <div className="mt-2 text-xl font-bold text-blue-400 font-mono">{monitor.lastLatency ?? 0} ms</div>
            <p className="mt-1 text-[10px] text-slate-500">Timeout threshold: {monitor.timeout} ms</p>
          </div>
        </div>

        {/* Latency Telemetry Chart */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-white">Response Time Telemetry</h3>
              <p className="text-xs text-slate-400">Live response latency over recorded heartbeats</p>
            </div>
            <span className="text-xs font-mono text-slate-400">Sample window: {heartbeats.length} probes</span>
          </div>
          <LatencyChart heartbeats={heartbeats} />
        </div>

        {/* Heartbeats Log Table */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6">
          <h3 className="text-sm font-semibold text-white mb-4">Recent Probe Heartbeats</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-800 text-slate-400 font-mono">
                <tr>
                  <th className="pb-3 font-semibold">Timestamp</th>
                  <th className="pb-3 font-semibold">Status</th>
                  <th className="pb-3 font-semibold">HTTP Code</th>
                  <th className="pb-3 font-semibold">Latency</th>
                  <th className="pb-3 font-semibold">Error Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {heartbeats.slice(-15).reverse().map((hb) => (
                  <tr key={hb.id} className="hover:bg-slate-800/30">
                    <td className="py-2.5 text-slate-300">
                      {new Date(hb.timestamp).toLocaleString()}
                    </td>
                    <td className="py-2.5">
                      <span className={`inline-flex items-center gap-1 font-semibold ${
                        hb.status === "UP" ? "text-emerald-400" : "text-rose-400"
                      }`}>
                        {hb.status}
                      </span>
                    </td>
                    <td className="py-2.5 text-slate-300">{hb.statusCode || "—"}</td>
                    <td className="py-2.5 text-blue-400">{hb.responseTime} ms</td>
                    <td className="py-2.5 text-slate-500">{hb.error || "None"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
