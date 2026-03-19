import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AlertType, Severity } from "../backend";
import { useActor } from "./useActor";

export function useDevices() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["devices"],
    queryFn: async () => {
      if (!actor) return [];
      const pairs = await actor.listDevices();
      return pairs.map(([, device]) => device);
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 10000,
  });
}

export function useAllLatestReadings() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["allLatestReadings"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllLatestReadings();
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 5000,
  });
}

export function useDashboardStats() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["dashboardStats"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getDashboardStats();
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 5000,
  });
}

export function useRecentAlerts(count = 20) {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["recentAlerts", count],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getRecentAlerts(BigInt(count));
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 10000,
  });
}

export function useDeviceHistory(deviceId: string, count = 20) {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["deviceHistory", deviceId, count],
    queryFn: async () => {
      if (!actor || !deviceId) return [];
      return actor.getHistoricalReadings(deviceId, BigInt(count));
    },
    enabled: !!actor && !isFetching && !!deviceId,
    refetchInterval: 5000,
  });
}

export function useLatestReading(deviceId: string) {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["latestReading", deviceId],
    queryFn: async () => {
      if (!actor || !deviceId) return null;
      return actor.getLatestReading(deviceId);
    },
    enabled: !!actor && !isFetching && !!deviceId,
    refetchInterval: 5000,
  });
}

export function useRegisterDevice() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      id: string;
      name: string;
      location: string;
      description: string;
    }) => {
      if (!actor) throw new Error("No actor");
      return actor.registerDevice(
        data.id,
        data.name,
        data.location,
        data.description,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["devices"] });
      queryClient.invalidateQueries({ queryKey: ["dashboardStats"] });
    },
  });
}

export function useIngestSensorData() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      deviceId: string;
      temperature: number;
      heat: number;
      level: number;
      flow: number;
      vibration: number;
    }) => {
      if (!actor) throw new Error("No actor");
      return actor.ingestSensorData(
        data.deviceId,
        data.temperature,
        data.heat,
        data.level,
        data.flow,
        data.vibration,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deviceHistory"] });
      queryClient.invalidateQueries({ queryKey: ["latestReading"] });
      queryClient.invalidateQueries({ queryKey: ["allLatestReadings"] });
      queryClient.invalidateQueries({ queryKey: ["dashboardStats"] });
    },
  });
}

export function useAcknowledgeAlert() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (alertId: string) => {
      if (!actor) throw new Error("No actor");
      return actor.acknowledgeAlert(alertId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recentAlerts"] });
      queryClient.invalidateQueries({ queryKey: ["dashboardStats"] });
    },
  });
}

export function useUpdateDeviceStatus() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { deviceId: string; isOnline: boolean }) => {
      if (!actor) throw new Error("No actor");
      return actor.updateDeviceStatus(data.deviceId, data.isOnline);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["devices"] });
      queryClient.invalidateQueries({ queryKey: ["dashboardStats"] });
    },
  });
}

export function useCreateAlert() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      deviceId: string;
      alertType: AlertType;
      message: string;
      severity: Severity;
    }) => {
      if (!actor) throw new Error("No actor");
      return actor.createAlert(
        data.deviceId,
        data.alertType,
        data.message,
        data.severity,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recentAlerts"] });
      queryClient.invalidateQueries({ queryKey: ["dashboardStats"] });
    },
  });
}
