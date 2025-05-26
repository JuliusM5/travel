import React from 'react';

interface DaySelectorProps {
  days: number[];
  selectedDay: number;
  onSelectDay: (day: number) => void;
}

export const DaySelector: React.FC<DaySelectorProps> = ({ days, selectedDay, onSelectDay }) => {
  return (
    <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
      {days.map(day => (
        <button
          key={day}
          onClick={() => onSelectDay(day)}
          className={`px-4 py-2 rounded-lg font-semibold whitespace-nowrap transition-all ${
            selectedDay === day
              ? 'bg-indigo-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Day {day}
        </button>
      ))}
    </div>
  );
};