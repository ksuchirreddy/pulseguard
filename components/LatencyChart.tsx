"use client";

import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from "recharts";
import { Heartbeat } from "@/lib/types";

interface LatencyChartProps {
  heartbeats: Heartbeat[];
}

export default function LatencyChart({ heartbeats }: LatencyChartProps) {
  if (!heartbeats || heartbeats.length === 0) {
    return (
      <div className="flex h-48 w-full items-center justify-center rounded-lg border border-slate-800 bg-slate-900/40 text-xs text-slate-500">
        No heartbeat telemetry available yet.
      </div>
    );
  }

  const data = heartbeats.map((hb) => ({
    time: new Date(hb.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    latency: hb.responseTime,
    status: hb.status,
    code: hb.statusCode,
  }));

  return (
    <div className="h-52 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="latencyGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="time"
            stroke="#475569"
            fontSize={10}
            tickLine={false}
            axisLine={{ stroke: "#1e293b" }}
          />
          <YAxis
            stroke="#475569"
            fontSize={10}
            tickLine={false}
            axisLine={{ stroke: "#1e293b" }}
            unit="ms"
          />
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const item = payload[0].payload;
                return (
                  <div className="rounded-lg border border-slate-700 bg-slate-900/95 p-2.5 text-xs shadow-xl backdrop-blur-md">
                    <p className="font-semibold text-slate-300">{item.time}</p>
                    <p className="mt-1 font-mono text-blue-400">{item.latency} ms</p>
                    <p className="text-[10px] text-slate-400">
                      Status: <span className={item.status === "UP" ? "text-emerald-400" : "text-rose-400"}>{item.status}</span> ({item.code || "ERR"})
                    </p>
                  </div>
                );
              }
              return null;
            }}
          />
          <Area
            type="monotone"
            dataKey="latency"
            stroke="#3b82f6"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#latencyGradient)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
