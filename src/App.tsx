import React, { useState, useEffect } from 'react';
import { Navigation } from './components/common/Navigation';
import { Layout } from './components/common/Layout';
import { Dashboard } from './pages/Dashboard';
import { TripDetails } from './pages/TripDetails';
import { Alerts } from './pages/Alerts';
import { Profile } from './pages/Profile';
import { Achievements } from './pages/Achievements';
import { AchievementNotification } from './components/achievements/AchievementNotification';
import { Trip, PriceAlert, User } from './store/types';
import { initialUser } from './store/useStore';
import { persistenceService } from './services/persistenceService';
import { cloudSyncService, SyncStatus } from './services/cloudSyncService';
import { achievementService, Achievement } from './services/achievementService';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [trips, setTrips] = useState<Trip[]>([]);
  const [alerts, setAlerts] = useState<PriceAlert[]>([]);
  const [user, setUser] = useState<User>(initialUser);
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    syncing: false,
    lastSync: null,
    error: null
  });
  const [unlockedAchievement, setUnlockedAchievement] = useState<Achievement | null>(null);

  // Load data from persistence on mount
  useEffect(() => {
    const loadPersistedData = () => {
      try {
        // Load user first
        const persistedUser = persistenceService.loadUser();
        if (persistedUser) {
          setUser(persistedUser);
        }

        // Load trips
        const persistedTrips = persistenceService.loadTrips();
        setTrips(persistedTrips);

        // Load alerts
        const persistedAlerts = persistenceService.loadAlerts();
        setAlerts(persistedAlerts);

        // Get last sync time
        const lastSync = persistenceService.getLastSync();
        setSyncStatus(prev => ({ ...prev, lastSync }));

      } catch (error) {
        console.error('Failed to load persisted data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadPersistedData();

    // Start auto-sync if available
    if (cloudSyncService.isAvailable()) {
      cloudSyncService.startAutoSync(setSyncStatus);
    }
    
    // Initialize achievements and check daily streak
    achievementService.initializeAchievements();
    achievementService.checkDailyStreak();
  }, []);

  // Persist trips whenever they change
  useEffect(() => {
    if (!isLoading) {
      persistenceService.saveTrips(trips);
    }
  }, [trips, isLoading]);

  // Persist alerts whenever they change
  useEffect(() => {
    if (!isLoading) {
      persistenceService.saveAlerts(alerts);
    }
  }, [alerts, isLoading]);

  // Persist user whenever it changes
  useEffect(() => {
    if (!isLoading) {
      persistenceService.saveUser(user);
      
      // Check for subscriber achievement
      if (user.isSubscriber) {
        const achievement = achievementService.unlockSpecial('subscriber');
        if (achievement) {
          setUnlockedAchievement(achievement);
        }
      }
    }
  }, [user, isLoading]);

  // Handle achievement notifications
  const showAchievement = (achievement: Achievement) => {
    setUnlockedAchievement(achievement);
  };

  const renderContent = () => {
    if (selectedTrip && activeTab === 'dashboard') {
      return (
        <TripDetails
          trip={selectedTrip}
          onBack={() => setSelectedTrip(null)}
          onUpdateTrip={(updatedTrip: Trip) => {
            setTrips(trips.map(t => t.id === updatedTrip.id ? updatedTrip : t));
            setSelectedTrip(updatedTrip);
          }}
        />
      );
    }

    switch (activeTab) {
      case 'dashboard':
        return (
          <Dashboard
            trips={trips}
            setTrips={setTrips}
            onSelectTrip={setSelectedTrip}
            onAchievement={showAchievement}
          />
        );
      case 'alerts':
        return (
          <Alerts
            alerts={alerts}
            setAlerts={setAlerts}
            user={user}
            setUser={setUser}
            onAchievement={showAchievement}
          />
        );
      case 'achievements':
        return <Achievements />;
      case 'profile':
        return (
          <Profile
            user={user}
            setUser={setUser}
          />
        );
      default:
        return <Dashboard trips={trips} setTrips={setTrips} onSelectTrip={setSelectedTrip} onAchievement={showAchievement} />;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your travel data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation activeTab={activeTab} setActiveTab={setActiveTab} user={user} />
      
      {/* Sync status bar */}
      {syncStatus.syncing && (
        <div className="bg-blue-100 border-b border-blue-200 px-4 py-2 text-sm text-blue-800 text-center">
          Syncing your data...
        </div>
      )}
      
      {syncStatus.error && (
        <div className="bg-red-100 border-b border-red-200 px-4 py-2 text-sm text-red-800 text-center">
          Sync error: {syncStatus.error}
        </div>
      )}
      
      <Layout>
        {renderContent()}
      </Layout>
      
      {/* Achievement Notification */}
      {unlockedAchievement && (
        <AchievementNotification
          achievement={unlockedAchievement}
          onClose={() => setUnlockedAchievement(null)}
        />
      )}
    </div>
  );
}

export default App;