import { Toaster } from "@/components/ui/sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { AlertType, Severity } from "./backend";
import { Sidebar } from "./components/Sidebar";
import { useActor } from "./hooks/useActor";
import { AlertsPage } from "./pages/AlertsPage";
import { ConnectPage } from "./pages/ConnectPage";
import { DashboardPage } from "./pages/DashboardPage";
import { DevicesPage } from "./pages/DevicesPage";
import { LiveDataPage } from "./pages/LiveDataPage";

export type Page = "dashboard" | "devices" | "live-data" | "alerts" | "connect";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 4000 } },
});

const SAMPLE_DEVICES = [
  {
    id: "greenhouse-01",
    name: "Greenhouse ESP32",
    location: "Greenhouse A",
    description: "Multi-sensor monitor for main greenhouse environment",
  },
  {
    id: "factory-01",
    name: "Factory Floor",
    location: "Production Line 1",
    description: "Industrial sensor array for factory floor monitoring",
  },
  {
    id: "tank-01",
    name: "Water Tank Monitor",
    location: "Roof Tank",
    description: "Level and flow sensor for rooftop water tank",
  },
];

function rand(min: number, max: number) {
  return min + Math.random() * (max - min);
}

function AppInner() {
  const [page, setPage] = useState<Page>("dashboard");
  const { actor, isFetching } = useActor();
  const seeded = useRef(false);

  useEffect(() => {
    if (!actor || isFetching || seeded.current) return;
    seeded.current = true;

    async function seed() {
      if (!actor) return;
      try {
        // Register sample devices
        await Promise.all(
          SAMPLE_DEVICES.map((d) =>
            actor
              .registerDevice(d.id, d.name, d.location, d.description)
              .catch(() => {}),
          ),
        );

        // Set devices online
        await Promise.all(
          SAMPLE_DEVICES.map((d) =>
            actor.updateDeviceStatus(d.id, true).catch(() => {}),
          ),
        );

        // Ingest historical readings for each device
        const ingests: Promise<void>[] = [];
        for (const d of SAMPLE_DEVICES) {
          for (let i = 0; i < 10; i++) {
            ingests.push(
              actor
                .ingestSensorData(
                  d.id,
                  rand(20, 35), // temperature °C
                  rand(25, 45), // heat index °C
                  rand(30, 90), // level %
                  rand(5, 25), // flow L/min
                  rand(0.1, 2.5), // vibration m/s²
                )
                .catch(() => {}),
            );
          }
        }
        await Promise.all(ingests);

        // Create sample alerts
        await Promise.all([
          actor
            .createAlert(
              "greenhouse-01",
              AlertType.temperature,
              "Temperature exceeded 32°C threshold in Greenhouse A",
              Severity.warning,
            )
            .catch(() => {}),
          actor
            .createAlert(
              "tank-01",
              AlertType.level,
              "Water tank level dropped below 30% — refill needed",
              Severity.critical,
            )
            .catch(() => {}),
        ]);

        queryClient.invalidateQueries();
        toast.success("Sample data loaded — 3 devices, 30 readings seeded!");
      } catch {
        // silent
      }
    }

    seed();
  }, [actor, isFetching]);

  const pageComponents: Record<Page, React.ReactNode> = {
    dashboard: <DashboardPage />,
    devices: <DevicesPage />,
    "live-data": <LiveDataPage />,
    alerts: <AlertsPage />,
    connect: <ConnectPage />,
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar currentPage={page} onNavigate={setPage} />
      <main className="flex-1 overflow-auto">{pageComponents[page]}</main>
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppInner />
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: "oklch(0.22 0.04 240)",
            border: "1px solid oklch(0.30 0.04 240)",
            color: "oklch(0.92 0.012 240)",
          },
        }}
      />
    </QueryClientProvider>
  );
}
