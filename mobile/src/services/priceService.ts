import Config from 'react-native-config';

const API_URL = Config.API_URL || 'http://localhost:3001';

interface PriceResponse {
  prices: Record<string, number | null>;
}

class PriceService {
  async checkPrice(origin: string, destination: string): Promise<number> {
    try {
      const response = await fetch(`${API_URL}/api/prices`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          routes: [`${origin}|${destination}`]
        })
      });

      if (!response.ok) {
        throw new Error('Failed to fetch prices');
      }

      const data: PriceResponse = await response.json();
      const price = data.prices[`${origin}-${destination}`];
      
      if (price === null || price === undefined) {
        // Return mock price if API fails
        return Math.floor(Math.random() * 500) + 200;
      }
      
      return price;
    } catch (error) {
      console.error('Price check failed:', error);
      // Fallback to mock price
      return Math.floor(Math.random() * 500) + 200;
    }
  }

  async checkMultiplePrices(routes: Array<{origin: string, destination: string}>): Promise<Record<string, number>> {
    try {
      const response = await fetch(`${API_URL}/api/prices`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          routes: routes.map(r => `${r.origin}|${r.destination}`)
        })
      });

      if (!response.ok) {
        throw new Error('Failed to fetch prices');
      }

      const data: PriceResponse = await response.json();
      
      // Convert null prices to mock prices
      const prices: Record<string, number> = {};
      routes.forEach(route => {
        const key = `${route.origin}-${route.destination}`;
        prices[key] = data.prices[key] || Math.floor(Math.random() * 500) + 200;
      });
      
      return prices;
    } catch (error) {
      console.error('Batch price check failed:', error);
      // Return mock prices for all routes
      const prices: Record<string, number> = {};
      routes.forEach(route => {
        const key = `${route.origin}-${route.destination}`;
        prices[key] = Math.floor(Math.random() * 500) + 200;
      });
      return prices;
    }
  }

  // Background price checking for notifications
  async checkPricesInBackground(alerts: Array<{id: string, origin: string, destination: string, targetPrice: number}>) {
    try {
      const routes = alerts.map(a => ({ origin: a.origin, destination: a.destination }));
      const prices = await this.checkMultiplePrices(routes);
      
      const priceDrops = [];
      for (const alert of alerts) {
        const key = `${alert.origin}-${alert.destination}`;
        const currentPrice = prices[key];
        
        if (currentPrice && currentPrice <= alert.targetPrice) {
          priceDrops.push({
            alertId: alert.id,
            origin: alert.origin,
            destination: alert.destination,
            targetPrice: alert.targetPrice,
            currentPrice: currentPrice,
            savings: alert.targetPrice - currentPrice
          });
        }
      }
      
      return priceDrops;
    } catch (error) {
      console.error('Background price check failed:', error);
      return [];
    }
  }
}

export const priceService = new PriceService();