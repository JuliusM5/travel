import AsyncStorage from '@react-native-async-storage/async-storage';
import { Trip, PriceAlert, User, Achievement } from '../types';

const STORAGE_KEYS = {
  TRIPS: '@travelmate_trips',
  ALERTS: '@travelmate_alerts',
  USER: '@travelmate_user',
  ACHIEVEMENTS: '@travelmate_achievements',
  STATS: '@travelmate_stats',
  LAST_SYNC: '@travelmate_last_sync',
  SETTINGS: '@travelmate_settings',
};

class PersistenceService {
  // Initialize storage
  async initialize() {
    try {
      // Check if this is first launch
      const firstLaunch = await AsyncStorage.getItem('@travelmate_first_launch');
      if (!firstLaunch) {
        await this.setupInitialData();
        await AsyncStorage.setItem('@travelmate_first_launch', 'false');
      }
    } catch (error) {
      console.error('Failed to initialize storage:', error);
    }
  }

  private async setupInitialData() {
    // Set up initial user
    const initialUser: User = {
      id: '1',
      name: '',
      email: '',
      isSubscriber: false,
      alertCount: 0,
    };
    await this.saveUser(initialUser);
  }

  // Save methods
  async saveTrips(trips: Trip[]): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.TRIPS, JSON.stringify(trips));
      await this.updateLastSync();
    } catch (error) {
      console.error('Failed to save trips:', error);
      throw error;
    }
  }

  async saveAlerts(alerts: PriceAlert[]): Promise<void> {
    try {
      // Convert Date objects to strings for storage
      const serializedAlerts = alerts.map(alert => ({
        ...alert,
        lastChecked: alert.lastChecked.toISOString(),
      }));
      await AsyncStorage.setItem(STORAGE_KEYS.ALERTS, JSON.stringify(serializedAlerts));
      await this.updateLastSync();
    } catch (error) {
      console.error('Failed to save alerts:', error);
      throw error;
    }
  }

  async saveUser(user: User): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
      await this.updateLastSync();
    } catch (error) {
      console.error('Failed to save user:', error);
      throw error;
    }
  }

  async saveAchievements(achievements: Achievement[]): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.ACHIEVEMENTS, JSON.stringify(achievements));
    } catch (error) {
      console.error('Failed to save achievements:', error);
      throw error;
    }
  }

  async saveStats(stats: any): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.STATS, JSON.stringify(stats));
    } catch (error) {
      console.error('Failed to save stats:', error);
      throw error;
    }
  }

  async saveSettings(settings: any): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    } catch (error) {
      console.error('Failed to save settings:', error);
      throw error;
    }
  }

  // Load methods
  async loadTrips(): Promise<Trip[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.TRIPS);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Failed to load trips:', error);
      return [];
    }
  }

  async loadAlerts(): Promise<PriceAlert[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.ALERTS);
      if (!data) return [];

      // Convert date strings back to Date objects
      const alerts = JSON.parse(data);
      return alerts.map((alert: any) => ({
        ...alert,
        lastChecked: new Date(alert.lastChecked),
      }));
    } catch (error) {
      console.error('Failed to load alerts:', error);
      return [];
    }
  }

  async loadUser(): Promise<User | null> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.USER);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Failed to load user:', error);
      return null;
    }
  }

  async loadAchievements(): Promise<Achievement[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.ACHIEVEMENTS);
      if (!data) return [];
      
      const achievements = JSON.parse(data);
      return achievements.map((a: any) => ({
        ...a,
        unlockedAt: a.unlockedAt ? new Date(a.unlockedAt) : undefined,
      }));
    } catch (error) {
      console.error('Failed to load achievements:', error);
      return [];
    }
  }

  async loadStats(): Promise<any> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.STATS);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Failed to load stats:', error);
      return null;
    }
  }

  async loadSettings(): Promise<any> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.SETTINGS);
      return data ? JSON.parse(data) : {};
    } catch (error) {
      console.error('Failed to load settings:', error);
      return {};
    }
  }

  // Sync methods
  private async updateLastSync(): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.LAST_SYNC, new Date().toISOString());
  }

  async getLastSync(): Promise<Date | null> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.LAST_SYNC);
      return data ? new Date(data) : null;
    } catch (error) {
      return null;
    }
  }

  // Clear methods
  async clearAll(): Promise<void> {
    try {
      const keys = Object.values(STORAGE_KEYS);
      await AsyncStorage.multiRemove(keys);
    } catch (error) {
      console.error('Failed to clear storage:', error);
      throw error;
    }
  }

  // Export/Import for backup
  async exportData(): Promise<string> {
    try {
      const [trips, alerts, user, achievements, stats] = await Promise.all([
        this.loadTrips(),
        this.loadAlerts(),
        this.loadUser(),
        this.loadAchievements(),
        this.loadStats(),
      ]);

      const data = {
        trips,
        alerts,
        user,
        achievements,
        stats,
        exportDate: new Date().toISOString(),
        version: '1.0',
      };

      return JSON.stringify(data, null, 2);
    } catch (error) {
      console.error('Failed to export data:', error);
      throw error;
    }
  }

  async importData(jsonData: string): Promise<boolean> {
    try {
      const data = JSON.parse(jsonData);

      if (data.trips) {
        await this.saveTrips(data.trips);
      }
      if (data.alerts) {
        // Convert date strings in imported alerts
        const alerts = data.alerts.map((alert: any) => ({
          ...alert,
          lastChecked: new Date(alert.lastChecked || new Date()),
        }));
        await this.saveAlerts(alerts);
      }
      if (data.user) {
        await this.saveUser(data.user);
      }
      if (data.achievements) {
        await this.saveAchievements(data.achievements);
      }
      if (data.stats) {
        await this.saveStats(data.stats);
      }

      return true;
    } catch (error) {
      console.error('Failed to import data:', error);
      return false;
    }
  }

  // Storage info
  async getStorageInfo() {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const items = await AsyncStorage.multiGet(keys);
      
      let totalSize = 0;
      items.forEach(([key, value]) => {
        if (value) {
          totalSize += value.length;
        }
      });

      return {
        keys: keys.length,
        sizeInBytes: totalSize,
        sizeInMB: (totalSize / 1024 / 1024).toFixed(2),
      };
    } catch (error) {
      console.error('Failed to get storage info:', error);
      return null;
    }
  }
}

export const persistenceService = new PersistenceService();