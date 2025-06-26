const express = require('express');
const SensorData = require('../models/SensorData');
const router = express.Router();

router.get('/latest', async (req, res) => {
  try {
    const latest = await SensorData.findOne().sort({ timestamp: -1 });
    res.json(latest || { temperature: 24.5, ph: 6.2, ec: 1.8, waterLevel: 85, timestamp: new Date() });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/history', async (req, res) => {
  try {
    const hours = parseInt(req.query.hours) || 24;
    const data = await SensorData.find({
      timestamp: { $gte: new Date(Date.now() - hours * 60 * 60 * 1000) }
    }).sort({ timestamp: 1 });
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const sensorData = new SensorData(req.body);
    await sensorData.save();
    req.io.emit('sensorUpdate', sensorData);
    res.status(201).json(sensorData);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;