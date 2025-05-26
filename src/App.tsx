import React, { useState } from 'react';
import { Navigation } from './components/common/Navigation';
import { Layout } from './components/common/Layout';
import { Dashboard } from './pages/Dashboard';
import { TripDetails } from './pages/TripDetails';
import { Alerts } from './pages/Alerts';
import { Profile } from './pages/Profile';
import { Trip, PriceAlert, User } from './store/types';
import { initialUser } from './store/useStore';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [trips, setTrips] = useState<Trip[]>([]);
  const [alerts, setAlerts] = useState<PriceAlert[]>([]);
  const [user, setUser] = useState<User>(initialUser);
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);

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
          />
        );
      case 'alerts':
        return (
          <Alerts
            alerts={alerts}
            setAlerts={setAlerts}
            user={user}
            setUser={setUser}
          />
        );
      case 'profile':
        return (
          <Profile
            user={user}
            setUser={setUser}
          />
        );
      default:
        return <Dashboard trips={trips} setTrips={setTrips} onSelectTrip={setSelectedTrip} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation activeTab={activeTab} setActiveTab={setActiveTab} user={user} />
      <Layout>
        {renderContent()}
      </Layout>
    </div>
  );
}

export default App;