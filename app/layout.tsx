import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PulseGuard — High-Performance Uptime & API Health Monitor",
  description: "Automated real-time API health checks, latency analytics, and status pages built with Next.js and SQLite.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#090d16] text-slate-100 antialiased font-sans selection:bg-blue-600 selection:text-white">
        {children}
      </body>
    </html>
  );
}
