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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Activity,
  Clock,
  Droplets,
  Flame,
  Loader2,
  Thermometer,
  Waves,
  Zap,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { SensorData } from "../backend";
import {
  useAllLatestReadings,
  useDeviceHistory,
  useDevices,
} from "../hooks/useQueries";

const REFRESH_INTERVAL = 5;

function formatTime(ts: bigint): string {
  const ms = Number(ts) / 1_000_000;
  if (ms === 0) return "—";
  return new Date(ms).toLocaleString();
}

function isOutOfRange(field: keyof SensorData, val: number): boolean {
  const ranges: Partial<Record<keyof SensorData, [number, number]>> = {
    temperature: [20, 35],
    heat: [25, 45],
    level: [30, 90],
    flow: [5, 25],
    vibration: [0.1, 2.5],
  };
  const r = ranges[field];
  if (!r) return false;
  return val < r[0] || val > r[1];
}

function valClass(field: keyof SensorData, val: number) {
  return isOutOfRange(field, val)
    ? "text-destructive font-bold"
    : "text-foreground";
}

export function LiveDataPage() {
  const { data: devices = [] } = useDevices();
  const { data: allLatest = [], isLoading: latestLoading } =
    useAllLatestReadings();
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>("all");
  const [countdown, setCountdown] = useState(REFRESH_INTERVAL);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Countdown timer
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) return REFRESH_INTERVAL;
        return c - 1;
      });
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const targetDeviceId = selectedDeviceId === "all" ? "" : selectedDeviceId;

  const { data: deviceHistory = [], isLoading: histLoading } = useDeviceHistory(
    targetDeviceId,
    50,
  );

  // For "all" view use allLatestReadings; for specific device use history
  const showAll = selectedDeviceId === "all";

  return (
    <div
      className="flex flex-col gap-6 p-6 animate-fade-in"
      data-ocid="livedata.page"
    >
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Live Sensor Data
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Real-time readings from all ESP32 devices
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={selectedDeviceId} onValueChange={setSelectedDeviceId}>
            <SelectTrigger
              data-ocid="livedata.select"
              className="w-52 bg-card border-border"
            >
              <SelectValue placeholder="Select device" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              <SelectItem value="all">All Devices (latest)</SelectItem>
              {devices.map((d) => (
                <SelectItem key={d.id} value={d.id}>
                  {d.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20">
            <Clock className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs text-primary font-mono font-bold">
              Refresh in {countdown}s
            </span>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          {
            icon: Thermometer,
            label: "Temperature",
            color: "text-blue-400 bg-blue-500/10",
          },
          {
            icon: Flame,
            label: "Heat Index",
            color: "text-orange-400 bg-orange-500/10",
          },
          {
            icon: Droplets,
            label: "Level",
            color: "text-cyan-400 bg-cyan-500/10",
          },
          {
            icon: Waves,
            label: "Flow Rate",
            color: "text-green-400 bg-green-500/10",
          },
        ].map(({ icon: Icon, label, color }) => (
          <div
            key={label}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl ${color} border border-current/10`}
          >
            <Icon className="w-4 h-4" />
            <span className="text-xs font-medium">{label}</span>
          </div>
        ))}
      </div>

      {/* Main Table */}
      <Card className="bg-card border-border shadow-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Activity className="w-4 h-4 text-primary" />
            {showAll
              ? "Latest Reading per Device"
              : `${devices.find((d) => d.id === selectedDeviceId)?.name ?? selectedDeviceId} — History`}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {latestLoading || histLoading ? (
            <div
              data-ocid="livedata.loading_state"
              className="p-8 text-center text-muted-foreground text-sm"
            >
              <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />
              Loading sensor data...
            </div>
          ) : (
            <div className="overflow-auto">
              <Table data-ocid="livedata.table">
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead className="text-muted-foreground text-xs">
                      Device
                    </TableHead>
                    <TableHead className="text-muted-foreground text-xs">
                      <Thermometer className="inline w-3 h-3 mr-1 text-blue-400" />
                      Temp (°C)
                    </TableHead>
                    <TableHead className="text-muted-foreground text-xs">
                      <Flame className="inline w-3 h-3 mr-1 text-orange-400" />
                      Heat (°C)
                    </TableHead>
                    <TableHead className="text-muted-foreground text-xs">
                      <Droplets className="inline w-3 h-3 mr-1 text-cyan-400" />
                      Level (%)
                    </TableHead>
                    <TableHead className="text-muted-foreground text-xs">
                      <Waves className="inline w-3 h-3 mr-1 text-green-400" />
                      Flow (L/min)
                    </TableHead>
                    <TableHead className="text-muted-foreground text-xs">
                      <Zap className="inline w-3 h-3 mr-1 text-purple-400" />
                      Vib (m/s²)
                    </TableHead>
                    <TableHead className="text-muted-foreground text-xs">
                      <Clock className="inline w-3 h-3 mr-1" />
                      Time
                    </TableHead>
                    <TableHead className="text-muted-foreground text-xs">
                      Status
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {showAll ? (
                    allLatest.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8}>
                          <div
                            data-ocid="livedata.empty_state"
                            className="p-8 text-center text-muted-foreground text-sm"
                          >
                            No readings yet.
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      allLatest.map(([deviceId, reading], i) => {
                        if (!reading) return null;
                        const deviceName =
                          devices.find((d) => d.id === deviceId)?.name ??
                          deviceId;
                        const anyOor =
                          isOutOfRange("temperature", reading.temperature) ||
                          isOutOfRange("heat", reading.heat) ||
                          isOutOfRange("level", reading.level) ||
                          isOutOfRange("flow", reading.flow) ||
                          isOutOfRange("vibration", reading.vibration);
                        return (
                          <TableRow
                            key={deviceId}
                            data-ocid={`livedata.item.${i + 1}`}
                            className="border-border hover:bg-accent/30 transition-colors"
                          >
                            <TableCell className="text-sm font-medium text-foreground">
                              {deviceName}
                            </TableCell>
                            <TableCell
                              className={`text-sm font-mono ${valClass("temperature", reading.temperature)}`}
                            >
                              {reading.temperature.toFixed(1)}
                            </TableCell>
                            <TableCell
                              className={`text-sm font-mono ${valClass("heat", reading.heat)}`}
                            >
                              {reading.heat.toFixed(1)}
                            </TableCell>
                            <TableCell
                              className={`text-sm font-mono ${valClass("level", reading.level)}`}
                            >
                              {reading.level.toFixed(1)}
                            </TableCell>
                            <TableCell
                              className={`text-sm font-mono ${valClass("flow", reading.flow)}`}
                            >
                              {reading.flow.toFixed(1)}
                            </TableCell>
                            <TableCell
                              className={`text-sm font-mono ${valClass("vibration", reading.vibration)}`}
                            >
                              {reading.vibration.toFixed(2)}
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                              {formatTime(reading.timestamp)}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant="outline"
                                className={
                                  anyOor
                                    ? "text-destructive border-destructive/30 bg-destructive/10 text-xs"
                                    : "text-success border-success/30 bg-success/10 text-xs"
                                }
                              >
                                {anyOor ? "Warning" : "Normal"}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )
                  ) : deviceHistory.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8}>
                        <div
                          data-ocid="livedata.empty_state"
                          className="p-8 text-center text-muted-foreground text-sm"
                        >
                          No history for this device.
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    deviceHistory
                      .slice()
                      .reverse()
                      .map((reading, i) => {
                        const anyOor =
                          isOutOfRange("temperature", reading.temperature) ||
                          isOutOfRange("heat", reading.heat) ||
                          isOutOfRange("level", reading.level) ||
                          isOutOfRange("flow", reading.flow) ||
                          isOutOfRange("vibration", reading.vibration);
                        return (
                          <TableRow
                            key={String(reading.timestamp)}
                            data-ocid={`livedata.item.${i + 1}`}
                            className="border-border hover:bg-accent/30 transition-colors"
                          >
                            <TableCell className="text-xs text-muted-foreground">
                              #{i + 1}
                            </TableCell>
                            <TableCell
                              className={`text-sm font-mono ${valClass("temperature", reading.temperature)}`}
                            >
                              {reading.temperature.toFixed(1)}
                            </TableCell>
                            <TableCell
                              className={`text-sm font-mono ${valClass("heat", reading.heat)}`}
                            >
                              {reading.heat.toFixed(1)}
                            </TableCell>
                            <TableCell
                              className={`text-sm font-mono ${valClass("level", reading.level)}`}
                            >
                              {reading.level.toFixed(1)}
                            </TableCell>
                            <TableCell
                              className={`text-sm font-mono ${valClass("flow", reading.flow)}`}
                            >
                              {reading.flow.toFixed(1)}
                            </TableCell>
                            <TableCell
                              className={`text-sm font-mono ${valClass("vibration", reading.vibration)}`}
                            >
                              {reading.vibration.toFixed(2)}
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                              {formatTime(reading.timestamp)}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant="outline"
                                className={
                                  anyOor
                                    ? "text-destructive border-destructive/30 bg-destructive/10 text-xs"
                                    : "text-success border-success/30 bg-success/10 text-xs"
                                }
                              >
                                {anyOor ? "Warning" : "Normal"}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        );
                      })
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
