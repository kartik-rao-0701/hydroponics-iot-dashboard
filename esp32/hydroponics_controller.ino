// -----------------------------------------------------------------------------
//  HydroponicsController.ino  –  ESP32 firmware for the IoT Hydroponics project
// -----------------------------------------------------------------------------
//  • Reads Temperature (DS18B20), pH, EC, and Water‑Level sensors.
//  • Publishes JSON to the Node/Express backend via HTTP POST.
//  • Listens for control commands (pump / lights / dosing) via WebSocket.
//  • Non‑blocking timing loops (millis) – no delays except 1 s nutrient dose.
//  • Robust Wi‑Fi & WebSocket reconnection, optional multi‑SSID support.
//  • Compile‑time pin map & optional active‑low relay logic.
// -----------------------------------------------------------------------------

#include <WiFi.h>
#include <WiFiMulti.h>
#include <HTTPClient.h>
#include <WebSocketsClient.h>
#include <ArduinoJson.h>
#include <OneWire.h>
#include <DallasTemperature.h>
#include "config.h"   // ➜  Provide WIFI_SSID, WIFI_PASSWORD, SERVER_HOST, SERVER_PORT

/* --------------------------- Pin Definitions ----------------------------- */
constexpr uint8_t PIN_TEMP       = 4;    // DS18B20 data
constexpr uint8_t PIN_PH         = 34;   // ADC1_CH6
constexpr uint8_t PIN_EC         = 35;   // ADC1_CH7
constexpr uint8_t PIN_LEVEL      = 32;   // ADC1_CH4

constexpr uint8_t PIN_RELAY_PUMP  = 5;   // water‑circulation relay
constexpr uint8_t PIN_RELAY_LIGHT = 18;  // LED grow‑lights relay
constexpr uint8_t PIN_PUMP_DOSE   = 19;  // nutrient‑dosing pump

constexpr bool RELAY_ACTIVE_LOW = true;  // set to false if your relays are active‑HIGH

/* --------------------------- Timing (ms) --------------------------------- */
constexpr uint32_t READ_INTERVAL  = 2'000;
constexpr uint32_t POST_INTERVAL  = 5'000;
constexpr uint32_t WIFI_RETRY_MS  = 15'000;
constexpr uint32_t WS_PING_MS     = 30'000;

/* --------------------------- Globals ------------------------------------- */
WiFiMulti wifiMulti;
WebSocketsClient ws;
HTTPClient http;
OneWire oneWire(PIN_TEMP);
DallasTemperature tempSensor(&oneWire);

struct {
  float temperature{0};
  float ph{0};
  float ec{0};
  float water{0};
  uint32_t ts{0};
} sensor;

uint32_t lastRead{0}, lastPost{0}, lastPing{0};

bool pumpOn   = false;
bool lightsOn = true;

/* --------------------------- Helpers ------------------------------------- */
#define DBG(fmt, ...) Serial.printf_P(PSTR(fmt), ##__VA_ARGS__)
inline void relayWrite(uint8_t pin, bool on) {
  digitalWrite(pin, RELAY_ACTIVE_LOW ? !on : on);
}

/* --------------------------- Forward Decls -------------------------------- */
void connectWiFi();
void connectWS();
void readSensors();
void publishSensors();
void onWSEvent(WStype_t type, uint8_t *payload, size_t len);

/* ------------------------------------------------------------------------- */
void setup() {
  Serial.begin(115200);
  delay(200);

  // GPIO initialisation.
  pinMode(PIN_RELAY_PUMP,  OUTPUT);
  pinMode(PIN_RELAY_LIGHT, OUTPUT);
  pinMode(PIN_PUMP_DOSE,   OUTPUT);
  relayWrite(PIN_RELAY_PUMP,  pumpOn);
  relayWrite(PIN_RELAY_LIGHT, lightsOn);

  // Sensors.
  tempSensor.begin();
  analogReadResolution(12);   // 0‑4095

  // Wi‑Fi (multi‑SSID ready).
  wifiMulti.addAP(WIFI_SSID, WIFI_PASSWORD);
  connectWiFi();

  // WebSocket – reconnects automatically every 5 s.
  connectWS();

  DBG("\n✔️  Hydroponics Controller ready\n");
}

