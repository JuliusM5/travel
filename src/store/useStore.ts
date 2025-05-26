import { User } from './types';

// Simple store without external dependencies
export const initialUser: User = {
  id: '1',
  name: 'Travel Enthusiast',
  email: 'user@example.com',
  isSubscriber: false,
  alertCount: 0
};

// We'll use React's useState in our components instead of zustand