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

export interface AppState {
  trips: Trip[];
  alerts: PriceAlert[];
  user: User;
  selectedTrip: Trip | null;
  activeTab: string;
  setTrips: (trips: Trip[]) => void;
  setAlerts: (alerts: PriceAlert[]) => void;
  setUser: (user: User) => void;
  setSelectedTrip: (trip: Trip | null) => void;
  setActiveTab: (tab: string) => void;
  addTrip: (trip: Trip) => void;
  updateTrip: (trip: Trip) => void;
  deleteTrip: (id: string) => void;
  addAlert: (alert: PriceAlert) => void;
  updateAlert: (alert: PriceAlert) => void;
  deleteAlert: (id: string) => void;
}