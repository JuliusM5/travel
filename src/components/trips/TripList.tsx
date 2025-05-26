import React from 'react';
import { Trip } from '../../store/types';
import { TripCard } from './TripCard';

interface TripListProps {
  trips: Trip[];
  onSelectTrip: (trip: Trip) => void;
  onEditTrip: (trip: Trip) => void;
  onDeleteTrip: (id: string) => void;
}

export const TripList: React.FC<TripListProps> = ({ 
  trips, 
  onSelectTrip, 
  onEditTrip, 
  onDeleteTrip 
}) => {
  if (trips.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {trips.map(trip => (
        <TripCard
          key={trip.id}
          trip={trip}
          onClick={() => onSelectTrip(trip)}
          onEdit={onEditTrip}
          onDelete={onDeleteTrip}
        />
      ))}
    </div>
  );
};