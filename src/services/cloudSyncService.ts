import { persistenceService } from './persistenceService';

export interface SyncStatus {
  syncing: boolean;
  lastSync: Date | null;
  error: string | null;
}

// Cloud sync service for iCloud/Google Drive
export const cloudSyncService = {
  // Check if cloud sync is available
  isAvailable(): boolean {
    // Check for iOS
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    // Check for Android
    const isAndroid = /Android/.test(navigator.userAgent);
    
    return isIOS || isAndroid;
  },

  // Sync data to cloud
  async syncToCloud(): Promise<boolean> {
    try {
      const data = persistenceService.exportData();
      
      // In a real app, this would use native APIs
      // For web, we'll use a simple approach with the Web Share API
      if ('share' in navigator) {
        // Create a blob with the data
        const blob = new Blob([data], { type: 'application/json' });
        const file = new File([blob], 'travelmate-backup.json', { type: 'application/json' });
        
        // For now, allow user to save to their preferred cloud service
        await navigator.share({
          files: [file],
          title: 'TravelMate Backup',
          text: 'Save your TravelMate data'
        });
        
        return true;
      } else {
        // Fallback: Download the file
        this.downloadBackup(data);
        return true;
      }
    } catch (error) {
      console.error('Cloud sync failed:', error);
      return false;
    }
  },

  // Download backup file
  downloadBackup(data: string): void {
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `travelmate-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },

  // Handle file import
  async importFromFile(file: File): Promise<boolean> {
    try {
      const text = await file.text();
      return persistenceService.importData(text);
    } catch (error) {
      console.error('Failed to import file:', error);
      return false;
    }
  },

  // Auto-sync functionality
  startAutoSync(onSync: (status: SyncStatus) => void): void {
    // Check if we should sync (every 5 minutes if data changed)
    const SYNC_INTERVAL = 5 * 60 * 1000; // 5 minutes
    
    setInterval(() => {
      const lastSync = persistenceService.getLastSync();
      const now = new Date();
      
      if (!lastSync || now.getTime() - lastSync.getTime() > SYNC_INTERVAL) {
        onSync({
          syncing: true,
          lastSync,
          error: null
        });
        
        // In a real app, this would sync to actual cloud storage
        // For now, we just update the sync timestamp
        persistenceService.updateLastSync();
        
        onSync({
          syncing: false,
          lastSync: new Date(),
          error: null
        });
      }
    }, 60000); // Check every minute
  }
};