export interface PricePoint {
  date: Date;
  price: number;
}

export interface RouteHistory {
  route: string;
  origin: string;
  destination: string;
  history: PricePoint[];
  lowestPrice: number;
  highestPrice: number;
  averagePrice: number;
  trend: 'up' | 'down' | 'stable';
}

const HISTORY_KEY_PREFIX = 'travelmate_price_history_';
const MAX_HISTORY_DAYS = 90; // Keep 90 days of history

export const priceHistoryService = {
  // Add a price point to history
  addPricePoint(origin: string, destination: string, price: number): void {
    const route = `${origin}-${destination}`;
    const key = `${HISTORY_KEY_PREFIX}${route}`;
    
    try {
      const existing = this.getRouteHistory(origin, destination);
      const now = new Date();
      
      // Add new price point
      existing.history.push({ date: now, price });
      
      // Remove old entries (older than MAX_HISTORY_DAYS)
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - MAX_HISTORY_DAYS);
      existing.history = existing.history.filter(point => 
        new Date(point.date) > cutoffDate
      );
      
      // Sort by date
      existing.history.sort((a, b) => 
        new Date(a.date).getTime() - new Date(b.date).getTime()
      );
      
      // Save to localStorage
      localStorage.setItem(key, JSON.stringify(existing));
    } catch (error) {
      console.error('Failed to save price history:', error);
    }
  },

  // Get route history
  getRouteHistory(origin: string, destination: string): RouteHistory {
    const route = `${origin}-${destination}`;
    const key = `${HISTORY_KEY_PREFIX}${route}`;
    
    try {
      const data = localStorage.getItem(key);
      if (data) {
        const parsed = JSON.parse(data);
        // Convert date strings back to Date objects
        parsed.history = parsed.history.map((point: any) => ({
          date: new Date(point.date),
          price: point.price
        }));
        return this.calculateStats(parsed);
      }
    } catch (error) {
      console.error('Failed to load price history:', error);
    }
    
    // Return empty history
    return {
      route,
      origin,
      destination,
      history: [],
      lowestPrice: 0,
      highestPrice: 0,
      averagePrice: 0,
      trend: 'stable'
    };
  },

  // Calculate statistics for a route
  calculateStats(routeHistory: RouteHistory): RouteHistory {
    if (routeHistory.history.length === 0) {
      return routeHistory;
    }
    
    const prices = routeHistory.history.map(p => p.price);
    
    // Calculate stats
    routeHistory.lowestPrice = Math.min(...prices);
    routeHistory.highestPrice = Math.max(...prices);
    routeHistory.averagePrice = prices.reduce((a, b) => a + b, 0) / prices.length;
    
    // Calculate trend (last 7 days vs previous 7 days)
    if (routeHistory.history.length >= 14) {
      const recent = routeHistory.history.slice(-7);
      const previous = routeHistory.history.slice(-14, -7);
      
      const recentAvg = recent.reduce((a, b) => a + b.price, 0) / recent.length;
      const previousAvg = previous.reduce((a, b) => a + b.price, 0) / previous.length;
      
      if (recentAvg > previousAvg * 1.05) {
        routeHistory.trend = 'up';
      } else if (recentAvg < previousAvg * 0.95) {
        routeHistory.trend = 'down';
      } else {
        routeHistory.trend = 'stable';
      }
    }
    
    return routeHistory;
  },

  // Get all routes with history
  getAllRoutes(): string[] {
    const routes: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(HISTORY_KEY_PREFIX)) {
        routes.push(key.replace(HISTORY_KEY_PREFIX, ''));
      }
    }
    return routes;
  },

  // Clear history for a route
  clearRouteHistory(origin: string, destination: string): void {
    const route = `${origin}-${destination}`;
    const key = `${HISTORY_KEY_PREFIX}${route}`;
    localStorage.removeItem(key);
  },

  // Get price prediction based on historical data
  getPricePrediction(origin: string, destination: string, targetDate: Date): number | null {
    const history = this.getRouteHistory(origin, destination);
    
    if (history.history.length < 14) {
      return null; // Not enough data
    }
    
    // Simple prediction: use average price for the same day of week
    const targetDayOfWeek = targetDate.getDay();
    const sameDayPrices = history.history
      .filter(point => new Date(point.date).getDay() === targetDayOfWeek)
      .map(point => point.price);
    
    if (sameDayPrices.length === 0) {
      return history.averagePrice;
    }
    
    return sameDayPrices.reduce((a, b) => a + b, 0) / sameDayPrices.length;
  },

  // Format data for chart
  getChartData(origin: string, destination: string): {
    labels: string[];
    prices: number[];
    average: number;
  } {
    const history = this.getRouteHistory(origin, destination);
    
    const labels = history.history.map(point => 
      new Date(point.date).toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      })
    );
    
    const prices = history.history.map(point => point.price);
    
    return {
      labels,
      prices,
      average: history.averagePrice
    };
  }
};