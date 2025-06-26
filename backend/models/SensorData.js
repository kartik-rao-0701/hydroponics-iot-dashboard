const mongoose = require('mongoose');

const sensorDataSchema = new mongoose.Schema({
  temperature: Number,
  ph: Number,
  ec: Number,
  waterLevel: Number,
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('SensorData', sensorDataSchema);
