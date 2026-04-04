"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/", label: "Dashboard", icon: "📊" },
  { href: "/analytics", label: "Funnel Analytics", icon: "📈" },
  { href: "/leads", label: "Leads", icon: "👥" },
  { href: "/firms", label: "Firmalar", icon: "🏢" },
  { href: "/funnel", label: "Funnel Editör", icon: "📝" },
  { href: "/preview", label: "Önizleme", icon: "👁" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-[#0D297B] min-h-screen text-white flex flex-col shrink-0">
      <div className="px-5 py-5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-white/15 flex items-center justify-center text-lg font-bold">
            🛡
          </div>
          <div>
            <div className="font-bold text-sm tracking-tight">Timurlar Sigorta</div>
            <div className="text-[10px] text-white/50 font-semibold tracking-wider uppercase">
              Analytics Panel
            </div>
          </div>
        </div>
      </div>
      <nav className="flex-1 py-4 px-3 space-y-1">
        {NAV.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                active
                  ? "bg-white/15 text-white"
                  : "text-white/60 hover:bg-white/8 hover:text-white/90"
              }`}
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="px-5 py-4 border-t border-white/10 text-[11px] text-white/30">
        TSS Funnel v3.4
      </div>
    </aside>
  );
}
