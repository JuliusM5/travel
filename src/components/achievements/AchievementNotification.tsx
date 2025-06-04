import React, { useEffect, useState } from 'react';
import { Trophy, X } from 'lucide-react';
import { Achievement } from '../../services/achievementService';

interface AchievementNotificationProps {
  achievement: Achievement;
  onClose: () => void;
}

export const AchievementNotification: React.FC<AchievementNotificationProps> = ({ 
  achievement, 
  onClose 
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Animate in
    setTimeout(() => setIsVisible(true), 100);
    
    // Auto-close after 5 seconds
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300);
    }, 5000);

    return () => clearTimeout(timer);
  }, [onClose]);

  const getRarityColor = () => {
    switch (achievement.rarity) {
      case 'legendary': return 'from-yellow-400 to-orange-500';
      case 'epic': return 'from-purple-400 to-pink-500';
      case 'rare': return 'from-blue-400 to-indigo-500';
      default: return 'from-green-400 to-teal-500';
    }
  };

  const getRarityBorder = () => {
    switch (achievement.rarity) {
      case 'legendary': return 'border-yellow-400';
      case 'epic': return 'border-purple-400';
      case 'rare': return 'border-blue-400';
      default: return 'border-green-400';
    }
  };

  return (
    <div
      className={`fixed top-4 right-4 z-50 transition-all duration-300 ${
        isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
      }`}
    >
      <div className={`bg-white rounded-lg shadow-2xl border-2 ${getRarityBorder()} overflow-hidden`}>
        {/* Gradient header */}
        <div className={`bg-gradient-to-r ${getRarityColor()} p-4 text-white`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="text-3xl animate-bounce">{achievement.icon}</div>
              <div>
                <p className="text-xs opacity-90 uppercase tracking-wider">Achievement Unlocked!</p>
                <h3 className="text-lg font-bold">{achievement.title}</h3>
              </div>
            </div>
            <button
              onClick={() => {
                setIsVisible(false);
                setTimeout(onClose, 300);
              }}
              className="text-white/80 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        {/* Content */}
        <div className="p-4">
          <p className="text-gray-600 text-sm mb-3">{achievement.description}</p>
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500 capitalize">
              {achievement.rarity} Achievement
            </span>
            <div className="flex items-center gap-1">
              <Trophy className="w-4 h-4 text-yellow-500" />
              <span className="text-sm font-bold text-gray-900">+{achievement.points} pts</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};