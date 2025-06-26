// server.js
require('dotenv').config();              // ↖️  load env vars FIRST
const express   = require('express');
const http      = require('http');
const cors      = require('cors');
const helmet    = require('helmet');     // basic hardening
const mongoose  = require('mongoose');
const { Server: SocketIO } = require('socket.io');
const Joi       = require('joi');        // payload validation

/* ------------------------------------------------------------------ */
/* 1. CONFIGURATION                                                   */
/* ------------------------------------------------------------------ */

const PORT        = process.env.PORT        || 3001;
const MONGO_URI   = process.env.MONGODB_URI || 'mongodb://localhost:27017/hydroponics';
const SOCKET_ORIG = process.env.SOCKET_ORIGIN?.split(',') || '*'; // comma-separated origins

/* ------------------------------------------------------------------ */
/* 2. APP & WEBSOCKET SET-UP                                          */
/* ------------------------------------------------------------------ */

const app    = express();
const server = http.createServer(app);
const io     = new SocketIO(server, {
  cors: { origin: SOCKET_ORIG, methods: ['GET', 'POST'] },
});

app.use(helmet());
app.use(cors({ origin: SOCKET_ORIG }));
app.use(express.json());
app.use(express.static('public'));

/* ------------------------------------------------------------------ */
/* 3. DATABASE                                                        */
/* ------------------------------------------------------------------ */

(async () => {
  try {
    await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('🗄️  MongoDB connected');
  } catch (err) {
    console.error('❌ Could not connect to MongoDB:', err.message);
    process.exit(1);
  }
})();

const sensorSchema = new mongoose.Schema({
  temperature: { type: Number, required: true },
  ph:          { type: Number, required: true },
  ec:          { type: Number, required: true },
  waterLevel:  { type: Number, required: true },
  timestamp:   { type: Date,   default: Date.now },
});
const Sensor = mongoose.model('Sensor', sensorSchema);

/* ------------------------------------------------------------------ */
/* 4. HELPERS                                                         */
/* ------------------------------------------------------------------ */

// quick JOI schema to validate incoming sensor posts
const sensorPayload = Joi.object({
  temperature: Joi.number().required(),
  ph:          Joi.number().required(),
  ec:          Joi.number().required(),
  waterLevel:  Joi.number().integer().min(0).max(100).required(),
  timestamp:   Joi.date().optional(),
});

// broadcast helper (avoids arrow-function rebinding in many places)
const broadcastSensor = data => io.emit('sensorUpdate', data);

/* ------------------------------------------------------------------ */
/* 5. ROUTES                                                          */
/* ------------------------------------------------------------------ */

app.get('/api/sensors/latest', async (_req, res) => {
  try {
    const latest = await Sensor.findOne().sort({ timestamp: -1 }).lean();
    res.json(latest ?? {
      temperature: 24.5, ph: 6.2, ec: 1.8, waterLevel: 85, timestamp: new Date(),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/sensors/history', async (req, res) => {
  const hours = Number(req.query.hours) || 24;
  try {
    const from  = new Date(Date.now() - hours * 3600_000);
    const data  = await Sensor.find({ timestamp: { $gte: from } }).sort({ timestamp: 1 }).lean();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/sensors', async (req, res) => {
  const { error, value } = sensorPayload.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });

  try {
    const saved = await new Sensor(value).save();
    broadcastSensor(saved);
    res.status(201).json(saved);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/controls/:action', (req, res) => {
  const { action } = req.params;
  const { value }   = req.body;

  // ↘️  Here you might integrate actual ESP32 comms instead of a console log
  console.log(`📟 Control: ${action} → ${value}`);

  io.emit('controlUpdate', { action, value, timestamp: new Date() });
  res.json({ success: true, action, value });
});

/* ------------------------------------------------------------------ */
/* 6. SOCKET.IO HANDLERS                                              */
/* ------------------------------------------------------------------ */

io.on('connection', async socket => {
  console.log('🔌 Client connected', socket.id);

  // push the most recent reading immediately
  const latest = await Sensor.findOne().sort({ timestamp: -1 }).lean();
  if (latest) socket.emit('sensorUpdate', latest);

  socket.on('disconnect', () => console.log('❎ Client disconnected', socket.id));
});

/* ------------------------------------------------------------------ */
/* 7. DEVELOPMENT: MOCK DATA (remove for prod)                        */
/* ------------------------------------------------------------------ */

if (process.env.NODE_ENV !== 'production') {
  console.log('⚠️  Mock sensor data enabled (dev only)');
  setInterval(async () => {
    const mock = {
      temperature: 24.5 + (Math.random() * 2 - 1),
      ph:          6.2  + (Math.random() * 0.4 - 0.2),
      ec:          1.8  + (Math.random() * 0.4 - 0.2),
      waterLevel:  Math.max(15, Math.min(100, 85 + (Math.random() * 10 - 5))),
    };
    try {
      const saved = await new Sensor(mock).save();
      broadcastSensor(saved);
    } catch (err) {
      console.error('💾 Mock data error:', err.message);
    }
  }, 5_000);
}

/* ------------------------------------------------------------------ */
/* 8. START SERVER                                                    */
/* ------------------------------------------------------------------ */

server.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
