// -----------------------------------------------------------------------------
//  wifi_manager.h  –  Wi‑Fi (ESP32) helper for Hydroponics project
// -----------------------------------------------------------------------------
//  Usage example:
//      WifiManager::begin();
//      if (!WifiManager::ensureConnected()) reboot();
//      Serial.println(WifiManager::ip());
// -----------------------------------------------------------------------------
#pragma once

#include <WiFi.h>
#include <WiFiMulti.h>
#include "config.h"

namespace WifiManager {

inline WiFiMulti wifiMulti;

inline void begin() {
  wifiMulti.addAP(WIFI_SSID, WIFI_PASSWORD);
#ifdef WIFI_SSID_2
  wifiMulti.addAP(WIFI_SSID_2, WIFI_PASSWORD_2);
#endif
}

inline bool ensureConnected(unsigned long timeoutMs = 15'000) {
  const unsigned long start = millis();
  while (wifiMulti.run() != WL_CONNECTED) {
    if (millis() - start >= timeoutMs) return false;
    delay(250);
  }
  return true;
}

inline bool isConnected() {
  return WiFi.status() == WL_CONNECTED;
}

inline IPAddress ip() {
  return WiFi.localIP();
}

} // namespace WifiManager
