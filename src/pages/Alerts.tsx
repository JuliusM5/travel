import React, { useState } from 'react';
import { Bell, AlertCircle } from 'lucide-react';
import { PriceAlert, User } from '../store/types';
import { PriceAlertCard } from '../components/alerts/PriceAlertCard';
import { PriceAlertForm } from '../components/alerts/PriceAlertForm';
import { generateId } from '../utils/helpers';
import { flightAPI } from '../services/api/flightApi';

interface AlertsProps {
  alerts: PriceAlert[];
  setAlerts: (alerts: PriceAlert[]) => void;
  user: User;
  setUser: (user: User) => void;
}

export const Alerts: React.FC<AlertsProps> = ({ alerts, setAlerts, user, setUser }) => {
  const [showAlertForm, setShowAlertForm] = useState(false);

  const handleCreateAlert = async (alertData: any) => {
    if (!user.isSubscriber && user.alertCount >= 3) {
      alert('You have reached the free tier limit of 3 alerts. Upgrade to Pro for unlimited alerts!');
      return;
    }

    try {
      const currentPrice = await flightAPI.checkPrices(alertData.origin, alertData.destination);
      
      const newAlert: PriceAlert = {
        id: generateId(),
        ...alertData,
        currentPrice,
        lastChecked: new Date(),
        triggered: currentPrice <= alertData.targetPrice
      };
      
      setAlerts([...alerts, newAlert]);
      setUser({ ...user, alertCount: user.alertCount + 1 });
      setShowAlertForm(false);
      
      if (newAlert.triggered) {
        alert(`Great news! Flights from ${newAlert.origin} to ${newAlert.destination} are now ${currentPrice} - below your target!`);
      }
    } catch (error) {
      alert('Failed to check prices. Please try again.');
    }
  };

  const handleCheckAlert = async (alertId: string) => {
    const priceAlert = alerts.find(a => a.id === alertId);
    if (!priceAlert) return;

    try {
      const currentPrice = await flightAPI.checkPrices(priceAlert.origin, priceAlert.destination);
      const updatedAlert = {
        ...priceAlert,
        currentPrice,
        lastChecked: new Date(),
        triggered: currentPrice <= priceAlert.targetPrice
      };
      
      setAlerts(alerts.map(a => a.id === alertId ? updatedAlert : a));
      
      if (updatedAlert.triggered && !priceAlert.triggered) {
        window.alert(`Price drop alert! Flights from ${priceAlert.origin} to ${priceAlert.destination} are now $${currentPrice}!`);
      }
    } catch (error) {
      window.alert('Failed to check prices. Please try again.');
    }
  };

  const handleDeleteAlert = (alertId: string) => {
    setAlerts(alerts.filter(a => a.id !== alertId));
    setUser({ ...user, alertCount: Math.max(0, user.alertCount - 1) });
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Price Alerts</h1>
          <p className="text-gray-600 mt-1">
            {user.isSubscriber ? 'Unlimited alerts' : `${3 - user.alertCount} alerts remaining`}
          </p>
        </div>
        <button
          onClick={() => setShowAlertForm(true)}
          className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors font-semibold flex items-center gap-2"
        >
          <Bell className="w-5 h-5" />
          New Alert
        </button>
      </div>
      
      {showAlertForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="max-w-md w-full">
            <PriceAlertForm
              onSave={handleCreateAlert}
              onCancel={() => setShowAlertForm(false)}
            />
          </div>
        </div>
      )}
      
      {!user.isSubscriber && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600" />
            <div>
              <p className="font-semibold text-gray-900">Limited to 3 alerts on free plan</p>
              <p className="text-sm text-gray-600">Upgrade to Pro for unlimited price tracking</p>
            </div>
          </div>
          <button 
            onClick={() => setUser({ ...user, isSubscriber: true })}
            className="bg-yellow-400 text-gray-900 px-4 py-2 rounded-lg hover:bg-yellow-300 transition-colors font-semibold"
          >
            Upgrade Now
          </button>
        </div>
      )}
      
      {alerts.length === 0 ? (
        <div className="text-center py-16">
          <Bell className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h2 className="text-2xl font-semibold text-gray-600 mb-2">No price alerts set</h2>
          <p className="text-gray-500 mb-6">Get notified when flight prices drop!</p>
          <button
            onClick={() => setShowAlertForm(true)}
            className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors font-semibold"
          >
            Create Price Alert
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {alerts.map(alert => (
            <PriceAlertCard
              key={alert.id}
              alert={alert}
              onCheck={handleCheckAlert}
              onDelete={handleDeleteAlert}
            />
          ))}
        </div>
      )}
    </div>
  );
};