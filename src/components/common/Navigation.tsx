import React, { useState } from 'react';
import { MapPin, Bell, Settings, Menu, Plane } from 'lucide-react';
import { User } from '../../store/types';

interface NavigationProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  user: User;
}

export const Navigation: React.FC<NavigationProps> = ({ activeTab, setActiveTab, user }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const tabs = [
    { id: 'dashboard', label: 'My Trips', icon: MapPin },
    { id: 'alerts', label: 'Price Alerts', icon: Bell },
    { id: 'profile', label: 'Profile', icon: Settings }
  ];

  return (
    <nav className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-2">
            <Plane className="w-8 h-8" />
            <span className="text-xl font-bold">TravelMate</span>
          </div>
          
          <div className="hidden md:flex space-x-8">
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-md transition-all ${
                    activeTab === tab.id 
                      ? 'bg-white/20 text-white' 
                      : 'text-white/80 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center space-x-4">
            {!user.isSubscriber && (
              <button className="hidden md:block bg-yellow-400 text-gray-900 px-4 py-2 rounded-full text-sm font-semibold hover:bg-yellow-300 transition-colors">
                Upgrade to Pro
              </button>
            )}
            
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden"
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden pb-4">
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`flex items-center space-x-2 w-full px-3 py-2 rounded-md transition-all ${
                    activeTab === tab.id 
                      ? 'bg-white/20 text-white' 
                      : 'text-white/80 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
            {!user.isSubscriber && (
              <button className="mt-2 w-full bg-yellow-400 text-gray-900 px-4 py-2 rounded-full text-sm font-semibold hover:bg-yellow-300 transition-colors">
                Upgrade to Pro
              </button>
            )}
          </div>
        )}
      </div>
    </nav>
  );
};