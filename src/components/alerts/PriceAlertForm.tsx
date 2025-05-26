import React, { useState } from 'react';

interface PriceAlertFormProps {
  onSave: (alertData: any) => void;
  onCancel: () => void;
}

export const PriceAlertForm: React.FC<PriceAlertFormProps> = ({ onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    origin: '',
    destination: '',
    targetPrice: 300
  });

  const handleSubmit = () => {
    if (!formData.origin || !formData.destination) {
      alert('Please enter both origin and destination');
      return;
    }
    onSave(formData);
  };

  return (
    <div className="space-y-4 p-6 bg-white rounded-lg shadow-lg">
      <h3 className="text-xl font-bold mb-4">Create Price Alert</h3>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Origin *</label>
          <input
            type="text"
            value={formData.origin}
            onChange={(e) => setFormData({ ...formData, origin: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            placeholder="NYC"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Destination *</label>
          <input
            type="text"
            value={formData.destination}
            onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            placeholder="LAX"
          />
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Target Price (USD)</label>
        <input
          type="number"
          min="0"
          value={formData.targetPrice}
          onChange={(e) => setFormData({ ...formData, targetPrice: parseInt(e.target.value) || 0 })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
        />
      </div>
      
      <div className="flex gap-3 pt-4">
        <button
          onClick={handleSubmit}
          className="flex-1 bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition-colors font-semibold"
        >
          Create Alert
        </button>
        <button
          onClick={onCancel}
          className="flex-1 bg-gray-200 text-gray-800 py-2 rounded-lg hover:bg-gray-300 transition-colors font-semibold"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};