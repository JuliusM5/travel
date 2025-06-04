import React, { useState, useEffect } from 'react';
import { Bell, AlertCircle, Loader, TrendingDown, BarChart3 } from 'lucide-react';
import { PriceAlert, User } from '../store/types';
import { PriceAlertCard } from '../components/alerts/PriceAlertCard';
import { PriceAlertForm } from '../components/alerts/PriceAlertForm';
import { PriceHistoryChart } from '../components/charts/PriceHistoryChart';
import { generateId } from '../utils/helpers';
import { flightAPI } from '../services/api/flightApi';
import { priceMonitor, PriceCheckResult } from '../services/priceMonitor';
import { priceHistoryService } from '../services/priceHistoryService';
import { achievementService, Achievement } from '../services/achievementService';
import { notificationService } from '../services/notificationService';

interface AlertsProps {
  alerts: PriceAlert[];
  setAlerts: (alerts: PriceAlert[]) => void;
  user: User;
  setUser: (user: User) => void;
  onAchievement?: (achievement: Achievement) => void;
}

export const Alerts: React.FC<AlertsProps> = ({ alerts, setAlerts, user, setUser, onAchievement }) => {
  const [showAlertForm, setShowAlertForm] = useState(false);
  const [isCheckingPrices, setIsCheckingPrices] = useState(false);
  const [lastBatchCheck, setLastBatchCheck] = useState<Date | null>(null);
  const [showPriceHistory, setShowPriceHistory] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState<{origin: string, destination: string} | null>(null);

  // Track alert stats for achievements
  useEffect(() => {
    const stats = achievementService.getStats();
    const priceDropsCaught = alerts.filter(a => a.triggered).length;
    
    if (stats.alertsCreated !== alerts.length || stats.priceDropsCaught !== priceDropsCaught) {
      achievementService.updateStats({ 
        alertsCreated: alerts.length,
        priceDropsCaught: priceDropsCaught
      });
      
      // Check for newly unlocked achievements
      const achievements = achievementService.getAchievements();
      const newlyUnlocked = achievements.filter(a => 
        a.unlocked && 
        a.unlockedAt && 
        new Date(a.unlockedAt).getTime() > Date.now() - 1000
      );
      
      newlyUnlocked.forEach(achievement => {
        if (onAchievement) {
          onAchievement(achievement);
        }
      });
    }
  }, [alerts, onAchievement]);

  // Start price monitoring when component mounts
  useEffect(() => {
    const handlePriceUpdates = (results: PriceCheckResult[]) => {
      const updatedAlerts = alerts.map(alert => {
        const result = results.find(r => r.alertId === alert.id);
        if (result) {
          const wasTriggered = alert.triggered;
          const newAlert = {
            ...alert,
            currentPrice: result.newPrice,
            lastChecked: new Date(),
            triggered: result.triggered
          };
          
          // Show notification for newly triggered alerts
          if (!wasTriggered && result.triggered) {
            showPriceDropNotification(alert);
            
            // Track savings for achievements
            const saved = alert.targetPrice - result.newPrice;
            if (saved > 0) {
              const stats = achievementService.getStats();
              achievementService.updateStats({ 
                totalSaved: stats.totalSaved + saved,
                perfectDeals: stats.perfectDeals + 1
              });
              
              // Check for 50%+ discount achievement
              const discountPercent = (saved / alert.targetPrice) * 100;
              if (discountPercent >= 50) {
                const achievement = achievementService.unlockSpecial('perfect_timing');
                if (achievement && onAchievement) {
                  onAchievement(achievement);
                }
              }
            }
          }
          
          // Track price history
          priceHistoryService.addPricePoint(alert.origin, alert.destination, result.newPrice);
          
          return newAlert;
        }
        return alert;
      });
      setAlerts(updatedAlerts);
      setLastBatchCheck(new Date());
    };

    // Start monitoring with current alerts
    priceMonitor.startMonitoring(
      () => alerts,
      handlePriceUpdates
    );

    return () => {
      priceMonitor.stopMonitoring();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [alerts.length]); // Re-start monitoring when alerts are added/removed

  const showPriceDropNotification = (priceAlert: PriceAlert) => {
    // In a real app, use push notifications
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('TravelMate Price Drop! ✈️', {
        body: `${priceAlert.origin} → ${priceAlert.destination} is now ${priceAlert.currentPrice}!`,
        icon: '/favicon.ico'
      });
    } else {
      window.alert(`🎉 Price Drop! ${priceAlert.origin} → ${priceAlert.destination} is now ${priceAlert.currentPrice}!`);
    }
  };

  const handleCreateAlert = async (alertData: any) => {
    if (!user.isSubscriber && user.alertCount >= 3) {
      window.alert('You have reached the free tier limit of 3 alerts. Upgrade to Pro for unlimited alerts!');
      return;
    }

    setIsCheckingPrices(true);
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
        showPriceDropNotification(newAlert);
      }
      
      // Track initial price
      priceHistoryService.addPricePoint(alertData.origin, alertData.destination, currentPrice);
    } catch (error) {
      window.alert('Failed to check prices. Please try again.');
    } finally {
      setIsCheckingPrices(false);
    }
  };

  const handleCheckAlert = async (alertId: string) => {
    const result = await priceMonitor.checkSingleAlert(
      alerts.find(a => a.id === alertId)!
    );
    
    setAlerts(alerts.map(a => {
      if (a.id === alertId) {
        const wasTriggered = a.triggered;
        const newAlert = {
          ...a,
          currentPrice: result.newPrice,
          lastChecked: new Date(),
          triggered: result.triggered
        };
        
        if (!wasTriggered && result.triggered) {
          showPriceDropNotification(a);
        }
        
        return newAlert;
      }
      return a;
    }));
    
    // Track price in history
    if (result.newPrice !== result.oldPrice) {
      const alert = alerts.find(a => a.id === alertId)!;
      priceHistoryService.addPricePoint(alert.origin, alert.destination, result.newPrice);
    };
  };

  const handleDeleteAlert = (alertId: string) => {
    setAlerts(alerts.filter(a => a.id !== alertId));
    setUser({ ...user, alertCount: Math.max(0, user.alertCount - 1) });
  };

  const handleCheckAllPrices = async () => {
    setIsCheckingPrices(true);
    await priceMonitor.checkAllPrices(
      () => alerts,
      (results) => {
        setAlerts(alerts.map(alert => {
          const result = results.find(r => r.alertId === alert.id);
          if (result) {
            return {
              ...alert,
              currentPrice: result.newPrice,
              lastChecked: new Date(),
              triggered: result.triggered
            };
          }
          return alert;
        }));
        
        // Track all price changes
        results.forEach(result => {
          const alert = alerts.find(a => a.id === result.alertId);
          if (alert && result.newPrice !== result.oldPrice) {
            priceHistoryService.addPricePoint(alert.origin, alert.destination, result.newPrice);
          }
        });
      }
    );
    setIsCheckingPrices(false);
  };

  // Request notification permission
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
    
    // Initialize notifications if not already done
    notificationService.initialize();
  }, []);

  const handleShowHistory = (origin: string, destination: string) => {
    setSelectedRoute({ origin, destination });
    setShowPriceHistory(true);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Price Alerts</h1>
          <p className="text-gray-600 mt-1">
            {user.isSubscriber ? 'Unlimited alerts' : `${3 - user.alertCount} alerts remaining`}
          </p>
          {lastBatchCheck && (
            <p className="text-sm text-gray-500 mt-1">
              Last checked: {lastBatchCheck.toLocaleTimeString()}
            </p>
          )}
        </div>
        <div className="flex gap-3">
          {alerts.length > 0 && (
            <button
              onClick={handleCheckAllPrices}
              disabled={isCheckingPrices}
              className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors font-semibold flex items-center gap-2 disabled:opacity-50"
            >
              {isCheckingPrices ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  Checking...
                </>
              ) : (
                <>
                  <TrendingDown className="w-5 h-5" />
                  Check All Now
                </>
              )}
            </button>
          )}
          <button
            onClick={() => setShowAlertForm(true)}
            className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors font-semibold flex items-center gap-2"
          >
            <Bell className="w-5 h-5" />
            New Alert
          </button>
        </div>
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
      
      {showPriceHistory && selectedRoute && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="max-w-2xl w-full bg-white rounded-lg shadow-xl p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Price History</h2>
              <button
                onClick={() => {
                  setShowPriceHistory(false);
                  setSelectedRoute(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            <PriceHistoryChart
              history={priceHistoryService.getRouteHistory(selectedRoute.origin, selectedRoute.destination)}
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
            Upgrade to $6.99/mo
          </button>
        </div>
      )}

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-center gap-2 mb-2">
          <Bell className="w-5 h-5 text-blue-600" />
          <span className="font-semibold text-gray-900">How Price Alerts Work</span>
        </div>
        <p className="text-sm text-gray-700">
          We check flight prices every hour for all your alerts. When prices drop below your target, 
          we'll notify you immediately. All users get fair, hourly price checks regardless of subscription level.
        </p>
      </div>
      
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
              onShowHistory={handleShowHistory}
            />
          ))}
        </div>
      )}
    </div>
  );
};