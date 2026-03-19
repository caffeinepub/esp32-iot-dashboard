# ESP32 IoT Dashboard

## Current State
Full-stack app with Motoko backend storing sensor data (temperature, heat, level, flow, vibration). Frontend has Dashboard, Devices, LiveData, Alerts, Connect pages. No real-time charts exist yet.

## Requested Changes (Diff)

### Add
- Real-time line charts for all 5 sensors (temperature, heat index, water level, flow rate, vibration) on LiveDataPage
- Auto-poll every 5 seconds to fetch latest readings and update charts
- Chart shows last 20 readings with timestamp on X-axis
- Individual colored cards per sensor with current value + trend chart
- Device selector to view specific device charts

### Modify
- LiveDataPage: replace any placeholder with full charting UI using recharts
- DashboardPage: show live current values with small sparkline charts

### Remove
- Nothing

## Implementation Plan
1. Add recharts to frontend dependencies
2. Rewrite LiveDataPage with per-sensor LineCharts, auto-polling every 5s
3. Update DashboardPage sensor cards to show sparklines
4. Wire to getHistoricalReadings and getLatestReading backend APIs
