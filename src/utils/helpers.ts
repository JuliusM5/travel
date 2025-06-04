export const generateId = (): string => {
  return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
};

export const getDaysBetween = (startDate: string, endDate: string): number => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays + 1;
};

export const getDaysUntilTrip = (startDate: string): number => {
  return Math.ceil(
    (new Date(startDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  );
};

export const validateEmail = (email: string): boolean => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

export const formatDateRange = (startDate: string, endDate: string): string => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  const startMonth = start.toLocaleDateString('en-US', { month: 'short' });
  const endMonth = end.toLocaleDateString('en-US', { month: 'short' });
  
  if (startMonth === endMonth) {
    return `${startMonth} ${start.getDate()}-${end.getDate()}, ${start.getFullYear()}`;
  } else if (start.getFullYear() === end.getFullYear()) {
    return `${startMonth} ${start.getDate()} - ${endMonth} ${end.getDate()}, ${start.getFullYear()}`;
  } else {
    return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
  }
};

export const hapticFeedback = async (type: 'light' | 'medium' | 'heavy' = 'light') => {
  try {
    const HapticFeedback = require('react-native-haptic-feedback').default;
    HapticFeedback.trigger(type);
  } catch (error) {
    // Haptic feedback not available
  }
};