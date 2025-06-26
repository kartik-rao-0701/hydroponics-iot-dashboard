import React from 'react';

const SensorCard = ({ title, value, unit, icon, color, optimal }) => (
  <div className="bg-white rounded-lg shadow-md p-6">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-600">{title}</p>
        <p className={`text-2xl font-bold ${color}`}>
          {value}{unit}
        </p>
        <p className="text-xs text-gray-500">Optimal: {optimal}</p>
      </div>
      <div className={`text-3xl ${color}`}>{icon}</div>
    </div>
  </div>
);

export default SensorCard;
