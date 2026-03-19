import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { SensorData } from "../backend";

interface SensorChartProps {
  data: SensorData[];
}

function formatTime(ts: bigint): string {
  const ms = Number(ts) / 1_000_000;
  if (ms === 0) return "";
  const d = new Date(ms);
  return d.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

const SENSOR_LINES = [
  { key: "Temperature", color: "#3b82f6", label: "Temp (°C)" },
  { key: "Heat", color: "#f97316", label: "Heat (°C)" },
  { key: "Level", color: "#06b6d4", label: "Level (%)" },
  { key: "Flow", color: "#22c55e", label: "Flow (L/min)" },
  { key: "Vibration", color: "#a855f7", label: "Vib (m/s²)" },
];

export function SensorChart({ data }: SensorChartProps) {
  const chartData = [...data]
    .sort((a, b) => Number(a.timestamp - b.timestamp))
    .slice(-20)
    .map((d) => ({
      time: formatTime(d.timestamp),
      Temperature: Math.round(d.temperature * 10) / 10,
      Heat: Math.round(d.heat * 10) / 10,
      Level: Math.round(d.level * 10) / 10,
      Flow: Math.round(d.flow * 10) / 10,
      Vibration: Math.round(d.vibration * 100) / 100,
    }));

  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart
        data={chartData}
        margin={{ top: 8, right: 16, left: -8, bottom: 0 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.30 0.04 240)" />
        <XAxis
          dataKey="time"
          tick={{ fill: "oklch(0.67 0.03 240)", fontSize: 10 }}
          axisLine={{ stroke: "oklch(0.30 0.04 240)" }}
          tickLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          tick={{ fill: "oklch(0.67 0.03 240)", fontSize: 10 }}
          axisLine={{ stroke: "oklch(0.30 0.04 240)" }}
          tickLine={false}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "oklch(0.22 0.04 240)",
            border: "1px solid oklch(0.30 0.04 240)",
            borderRadius: "8px",
            fontSize: "11px",
            color: "oklch(0.92 0.012 240)",
          }}
        />
        <Legend
          wrapperStyle={{ fontSize: "11px", color: "oklch(0.67 0.03 240)" }}
        />
        {SENSOR_LINES.map((s) => (
          <Line
            key={s.key}
            type="monotone"
            dataKey={s.key}
            stroke={s.color}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
