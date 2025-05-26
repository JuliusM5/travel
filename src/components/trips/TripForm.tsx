import React, { useState } from 'react';
import { Trip } from '../../store/types';

interface TripFormProps {
  trip?: Trip | null;  // Allow null here
  onSave: (tripData: any) => void;
  onCancel: () => void;
}

export const TripForm: React.FC<TripFormProps> = ({ trip, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    name: trip?.name || '',
    destination: trip?.destination || '',
    startDate: trip?.startDate || '',
    endDate: trip?.endDate || '',
    budget: trip?.budget || 1000,
    collaborators: trip?.collaborators?.join(', ') || ''
  });

  const handleSubmit = () => {
    if (!formData.name || !formData.destination || !formData.startDate || !formData.endDate) {
      alert('Please fill in all required fields');
      return;
    }
    onSave({
      ...formData,
      collaborators: formData.collaborators.split(',').map(c => c.trim()).filter(Boolean)
    });
  };

  return (
    <div className="space-y-4 p-6 bg-white rounded-lg shadow-lg">
      <h3 className="text-xl font-bold mb-4">{trip ? 'Edit Trip' : 'Create New Trip'}</h3>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Trip Name *</label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          placeholder="Summer in Paris"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Destination *</label>
        <input
          type="text"
          value={formData.destination}
          onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          placeholder="Paris, France"
        />
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Start Date *</label>
          <input
            type="date"
            value={formData.startDate}
            onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">End Date *</label>
          <input
            type="date"
            value={formData.endDate}
            onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
            min={formData.startDate}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Budget (USD)</label>
        <input
          type="number"
          min="0"
          value={formData.budget}
          onChange={(e) => setFormData({ ...formData, budget: parseInt(e.target.value) || 0 })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Collaborators (comma separated emails)</label>
        <input
          type="text"
          value={formData.collaborators}
          onChange={(e) => setFormData({ ...formData, collaborators: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          placeholder="friend@email.com, partner@email.com"
        />
      </div>
      
      <div className="flex gap-3 pt-4">
        <button
          onClick={handleSubmit}
          className="flex-1 bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition-colors font-semibold"
        >
          {trip ? 'Update Trip' : 'Create Trip'}
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