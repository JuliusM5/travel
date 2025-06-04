import notifee, { 
  AndroidImportance, 
  AndroidStyle,
  EventType,
  Notification
} from '@notifee/react-native';
import { Platform } from 'react-native';

class NotificationService {
  private channelsCreated = false;

  async initialize() {
    // Request permissions
    await this.requestPermission();
    
    // Create notification channels for Android
    if (Platform.OS === 'android' && !this.channelsCreated) {
      await this.createChannels();
      this.channelsCreated = true;
    }

    // Set up notification handlers
    this.setupHandlers();
  }

  async requestPermission(): Promise<boolean> {
    const settings = await notifee.requestPermission();
    return settings.authorizationStatus >= 1; // AUTHORIZED or PROVISIONAL
  }

  private async createChannels() {
    await notifee.createChannel({
      id: 'price-alerts',
      name: 'Price Alerts',
      description: 'Notifications for flight price drops',
      importance: AndroidImportance.HIGH,
      vibration: true,
      sound: 'default',
    });

    await notifee.createChannel({
      id: 'achievements',
      name: 'Achievements',
      description: 'Achievement unlock notifications',
      importance: AndroidImportance.DEFAULT,
      vibration: true,
      sound: 'default',
    });

    await notifee.createChannel({
      id: 'reminders',
      name: 'Trip Reminders',
      description: 'Reminders for upcoming trips',
      importance: AndroidImportance.HIGH,
      vibration: true,
      sound: 'default',
    });
  }

  private setupHandlers() {
    // Handle notification events
    notifee.onForegroundEvent(async ({ type, detail }) => {
      switch (type) {
        case EventType.PRESS:
          console.log('Notification pressed:', detail.notification);
          // Handle navigation based on notification data
          break;
        case EventType.ACTION_PRESS:
          console.log('Action pressed:', detail.pressAction);
          // Handle action button press
          break;
      }
    });

    // Background event handler
    notifee.onBackgroundEvent(async ({ type, detail }) => {
      if (type === EventType.PRESS) {
        console.log('Background notification pressed:', detail.notification);
      }
    });
  }

  async showPriceDropNotification(
    origin: string,
    destination: string,
    oldPrice: number,
    newPrice: number
  ) {
    const saved = oldPrice - newPrice;
    const percentOff = Math.round((saved / oldPrice) * 100);

    await notifee.displayNotification({
      title: `✈️ Price Drop Alert! ${percentOff}% OFF`,
      body: `${origin} → ${destination} is now $${newPrice} (was $${oldPrice})`,
      android: {
        channelId: 'price-alerts',
        importance: AndroidImportance.HIGH,
        pressAction: {
          id: 'default',
        },
        actions: [
          {
            title: '🎯 View Deal',
            pressAction: { id: 'view-deal' },
          },
          {
            title: '⏰ Later',
            pressAction: { id: 'snooze' },
          },
        ],
        style: {
          type: AndroidStyle.BIGTEXT,
          text: `Flight from ${origin} to ${destination} just dropped to $${newPrice}! That's a savings of $${saved} (${percentOff}% off). This deal might not last long!`,
        },
        color: '#6366F1',
      },
      ios: {
        foregroundPresentationOptions: {
          badge: true,
          sound: true,
          banner: true,
          list: true,
        },
        categoryId: 'price-drop',
        attachments: [],
      },
      data: {
        type: 'price-drop',
        origin,
        destination,
        newPrice: newPrice.toString(),
        saved: saved.toString(),
      },
    });
  }

  async showAchievementNotification(
    title: string,
    description: string,
    points: number,
    rarity: string
  ) {
    const emoji = this.getAchievementEmoji(rarity);
    
    await notifee.displayNotification({
      title: `${emoji} Achievement Unlocked!`,
      body: `${title} - ${description}`,
      subtitle: `+${points} points`,
      android: {
        channelId: 'achievements',
        importance: AndroidImportance.DEFAULT,
        smallIcon: 'ic_notification',
        color: this.getRarityColor(rarity),
        pressAction: {
          id: 'default',
          launchActivity: 'default',
        },
      },
      ios: {
        foregroundPresentationOptions: {
          badge: true,
          sound: true,
          banner: true,
        },
      },
      data: {
        type: 'achievement',
        achievementTitle: title,
      },
    });
  }

  async showTripReminderNotification(
    tripName: string,
    destination: string,
    daysUntil: number
  ) {
    const emoji = daysUntil === 1 ? '🎉' : '📅';
    const dayText = daysUntil === 1 ? 'tomorrow' : `in ${daysUntil} days`;

    await notifee.displayNotification({
      title: `${emoji} Trip Reminder`,
      body: `${tripName} to ${destination} starts ${dayText}!`,
      android: {
        channelId: 'reminders',
        importance: AndroidImportance.HIGH,
        actions: [
          {
            title: '📋 View Itinerary',
            pressAction: { id: 'view-itinerary' },
          },
        ],
        color: '#6366F1',
      },
      ios: {
        foregroundPresentationOptions: {
          badge: true,
          sound: true,
          banner: true,
          list: true,
        },
      },
      data: {
        type: 'trip-reminder',
        tripName,
        destination,
      },
    });
  }

  async scheduleNotification(notification: Notification, date: Date) {
    await notifee.createTriggerNotification(
      notification,
      {
        type: notifee.TriggerType.TIMESTAMP,
        timestamp: date.getTime(),
      }
    );
  }

  async cancelAllNotifications() {
    await notifee.cancelAllNotifications();
  }

  async getBadgeCount(): Promise<number> {
    return notifee.getBadgeCount();
  }

  async setBadgeCount(count: number) {
    await notifee.setBadgeCount(count);
  }

  async incrementBadgeCount() {
    const current = await this.getBadgeCount();
    await this.setBadgeCount(current + 1);
  }

  private getAchievementEmoji(rarity: string): string {
    switch (rarity) {
      case 'legendary': return '👑';
      case 'epic': return '💎';
      case 'rare': return '⭐';
      default: return '🏆';
    }
  }

  private getRarityColor(rarity: string): string {
    switch (rarity) {
      case 'legendary': return '#F59E0B';
      case 'epic': return '#8B5CF6';
      case 'rare': return '#3B82F6';
      default: return '#10B981';
    }
  }
}

export const notificationService = new NotificationService();