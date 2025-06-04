import { Trip, PriceAlert, User } from '../store/types';

// Keys for local storage
const STORAGE_KEYS = {
  TRIPS: 'travelmate_trips',
  ALERTS: 'travelmate_alerts',
  USER: 'travelmate_user',
  LAST_SYNC: 'travelmate_last_sync'
};

// Persistence service for local device storage
export const persistenceService = {
  // Save data to local storage
  saveTrips(trips: Trip[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.TRIPS, JSON.stringify(trips));
      this.updateLastSync();
    } catch (error) {
      console.error('Failed to save trips:', error);
    }
  },

  saveAlerts(alerts: PriceAlert[]): void {
    try {
      // Convert Date objects to strings for storage
      const serializedAlerts = alerts.map(alert => ({
        ...alert,
        lastChecked: alert.lastChecked.toISOString()
      }));
      localStorage.setItem(STORAGE_KEYS.ALERTS, JSON.stringify(serializedAlerts));
      this.updateLastSync();
    } catch (error) {
      console.error('Failed to save alerts:', error);
    }
  },

  saveUser(user: User): void {
    try {
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
      this.updateLastSync();
    } catch (error) {
      console.error('Failed to save user:', error);
    }
  },

  // Load data from local storage
  loadTrips(): Trip[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.TRIPS);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Failed to load trips:', error);
      return [];
    }
  },

  loadAlerts(): PriceAlert[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.ALERTS);
      if (!data) return [];
      
      // Convert date strings back to Date objects
      const alerts = JSON.parse(data);
      return alerts.map((alert: any) => ({
        ...alert,
        lastChecked: new Date(alert.lastChecked)
      }));
    } catch (error) {
      console.error('Failed to load alerts:', error);
      return [];
    }
  },

  loadUser(): User | null {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.USER);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Failed to load user:', error);
      return null;
    }
  },

  // Update last sync timestamp
  updateLastSync(): void {
    localStorage.setItem(STORAGE_KEYS.LAST_SYNC, new Date().toISOString());
  },

  getLastSync(): Date | null {
    const data = localStorage.getItem(STORAGE_KEYS.LAST_SYNC);
    return data ? new Date(data) : null;
  },

  // Clear all data
  clearAll(): void {
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
  },

  // Export all data for backup
  exportData(): string {
    const data = {
      trips: this.loadTrips(),
      alerts: this.loadAlerts(),
      user: this.loadUser(),
      exportDate: new Date().toISOString(),
      version: '1.0'
    };
    return JSON.stringify(data, null, 2);
  },

  // Import data from backup
  importData(jsonData: string): boolean {
    try {
      const data = JSON.parse(jsonData);
      
      if (data.trips) {
        this.saveTrips(data.trips);
      }
      if (data.alerts) {
        // Convert date strings in imported alerts
        const alerts = data.alerts.map((alert: any) => ({
          ...alert,
          lastChecked: new Date(alert.lastChecked || new Date())
        }));
        this.saveAlerts(alerts);
      }
      if (data.user) {
        this.saveUser(data.user);
      }
      
      return true;
    } catch (error) {
      console.error('Failed to import data:', error);
      return false;
    }
  }
};