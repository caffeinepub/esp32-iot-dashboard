# ESP32 IoT Dashboard - Multi-Sensor Update

## Current State
Basic ESP32 dashboard with temperature, humidity, voltage sensors. Single sensor data model.

## Requested Changes (Diff)

### Add
- Full multi-sensor support: Temperature, Heat, Level, Flow, Vibration sensors
- Each sensor type has its own unit and display (°C, °F, %, L/min, m/s², etc.)
- Per-sensor real-time chart on device detail page
- Sensor-specific alert thresholds displayed
- ESP32 Arduino code snippet shown in app so user can copy-paste to board
- Auto-refresh every 5 seconds for real-time monitoring
- Sensor cards on dashboard showing latest value per sensor type per device

### Modify
- Backend: extend SensorData to include heat, level, flow, vibration fields
- ingestSensorData to accept all 5 sensor values
- Frontend dashboard to show all sensor types
- Charts to show all sensor types with color-coded lines

### Remove
- humidity/voltage fields replaced by heat, level, flow, vibration (keep temperature)

## Implementation Plan
1. Update Motoko backend with new SensorData structure
2. Regenerate frontend bindings
3. Update frontend:
   - Dashboard: sensor overview cards per type
   - Live Data table: columns for all 5 sensors
   - Device detail: multi-line chart for all sensors
   - New "Connect" page: ESP32 Arduino code snippet with device ID
   - Auto-refresh polling every 5 seconds
