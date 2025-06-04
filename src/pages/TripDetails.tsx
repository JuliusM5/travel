import React, { useState } from 'react';
import { Calendar, MapPin, DollarSign, Share2, Plus, Clock, TrendingDown, Download, FileText, ExternalLink } from 'lucide-react';
import { Trip, Activity } from '../store/types';
import { formatDate, formatCurrency } from '../utils/formatters';
import { getDaysBetween, generateId } from '../utils/helpers';
import { ActivityForm } from '../components/itinerary/ActivityForm';
import { ActivityList } from '../components/itinerary/ActivityList';
import { DaySelector } from '../components/itinerary/DaySelector';
import { exportService } from '../services/exportService';

interface TripDetailsProps {
  trip: Trip;
  onBack: () => void;
  onUpdateTrip: (trip: Trip) => void;
}

export const TripDetails: React.FC<TripDetailsProps> = ({ trip, onBack, onUpdateTrip }) => {
  const [showActivityForm, setShowActivityForm] = useState(false);
  const [selectedDay, setSelectedDay] = useState(1);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [showExportMenu, setShowExportMenu] = useState(false);

  const days = getDaysBetween(trip.startDate, trip.endDate);
  const dayNumbers = Array.from({ length: days }, (_, i) => i + 1);

  const handleAddActivity = (activityData: any) => {
    const newActivity: Activity = {
      ...activityData,
      id: generateId(),
      day: selectedDay
    };
    
    const updatedTrip = {
      ...trip,
      activities: [...trip.activities, newActivity],
      spent: trip.spent + activityData.cost
    };
    
    onUpdateTrip(updatedTrip);
    setShowActivityForm(false);
    setEditingActivity(null);
  };

  const handleUpdateActivity = (activityData: any) => {
    if (editingActivity) {
      const costDifference = activityData.cost - editingActivity.cost;
      const updatedTrip = {
        ...trip,
        activities: trip.activities.map(a => 
          a.id === editingActivity.id ? { ...editingActivity, ...activityData } : a
        ),
        spent: trip.spent + costDifference
      };
      onUpdateTrip(updatedTrip);
      setShowActivityForm(false);
      setEditingActivity(null);
    }
  };

  const handleDeleteActivity = (activityId: string) => {
    const activity = trip.activities.find(a => a.id === activityId);
    if (activity) {
      const updatedTrip = {
        ...trip,
        activities: trip.activities.filter(a => a.id !== activityId),
        spent: trip.spent - activity.cost
      };
      onUpdateTrip(updatedTrip);
    }
  };

  const handleExportCalendar = () => {
    exportService.downloadICalendar(trip);
    setShowExportMenu(false);
  };

  const handleExportGoogle = () => {
    const url = exportService.generateGoogleCalendarUrl(trip);
    window.open(url, '_blank');
    setShowExportMenu(false);
  };

  const handleExportPDF = () => {
    exportService.downloadPDF(trip);
    setShowExportMenu(false);
  };

  const handleShare = async () => {
    const shared = await exportService.shareTrip(trip);
    if (!shared) {
      // Fallback: copy link to clipboard
      navigator.clipboard.writeText(window.location.href);
      alert('Trip link copied to clipboard!');
    }
  };

  const activitiesForDay = trip.activities
    .filter(a => a.day === selectedDay)
    .sort((a, b) => a.time.localeCompare(b.time));

  return (
    <div className="max-w-4xl mx-auto">
      <button
        onClick={onBack}
        className="mb-6 text-indigo-600 hover:text-indigo-700 font-semibold flex items-center gap-2"
      >
        ← Back to Trips
      </button>
      
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="relative h-64 bg-gradient-to-br from-indigo-500 to-purple-600">
          <div className="absolute inset-0 bg-black/30" />
          <div className="absolute bottom-6 left-6 text-white">
            <h1 className="text-4xl font-bold mb-2">{trip.name}</h1>
            <p className="flex items-center gap-2 text-lg">
              <MapPin className="w-5 h-5" />
              {trip.destination}
            </p>
            <p className="flex items-center gap-2 mt-2">
              <Calendar className="w-5 h-5" />
              {formatDate(trip.startDate)} - {formatDate(trip.endDate)}
            </p>
          </div>
          <div className="absolute top-6 right-6 flex gap-2">
            <button 
              onClick={handleShare}
              className="bg-white/20 backdrop-blur-sm text-white p-3 rounded-lg hover:bg-white/30 transition-colors"
            >
              <Share2 className="w-5 h-5" />
            </button>
            <div className="relative">
              <button 
                onClick={() => setShowExportMenu(!showExportMenu)}
                className="bg-white/20 backdrop-blur-sm text-white p-3 rounded-lg hover:bg-white/30 transition-colors"
              >
                <Download className="w-5 h-5" />
              </button>
              
              {showExportMenu && (
                <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-10">
                  <button
                    onClick={handleExportCalendar}
                    className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-2"
                  >
                    <Calendar className="w-4 h-4 text-gray-600" />
                    Export to Calendar
                  </button>
                  <button
                    onClick={handleExportGoogle}
                    className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-2"
                  >
                    <ExternalLink className="w-4 h-4 text-gray-600" />
                    Add to Google Calendar
                  </button>
                  <button
                    onClick={handleExportPDF}
                    className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-2"
                  >
                    <FileText className="w-4 h-4 text-gray-600" />
                    Download PDF
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-600">Budget</span>
                <DollarSign className="w-5 h-5 text-gray-400" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(trip.budget)}</p>
              <p className="text-sm text-gray-600 mt-1">
                {formatCurrency(trip.budget - trip.spent)} remaining
              </p>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-600">Spent</span>
                <TrendingDown className="w-5 h-5 text-gray-400" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(trip.spent)}</p>
              <p className="text-sm text-gray-600 mt-1">
                {((trip.spent / trip.budget) * 100).toFixed(0)}% of budget
              </p>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-600">Activities</span>
                <Clock className="w-5 h-5 text-gray-400" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{trip.activities.length}</p>
              <p className="text-sm text-gray-600 mt-1">
                Across {days} days
              </p>
            </div>
          </div>
          
          <div className="mb-6">
            <h2 className="text-xl font-bold mb-4">Itinerary</h2>
            
            <DaySelector
              days={dayNumbers}
              selectedDay={selectedDay}
              onSelectDay={setSelectedDay}
            />
            
            <div className="space-y-4">
              {activitiesForDay.length === 0 && !showActivityForm && (
                <div className="text-center py-12 text-gray-500">
                  <Clock className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>No activities planned for this day</p>
                </div>
              )}
              
              <ActivityList
                activities={activitiesForDay}
                onEdit={(activity) => {
                  setEditingActivity(activity);
                  setShowActivityForm(true);
                }}
                onDelete={handleDeleteActivity}
              />
              
              {showActivityForm && (
                <ActivityForm
                  activity={editingActivity}
                  onSave={editingActivity ? handleUpdateActivity : handleAddActivity}
                  onCancel={() => {
                    setShowActivityForm(false);
                    setEditingActivity(null);
                  }}
                />
              )}
              
              {!showActivityForm && (
                <button
                  onClick={() => setShowActivityForm(true)}
                  className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-indigo-400 hover:text-indigo-600 transition-colors flex items-center justify-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  Add Activity
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};