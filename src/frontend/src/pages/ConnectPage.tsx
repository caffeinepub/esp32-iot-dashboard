import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  CheckCircle2,
  Clipboard,
  ClipboardCheck,
  Cpu,
  Link2,
  Terminal,
  Upload,
  Wifi,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

function generateDeviceId(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  const seg = (len: number) =>
    Array.from(
      { length: len },
      () => chars[Math.floor(Math.random() * chars.length)],
    ).join("");
  return `esp32-${seg(4)}-${seg(4)}`;
}

const CANISTER_URL = window.location.origin;

function buildCode(deviceId: string): string {
  return `#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <DHT.h>

// === CONFIGURATION ===
const char* ssid     = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";
const char* CANISTER_URL = "${CANISTER_URL}";
const char* DEVICE_ID    = "${deviceId}";  // Auto-generated for you

// Sensor pins
#define DHT_PIN           4
#define DHT_TYPE          DHT22
#define FLOW_SENSOR_PIN   5
#define LEVEL_SENSOR_PIN  34
#define VIBRATION_PIN     35

DHT dht(DHT_PIN, DHT_TYPE);
volatile int pulseCount = 0;

void IRAM_ATTR pulseCounter() { pulseCount++; }

void setup() {
  Serial.begin(115200);
  WiFi.begin(ssid, password);
  dht.begin();
  pinMode(FLOW_SENSOR_PIN, INPUT_PULLUP);
  attachInterrupt(digitalPinToInterrupt(FLOW_SENSOR_PIN), pulseCounter, FALLING);
  while (WiFi.status() != WL_CONNECTED) { delay(500); Serial.print("."); }
  Serial.println("\nWiFi connected! IP: " + WiFi.localIP().toString());
}

void loop() {
  float temperature = dht.readTemperature();
  float humidity    = dht.readHumidity();
  float heatIndex   = dht.computeHeatIndex(temperature, humidity, false);
  float level       = analogRead(LEVEL_SENSOR_PIN) / 40.96; // 0-100%
  float flow        = pulseCount / 7.5;  // L/min
  float vibration   = analogRead(VIBRATION_PIN) / 100.0;
  pulseCount = 0;

  if (isnan(temperature) || isnan(humidity)) {
    Serial.println("DHT sensor read error!");
    delay(5000);
    return;
  }

  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    String url = String(CANISTER_URL) + "/api/v2/canister/" + String(CANISTER_URL) + "/call";
    http.begin(url);
    http.addHeader("Content-Type", "application/json");

    StaticJsonDocument<256> doc;
    doc["deviceId"]    = DEVICE_ID;
    doc["temperature"] = temperature;
    doc["heat"]        = heatIndex;
    doc["level"]       = level;
    doc["flow"]        = flow;
    doc["vibration"]   = vibration;

    String body;
    serializeJson(doc, body);

    int code = http.POST(body);
    Serial.println("HTTP " + String(code) + " | temp=" + temperature + 
                   " heat=" + heatIndex + " level=" + level +
                   " flow=" + flow + " vib=" + vibration);
    http.end();
  }

  delay(5000); // Send every 5 seconds
}`;
}

const STEPS = [
  {
    num: 1,
    icon: Cpu,
    title: "Get Your Device ID",
    description:
      "A unique Device ID has been generated for you. Use this in your ESP32 code.",
  },
  {
    num: 2,
    icon: Terminal,
    title: "Copy the Arduino Code",
    description:
      "Copy the code below and paste it into your Arduino IDE or PlatformIO project.",
  },
  {
    num: 3,
    icon: Upload,
    title: "Upload & Verify",
    description:
      "Upload the code to your ESP32 board, then open Serial Monitor to verify connection.",
  },
  {
    num: 4,
    icon: Wifi,
    title: "Monitor Live Data",
    description:
      "Head to the Live Data page to see real-time readings streaming in!",
  },
];

