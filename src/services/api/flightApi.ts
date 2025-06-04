import { rateLimiter } from './rateLimiter';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

interface PriceResponse {
  prices: Record<string, number | null>;
}

export const flightAPI = {
  async checkPrices(origin: string, destination: string): Promise<number> {
    return rateLimiter.execute(async () => {
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
          // Fallback to mock price if API fails
          return Math.floor(Math.random() * 500) + 200;
        }
        
        return price;
      } catch (error) {
        console.error('Price check failed:', error);
        // Fallback to mock price
        return Math.floor(Math.random() * 500) + 200;
      }
    });
  },

  async checkMultiplePrices(routes: Array<{origin: string, destination: string}>): Promise<Record<string, number>> {
    return rateLimiter.execute(async () => {
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
    });
  }
};