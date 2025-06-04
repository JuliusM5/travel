interface NotificationOptions {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  requireInteraction?: boolean;
  actions?: NotificationAction[];
  data?: any;
}

class NotificationService {
  private registration: ServiceWorkerRegistration | null = null;
  private permission: NotificationPermission = 'default';

  async initialize(): Promise<boolean> {
    // Check if browser supports notifications
    if (!('Notification' in window)) {
      console.log('This browser does not support notifications');
      return false;
    }

    // Check if service workers are supported
    if (!('serviceWorker' in navigator)) {
      console.log('Service workers are not supported');
      return false;
    }

    try {
      // Register service worker
      this.registration = await navigator.serviceWorker.register('/service-worker.js');
      console.log('Service worker registered successfully');

      // Get notification permission
      this.permission = Notification.permission;

      // Request permission if not granted
      if (this.permission === 'default') {
        this.permission = await Notification.requestPermission();
      }

      return this.permission === 'granted';
    } catch (error) {
      console.error('Failed to initialize notifications:', error);
      return false;
    }
  }

  async requestPermission(): Promise<boolean> {
    if (this.permission === 'granted') {
      return true;
    }

    if (this.permission === 'denied') {
      console.log('Notification permission was denied');
      return false;
    }

    try {
      this.permission = await Notification.requestPermission();
      return this.permission === 'granted';
    } catch (error) {
      console.error('Failed to request notification permission:', error);
      return false;
    }
  }

  async showNotification(options: NotificationOptions): Promise<void> {
    if (this.permission !== 'granted') {
      console.log('Notification permission not granted');
      return;
    }

    if (!this.registration) {
      console.log('Service worker not registered');
      return;
    }

    try {
      await this.registration.showNotification(options.title, {
        body: options.body,
        icon: options.icon || '/logo192.png',
        badge: options.badge || '/logo192.png',
        tag: options.tag,
        requireInteraction: options.requireInteraction || false,
        vibrate: [200, 100, 200],
        actions: options.actions,
        data: options.data
      });
    } catch (error) {
      console.error('Failed to show notification:', error);
    }
  }

  async showPriceDropNotification(
    origin: string,
    destination: string,
    oldPrice: number,
    newPrice: number
  ): Promise<void> {
    const saved = oldPrice - newPrice;
    const percentOff = Math.round((saved / oldPrice) * 100);

    await this.showNotification({
      title: `✈️ Price Drop Alert! ${percentOff}% OFF`,
      body: `${origin} → ${destination} is now $${newPrice} (was $${oldPrice})`,
      tag: `price-drop-${origin}-${destination}`,
      requireInteraction: true,
      actions: [
        {
          action: 'book',
          title: '🎯 View Deal',
          icon: '/icons/check.png'
        },
        {
          action: 'later',
          title: '⏰ Later',
          icon: '/icons/clock.png'
        }
      ],
      data: {
        url: '/alerts',
        origin,
        destination,
        newPrice,
        saved
      }
    });
  }

  async showAchievementNotification(
    title: string,
    description: string,
    icon: string,
    points: number
  ): Promise<void> {
    await this.showNotification({
      title: `🏆 Achievement Unlocked!`,
      body: `${title} - ${description} (+${points} points)`,
      tag: `achievement-${title}`,
      data: {
        url: '/achievements'
      }
    });
  }

  async showTripReminderNotification(
    tripName: string,
    destination: string,
    daysUntil: number
  ): Promise<void> {
    const emoji = daysUntil === 1 ? '🎉' : '📅';
    const dayText = daysUntil === 1 ? 'tomorrow' : `in ${daysUntil} days`;

    await this.showNotification({
      title: `${emoji} Trip Reminder`,
      body: `${tripName} to ${destination} starts ${dayText}!`,
      tag: `trip-reminder-${tripName}`,
      requireInteraction: true,
      actions: [
        {
          action: 'view',
          title: '📋 View Itinerary',
          icon: '/icons/list.png'
        }
      ],
      data: {
        url: '/dashboard'
      }
    });
  }

  // Enable background sync for price checking
  async enableBackgroundSync(): Promise<boolean> {
    if (!this.registration) {
      console.log('Service worker not registered');
      return false;
    }

    try {
      // Register periodic background sync (if supported)
      if ('periodicSync' in this.registration) {
        await (this.registration as any).periodicSync.register('check-prices', {
          minInterval: 60 * 60 * 1000 // 1 hour
        });
        console.log('Periodic background sync registered');
        return true;
      } else {
        console.log('Periodic background sync not supported');
        return false;
      }
    } catch (error) {
      console.error('Failed to register background sync:', error);
      return false;
    }
  }

  // Check if notifications are supported and enabled
  isEnabled(): boolean {
    return 'Notification' in window && this.permission === 'granted';
  }

  // Get current permission status
  getPermissionStatus(): NotificationPermission {
    return this.permission;
  }
}

export const notificationService = new NotificationService();