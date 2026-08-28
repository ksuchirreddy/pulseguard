"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, Radio, ShieldCheck, BarChart3, Plus, ExternalLink } from "lucide-react";

interface NavbarProps {
  onAddClick?: () => void;
}

export default function Navbar({ onAddClick }: NavbarProps) {
  const pathname = usePathname();

  const navItems = [
    { name: "Dashboard", href: "/", icon: Activity },
    { name: "Public Status", href: "/status", icon: Radio },
    { name: "Analytics & SLA", href: "/analytics", icon: BarChart3 },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-[#090d16]/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 shadow-lg shadow-blue-500/20 text-white">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold tracking-tight text-white text-lg">PulseGuard</span>
                <span className="rounded bg-blue-900/60 px-1.5 py-0.5 text-[10px] font-semibold text-blue-400 border border-blue-700/50">
                  PRO
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium leading-none">Uptime & Health Engine</p>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-slate-800 text-blue-400"
                      : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-950/40 px-3 py-1 text-xs font-medium text-emerald-400">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse-subtle" />
            All Systems Operational
          </div>

          {onAddClick && (
            <button
              onClick={onAddClick}
              className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white shadow-md shadow-blue-600/30 hover:bg-blue-500 transition-all active:scale-95"
            >
              <Plus className="h-4 w-4" />
              <span>Add Monitor</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
