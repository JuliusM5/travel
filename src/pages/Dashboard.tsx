import React, { useState } from 'react';
import { Plus, Search, MapPin } from 'lucide-react';
import { Trip } from '../store/types';
import { TripList } from '../components/trips/TripList';
import { TripForm } from '../components/trips/TripForm';
import { generateId } from '../utils/helpers';

interface DashboardProps {
  trips: Trip[];
  setTrips: (trips: Trip[]) => void;
  onSelectTrip: (trip: Trip) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ trips, setTrips, onSelectTrip }) => {
  const [showTripForm, setShowTripForm] = useState(false);
  const [editingTrip, setEditingTrip] = useState<Trip | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const handleCreateTrip = (tripData: any) => {
    const newTrip: Trip = {
      id: generateId(),
      ...tripData,
      spent: 0,
      activities: []
    };
    setTrips([...trips, newTrip]);
    setShowTripForm(false);
    setEditingTrip(null);
  };

  const handleUpdateTrip = (tripData: any) => {
    if (editingTrip) {
      const updatedTrip = { ...editingTrip, ...tripData };
      setTrips(trips.map(t => t.id === editingTrip.id ? updatedTrip : t));
      setEditingTrip(null);
      setShowTripForm(false);
    }
  };

  const handleDeleteTrip = (tripId: string) => {
    if (window.confirm('Are you sure you want to delete this trip?')) {
      setTrips(trips.filter(t => t.id !== tripId));
    }
  };

  const filteredTrips = trips.filter(trip => 
    trip.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    trip.destination.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const upcomingTrips = filteredTrips.filter(trip => 
    new Date(trip.startDate) > new Date()
  ).sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());

  const pastTrips = filteredTrips.filter(trip => 
    new Date(trip.endDate) < new Date()
  ).sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">My Trips</h1>
        <div className="flex gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search trips..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
          <button
            onClick={() => setShowTripForm(true)}
            className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors font-semibold flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            New Trip
          </button>
        </div>
      </div>
      
      {showTripForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="max-w-md w-full">
            <TripForm
              trip={editingTrip}
              onSave={editingTrip ? handleUpdateTrip : handleCreateTrip}
              onCancel={() => {
                setShowTripForm(false);
                setEditingTrip(null);
              }}
            />
          </div>
        </div>
      )}
      
      {trips.length === 0 ? (
        <div className="text-center py-16">
          <MapPin className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h2 className="text-2xl font-semibold text-gray-600 mb-2">No trips planned yet</h2>
          <p className="text-gray-500 mb-6">Start planning your next adventure!</p>
          <button
            onClick={() => setShowTripForm(true)}
            className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors font-semibold"
          >
            Create Your First Trip
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          {upcomingTrips.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Upcoming Adventures</h2>
              <TripList
                trips={upcomingTrips}
                onSelectTrip={onSelectTrip}
                onEditTrip={(trip) => {
                  setEditingTrip(trip);
                  setShowTripForm(true);
                }}
                onDeleteTrip={handleDeleteTrip}
              />
            </div>
          )}
          
          {pastTrips.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Past Trips</h2>
              <TripList
                trips={pastTrips}
                onSelectTrip={onSelectTrip}
                onEditTrip={(trip) => {
                  setEditingTrip(trip);
                  setShowTripForm(true);
                }}
                onDeleteTrip={handleDeleteTrip}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};