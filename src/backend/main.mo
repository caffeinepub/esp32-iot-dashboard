import Time "mo:core/Time";
import Text "mo:core/Text";
import Array "mo:core/Array";
import Order "mo:core/Order";
import Int "mo:core/Int";
import Float "mo:core/Float";
import List "mo:core/List";
import Iter "mo:core/Iter";
import Map "mo:core/Map";
import Runtime "mo:core/Runtime";

actor {
  // Types
  type DeviceId = Text;
  type AlertId = Text;
  type Severity = { #info; #warning; #critical };
  type AlertType = { #level; #temperature; #heat; #flow; #vibration };

  public type SensorData = {
    temperature : Float;
    heat : Float;
    level : Float;
    flow : Float;
    vibration : Float;
    timestamp : Time.Time;
  };

  public type Device = {
    id : DeviceId;
    name : Text;
    location : Text;
    description : Text;
    isOnline : Bool;
    lastSeen : Time.Time;
  };

  public type Alert = {
    id : AlertId;
    deviceId : DeviceId;
    alertType : AlertType;
    message : Text;
    severity : Severity;
    timestamp : Time.Time;
    acknowledged : Bool;
  };

  module Alert {
    public func compare(alert1 : Alert, alert2 : Alert) : Order.Order {
      Int.compare(alert2.timestamp, alert1.timestamp);
    };
  };

  public type DashboardStats = {
    activeDevices : Nat;
    totalDataPoints : Nat;
    unreadAlerts : Nat;
    cloudStatus : Text;
  };

  // Storage
  let devices = Map.empty<DeviceId, Device>();
  let sensorData = Map.empty<DeviceId, List.List<SensorData>>();
  let alerts = Map.empty<AlertId, Alert>();

  // Compare module for SensorData
  module SensorData {
    public func compareTimestamp(d1 : SensorData, d2 : SensorData) : Order.Order {
      Int.compare(d2.timestamp, d1.timestamp);
    };
  };

  // Device Management
  public shared ({ caller }) func registerDevice(id : DeviceId, name : Text, location : Text, description : Text) : async () {
    let device : Device = {
      id;
      name;
      location;
      description;
      isOnline = true;
      lastSeen = Time.now();
    };
    devices.add(id, device);
  };

  public shared ({ caller }) func updateDeviceStatus(id : DeviceId, isOnline : Bool) : async () {
    switch (devices.get(id)) {
      case (?device) {
        let updatedDevice = { device with isOnline; lastSeen = Time.now() };
        devices.add(id, updatedDevice);
      };
      case (null) { Runtime.trap("Device not found") };
    };
  };

  public query ({ caller }) func listDevices() : async [(DeviceId, Device)] {
    devices.toArray();
  };

  // Sensor Data Operations
  public shared ({ caller }) func ingestSensorData(deviceId : DeviceId, temperature : Float, heat : Float, level : Float, flow : Float, vibration : Float) : async () {
    let data : SensorData = {
      temperature;
      heat;
      level;
      flow;
      vibration;
      timestamp = Time.now();
    };

    // Auto register device if not found
    if (not devices.containsKey(deviceId)) {
      let newDevice : Device = {
        id = deviceId;
        name = "Auto Registered";
        location = "Unknown";
        description = "Auto registered device";
        isOnline = true;
        lastSeen = Time.now();
      };
      devices.add(deviceId, newDevice);
    };

    // Store sensor data
    let existingData = switch (sensorData.get(deviceId)) {
      case (?dataList) { dataList };
      case (null) { List.empty<SensorData>() };
    };
    existingData.add(data);
    sensorData.add(deviceId, existingData);
  };

  public query ({ caller }) func getLatestReading(deviceId : DeviceId) : async ?SensorData {
    switch (sensorData.get(deviceId)) {
      case (?dataList) {
        if (dataList.isEmpty()) { return null };
        let sorted = dataList.toArray().sort(SensorData.compareTimestamp);
        if (sorted.size() > 0) { ?sorted[0] } else { null };
      };
      case (null) { null };
    };
  };

  public query ({ caller }) func getHistoricalReadings(deviceId : DeviceId, count : Nat) : async [SensorData] {
    switch (sensorData.get(deviceId)) {
      case (?dataList) {
        let sorted = dataList.toArray().sort(SensorData.compareTimestamp);
        sorted.sliceToArray(0, Int.min(count, sorted.size()));
      };
      case (null) { ([] : [SensorData]) };
    };
  };

  public query ({ caller }) func getAllLatestReadings() : async [(DeviceId, ?SensorData)] {
    let devicesArray = devices.toArray();
    devicesArray.map(func((deviceId, _)) { (deviceId, getLatestReadingInternal(deviceId)) });
  };

  // Alerts
  public shared ({ caller }) func createAlert(deviceId : DeviceId, alertType : AlertType, message : Text, severity : Severity) : async () {
    let id = deviceId # "-" # debug_show (Time.now());
    let alert : Alert = {
      id;
      deviceId;
      alertType;
      message;
      severity;
      timestamp = Time.now();
      acknowledged = false;
    };
    alerts.add(id, alert);
  };

  public shared ({ caller }) func acknowledgeAlert(alertId : AlertId) : async () {
    switch (alerts.get(alertId)) {
      case (?alert) {
        let updatedAlert = { alert with acknowledged = true };
        alerts.add(alertId, updatedAlert);
      };
      case (null) { Runtime.trap("Alert not found") };
    };
  };

  public query ({ caller }) func getRecentAlerts(count : Nat) : async [Alert] {
    let alertsArray = alerts.toArray().map(func((_, alert)) { alert });
    let sorted = alertsArray.sort();
    sorted.sliceToArray(0, Int.min(count, sorted.size()));
  };

  // Dashboard Stats
  public query ({ caller }) func getDashboardStats() : async DashboardStats {
    let activeDeviceCount = devices.values().toArray().filter(func(device) { device.isOnline }).size();
    let totalDataPoints = sensorData.values().toArray().map(func(dataList) { dataList.size() }).foldLeft(0, Nat.add);
    let unreadAlerts = alerts.values().toArray().filter(func(alert) { not alert.acknowledged }).size();

    {
      activeDevices = activeDeviceCount;
      totalDataPoints;
      unreadAlerts;
      cloudStatus = "Online";
    };
  };

  // Helper functions
  func getLatestReadingInternal(deviceId : DeviceId) : ?SensorData {
    switch (sensorData.get(deviceId)) {
      case (?dataList) {
        if (dataList.isEmpty()) { return null };
        let sorted = dataList.toArray().sort(SensorData.compareTimestamp);
        if (sorted.size() > 0) { ?sorted[0] } else { null };
      };
      case (null) { null };
    };
  };
};
