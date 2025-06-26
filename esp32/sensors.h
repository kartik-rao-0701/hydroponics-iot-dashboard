// -----------------------------------------------------------------------------
//  sensors.h  –  Abstraction layer for Hydroponics sensors on ESP32
// -----------------------------------------------------------------------------
//  Provides a simple API:
//      Sensors::begin();          // initialise buses & ADC
//      Sensors::Data d = Sensors::readAll();
//
//  Replace the calibration constants with values from your own probes.
// -----------------------------------------------------------------------------
#pragma once

#include <Arduino.h>
#include <OneWire.h>
#include <DallasTemperature.h>

namespace Sensors {

// ---------------- Pin mapping (override in config if you like) --------------
constexpr uint8_t PIN_TEMP        = 4;   // DS18B20 OneWire
constexpr uint8_t PIN_PH          = 34;  // ADC1_CH6
constexpr uint8_t PIN_EC          = 35;  // ADC1_CH7
constexpr uint8_t PIN_WATER_LEVEL = 32;  // ADC1_CH4

// ---------------- Calibration constants ------------------------------------
//  👉  Replace these slope / factor values with your own calibration curves.
constexpr float PH_SLOPE   = 14.0f / 4095.0f;   // raw → pH
constexpr float EC_FACTOR  =  5.0f / 4095.0f;   // raw → mS/cm

struct Data {
  float temperature;   // °C
  float ph;            // 0–14
  float ec;            // mS/cm
  float waterLevel;    // %
  uint32_t ts;         // epoch (s) or millis
};

// ---------------- Internal handles -----------------------------------------
inline OneWire oneWire(PIN_TEMP);
inline DallasTemperature tempSensor(&oneWire);

// ---------------- Public API -----------------------------------------------
inline void begin() {
  tempSensor.begin();
  analogReadResolution(12);   // 0‑4095 for better precision
}

inline float readTemperatureC() {
  tempSensor.requestTemperatures();
  return tempSensor.getTempCByIndex(0);
}

inline float readPH() {
  return analogRead(PIN_PH) * PH_SLOPE;
}

inline float readEC() {
  return analogRead(PIN_EC) * EC_FACTOR;
}

inline float readWaterLevel() {
  return analogRead(PIN_WATER_LEVEL) * (100.0f / 4095.0f);
}

inline Data readAll() {
  Data d;
  d.temperature  = readTemperatureC();
  d.ph           = readPH();
  d.ec           = readEC();
  d.waterLevel   = readWaterLevel();
  d.ts           = millis();
  return d;
}

} // namespace Sensors
