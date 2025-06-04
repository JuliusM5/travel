// Shared types between web and mobile
export interface Trip {
  id: string;
  name: string;
  destination: string;
  startDate: string;
  endDate: string;
  budget: number;
  spent: number;
  collaborators: string[];
  activities: Activity[];
}

export interface Activity {
  id: string;
  day: number;
  time: string;
  title: string;
  location: string;
  cost: number;
  notes: string;
}

export interface PriceAlert {
  id: string;
  origin: string;
  destination: string;
  targetPrice: number;
  currentPrice: number;
  lastChecked: Date;
  triggered: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  isSubscriber: boolean;
  alertCount: number;
}

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

// Navigation types
export type RootStackParamList = {
  Main: undefined;
  TripDetails: { trip: Trip };
  AlertDetails: { alert: PriceAlert };
  AchievementDetails: { achievement: Achievement };
};

export type TabParamList = {
  Dashboard: undefined;
  Alerts: undefined;
  Achievements: undefined;
  Profile: undefined;
};