import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Activity,
  Droplets,
  Flame,
  Loader2,
  Thermometer,
  Waves,
  Zap,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { SensorData } from "../backend";
import { useDeviceHistory, useDevices } from "../hooks/useQueries";

function formatTime(ts: bigint): string {
  const ms = Number(ts) / 1_000_000;
  if (ms === 0) return "—";
  return new Date(ms).toLocaleTimeString("en-US", { hour12: false });
}

type ChartPoint = { time: string; value: number };

function toChartData(
  history: SensorData[],
  key: keyof Omit<SensorData, "timestamp">,
): ChartPoint[] {
  return history.map((r) => ({
    time: formatTime(r.timestamp),
    value: r[key] as number,
  }));
}

interface SensorChartCardProps {
  label: string;
  unit: string;
  icon: React.ElementType;
  color: string;
  data: ChartPoint[];
  chartType: "line" | "area";
  currentValue: number | null;
  decimals?: number;
  isLoading: boolean;
}

function SensorChartCard({
  label,
  unit,
  icon: Icon,
  color,
  data,
  chartType,
  currentValue,
  decimals = 1,
  isLoading,
}: SensorChartCardProps) {
  const tooltipStyle = {
    backgroundColor: "oklch(0.22 0.04 240)",
    border: `1px solid ${color}40`,
    borderRadius: "8px",
    color: "oklch(0.92 0.012 240)",
    fontSize: "12px",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      <Card
        className="bg-card border shadow-lg overflow-hidden"
        style={{ borderColor: `${color}30` }}
      >
        <CardHeader className="pb-2 pt-4 px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: `${color}20` }}
              >
                <Icon className="w-4 h-4" style={{ color }} />
              </div>
              <CardTitle className="text-sm font-semibold text-muted-foreground">
                {label}
              </CardTitle>
            </div>
            {currentValue !== null && (
              <div className="text-right">
                <span
                  className="text-2xl font-bold tabular-nums"
                  style={{ color }}
                >
                  {currentValue.toFixed(decimals)}
                </span>
                <span className="text-xs text-muted-foreground ml-1">
                  {unit}
                </span>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="px-1 pb-3">
          {isLoading ? (
            <div className="h-36 flex items-center justify-center">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : data.length === 0 ? (
            <div
              data-ocid="livedata.empty_state"
              className="h-36 flex items-center justify-center text-muted-foreground text-xs"
            >
              Waiting for data...
            </div>
          ) : chartType === "area" ? (
            <ResponsiveContainer width="100%" height={148}>
              <AreaChart
                data={data}
                margin={{ top: 4, right: 8, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient
                    id={`grad-${label}`}
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="5%" stopColor={color} stopOpacity={0.35} />
                    <stop offset="95%" stopColor={color} stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="oklch(0.3 0.04 240)"
                  vertical={false}
                />
                <XAxis
                  dataKey="time"
                  tick={{ fontSize: 9, fill: "oklch(0.55 0.025 240)" }}
                  tickLine={false}
                  axisLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis
                  tick={{ fontSize: 9, fill: "oklch(0.55 0.025 240)" }}
                  tickLine={false}
                  axisLine={false}
                  width={38}
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(v: number) => [
                    `${v.toFixed(decimals)} ${unit}`,
                    label,
                  ]}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke={color}
                  strokeWidth={2}
                  fill={`url(#grad-${label})`}
                  dot={false}
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <ResponsiveContainer width="100%" height={148}>
              <LineChart
                data={data}
                margin={{ top: 4, right: 8, left: -20, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="oklch(0.3 0.04 240)"
                  vertical={false}
                />
                <XAxis
                  dataKey="time"
                  tick={{ fontSize: 9, fill: "oklch(0.55 0.025 240)" }}
                  tickLine={false}
                  axisLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis
                  tick={{ fontSize: 9, fill: "oklch(0.55 0.025 240)" }}
                  tickLine={false}
                  axisLine={false}
                  width={38}
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(v: number) => [
                    `${v.toFixed(decimals)} ${unit}`,
                    label,
                  ]}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke={color}
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

export function LiveDataPage() {
  const { data: devices = [] } = useDevices();
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>("");

  const effectiveDeviceId =
    selectedDeviceId || (devices.length > 0 ? devices[0].id : "");

  const { data: history = [], isLoading } = useDeviceHistory(
    effectiveDeviceId,
    20,
  );

  const latest = history[history.length - 1] ?? null;

  const sensors = [
    {
      label: "Temperature",
      unit: "°C",
      icon: Thermometer,
      color: "#f97316",
      key: "temperature" as const,
      chartType: "line" as const,
      decimals: 1,
    },
    {
      label: "Heat Index",
      unit: "°C",
      icon: Flame,
      color: "#ef4444",
      key: "heat" as const,
      chartType: "line" as const,
      decimals: 1,
    },
    {
      label: "Water Level",
      unit: "%",
      icon: Droplets,
      color: "#3b82f6",
      key: "level" as const,
      chartType: "area" as const,
      decimals: 1,
    },
    {
      label: "Flow Rate",
      unit: "L/min",
      icon: Waves,
      color: "#06b6d4",
      key: "flow" as const,
      chartType: "line" as const,
      decimals: 1,
    },
    {
      label: "Vibration",
      unit: "m/s²",
      icon: Zap,
      color: "#a855f7",
      key: "vibration" as const,
      chartType: "line" as const,
      decimals: 2,
    },
  ];

  return (
    <div
      className="flex flex-col gap-6 p-6 animate-fade-in"
      data-ocid="livedata.page"
    >
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Live Sensor Charts
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Real-time monitoring — auto-refreshes every 5 seconds
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={effectiveDeviceId} onValueChange={setSelectedDeviceId}>
            <SelectTrigger
              data-ocid="livedata.select"
              className="w-52 bg-card border-border"
            >
              <SelectValue placeholder="Select device" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              {devices.map((d) => (
                <SelectItem key={d.id} value={d.id}>
                  {d.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Badge
            data-ocid="livedata.toggle"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-success/10 border border-success/30 text-success text-xs rounded-full"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-success" />
            </span>
            Live
          </Badge>
        </div>
      </div>

      {/* Summary strip */}
      {latest && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {sensors.map((s) => (
            <div
              key={s.key}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-card border"
              style={{ borderColor: `${s.color}30` }}
            >
              <s.icon
                className="w-3.5 h-3.5 shrink-0"
                style={{ color: s.color }}
              />
              <div className="min-w-0">
                <div className="text-[10px] text-muted-foreground truncate">
                  {s.label}
                </div>
                <div
                  className="text-sm font-bold tabular-nums"
                  style={{ color: s.color }}
                >
                  {(latest[s.key] as number).toFixed(s.decimals)}
                  <span className="text-[10px] font-normal text-muted-foreground ml-0.5">
                    {s.unit}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Chart Grid */}
      {devices.length === 0 && !isLoading ? (
        <div
          data-ocid="livedata.empty_state"
          className="flex flex-col items-center justify-center py-24 text-muted-foreground gap-3"
        >
          <Activity className="w-10 h-10 opacity-30" />
          <p className="text-sm">No devices registered yet.</p>
          <p className="text-xs opacity-60">
            Register a device on the Devices page to start monitoring.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sensors.map((s) => (
            <SensorChartCard
              key={s.key}
              label={s.label}
              unit={s.unit}
              icon={s.icon}
              color={s.color}
              data={toChartData(history, s.key)}
              chartType={s.chartType}
              currentValue={latest ? (latest[s.key] as number) : null}
              decimals={s.decimals}
              isLoading={isLoading}
            />
          ))}
        </div>
      )}
    </div>
  );
}
