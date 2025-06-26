import React from 'react';

const Controls = ({ controls, onControlChange }) => (
  <div className="bg-white rounded-lg shadow-md p-6">
    <h3 className="text-lg font-semibold mb-4">System Controls</h3>
    
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-medium">Water Pump</h4>
          <p className="text-sm text-gray-600">Circulation system</p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input type="checkbox" checked={controls.pump} 
                 onChange={(e) => onControlChange('pump', e.target.checked)} 
                 className="sr-only peer" />
          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
        </label>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-medium">Grow Lights</h4>
          <p className="text-sm text-gray-600">LED lighting system</p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input type="checkbox" checked={controls.lights} 
                 onChange={(e) => onControlChange('lights', e.target.checked)} 
                 className="sr-only peer" />
          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
        </label>
      </div>

      <button onClick={() => onControlChange('dose', true)}
              className="w-full bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded">
        Add Nutrients
      </button>
    </div>
  </div>
);

export default Controls;
