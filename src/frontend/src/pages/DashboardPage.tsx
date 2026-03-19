import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Activity,
  Bell,
  CheckCircle2,
  Cloud,
  Cpu,
  Droplets,
  Flame,
  RefreshCw,
  Thermometer,
  TrendingUp,
  Waves,
  Zap,
} from "lucide-react";
import { motion } from "motion/react";
import type { Alert } from "../backend";
import { SensorChart } from "../components/SensorChart";
import {
  useAllLatestReadings,
  useDashboardStats,
  useDeviceHistory,
  useDevices,
  useRecentAlerts,
} from "../hooks/useQueries";

const STAT_SKELETON_KEYS = ["stat-sk-1", "stat-sk-2", "stat-sk-3", "stat-sk-4"];

function StatCard({
  title,
  value,
  icon: Icon,
  trend,
  colorClass,
}: {
  title: string;
  value: string;
  icon: React.ElementType;
  trend?: string;
  colorClass: string;
}) {
  return (
    <Card className="bg-card border-border shadow-card">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-muted-foreground mb-1">{title}</p>
            <p className="text-3xl font-bold text-foreground">{value}</p>
            {trend && (
              <p className="text-xs text-muted-foreground mt-1">{trend}</p>
            )}
          </div>
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center ${colorClass}`}
          >
            <Icon className="w-5 h-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface SensorCardProps {
  icon: React.ElementType;
  label: string;
  value: string | null;
  unit: string;
  colorClass: string;
  bgClass: string;
  borderClass: string;
}

function SensorCard({
  icon: Icon,
  label,
  value,
  unit,
  colorClass,
  bgClass,
  borderClass,
}: SensorCardProps) {
  return (
    <Card className={`bg-card border shadow-card ${borderClass}`}>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center ${bgClass}`}
          >
            <Icon className={`w-5 h-5 ${colorClass}`} />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className={`text-xl font-bold ${colorClass}`}>
              {value !== null ? value : "—"}
              {value !== null && (
                <span className="text-xs font-normal ml-1 text-muted-foreground">
                  {unit}
                </span>
              )}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function severityColor(severity: string) {
  if (severity === "critical")
    return "bg-destructive/15 text-destructive border-destructive/30";
  if (severity === "warning")
    return "bg-warning/15 text-warning border-warning/30";
  return "bg-primary/15 text-primary border-primary/30";
}

function AlertRow({ alert, index }: { alert: Alert; index: number }) {
  const ts = new Date(Number(alert.timestamp) / 1_000_000);
  return (
    <tr
      data-ocid={`dashboard.alerts.item.${index + 1}`}
      className="border-b border-border last:border-0 hover:bg-accent/50 transition-colors"
    >
      <td className="py-3 px-4">
        <Badge
          variant="outline"
          className={`text-xs ${severityColor(alert.severity)}`}
        >
          {alert.severity}
        </Badge>
      </td>
      <td className="py-3 px-4 text-xs text-muted-foreground font-mono">
        {alert.deviceId}
      </td>
      <td className="py-3 px-4 text-sm text-muted-foreground max-w-[200px]">
        <span className="line-clamp-1">{alert.message}</span>
      </td>
      <td className="py-3 px-4 text-xs text-muted-foreground whitespace-nowrap">
        {ts.toLocaleTimeString()}
      </td>
    </tr>
  );
}

export function DashboardPage() {
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: alerts = [] } = useRecentAlerts(5);
  const { data: devices = [] } = useDevices();
  const { data: latestReadings = [] } = useAllLatestReadings();
  const firstDeviceId = devices[0]?.id ?? "";
  const { data: history = [] } = useDeviceHistory(firstDeviceId, 20);

  // Compute averages from latest readings
  const validReadings = latestReadings
    .map(([, r]) => r)
    .filter((r): r is NonNullable<typeof r> => r !== null);

  function avg(fn: (r: NonNullable<(typeof validReadings)[0]>) => number) {
    if (validReadings.length === 0) return null;
    return (
      validReadings.reduce((s, r) => s + fn(r), 0) / validReadings.length
    ).toFixed(1);
  }

  const sensorCards: SensorCardProps[] = [
    {
      icon: Thermometer,
      label: "Temperature",
      value: avg((r) => r.temperature),
      unit: "°C",
      colorClass: "text-blue-400",
      bgClass: "bg-blue-500/15",
      borderClass: "border-blue-500/20",
    },
    {
      icon: Flame,
      label: "Heat Index",
      value: avg((r) => r.heat),
      unit: "°C",
      colorClass: "text-orange-400",
      bgClass: "bg-orange-500/15",
      borderClass: "border-orange-500/20",
    },
    {
      icon: Droplets,
      label: "Level",
      value: avg((r) => r.level),
      unit: "%",
      colorClass: "text-cyan-400",
      bgClass: "bg-cyan-500/15",
      borderClass: "border-cyan-500/20",
    },
    {
      icon: Waves,
      label: "Flow Rate",
      value: avg((r) => r.flow),
      unit: "L/min",
      colorClass: "text-green-400",
      bgClass: "bg-green-500/15",
      borderClass: "border-green-500/20",
    },
    {
      icon: Zap,
      label: "Vibration",
      value: avg((r) => r.vibration),
      unit: "m/s²",
      colorClass: "text-purple-400",
      bgClass: "bg-purple-500/15",
      borderClass: "border-purple-500/20",
    },
  ];

  return (
    <div className="flex flex-col gap-6 p-6" data-ocid="dashboard.page">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            ESP32 Real-Time Monitor
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Cloud IoT sensor dashboard
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-success/10 border border-success/20">
          <RefreshCw
            className="w-3 h-3 text-success animate-spin"
            style={{ animationDuration: "3s" }}
          />
          <span className="text-xs text-success font-medium">Live • 5s</span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {statsLoading ? (
          STAT_SKELETON_KEYS.map((k) => (
            <Skeleton key={k} className="h-28 rounded-xl" />
          ))
        ) : (
          <>
            <StatCard
              title="Active Devices"
              value={stats ? String(stats.activeDevices) : "0"}
              icon={Cpu}
              trend="Registered sensors"
              colorClass="bg-primary/15 text-primary"
            />
            <StatCard
              title="Total Readings"
              value={stats ? String(stats.totalDataPoints) : "0"}
              icon={Activity}
              trend="Cloud data points"
              colorClass="bg-success/15 text-success"
            />
            <StatCard
              title="Unread Alerts"
              value={stats ? String(stats.unreadAlerts) : "0"}
              icon={Bell}
              trend="Needs attention"
              colorClass="bg-warning/15 text-warning"
            />
            <StatCard
              title="Cloud Status"
              value={stats?.cloudStatus ?? "—"}
              icon={Cloud}
              trend="System operational"
              colorClass="bg-success/15 text-success"
            />
          </>
        )}
      </div>

      {/* Sensor Overview Cards */}
      <div>
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Sensor Overview — Avg across all devices
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-3">
          {sensorCards.map((sc) => (
            <motion.div
              key={sc.label}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <SensorCard {...sc} />
            </motion.div>
          ))}
        </div>
      </div>

      {/* Chart + Alerts */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">
        <Card className="xl:col-span-3 bg-card border-border shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              Real-Time Sensor Chart
              {devices[0] && (
                <span className="text-xs text-muted-foreground font-normal ml-1">
                  — {devices[0].name}
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {history.length === 0 ? (
              <div
                data-ocid="chart.empty_state"
                className="h-64 flex items-center justify-center text-muted-foreground text-sm"
              >
                No sensor data yet.
              </div>
            ) : (
              <SensorChart data={history} />
            )}
          </CardContent>
        </Card>

        <Card className="xl:col-span-2 bg-card border-border shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Bell className="w-4 h-4 text-warning" />
              Recent Alerts
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {alerts.length === 0 ? (
              <div
                data-ocid="alerts.empty_state"
                className="p-6 text-center text-muted-foreground text-sm"
              >
                No recent alerts.
              </div>
            ) : (
              <div className="overflow-auto max-h-72">
                <table className="w-full text-left">
                  <tbody>
                    {alerts.map((a, i) => (
                      <AlertRow key={String(a.id)} alert={a} index={i} />
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Device Status Row */}
      <div>
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Device Status
        </h2>
        {devices.length === 0 ? (
          <div
            data-ocid="devices.empty_state"
            className="p-6 rounded-xl bg-card border border-border text-center text-muted-foreground text-sm"
          >
            No devices registered.
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
            {devices.map((device, i) => (
              <motion.div
                key={device.id}
                data-ocid={`device.card.${i + 1}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-card border border-border rounded-xl p-4 flex items-start gap-3 hover:border-primary/50 transition-colors"
              >
                <div
                  className={`w-2.5 h-2.5 rounded-full mt-1 shrink-0 ${device.isOnline ? "bg-success" : "bg-destructive"}`}
                />
                <div className="overflow-hidden">
                  <div className="text-sm font-semibold text-foreground truncate">
                    {device.name}
                  </div>
                  <div className="text-xs text-muted-foreground truncate">
                    {device.location}
                  </div>
                  <div
                    className={`text-xs font-medium mt-1 ${device.isOnline ? "text-success" : "text-destructive"}`}
                  >
                    {device.isOnline ? "Online" : "Offline"}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <footer className="text-center text-xs text-muted-foreground pt-2 pb-1">
        <CheckCircle2 className="inline w-3 h-3 mr-1 text-success" />©{" "}
        {new Date().getFullYear()}. Built with{" "}
        <span className="text-red-400">♥</span> using{" "}
        <a
          href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline"
        >
          caffeine.ai
        </a>
      </footer>
    </div>
  );
}
