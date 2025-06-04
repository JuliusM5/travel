export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt?: Date;
  progress?: number;
  maxProgress?: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  points: number;
}

export interface UserStats {
  totalSaved: number;
  alertsCreated: number;
  tripsPlanned: number;
  priceDropsCaught: number;
  perfectDeals: number; // Prices below target
  streak: number; // Days checking app
  lastCheckIn: Date | null;
}

const ACHIEVEMENTS_KEY = 'travelmate_achievements';
const STATS_KEY = 'travelmate_stats';

// Define all achievements
const ALL_ACHIEVEMENTS: Achievement[] = [
  // Savings achievements
  {
    id: 'first_save',
    title: 'First Deal',
    description: 'Caught your first price drop',
    icon: '🎯',
    unlocked: false,
    rarity: 'common',
    points: 10
  },
  {
    id: 'save_100',
    title: 'Smart Saver',
    description: 'Saved $100 on flights',
    icon: '💰',
    unlocked: false,
    progress: 0,
    maxProgress: 100,
    rarity: 'common',
    points: 20
  },
  {
    id: 'save_500',
    title: 'Deal Hunter',
    description: 'Saved $500 on flights',
    icon: '🏆',
    unlocked: false,
    progress: 0,
    maxProgress: 500,
    rarity: 'rare',
    points: 50
  },
  {
    id: 'save_1000',
    title: 'Master Negotiator',
    description: 'Saved $1000 on flights',
    icon: '👑',
    unlocked: false,
    progress: 0,
    maxProgress: 1000,
    rarity: 'epic',
    points: 100
  },
  
  // Activity achievements
  {
    id: 'first_alert',
    title: 'Alert Rookie',
    description: 'Created your first price alert',
    icon: '🔔',
    unlocked: false,
    rarity: 'common',
    points: 10
  },
  {
    id: 'alerts_10',
    title: 'Alert Master',
    description: 'Created 10 price alerts',
    icon: '🚨',
    unlocked: false,
    progress: 0,
    maxProgress: 10,
    rarity: 'rare',
    points: 30
  },
  {
    id: 'first_trip',
    title: 'Trip Planner',
    description: 'Planned your first trip',
    icon: '✈️',
    unlocked: false,
    rarity: 'common',
    points: 10
  },
  {
    id: 'trips_5',
    title: 'Frequent Flyer',
    description: 'Planned 5 trips',
    icon: '🌍',
    unlocked: false,
    progress: 0,
    maxProgress: 5,
    rarity: 'rare',
    points: 40
  },
  
  // Streak achievements
  {
    id: 'streak_7',
    title: 'Week Warrior',
    description: '7-day check-in streak',
    icon: '🔥',
    unlocked: false,
    progress: 0,
    maxProgress: 7,
    rarity: 'common',
    points: 25
  },
  {
    id: 'streak_30',
    title: 'Dedicated Traveler',
    description: '30-day check-in streak',
    icon: '⚡',
    unlocked: false,
    progress: 0,
    maxProgress: 30,
    rarity: 'epic',
    points: 100
  },
  
  // Special achievements
  {
    id: 'perfect_timing',
    title: 'Perfect Timing',
    description: 'Caught a 50%+ price drop',
    icon: '⏰',
    unlocked: false,
    rarity: 'epic',
    points: 75
  },
  {
    id: 'night_owl',
    title: 'Night Owl',
    description: 'Checked prices after midnight',
    icon: '🦉',
    unlocked: false,
    rarity: 'rare',
    points: 20
  },
  {
    id: 'early_bird',
    title: 'Early Bird',
    description: 'Checked prices before 6 AM',
    icon: '🐦',
    unlocked: false,
    rarity: 'rare',
    points: 20
  },
  {
    id: 'subscriber',
    title: 'Pro Traveler',
    description: 'Became a Pro subscriber',
    icon: '⭐',
    unlocked: false,
    rarity: 'legendary',
    points: 200
  }
];

