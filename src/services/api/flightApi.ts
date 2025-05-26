import { rateLimiter } from './rateLimiter';

export const flightAPI = {
  async checkPrices(origin: string, destination: string): Promise<number> {
    // Simulate API call with rate limiting
    return rateLimiter.execute(async () => {
      await new Promise(resolve => setTimeout(resolve, 500));
      // Simulate price between $200-$700
      return Math.floor(Math.random() * 500) + 200;
    });
  }
};