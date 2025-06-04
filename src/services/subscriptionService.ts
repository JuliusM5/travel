import { memoryStorage } from './storage/memoryStorage';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

export interface SubscriptionStatus {
  isSubscribed: boolean;
  sessionToken?: string;
  subscription?: any;
}

export const subscriptionService = {
  // Store session token in memory
  getSessionToken(): string | null {
    return memoryStorage.get('sessionToken');
  },

  setSessionToken(token: string): void {
    memoryStorage.set('sessionToken', token);
  },

  clearSession(): void {
    memoryStorage.remove('sessionToken');
  },

  // Create checkout session for new subscription
  async createCheckoutSession(email: string): Promise<{ url: string }> {
    try {
      const response = await fetch(`${API_URL}/api/create-checkout-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          successUrl: `${window.location.origin}/profile?subscription=success`,
          cancelUrl: `${window.location.origin}/profile?subscription=cancelled`
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create checkout session');
      }

      const data = await response.json();
      return { url: data.url };
    } catch (error) {
      console.error('Checkout session error:', error);
      throw error;
    }
  },

  // Verify subscription status
  async verifySubscription(email: string): Promise<SubscriptionStatus> {
    try {
      const response = await fetch(`${API_URL}/api/verify-subscription`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email })
      });

      if (!response.ok) {
        throw new Error('Failed to verify subscription');
      }

      const data = await response.json();
      
      // Store session token if provided
      if (data.sessionToken) {
        this.setSessionToken(data.sessionToken);
      }

      return data;
    } catch (error) {
      console.error('Subscription verification error:', error);
      return { isSubscribed: false };
    }
  },

  // Cancel subscription
  async cancelSubscription(): Promise<{ success: boolean; cancelAt?: number }> {
    try {
      const sessionToken = this.getSessionToken();
      if (!sessionToken) {
        throw new Error('No session token');
      }

      const response = await fetch(`${API_URL}/api/cancel-subscription`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sessionToken })
      });

      if (!response.ok) {
        throw new Error('Failed to cancel subscription');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Subscription cancellation error:', error);
      throw error;
    }
  },

  // Open Stripe customer portal
  async openCustomerPortal(): Promise<void> {
    try {
      const sessionToken = this.getSessionToken();
      if (!sessionToken) {
        throw new Error('No session token');
      }

      const response = await fetch(`${API_URL}/api/create-portal-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sessionToken })
      });

      if (!response.ok) {
        throw new Error('Failed to create portal session');
      }

      const data = await response.json();
      window.location.href = data.url;
    } catch (error) {
      console.error('Portal session error:', error);
      throw error;
    }
  }
};