export const achievementService = {
  // Initialize achievements
  initializeAchievements(): void {
    const existing = localStorage.getItem(ACHIEVEMENTS_KEY);
    if (!existing) {
      localStorage.setItem(ACHIEVEMENTS_KEY, JSON.stringify(ALL_ACHIEVEMENTS));
      this.initializeStats();
    }
  },

  // Initialize stats
  initializeStats(): void {
    const stats: UserStats = {
      totalSaved: 0,
      alertsCreated: 0,
      tripsPlanned: 0,
      priceDropsCaught: 0,
      perfectDeals: 0,
      streak: 0,
      lastCheckIn: null
    };
    localStorage.setItem(STATS_KEY, JSON.stringify(stats));
  },

  // Get all achievements
  getAchievements(): Achievement[] {
    try {
      const data = localStorage.getItem(ACHIEVEMENTS_KEY);
      if (data) {
        const achievements = JSON.parse(data);
        // Convert date strings back to Date objects
        return achievements.map((a: any) => ({
          ...a,
          unlockedAt: a.unlockedAt ? new Date(a.unlockedAt) : undefined
        }));
      }
    } catch (error) {
      console.error('Failed to load achievements:', error);
    }
    this.initializeAchievements();
    return ALL_ACHIEVEMENTS;
  },

  // Get user stats
  getStats(): UserStats {
    try {
      const data = localStorage.getItem(STATS_KEY);
      if (data) {
        const stats = JSON.parse(data);
        return {
          ...stats,
          lastCheckIn: stats.lastCheckIn ? new Date(stats.lastCheckIn) : null
        };
      }
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
    this.initializeStats();
    return this.getStats();
  },

  // Update stats
  updateStats(updates: Partial<UserStats>): void {
    const stats = this.getStats();
    const newStats = { ...stats, ...updates };
    localStorage.setItem(STATS_KEY, JSON.stringify(newStats));
    
    // Check for achievement unlocks based on new stats
    this.checkAchievements(newStats);
  },

  // Check and unlock achievements
  checkAchievements(stats: UserStats): Achievement[] {
    const achievements = this.getAchievements();
    const newlyUnlocked: Achievement[] = [];

    achievements.forEach(achievement => {
      if (achievement.unlocked) return;

      let shouldUnlock = false;
      let progress = achievement.progress || 0;

      switch (achievement.id) {
        // Savings achievements
        case 'first_save':
          shouldUnlock = stats.priceDropsCaught > 0;
          break;
        case 'save_100':
          progress = Math.min(stats.totalSaved, 100);
          shouldUnlock = stats.totalSaved >= 100;
          break;
        case 'save_500':
          progress = Math.min(stats.totalSaved, 500);
          shouldUnlock = stats.totalSaved >= 500;
          break;
        case 'save_1000':
          progress = Math.min(stats.totalSaved, 1000);
          shouldUnlock = stats.totalSaved >= 1000;
          break;
          
        // Activity achievements
        case 'first_alert':
          shouldUnlock = stats.alertsCreated > 0;
          break;
        case 'alerts_10':
          progress = Math.min(stats.alertsCreated, 10);
          shouldUnlock = stats.alertsCreated >= 10;
          break;
        case 'first_trip':
          shouldUnlock = stats.tripsPlanned > 0;
          break;
        case 'trips_5':
          progress = Math.min(stats.tripsPlanned, 5);
          shouldUnlock = stats.tripsPlanned >= 5;
          break;
          
        // Streak achievements
        case 'streak_7':
          progress = Math.min(stats.streak, 7);
          shouldUnlock = stats.streak >= 7;
          break;
        case 'streak_30':
          progress = Math.min(stats.streak, 30);
          shouldUnlock = stats.streak >= 30;
          break;
      }

      if (progress !== achievement.progress) {
        achievement.progress = progress;
      }

      if (shouldUnlock && !achievement.unlocked) {
        achievement.unlocked = true;
        achievement.unlockedAt = new Date();
        newlyUnlocked.push(achievement);
      }
    });

    // Save updated achievements
    localStorage.setItem(ACHIEVEMENTS_KEY, JSON.stringify(achievements));
    
    return newlyUnlocked;
  },

  // Unlock special achievement
  unlockSpecial(achievementId: string): Achievement | null {
    const achievements = this.getAchievements();
    const achievement = achievements.find(a => a.id === achievementId);
    
    if (achievement && !achievement.unlocked) {
      achievement.unlocked = true;
      achievement.unlockedAt = new Date();
      localStorage.setItem(ACHIEVEMENTS_KEY, JSON.stringify(achievements));
      return achievement;
    }
    
    return null;
  },

  // Check daily streak
  checkDailyStreak(): void {
    const stats = this.getStats();
    const now = new Date();
    const lastCheckIn = stats.lastCheckIn ? new Date(stats.lastCheckIn) : null;
    
    if (!lastCheckIn) {
      // First check-in
      this.updateStats({ streak: 1, lastCheckIn: now });
    } else {
      const daysSinceLastCheckIn = Math.floor(
        (now.getTime() - lastCheckIn.getTime()) / (1000 * 60 * 60 * 24)
      );
      
      if (daysSinceLastCheckIn === 1) {
        // Consecutive day
        this.updateStats({ streak: stats.streak + 1, lastCheckIn: now });
      } else if (daysSinceLastCheckIn > 1) {
        // Streak broken
        this.updateStats({ streak: 1, lastCheckIn: now });
      }
      // Same day - no update needed
    }
    
    // Check for time-based achievements
    const hour = now.getHours();
    if (hour >= 0 && hour < 6) {
      this.unlockSpecial('early_bird');
    } else if (hour >= 0 && hour < 5 || hour >= 23) {
      this.unlockSpecial('night_owl');
    }
  },

  // Calculate total points
  getTotalPoints(): number {
    const achievements = this.getAchievements();
    return achievements
      .filter(a => a.unlocked)
      .reduce((sum, a) => sum + a.points, 0);
  },

  // Get achievement summary
  getAchievementSummary(): {
    total: number;
    unlocked: number;
    points: number;
    nextAchievement: Achievement | null;
  } {
    const achievements = this.getAchievements();
    const unlocked = achievements.filter(a => a.unlocked);
    const locked = achievements.filter(a => !a.unlocked);
    
    // Find next closest achievement
    const nextAchievement = locked
      .filter(a => a.progress !== undefined && a.maxProgress !== undefined)
      .sort((a, b) => {
        const aProgress = (a.progress! / a.maxProgress!) * 100;
        const bProgress = (b.progress! / b.maxProgress!) * 100;
        return bProgress - aProgress;
      })[0] || locked[0] || null;
    
    return {
      total: achievements.length,
      unlocked: unlocked.length,
      points: this.getTotalPoints(),
      nextAchievement
    };
  }
};