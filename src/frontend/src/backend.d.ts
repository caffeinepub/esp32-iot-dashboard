import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export type DeviceId = string;
export type Time = bigint;
export interface SensorData {
    temperature: number;
    flow: number;
    heat: number;
    vibration: number;
    level: number;
    timestamp: Time;
}
export type AlertId = string;
export interface DashboardStats {
    cloudStatus: string;
    activeDevices: bigint;
    unreadAlerts: bigint;
    totalDataPoints: bigint;
}
export interface Device {
    id: DeviceId;
    name: string;
    isOnline: boolean;
    description: string;
    lastSeen: Time;
    location: string;
}
export interface Alert {
    id: AlertId;
    alertType: AlertType;
    acknowledged: boolean;
    message: string;
    deviceId: DeviceId;
    timestamp: Time;
    severity: Severity;
}
export enum AlertType {
    temperature = "temperature",
    flow = "flow",
    heat = "heat",
    vibration = "vibration",
    level = "level"
}
export enum Severity {
    warning = "warning",
    info = "info",
    critical = "critical"
}
export interface backendInterface {
    acknowledgeAlert(alertId: AlertId): Promise<void>;
    createAlert(deviceId: DeviceId, alertType: AlertType, message: string, severity: Severity): Promise<void>;
    getAllLatestReadings(): Promise<Array<[DeviceId, SensorData | null]>>;
    getDashboardStats(): Promise<DashboardStats>;
    getHistoricalReadings(deviceId: DeviceId, count: bigint): Promise<Array<SensorData>>;
    getLatestReading(deviceId: DeviceId): Promise<SensorData | null>;
    getRecentAlerts(count: bigint): Promise<Array<Alert>>;
    ingestSensorData(deviceId: DeviceId, temperature: number, heat: number, level: number, flow: number, vibration: number): Promise<void>;
    listDevices(): Promise<Array<[DeviceId, Device]>>;
    registerDevice(id: DeviceId, name: string, location: string, description: string): Promise<void>;
    updateDeviceStatus(id: DeviceId, isOnline: boolean): Promise<void>;
}