/* ------------------------------------------------------------------------- */
void loop() {
  if (WiFi.status() != WL_CONNECTED && millis() - lastPing > WIFI_RETRY_MS) {
    connectWiFi();
  }

  ws.loop();

  const uint32_t now = millis();
  if (now - lastRead >= READ_INTERVAL) {
    readSensors();
    lastRead = now;
  }
  if (now - lastPost >= POST_INTERVAL) {
    publishSensors();
    lastPost = now;
  }
  if (now - lastPing >= WS_PING_MS) {
    ws.sendPing();
    lastPing = now;
  }
}

/* --------------------------- Connectivity -------------------------------- */
void connectWiFi() {
  DBG("\n🔄 Connecting Wi‑Fi … ");
  while (wifiMulti.run() != WL_CONNECTED) {
    delay(500);
    Serial.print('.');
  }
  DBG(" connected: %s\n", WiFi.localIP().toString().c_str());
}

void connectWS() {
  ws.begin(SERVER_HOST, SERVER_PORT, "/");
  ws.onEvent(onWSEvent);
  ws.setReconnectInterval(5'000);
}

/* --------------------------- Sensor Logic -------------------------------- */
void readSensors() {
  // Temperature (DS18B20)
  tempSensor.requestTemperatures();
  sensor.temperature = tempSensor.getTempCByIndex(0);

  // pH  (replace with calibrated equation)
  const uint16_t phRaw = analogRead(PIN_PH);
  sensor.ph = phRaw * (14.0f / 4095.0f);

  // EC  (replace with calibrated equation)
  const uint16_t ecRaw = analogRead(PIN_EC);
  sensor.ec = ecRaw * (5.0f / 4095.0f);

  // Water‑level percentage
  const uint16_t lvlRaw = analogRead(PIN_LEVEL);
  sensor.water = lvlRaw * (100.0f / 4095.0f);

  sensor.ts = static_cast<uint32_t>(time(nullptr));

  DBG("📈  T=%.2f °C  pH=%.2f  EC=%.2f  H=%.0f%%\n",
      sensor.temperature, sensor.ph, sensor.ec, sensor.water);
}

/* --------------------------- HTTP Publish -------------------------------- */
void publishSensors() {
  if (WiFi.status() != WL_CONNECTED) return;

  StaticJsonDocument<256> doc;
  doc["temperature"] = sensor.temperature;
  doc["ph"]          = sensor.ph;
  doc["ec"]          = sensor.ec;
  doc["waterLevel"]  = sensor.water;
  doc["timestamp"]   = sensor.ts;

  String json;
  serializeJson(doc, json);

  http.begin(String("http://") + SERVER_HOST + ':' + SERVER_PORT + "/api/sensors");
  http.addHeader("Content-Type", "application/json");
  const int code = http.POST(json);
  http.end();

  DBG("➡️  POST /api/sensors → %d\n", code);
}

/* --------------------------- WebSocket ----------------------------------- */
void onWSEvent(WStype_t type, uint8_t *payload, size_t len) {
  switch (type) {
    case WStype_CONNECTED:
      DBG("🌐 WS connected\n");
      break;

    case WStype_TEXT: {
      StaticJsonDocument<256> doc;
      if (deserializeJson(doc, payload, len) == DeserializationError::Ok && doc.containsKey("action")) {
        const String action = doc["action"].as<String>();
        const bool   value  = doc["value"].as<bool>();

        if (action == "pump") {
          pumpOn = value;
          relayWrite(PIN_RELAY_PUMP, pumpOn);
        } else if (action == "lights") {
          lightsOn = value;
          relayWrite(PIN_RELAY_LIGHT, lightsOn);
        } else if (action == "dosing" || action == "dose") {
          relayWrite(PIN_PUMP_DOSE, true);
          delay(1'000);                 // 1‑second dose
          relayWrite(PIN_PUMP_DOSE, false);
        }
        DBG("⚙️  %s → %s\n", action.c_str(), value ? "ON" : "OFF");
      }
      break;
    }

    case WStype_DISCONNECTED:
      DBG("🔌 WS disconnected\n");
      break;

    default:
      break;
  }
}

/* ------------------------------------------------------------------------- */
//  config.h (example)
// -------------------------------------------------------------------------
//  #pragma once
//  #define WIFI_SSID     "YourSSID"
//  #define WIFI_PASSWORD "YourPassword"
//  #define SERVER_HOST   "192.168.1.100"   // or "backend.local"
//  #define SERVER_PORT   3001               // Express server port
// -------------------------------------------------------------------------
