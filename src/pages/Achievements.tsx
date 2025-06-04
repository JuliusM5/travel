import React, { useState, useEffect } from 'react';
import { Trophy, Lock, Star, Target } from 'lucide-react';
import { achievementService, Achievement } from '../services/achievementService';

export const Achievements: React.FC = () => {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [summary, setSummary] = useState(achievementService.getAchievementSummary());

  useEffect(() => {
    // Initialize and load achievements
    achievementService.initializeAchievements();
    setAchievements(achievementService.getAchievements());
    setSummary(achievementService.getAchievementSummary());
  }, []);

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'legendary': return 'text-yellow-500';
      case 'epic': return 'text-purple-500';
      case 'rare': return 'text-blue-500';
      default: return 'text-green-500';
    }
  };

  const getRarityBg = (rarity: string) => {
    switch (rarity) {
      case 'legendary': return 'bg-yellow-50 border-yellow-200';
      case 'epic': return 'bg-purple-50 border-purple-200';
      case 'rare': return 'bg-blue-50 border-blue-200';
      default: return 'bg-green-50 border-green-200';
    }
  };

  const groupedAchievements = {
    unlocked: achievements.filter(a => a.unlocked),
    locked: achievements.filter(a => !a.unlocked)
  };

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Achievements</h1>
      
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <Trophy className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
          <p className="text-2xl font-bold text-gray-900">{summary.unlocked}/{summary.total}</p>
          <p className="text-sm text-gray-600">Achievements</p>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <Star className="w-8 h-8 text-indigo-500 mx-auto mb-2" />
          <p className="text-2xl font-bold text-gray-900">{summary.points}</p>
          <p className="text-sm text-gray-600">Total Points</p>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <Target className="w-8 h-8 text-green-500 mx-auto mb-2" />
          <p className="text-2xl font-bold text-gray-900">
            {Math.round((summary.unlocked / summary.total) * 100)}%
          </p>
          <p className="text-sm text-gray-600">Completion</p>
        </div>
        
        {summary.nextAchievement && (
          <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg shadow-md p-6 text-white">
            <p className="text-xs uppercase tracking-wider opacity-90 mb-1">Next Achievement</p>
            <p className="font-bold">{summary.nextAchievement.title}</p>
            {summary.nextAchievement.progress !== undefined && (
              <div className="mt-2">
                <div className="w-full bg-white/20 rounded-full h-2">
                  <div 
                    className="bg-white rounded-full h-2 transition-all"
                    style={{ 
                      width: `${(summary.nextAchievement.progress / summary.nextAchievement.maxProgress!) * 100}%` 
                    }}
                  />
                </div>
                <p className="text-xs mt-1 opacity-90">
                  {summary.nextAchievement.progress}/{summary.nextAchievement.maxProgress}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Unlocked Achievements */}
      {groupedAchievements.unlocked.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Unlocked ({groupedAchievements.unlocked.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {groupedAchievements.unlocked.map(achievement => (
              <div
                key={achievement.id}
                className={`bg-white rounded-lg border-2 p-4 ${getRarityBg(achievement.rarity)}`}
              >
                <div className="flex items-start gap-3">
                  <div className="text-3xl">{achievement.icon}</div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{achievement.title}</h3>
                    <p className="text-sm text-gray-600 mt-1">{achievement.description}</p>
                    <div className="flex items-center justify-between mt-3">
                      <span className={`text-xs font-semibold ${getRarityColor(achievement.rarity)}`}>
                        {achievement.rarity.toUpperCase()}
                      </span>
                      <div className="flex items-center gap-1">
                        <Trophy className="w-4 h-4 text-yellow-500" />
                        <span className="text-sm font-bold">{achievement.points}</span>
                      </div>
                    </div>
                    {achievement.unlockedAt && (
                      <p className="text-xs text-gray-500 mt-2">
                        Unlocked {new Date(achievement.unlockedAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Locked Achievements */}
      {groupedAchievements.locked.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Locked ({groupedAchievements.locked.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {groupedAchievements.locked.map(achievement => (
              <div
                key={achievement.id}
                className="bg-gray-100 rounded-lg border-2 border-gray-200 p-4 opacity-75"
              >
                <div className="flex items-start gap-3">
                  <div className="text-3xl grayscale opacity-50">{achievement.icon}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-700">{achievement.title}</h3>
                      <Lock className="w-4 h-4 text-gray-400" />
                    </div>
                    <p className="text-sm text-gray-500 mt-1">{achievement.description}</p>
                    
                    {achievement.progress !== undefined && achievement.maxProgress && (
                      <div className="mt-3">
                        <div className="w-full bg-gray-300 rounded-full h-2">
                          <div 
                            className="bg-indigo-500 rounded-full h-2 transition-all"
                            style={{ 
                              width: `${(achievement.progress / achievement.maxProgress) * 100}%` 
                            }}
                          />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          Progress: {achievement.progress}/{achievement.maxProgress}
                        </p>
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between mt-3">
                      <span className={`text-xs font-semibold ${getRarityColor(achievement.rarity)}`}>
                        {achievement.rarity.toUpperCase()}
                      </span>
                      <div className="flex items-center gap-1">
                        <Trophy className="w-4 h-4 text-gray-400" />
                        <span className="text-sm font-bold text-gray-600">{achievement.points}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};