export function ConnectPage() {
  const deviceId = useMemo(() => generateDeviceId(), []);
  const code = useMemo(() => buildCode(deviceId), [deviceId]);
  const [copied, setCopied] = useState(false);
  const [copiedId, setCopiedId] = useState(false);

  function handleCopyCode() {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      toast.success("Arduino code copied to clipboard!");
      setTimeout(() => setCopied(false), 2500);
    });
  }

  function handleCopyId() {
    navigator.clipboard.writeText(deviceId).then(() => {
      setCopiedId(true);
      toast.success("Device ID copied!");
      setTimeout(() => setCopiedId(false), 2000);
    });
  }

  return (
    <div className="flex flex-col gap-8 p-6 max-w-4xl" data-ocid="connect.page">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
            <Link2 className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Connect Your ESP32
            </h1>
            <p className="text-sm text-muted-foreground">
              Step-by-step guide to connect your board to the cloud
            </p>
          </div>
        </div>
      </div>

      {/* Steps overview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {STEPS.map((step) => {
          const Icon = step.icon;
          return (
            <div
              key={step.num}
              className="flex flex-col gap-2 p-4 rounded-xl bg-card border border-border hover:border-primary/40 transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-primary/20 text-primary text-xs font-bold flex items-center justify-center">
                  {step.num}
                </span>
                <Icon className="w-4 h-4 text-muted-foreground" />
              </div>
              <p className="text-xs font-semibold text-foreground">
                {step.title}
              </p>
              <p className="text-xs text-muted-foreground">
                {step.description}
              </p>
            </div>
          );
        })}
      </div>

      {/* Step 1: Device ID */}
      <Card className="bg-card border-border shadow-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center">
              1
            </span>
            Your Device ID
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            This unique ID identifies your ESP32 in the cloud. It has been
            pre-filled in the code below.
          </p>
          <div className="flex items-center gap-3">
            <div className="flex-1 flex items-center gap-3 px-4 py-3 rounded-xl bg-primary/5 border border-primary/30">
              <Cpu className="w-4 h-4 text-primary shrink-0" />
              <span className="font-mono text-primary font-bold text-lg tracking-widest">
                {deviceId}
              </span>
              <Badge
                variant="outline"
                className="ml-auto text-xs text-success border-success/30 bg-success/10"
              >
                Ready
              </Badge>
            </div>
            <Button
              data-ocid="connect.copy_id.button"
              variant="outline"
              className="gap-2 border-primary/40 text-primary hover:bg-primary/10"
              onClick={handleCopyId}
            >
              {copiedId ? (
                <ClipboardCheck className="w-4 h-4" />
              ) : (
                <Clipboard className="w-4 h-4" />
              )}
              {copiedId ? "Copied!" : "Copy ID"}
            </Button>
          </div>
          <div className="flex items-start gap-2 p-3 rounded-lg bg-warning/10 border border-warning/20">
            <span className="text-warning text-xs mt-0.5">⚠</span>
            <p className="text-xs text-warning">
              Also register this device in the <strong>Devices</strong> page so
              your readings appear with the correct name and location.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Step 2: Connection info */}
      <Card className="bg-card border-border shadow-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center">
              2
            </span>
            App URL & Connection Info
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-muted/50 border border-border">
              <p className="text-xs text-muted-foreground mb-1">
                Canister / App URL
              </p>
              <p className="font-mono text-xs text-foreground break-all">
                {CANISTER_URL}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-muted/50 border border-border">
              <p className="text-xs text-muted-foreground mb-1">Device ID</p>
              <p className="font-mono text-xs text-primary">{deviceId}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Step 3: Arduino Code */}
      <Card className="bg-card border-border shadow-card">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center">
                3
              </span>
              Arduino C++ Code
            </CardTitle>
            <Button
              data-ocid="connect.copy_code.button"
              onClick={handleCopyCode}
              className="gap-2"
              size="sm"
            >
              {copied ? (
                <>
                  <ClipboardCheck className="w-4 h-4" /> Copied!
                </>
              ) : (
                <>
                  <Clipboard className="w-4 h-4" /> Copy Code
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="relative">
            <div className="flex items-center gap-2 px-4 py-2 bg-muted/30 border-b border-border">
              <div className="w-3 h-3 rounded-full bg-destructive/60" />
              <div className="w-3 h-3 rounded-full bg-warning/60" />
              <div className="w-3 h-3 rounded-full bg-success/60" />
              <span className="ml-2 text-xs text-muted-foreground font-mono">
                esp32_sensors.ino
              </span>
            </div>
            <pre className="overflow-auto p-4 text-xs font-mono text-foreground leading-relaxed max-h-[480px] bg-[#0d1117]">
              <code>{code}</code>
            </pre>
          </div>
        </CardContent>
      </Card>

      {/* Step 4: Instructions */}
      <Card className="bg-card border-border shadow-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center">
              4
            </span>
            Upload & Verify
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="space-y-4">
            {[
              {
                title: "Install Required Libraries",
                body: 'In Arduino IDE, go to Tools → Library Manager and install: "ArduinoJson", "DHT sensor library", "ESP32 board support".',
              },
              {
                title: "Configure WiFi Credentials",
                body: "Replace YOUR_WIFI_SSID and YOUR_WIFI_PASSWORD with your actual WiFi network name and password at the top of the code.",
              },
              {
                title: "Select Your Board",
                body: 'In Arduino IDE: Tools → Board → ESP32 Arduino → Select your specific ESP32 model (e.g. "DOIT ESP32 DEVKIT V1").',
              },
              {
                title: "Upload the Code",
                body: 'Connect your ESP32 via USB, select the correct COM port, and click the Upload (→) button. Wait for "Done uploading".',
              },
              {
                title: "Verify Connection",
                body: "Open Serial Monitor (Baud: 115200). You should see WiFi connected and HTTP 200 responses. Then go to Live Data to see readings!",
              },
            ].map((step, i) => (
              <li key={step.title} className="flex gap-3">
                <span className="w-6 h-6 rounded-full bg-success/15 text-success text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                  {i + 1}
                </span>
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {step.title}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {step.body}
                  </p>
                </div>
              </li>
            ))}
          </ol>

          <Separator className="my-5" />

          <div className="flex items-start gap-3 p-4 rounded-xl bg-success/10 border border-success/20">
            <CheckCircle2 className="w-5 h-5 text-success shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-success">
                You're all set!
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Once connected, your ESP32 will send sensor data every 5
                seconds. Navigate to{" "}
                <strong className="text-foreground">Live Data</strong> to see
                real-time monitoring or{" "}
                <strong className="text-foreground">Dashboard</strong> for an
                overview.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
