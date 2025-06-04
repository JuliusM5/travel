import { PriceAlert } from '../store/types';
import { flightAPI } from './api/flightApi';

export interface PriceCheckResult {
  alertId: string;
  oldPrice: number;
  newPrice: number;
  triggered: boolean;
  error?: string;
}

class PriceMonitorService {
  private checkInterval: NodeJS.Timeout | null = null;
  private isChecking: boolean = false;
  
  // Check prices every hour as per the plan
  private readonly CHECK_INTERVAL = 60 * 60 * 1000; // 1 hour
  
  startMonitoring(
    getAlerts: () => PriceAlert[],
    onPriceUpdate: (results: PriceCheckResult[]) => void
  ) {
    // Clear any existing interval
    this.stopMonitoring();
    
    // Check immediately
    this.checkAllPrices(getAlerts, onPriceUpdate);
    
    // Then check every hour
    this.checkInterval = setInterval(() => {
      this.checkAllPrices(getAlerts, onPriceUpdate);
    }, this.CHECK_INTERVAL);
  }
  
  stopMonitoring() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }
  
  async checkAllPrices(
    getAlerts: () => PriceAlert[],
    onPriceUpdate: (results: PriceCheckResult[]) => void
  ) {
    if (this.isChecking) return;
    
    this.isChecking = true;
    const alerts = getAlerts();
    
    if (alerts.length === 0) {
      this.isChecking = false;
      return;
    }
    
    try {
      // Batch all routes for efficient API usage
      const uniqueRoutes = this.getUniqueRoutes(alerts);
      const prices = await flightAPI.checkMultiplePrices(uniqueRoutes);
      
      // Process results for each alert
      const results: PriceCheckResult[] = alerts.map(alert => {
        const routeKey = `${alert.origin}-${alert.destination}`;
        const newPrice = prices[routeKey] || alert.currentPrice;
        const triggered = newPrice <= alert.targetPrice;
        
        return {
          alertId: alert.id,
          oldPrice: alert.currentPrice,
          newPrice,
          triggered
        };
      });
      
      onPriceUpdate(results);
    } catch (error) {
      console.error('Price monitoring error:', error);
    } finally {
      this.isChecking = false;
    }
  }
  
  async checkSingleAlert(alert: PriceAlert): Promise<PriceCheckResult> {
    try {
      const newPrice = await flightAPI.checkPrices(alert.origin, alert.destination);
      return {
        alertId: alert.id,
        oldPrice: alert.currentPrice,
        newPrice,
        triggered: newPrice <= alert.targetPrice
      };
    } catch (error) {
      return {
        alertId: alert.id,
        oldPrice: alert.currentPrice,
        newPrice: alert.currentPrice,
        triggered: false,
        error: 'Failed to check price'
      };
    }
  }
  
  private getUniqueRoutes(alerts: PriceAlert[]): Array<{origin: string, destination: string}> {
    const routeMap = new Map<string, {origin: string, destination: string}>();
    
    alerts.forEach(alert => {
      const key = `${alert.origin}-${alert.destination}`;
      if (!routeMap.has(key)) {
        routeMap.set(key, {
          origin: alert.origin,
          destination: alert.destination
        });
      }
    });
    
    return Array.from(routeMap.values());
  }
  
  getNextCheckTime(): Date {
    const nextCheck = new Date();
    nextCheck.setHours(nextCheck.getHours() + 1);
    return nextCheck;
  }
}

export const priceMonitor = new PriceMonitorService();