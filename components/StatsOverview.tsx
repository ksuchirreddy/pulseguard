import { GlobalStats } from "@/lib/types";
import { Activity, CheckCircle2, AlertTriangle, Clock, Zap } from "lucide-react";

interface StatsOverviewProps {
  stats: GlobalStats | null;
  onRefreshAll?: () => void;
  isRefreshing?: boolean;
}

export default function StatsOverview({ stats, onRefreshAll, isRefreshing }: StatsOverviewProps) {
  if (!stats) return null;

  const cards = [
    {
      title: "Overall Uptime (24h)",
      value: `${stats.overallUptime}%`,
      sub: "Target: 99.9% SLA",
      icon: CheckCircle2,
      color: stats.overallUptime >= 99 ? "text-emerald-400" : "text-amber-400",
      bg: "bg-emerald-500/10 border-emerald-500/20",
    },
    {
      title: "Active Monitors",
      value: `${stats.upCount} / ${stats.totalMonitors}`,
      sub: `${stats.pausedCount} paused`,
      icon: Activity,
      color: "text-blue-400",
      bg: "bg-blue-500/10 border-blue-500/20",
    },
    {
      title: "Average Latency",
      value: `${stats.avgLatency} ms`,
      sub: "Global edge probe avg",
      icon: Clock,
      color: "text-indigo-400",
      bg: "bg-indigo-500/10 border-indigo-500/20",
    },
    {
      title: "Active Incidents",
      value: stats.openIncidentsCount,
      sub: stats.openIncidentsCount === 0 ? "Zero downtime active" : "Investigation needed",
      icon: AlertTriangle,
      color: stats.openIncidentsCount === 0 ? "text-slate-400" : "text-rose-400",
      bg: stats.openIncidentsCount === 0 ? "bg-slate-800/40 border-slate-700/50" : "bg-rose-500/10 border-rose-500/30",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card, i) => {
        const Icon = card.icon;
        return (
          <div
            key={i}
            className="group relative overflow-hidden rounded-xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-sm transition-all hover:border-slate-700"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">{card.title}</span>
              <div className={`rounded-lg p-2 border ${card.bg}`}>
                <Icon className={`h-4 w-4 ${card.color}`} />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold tracking-tight text-white">{card.value}</div>
              <p className="mt-1 text-xs text-slate-500">{card.sub}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
