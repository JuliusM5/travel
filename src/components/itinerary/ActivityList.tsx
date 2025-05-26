import React from 'react';
import { MapPin, X } from 'lucide-react';
import { Activity } from '../../store/types';
import { formatCurrency } from '../../utils/formatters';

interface ActivityListProps {
  activities: Activity[];
  onEdit: (activity: Activity) => void;
  onDelete: (id: string) => void;
}

export const ActivityList: React.FC<ActivityListProps> = ({ activities, onEdit, onDelete }) => {
  if (activities.length === 0) return null;

  return (
    <div className="space-y-4">
      {activities.map((activity) => (
        <div 
          key={activity.id} 
          className="bg-gray-50 p-4 rounded-lg hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => onEdit(activity)}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <span className="bg-indigo-100 text-indigo-700 px-2 py-1 rounded text-sm font-semibold">
                  {activity.time}
                </span>
                <h3 className="font-semibold text-gray-900">{activity.title}</h3>
              </div>
              {activity.location && (
                <p className="text-sm text-gray-600 flex items-center gap-1 mb-1">
                  <MapPin className="w-4 h-4" />
                  {activity.location}
                </p>
              )}
              {activity.notes && (
                <p className="text-sm text-gray-600 mt-2">{activity.notes}</p>
              )}
            </div>
            <div className="flex items-center gap-2 ml-4">
              <span className="font-semibold text-gray-900">
                {formatCurrency(activity.cost)}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(activity.id);
                }}
                className="text-red-600 hover:text-red-700 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};