import React from 'react';
import { Calendar, MapPin, Users, Edit2, Trash2 } from 'lucide-react';
import { Trip } from '../../store/types';
import { formatDate, formatCurrency } from '../../utils/formatters';
import { getDaysUntilTrip } from '../../utils/helpers';

interface TripCardProps {
  trip: Trip;
  onClick: () => void;
  onEdit: (trip: Trip) => void;
  onDelete: (id: string) => void;
}

export const TripCard: React.FC<TripCardProps> = ({ trip, onClick, onEdit, onDelete }) => {
  const progress = (trip.spent / trip.budget) * 100;
  const daysUntil = getDaysUntilTrip(trip.startDate);

  return (
    <div 
      className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all cursor-pointer overflow-hidden group"
      onClick={onClick}
    >
      <div className="relative h-48 bg-gradient-to-br from-indigo-400 to-purple-500">
        <div className="absolute inset-0 bg-black/20" />
        <div className="absolute bottom-4 left-4 text-white">
          <h3 className="text-2xl font-bold">{trip.name}</h3>
          <p className="flex items-center gap-1 text-sm">
            <MapPin className="w-4 h-4" />
            {trip.destination}
          </p>
        </div>
        <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(trip);
            }}
            className="p-2 bg-white/90 rounded-lg hover:bg-white transition-colors"
          >
            <Edit2 className="w-4 h-4 text-gray-700" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(trip.id);
            }}
            className="p-2 bg-white/90 rounded-lg hover:bg-white transition-colors"
          >
            <Trash2 className="w-4 h-4 text-red-600" />
          </button>
        </div>
      </div>
      
      <div className="p-4">
        <div className="flex justify-between text-sm text-gray-600 mb-3">
          <span className="flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            {formatDate(trip.startDate)} - {formatDate(trip.endDate)}
          </span>
          {daysUntil > 0 && (
            <span className="text-indigo-600 font-semibold">
              {daysUntil} days to go!
            </span>
          )}
        </div>
        
        <div className="space-y-3">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-600">Budget</span>
              <span className="font-semibold">{formatCurrency(trip.spent)} / {formatCurrency(trip.budget)}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all ${
                  progress > 90 ? 'bg-red-500' : progress > 70 ? 'bg-yellow-500' : 'bg-green-500'
                }`}
                style={{ width: `${Math.min(progress, 100)}%` }}
              />
            </div>
          </div>
          
          {trip.collaborators.length > 0 && (
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-gray-600" />
              <div className="flex -space-x-2">
                {trip.collaborators.slice(0, 3).map((collab: string, i: number) => (
                  <div
                    key={i}
                    className="w-8 h-8 rounded-full bg-indigo-500 text-white flex items-center justify-center text-xs font-semibold border-2 border-white"
                  >
                    {collab[0].toUpperCase()}
                  </div>
                ))}
                {trip.collaborators.length > 3 && (
                  <div className="w-8 h-8 rounded-full bg-gray-300 text-gray-700 flex items-center justify-center text-xs font-semibold border-2 border-white">
                    +{trip.collaborators.length - 3}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};