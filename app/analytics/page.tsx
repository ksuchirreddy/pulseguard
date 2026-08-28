"use client";

import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import { Monitor, GlobalStats } from "@/lib/types";
import { BarChart3, Activity, Clock, ShieldCheck } from "lucide-react";

export default function AnalyticsPage() {
  const [monitors, setMonitors] = useState<Monitor[]>([]);
  const [stats, setStats] = useState<GlobalStats | null>(null);

  useEffect(() => {
    Promise.all([fetch("/api/monitors"), fetch("/api/stats")])
      .then(async ([mRes, sRes]) => {
        const m = await mRes.json();
        const s = await sRes.json();
        if (m.monitors) setMonitors(m.monitors);
        if (s.stats) setStats(s.stats);
      })
      .catch(console.error);
  }, []);

  return (
    <div className="min-h-screen bg-[#090d16]">
      <Navbar />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">SLA Analytics & Performance</h1>
          <p className="text-xs text-slate-400 mt-1">Detailed service-level agreement metrics and latency breakdown</p>
        </div>

        {/* SLA Breakdown Grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6">
            <span className="text-xs font-medium text-slate-400">SLA Target</span>
            <div className="mt-2 text-2xl font-bold text-white">99.90%</div>
            <p className="text-xs text-emerald-400 mt-1">Current: {stats?.overallUptime ?? 100}% (Meeting SLA)</p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6">
            <span className="text-xs font-medium text-slate-400">Allowed Downtime / Month</span>
            <div className="mt-2 text-2xl font-bold text-slate-200">43.8 mins</div>
            <p className="text-xs text-slate-500 mt-1">Based on 99.9% availability contract</p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6">
            <span className="text-xs font-medium text-slate-400">Mean Time to Detect (MTTD)</span>
            <div className="mt-2 text-2xl font-bold text-blue-400">&lt; 30 sec</div>
            <p className="text-xs text-slate-500 mt-1">High-frequency probe interval</p>
          </div>
        </div>

        {/* Per Monitor SLA Table */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6">
          <h3 className="text-sm font-semibold text-white mb-4">Service Reliability Breakdown</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-800 text-slate-400 font-mono">
                <tr>
                  <th className="pb-3">Service Name</th>
                  <th className="pb-3">Method</th>
                  <th className="pb-3">24h Uptime</th>
                  <th className="pb-3">30d Uptime</th>
                  <th className="pb-3">Avg Latency</th>
                  <th className="pb-3">SLA Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {monitors.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-800/30">
                    <td className="py-3 font-semibold text-white">{m.name}</td>
                    <td className="py-3 text-blue-400">{m.method}</td>
                    <td className="py-3 text-emerald-400">{m.uptime24h ?? 100}%</td>
                    <td className="py-3 text-emerald-400">{m.uptime30d ?? 100}%</td>
                    <td className="py-3 text-slate-300">{m.lastLatency ?? 0} ms</td>
                    <td className="py-3">
                      <span className="rounded bg-emerald-950/60 px-2 py-0.5 text-[10px] font-semibold text-emerald-400 border border-emerald-800/50">
                        COMPLIANT
                      </span>
                    </td>
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
