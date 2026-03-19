import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Clock, Cpu, Loader2, MapPin, Plus, Wifi, WifiOff } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { Device } from "../backend";
import {
  useDevices,
  useRegisterDevice,
  useUpdateDeviceStatus,
} from "../hooks/useQueries";

function formatLastSeen(ts: bigint): string {
  const ms = Number(ts) / 1_000_000;
  if (ms === 0) return "Never";
  return new Date(ms).toLocaleString();
}

function DeviceCard({ device, index }: { device: Device; index: number }) {
  const updateStatus = useUpdateDeviceStatus();

  function toggleStatus() {
    updateStatus.mutate(
      { deviceId: device.id, isOnline: !device.isOnline },
      {
        onSuccess: () =>
          toast.success(
            `Device marked as ${!device.isOnline ? "online" : "offline"}`,
          ),
        onError: () => toast.error("Failed to update device status"),
      },
    );
  }

  return (
    <Card
      data-ocid={`devices.item.${index + 1}`}
      className="bg-card border-border shadow-card hover:border-primary/40 transition-all duration-200"
    >
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <div
              className={`w-2.5 h-2.5 rounded-full shrink-0 ${device.isOnline ? "bg-success" : "bg-destructive"}`}
            />
            <span className="text-sm font-bold text-foreground">
              {device.name}
            </span>
          </div>
          <Badge
            variant="outline"
            className={
              device.isOnline
                ? "text-success border-success/40 bg-success/10 text-xs"
                : "text-destructive border-destructive/40 bg-destructive/10 text-xs"
            }
          >
            {device.isOnline ? (
              <Wifi className="w-3 h-3 mr-1" />
            ) : (
              <WifiOff className="w-3 h-3 mr-1" />
            )}
            {device.isOnline ? "Online" : "Offline"}
          </Badge>
        </div>

        <div className="space-y-1.5 mb-4">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Cpu className="w-3 h-3" />
            <span className="font-mono">{device.id}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <MapPin className="w-3 h-3" />
            {device.location || "No location"}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="w-3 h-3" />
            Last seen: {formatLastSeen(device.lastSeen)}
          </div>
        </div>

        {device.description && (
          <p className="text-xs text-muted-foreground mb-4 line-clamp-2">
            {device.description}
          </p>
        )}

        <Button
          data-ocid={`devices.toggle.${index + 1}`}
          variant="outline"
          size="sm"
          className="w-full text-xs"
          onClick={toggleStatus}
          disabled={updateStatus.isPending}
        >
          {updateStatus.isPending ? (
            <Loader2 className="w-3 h-3 mr-1 animate-spin" />
          ) : null}
          Mark as {device.isOnline ? "Offline" : "Online"}
        </Button>
      </CardContent>
    </Card>
  );
}

interface DeviceForm {
  id: string;
  name: string;
  location: string;
  description: string;
}

const defaultForm: DeviceForm = {
  id: "",
  name: "",
  location: "",
  description: "",
};
const SKELETON_KEYS = ["sk-1", "sk-2", "sk-3"];

export function DevicesPage() {
  const { data: devices = [], isLoading } = useDevices();
  const registerDevice = useRegisterDevice();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<DeviceForm>(defaultForm);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    registerDevice.mutate(form, {
      onSuccess: () => {
        toast.success(`Device "${form.name}" registered successfully!`);
        setOpen(false);
        setForm(defaultForm);
      },
      onError: () => toast.error("Failed to register device"),
    });
  }

  return (
    <div
      className="flex flex-col gap-6 p-6 animate-fade-in"
      data-ocid="devices.page"
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Devices</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {devices.length} registered device{devices.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button data-ocid="devices.open_modal_button" className="gap-2">
              <Plus className="w-4 h-4" />
              Add Device
            </Button>
          </DialogTrigger>
          <DialogContent
            data-ocid="devices.dialog"
            className="bg-card border-border"
          >
            <DialogHeader>
              <DialogTitle>Register New Device</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-2">
              <div className="space-y-1.5">
                <Label htmlFor="dname">Device Name</Label>
                <Input
                  data-ocid="devices.name.input"
                  id="dname"
                  placeholder="e.g. Greenhouse Sensor 1"
                  value={form.name}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, name: e.target.value }))
                  }
                  required
                  className="bg-input border-border"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="did">Device ID</Label>
                <Input
                  data-ocid="devices.id.input"
                  id="did"
                  placeholder="e.g. esp32-001"
                  value={form.id}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, id: e.target.value }))
                  }
                  required
                  className="bg-input border-border font-mono"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="dloc">Location</Label>
                <Input
                  data-ocid="devices.location.input"
                  id="dloc"
                  placeholder="e.g. Greenhouse Zone A"
                  value={form.location}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, location: e.target.value }))
                  }
                  className="bg-input border-border"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ddesc">Description</Label>
                <Textarea
                  data-ocid="devices.description.textarea"
                  id="ddesc"
                  placeholder="Optional description..."
                  value={form.description}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, description: e.target.value }))
                  }
                  className="bg-input border-border resize-none"
                  rows={2}
                />
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  data-ocid="devices.cancel_button"
                  onClick={() => {
                    setOpen(false);
                    setForm(defaultForm);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  data-ocid="devices.submit_button"
                  type="submit"
                  disabled={registerDevice.isPending}
                >
                  {registerDevice.isPending && (
                    <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />
                  )}
                  Register Device
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div
          data-ocid="devices.loading_state"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {SKELETON_KEYS.map((k) => (
            <div key={k} className="h-48 rounded-xl bg-card animate-pulse" />
          ))}
        </div>
      ) : devices.length === 0 ? (
        <Card data-ocid="devices.empty_state" className="bg-card border-border">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Cpu className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-1">
              No Devices Yet
            </h3>
            <p className="text-sm text-muted-foreground mb-6">
              Register your first ESP32 device to start collecting sensor data.
            </p>
            <Button onClick={() => setOpen(true)} className="gap-2">
              <Plus className="w-4 h-4" />
              Register First Device
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {devices.map((device, i) => (
            <DeviceCard key={device.id} device={device} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}
