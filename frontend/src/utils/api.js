const API_BASE = 'http://localhost:3001/api';

export const fetchLatestSensorData = async () => {
  const response = await fetch(`${API_BASE}/sensors/latest`);
  return response.json();
};

export const fetchSensorHistory = async (hours = 24) => {
  const response = await fetch(`${API_BASE}/sensors/history?hours=${hours}`);
  return response.json();
};

export const sendControlCommand = async (action, value) => {
  const response = await fetch(`${API_BASE}/controls/${action}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ value })
  });
  return response.json();
};
