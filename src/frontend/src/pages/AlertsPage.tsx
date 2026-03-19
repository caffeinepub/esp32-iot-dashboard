import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  AlertOctagon,
  AlertTriangle,
  Bell,
  CheckCircle2,
  Info,
  Loader2,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { Alert } from "../backend";
import { useAcknowledgeAlert, useRecentAlerts } from "../hooks/useQueries";

function SeverityIcon({ severity }: { severity: string }) {
  if (severity === "critical")
    return <AlertOctagon className="w-4 h-4 text-destructive" />;
  if (severity === "warning")
    return <AlertTriangle className="w-4 h-4 text-warning" />;
  return <Info className="w-4 h-4 text-primary" />;
}

function severityClass(severity: string) {
  if (severity === "critical")
    return "text-destructive border-destructive/30 bg-destructive/10";
  if (severity === "warning")
    return "text-warning border-warning/30 bg-warning/10";
  return "text-primary border-primary/30 bg-primary/10";
}

function AlertTableRow({ alert, index }: { alert: Alert; index: number }) {
  const acknowledge = useAcknowledgeAlert();
  const ts = new Date(Number(alert.timestamp) / 1_000_000);

  function handleAcknowledge() {
    acknowledge.mutate(alert.id, {
      onSuccess: () => toast.success("Alert acknowledged"),
      onError: () => toast.error("Failed to acknowledge alert"),
    });
  }

  return (
    <TableRow
      data-ocid={`alerts.item.${index + 1}`}
      className={`border-border transition-colors ${alert.acknowledged ? "opacity-50" : "hover:bg-accent/30"}`}
    >
      <TableCell>
        <div className="flex items-center gap-1.5">
          <SeverityIcon severity={alert.severity} />
          <Badge
            variant="outline"
            className={`text-xs ${severityClass(alert.severity)}`}
          >
            {alert.severity}
          </Badge>
        </div>
      </TableCell>
      <TableCell className="text-sm font-mono text-muted-foreground">
        {alert.deviceId}
      </TableCell>
      <TableCell className="text-sm font-medium text-foreground max-w-xs">
        <span className="line-clamp-2">{alert.message}</span>
      </TableCell>
      <TableCell className="text-xs text-muted-foreground capitalize">
        {alert.alertType}
      </TableCell>
      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
        {ts.toLocaleString()}
      </TableCell>
      <TableCell>
        {alert.acknowledged ? (
          <span className="flex items-center gap-1 text-xs text-success">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Acked
          </span>
        ) : (
          <Button
            data-ocid={`alerts.confirm_button.${index + 1}`}
            variant="outline"
            size="sm"
            className="text-xs h-7 border-primary/40 text-primary hover:bg-primary/10"
            onClick={handleAcknowledge}
            disabled={acknowledge.isPending}
          >
            {acknowledge.isPending ? (
              <Loader2 className="w-3 h-3 mr-1 animate-spin" />
            ) : null}
            Acknowledge
          </Button>
        )}
      </TableCell>
    </TableRow>
  );
}

export function AlertsPage() {
  const { data: alerts = [], isLoading } = useRecentAlerts(100);
  const [filterSeverity, setFilterSeverity] = useState<string>("all");

  const filtered =
    filterSeverity === "all"
      ? alerts
      : alerts.filter((a) => a.severity === filterSeverity);

  const unread = alerts.filter((a) => !a.acknowledged).length;

  return (
    <div
      className="flex flex-col gap-6 p-6 animate-fade-in"
      data-ocid="alerts.page"
    >
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Bell className="w-6 h-6 text-warning" />
            Alerts
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {unread > 0 ? (
              <span className="text-warning">
                {unread} unread alert{unread !== 1 ? "s" : ""}
              </span>
            ) : (
              "All alerts acknowledged"
            )}
          </p>
        </div>
        <Select value={filterSeverity} onValueChange={setFilterSeverity}>
          <SelectTrigger
            data-ocid="alerts.select"
            className="w-44 bg-card border-border"
          >
            <SelectValue placeholder="Filter by severity" />
          </SelectTrigger>
          <SelectContent className="bg-card border-border">
            <SelectItem value="all">All Severities</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
            <SelectItem value="warning">Warning</SelectItem>
            <SelectItem value="info">Info</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card className="bg-card border-border shadow-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">
            Alert Log ({filtered.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div
              data-ocid="alerts.loading_state"
              className="p-8 text-center text-muted-foreground"
            >
              <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />
              Loading alerts...
            </div>
          ) : filtered.length === 0 ? (
            <div data-ocid="alerts.empty_state" className="p-12 text-center">
              <Bell className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                No alerts recorded yet.
              </p>
            </div>
          ) : (
            <div className="overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead className="text-muted-foreground text-xs w-32">
                      Severity
                    </TableHead>
                    <TableHead className="text-muted-foreground text-xs">
                      Device
                    </TableHead>
                    <TableHead className="text-muted-foreground text-xs">
                      Message
                    </TableHead>
                    <TableHead className="text-muted-foreground text-xs">
                      Type
                    </TableHead>
                    <TableHead className="text-muted-foreground text-xs">
                      Time
                    </TableHead>
                    <TableHead className="text-muted-foreground text-xs">
                      Action
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((alert, i) => (
                    <AlertTableRow
                      key={String(alert.id)}
                      alert={alert}
                      index={i}
                    />
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
