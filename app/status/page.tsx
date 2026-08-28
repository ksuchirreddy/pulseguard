"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Monitor, GlobalStats, Incident } from "@/lib/types";
import { ShieldCheck, CheckCircle2, AlertTriangle, Radio, ArrowLeft } from "lucide-react";

export default function PublicStatusPage() {
  const [monitors, setMonitors] = useState<Monitor[]>([]);
  const [stats, setStats] = useState<GlobalStats | null>(null);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [monitorsRes, statsRes, incidentsRes] = await Promise.all([
          fetch("/api/monitors"),
          fetch("/api/stats"),
          fetch("/api/incidents?status=OPEN"),
        ]);
        const m = await monitorsRes.json();
        const s = await statsRes.json();
        const inc = await incidentsRes.json();
        if (m.monitors) setMonitors(m.monitors);
        if (s.stats) setStats(s.stats);
        if (inc.incidents) setIncidents(inc.incidents);
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const isAllUp = !incidents || incidents.length === 0;

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100">
      {/* Top Banner */}
      <div className="border-b border-slate-800 bg-slate-900/40">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4 sm:px-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-500/20">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <span className="font-bold text-white text-base">PulseGuard Status</span>
          </div>

          <Link
            href="/"
            className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs font-medium text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Admin Dashboard
          </Link>
        </div>
      </div>

      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6 space-y-8">
        {/* Status Header Banner */}
        <div className={`rounded-2xl border p-6 text-center ${
          isAllUp
            ? "border-emerald-500/30 bg-emerald-950/20"
            : "border-rose-500/30 bg-rose-950/20"
        }`}>
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-900/80 mb-3 border border-slate-800">
            {isAllUp ? (
              <CheckCircle2 className="h-6 w-6 text-emerald-400" />
            ) : (
              <AlertTriangle className="h-6 w-6 text-rose-400" />
            )}
          </div>
          <h1 className="text-xl font-bold text-white">
            {isAllUp ? "All Systems Operational" : "Service Disruption Detected"}
          </h1>
          <p className="mt-1 text-xs text-slate-400">
            Live uptime: <span className="font-semibold text-emerald-400">{stats?.overallUptime ?? 100}%</span> across all edge probes
          </p>
        </div>

        {/* Services List */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 space-y-4">
          <h2 className="text-sm font-semibold text-white">Monitored Services</h2>
          <div className="divide-y divide-slate-800/60">
            {monitors.map((m) => (
              <div key={m.id} className="flex items-center justify-between py-4">
                <div>
                  <div className="font-semibold text-white text-sm">{m.name}</div>
                  <div className="text-xs text-slate-500 font-mono mt-0.5">{m.uptime24h ?? 100}% uptime (24h)</div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
                    m.status === "UP"
                      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                      : m.status === "DOWN"
                      ? "border-rose-500/30 bg-rose-500/10 text-rose-400"
                      : "border-slate-700 bg-slate-800 text-slate-400"
                  }`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${
                      m.status === "UP" ? "bg-emerald-400" : m.status === "DOWN" ? "bg-rose-400" : "bg-slate-400"
                    }`} />
                    {m.status === "UP" ? "Operational" : m.status === "DOWN" ? "Outage" : m.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Incident History */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
          <h2 className="text-sm font-semibold text-white mb-4">Past Incident Logs</h2>
          {incidents.length === 0 ? (
            <p className="text-xs text-slate-500">No major incidents reported in the past 90 days.</p>
          ) : (
            <div className="space-y-3">
              {incidents.map((inc) => (
                <div key={inc.id} className="rounded-lg border border-slate-800 bg-slate-950 p-4 text-xs">
                  <div className="flex items-center justify-between font-semibold text-rose-400">
                    <span>{inc.monitorName}</span>
                    <span className="font-mono text-[10px] text-slate-500">{new Date(inc.startedAt).toLocaleString()}</span>
                  </div>
                  <p className="mt-1 text-slate-300">{inc.title}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
