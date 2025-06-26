// -----------------------------------------------------------------------------
//  config.h  –  Project‑wide compile‑time settings (DO NOT hard‑code secrets!)
// -----------------------------------------------------------------------------
#pragma once

/* ---------------- Wi‑Fi credentials ---------------- */
#define WIFI_SSID       "YourSSID"
#define WIFI_PASSWORD   "YourPassword"

/* Optional secondary network
#define WIFI_SSID_2     "BackupSSID"
#define WIFI_PASSWORD_2 "BackupPass"
*/

/* --------------- Backend endpoint ------------------ */
#define SERVER_HOST   "192.168.1.100"   // e.g. "backend.local"
#define SERVER_PORT   3001              // Express server port
#define USE_SSL       0                 // set to 1 if you terminate HTTPS on ESP32

/* --------------- Relay behaviour ------------------- */
#define RELAY_ACTIVE_LOW 1  // 1 = LOW triggers relay, 0 = HIGH triggers relay

/* --------------- Sensor tuning --------------------- */
// You can override the defaults from sensors.h here, e.g.:
// #define PH_SLOPE   (14.0f / 4095.0f)
// #define EC_FACTOR  (5.0f  / 4095.0f)
