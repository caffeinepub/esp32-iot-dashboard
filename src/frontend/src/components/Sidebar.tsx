import { cn } from "@/lib/utils";
import {
  Activity,
  Bell,
  Cpu,
  LayoutDashboard,
  Link2,
  Wifi,
} from "lucide-react";
import type { Page } from "../App";

interface SidebarProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
}

const navItems = [
  { id: "dashboard" as Page, label: "Dashboard", icon: LayoutDashboard },
  { id: "devices" as Page, label: "Devices", icon: Cpu },
  { id: "live-data" as Page, label: "Live Data", icon: Activity },
  { id: "alerts" as Page, label: "Alerts", icon: Bell },
  { id: "connect" as Page, label: "Connect", icon: Link2 },
];

export function Sidebar({ currentPage, onNavigate }: SidebarProps) {
  return (
    <aside className="flex flex-col w-60 min-h-screen bg-sidebar border-r border-sidebar-border px-4 py-6 shrink-0">
      {/* Brand */}
      <div className="flex items-center gap-3 mb-8 px-2">
        <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shadow-glow shrink-0">
          <Wifi className="w-5 h-5 text-white" />
        </div>
        <div>
          <div className="text-sm font-bold text-foreground leading-tight">
            ESP32 Monitor
          </div>
          <div className="text-xs text-muted-foreground">Cloud Dashboard</div>
        </div>
      </div>

      {/* Live indicator */}
      <div className="flex items-center gap-2 mb-6 px-3 py-2 rounded-xl bg-success/10 border border-success/20">
        <span className="w-2 h-2 rounded-full bg-success animate-pulse shrink-0" />
        <span className="text-xs text-success font-medium">
          Live • Auto-refresh 5s
        </span>
      </div>

      {/* Nav */}
      <nav className="flex flex-col gap-1 flex-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;
          return (
            <button
              type="button"
              key={item.id}
              data-ocid={`nav.${item.id}.link`}
              onClick={() => onNavigate(item.id)}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 w-full text-left",
                isActive
                  ? "bg-primary text-white shadow-glow"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent",
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {item.label}
              {item.id === "connect" && (
                <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded bg-primary/20 text-primary font-semibold">
                  NEW
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="mt-4 px-2">
        <p className="text-xs text-muted-foreground text-center">
          © {new Date().getFullYear()} ·{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            caffeine.ai
          </a>
        </p>
      </div>
    </aside>
  );
}
