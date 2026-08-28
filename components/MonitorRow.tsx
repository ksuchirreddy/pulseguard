"use client";

import { useState } from "react";
import Link from "next/link";
import { Monitor } from "@/lib/types";
import { Play, Pause, Trash2, RefreshCw, ExternalLink, Activity } from "lucide-react";

interface MonitorRowProps {
  monitor: Monitor;
  onRefresh: () => void;
}

export default function MonitorRow({ monitor, onRefresh }: MonitorRowProps) {
  const [isPinging, setIsPinging] = useState(false);
  const [isToggling, setIsToggling] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handlePing = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsPinging(true);
    try {
      await fetch(`/api/monitors/${monitor.id}/check`, { method: "POST" });
      onRefresh();
    } catch (err) {
      console.error(err);
    } finally {
      setIsPinging(false);
    }
  };

  const handleToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsToggling(true);
    try {
      await fetch(`/api/monitors/${monitor.id}/toggle`, { method: "POST" });
      onRefresh();
    } catch (err) {
      console.error(err);
    } finally {
      setIsToggling(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm(`Are you sure you want to delete "${monitor.name}"?`)) return;
    setIsDeleting(true);
    try {
      await fetch(`/api/monitors/${monitor.id}`, { method: "DELETE" });
      onRefresh();
    } catch (err) {
      console.error(err);
    } finally {
      setIsDeleting(false);
    }
  };

  const getStatusBadge = () => {
    switch (monitor.status) {
      case "UP":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Operational
          </span>
        );
      case "DOWN":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-500/30 bg-rose-500/10 px-2.5 py-0.5 text-xs font-semibold text-rose-400 animate-pulse">
            <span className="h-1.5 w-1.5 rounded-full bg-rose-400" /> Major Outage
          </span>
        );
      case "DEGRADED":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-xs font-semibold text-amber-400">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-400" /> Degraded
          </span>
        );
      case "PAUSED":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-700 bg-slate-800/80 px-2.5 py-0.5 text-xs font-semibold text-slate-400">
            <span className="h-1.5 w-1.5 rounded-full bg-slate-500" /> Paused
          </span>
        );
    }
  };

  return (
    <div className="group flex flex-col gap-3 rounded-xl border border-slate-800 bg-slate-900/40 p-4 transition-all hover:border-slate-700 hover:bg-slate-900/70 sm:flex-row sm:items-center sm:justify-between">
      <Link href={`/monitors/${monitor.id}`} className="flex-1 cursor-pointer">
        <div className="flex items-center gap-3">
          {getStatusBadge()}
          <span className="font-semibold text-white group-hover:text-blue-400 transition-colors">
            {monitor.name}
          </span>
          <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] font-mono text-slate-400 border border-slate-700/50">
            {monitor.method}
          </span>
        </div>
        <div className="mt-1.5 flex items-center gap-4 text-xs text-slate-400 font-mono">
          <span className="truncate max-w-xs">{monitor.url}</span>
          <span className="hidden md:inline text-slate-600">•</span>
          <span className="hidden md:inline">Checked every {monitor.interval}s</span>
        </div>
      </Link>

      <div className="flex items-center justify-between gap-6 sm:justify-end border-t border-slate-800/60 pt-3 sm:border-0 sm:pt-0">
        {/* Latency badge */}
        <div className="text-right">
          <div className="text-xs font-mono font-medium text-slate-200">
            {monitor.status === "PAUSED" ? "—" : `${monitor.lastLatency ?? 0} ms`}
          </div>
          <div className="text-[10px] text-slate-500 font-mono">
            {monitor.uptime24h ?? 100}% 24h
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={handlePing}
            disabled={isPinging || monitor.status === "PAUSED"}
            title="Instant Probe Test"
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-blue-400 disabled:opacity-30 transition-colors"
          >
            <RefreshCw className={`h-4 w-4 ${isPinging ? "animate-spin text-blue-400" : ""}`} />
          </button>

          <button
            onClick={handleToggle}
            disabled={isToggling}
            title={monitor.status === "PAUSED" ? "Resume Monitoring" : "Pause Monitoring"}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-amber-400 transition-colors"
          >
            {monitor.status === "PAUSED" ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
          </button>

          <button
            onClick={handleDelete}
            disabled={isDeleting}
            title="Delete Monitor"
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-rose-400 transition-colors"
          >
            <Trash2 className="h-4 w-4" />
          </button>

          <Link
            href={`/monitors/${monitor.id}`}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <ExternalLink className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
