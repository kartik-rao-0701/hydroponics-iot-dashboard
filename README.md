# Hydroponics IoT Dashboard

Complete full-stack IoT solution for hydroponic system monitoring and control.

![image](https://github.com/user-attachments/assets/048da445-1c5a-4fd6-8737-fa1bc99e714d)

## Features
- Real-time sensor monitoring
- Remote system control
- Historical data visualization
- ESP32 S3 integration
- WebSocket communication

![image](https://github.com/user-attachments/assets/2c3988d6-abd4-416b-8930-eb263e5189f8)

## Quick Start
1. `cd backend && npm install && npm start`
2. `cd frontend && npm install && npm start`
3. Upload ESP32 code with your WiFi credentials

## 🗂️ Project Structure

<div style="background:#0d1117; padding:16px; border-radius:8px; color:#ffffff; font-family:monospace;">

<pre>
hydroponics-iot-dashboard/
├── frontend/
│   ├── public/
│   │   ├── index.html
│   │   └── favicon.ico
│   ├── src/
│   │   ├── components/
│   │   │   ├── Dashboard.jsx
│   │   │   ├── SensorCard.jsx
│   │   │   ├── Charts.jsx
│   │   │   └── Controls.jsx
│   │   ├── hooks/
│   │   │   └── useWebSocket.js
│   │   ├── utils/
│   │   │   └── api.js
│   │   ├── App.jsx
│   │   ├── index.js
│   │   └── index.css
│   ├── package.json
│   └── tailwind.config.js
├── backend/
│   ├── routes/
│   │   ├── sensors.js
│   │   └── controls.js
│   ├── models/
│   │   └── SensorData.js
│   ├── middleware/
│   │   └── auth.js
│   ├── server.js
│   ├── websocket.js
│   └── package.json
├── esp32/
│   ├── hydroponics_controller.ino
│   ├── sensors.h
│   ├── wifi_manager.h
│   └── config.h
├── docker-compose.yml
└── README.md
</pre>

</div>



## Tech Stack
- Frontend: React, Tailwind CSS, Recharts
- Backend: Node.js, Express, Socket.io, MongoDB
- Hardware: ESP32 S3, Sensors (pH, EC, Temperature, Water Level)
