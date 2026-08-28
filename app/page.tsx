"use client";

import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import StatsOverview from "@/components/StatsOverview";
import MonitorRow from "@/components/MonitorRow";
import AddMonitorModal from "@/components/AddMonitorModal";
import { Monitor, GlobalStats, Incident } from "@/lib/types";
import { Search, RefreshCw, AlertCircle, Plus, CheckCircle2, ShieldAlert } from "lucide-react";

export default function Dashboard() {
  const [monitors, setMonitors] = useState<Monitor[]>([]);
  const [stats, setStats] = useState<GlobalStats | null>(null);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [isLoading, setIsLoading] = useState(true);
  const [isProbingAll, setIsProbingAll] = useState(false);

  const fetchData = async () => {
    try {
      const [monitorsRes, statsRes, incidentsRes] = await Promise.all([
        fetch("/api/monitors"),
        fetch("/api/stats"),
        fetch("/api/incidents?status=OPEN"),
      ]);

      const monitorsData = await monitorsRes.json();
      const statsData = await statsRes.json();
      const incidentsData = await incidentsRes.json();

      if (monitorsData.monitors) setMonitors(monitorsData.monitors);
      if (statsData.stats) setStats(statsData.stats);
      if (incidentsData.incidents) setIncidents(incidentsData.incidents);
    } catch (err) {
      console.error("Failed to fetch dashboard data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleProbeAll = async () => {
    setIsProbingAll(true);
    try {
      await fetch("/api/cron", { method: "POST" });
      await fetchData();
    } catch (err) {
      console.error(err);
    } finally {
      setIsProbingAll(false);
    }
  };

  const filteredMonitors = monitors.filter((m) => {
    const matchesSearch =
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.url.toLowerCase().includes(search.toLowerCase());
    const matchesFilter =
      statusFilter === "ALL" ? true : m.status === statusFilter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="min-h-screen bg-[#090d16]">
      <Navbar onAddClick={() => setIsModalOpen(true)} />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
        {/* Header Title & Run Probes */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">System Infrastructure Health</h1>
            <p className="text-xs text-slate-400 mt-1">Real-time HTTP health probes & SLA verification</p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={handleProbeAll}
              disabled={isProbingAll}
              className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/90 px-3.5 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-all disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isProbingAll ? "animate-spin text-blue-400" : ""}`} />
              <span>{isProbingAll ? "Running Probes..." : "Run All Probes"}</span>
            </button>
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white shadow-md shadow-blue-600/30 hover:bg-blue-500 transition-all active:scale-95"
            >
              <Plus className="h-4 w-4" />
              <span>Add Monitor</span>
            </button>
          </div>
        </div>

        {/* Global Stats Overview */}
        <StatsOverview stats={stats} />

        {/* Active Incidents Banner (if any) */}
        {incidents.length > 0 && (
          <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4">
            <div className="flex items-center gap-3">
              <ShieldAlert className="h-5 w-5 text-rose-400 shrink-0" />
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-rose-400">
                  {incidents.length} Active Incident{incidents.length > 1 ? "s" : ""} Detected
                </h3>
                <p className="text-xs text-rose-300/80 mt-0.5">
                  One or more monitored services have failed health checks.
                </p>
              </div>
            </div>
            <div className="mt-3 space-y-2">
              {incidents.map((inc) => (
                <div
                  key={inc.id}
                  className="flex items-center justify-between rounded-lg bg-rose-950/40 p-2.5 text-xs text-rose-200 border border-rose-800/40"
                >
                  <span className="font-semibold">{inc.monitorName}: {inc.title}</span>
                  <span className="text-[10px] text-rose-300 font-mono">
                    Started {new Date(inc.startedAt).toLocaleTimeString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Search & Filter Toolbar */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-800/80 pb-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search monitors by name or URL..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-slate-800 bg-slate-900/60 py-2 pl-9 pr-3 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto">
            {["ALL", "UP", "DOWN", "DEGRADED", "PAUSED"].map((f) => (
              <button
                key={f}
                onClick={() => setStatusFilter(f)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                  statusFilter === f
                    ? "bg-blue-600 text-white shadow-sm"
                    : "bg-slate-900/40 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Monitors List */}
        <div className="space-y-3">
          {isLoading ? (
            <div className="py-12 text-center text-xs text-slate-500 animate-pulse">
              Loading real-time monitor telemetry...
            </div>
          ) : filteredMonitors.length === 0 ? (
            <div className="rounded-xl border border-slate-800 bg-slate-900/30 p-12 text-center">
              <AlertCircle className="mx-auto h-8 w-8 text-slate-600" />
              <h3 className="mt-3 text-sm font-semibold text-slate-300">No monitors match your criteria</h3>
              <p className="mt-1 text-xs text-slate-500">Add a new endpoint or clear your filters to see active probes.</p>
            </div>
          ) : (
            filteredMonitors.map((monitor) => (
              <MonitorRow key={monitor.id} monitor={monitor} onRefresh={fetchData} />
            ))
          )}
        </div>
      </main>

      <AddMonitorModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAdded={fetchData}
      />
    </div>
  );
}
