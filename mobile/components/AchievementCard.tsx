import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import { Achievement } from '../types';
import { Colors } from '../theme/colors';

interface AchievementCardProps {
  achievement: Achievement;
  onPress?: () => void;
}

export const AchievementCard: React.FC<AchievementCardProps> = ({ 
  achievement, 
  onPress 
}) => {
  const scaleAnim = React.useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const getRarityColors = () => {
    switch (achievement.rarity) {
      case 'legendary':
        return [Colors.legendary, '#F59E0B'];
      case 'epic':
        return [Colors.epic, '#7C3AED'];
      case 'rare':
        return [Colors.rare, '#2563EB'];
      default:
        return [Colors.common, '#059669'];
    }
  };

  const getRarityStyle = () => {
    if (!achievement.unlocked) {
      return styles.lockedCard;
    }
    
    switch (achievement.rarity) {
      case 'legendary':
        return styles.legendaryCard;
      case 'epic':
        return styles.epicCard;
      case 'rare':
        return styles.rareCard;
      default:
        return styles.commonCard;
    }
  };

  const content = (
    <Animated.View
      style={[
        styles.container,
        getRarityStyle(),
        { transform: [{ scale: scaleAnim }] }
      ]}
    >
      {achievement.unlocked && achievement.rarity !== 'common' && (
        <LinearGradient
          colors={getRarityColors()}
          style={StyleSheet.absoluteFillObject}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          opacity={0.1}
        />
      )}

      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Text style={[
            styles.icon,
            !achievement.unlocked && styles.lockedIcon
          ]}>
            {achievement.icon}
          </Text>
          {!achievement.unlocked && (
            <View style={styles.lockOverlay}>
              <Icon name="lock-closed" size={20} color={Colors.gray} />
            </View>
          )}
        </View>

        <View style={styles.textContainer}>
          <Text style={[
            styles.title,
            !achievement.unlocked && styles.lockedText
          ]}>
            {achievement.title}
          </Text>
          <Text style={[
            styles.description,
            !achievement.unlocked && styles.lockedText
          ]}>
            {achievement.description}
          </Text>

          {achievement.progress !== undefined && achievement.maxProgress && (
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressFill,
                    { 
                      width: `${(achievement.progress / achievement.maxProgress) * 100}%`,
                      backgroundColor: achievement.unlocked ? Colors.success : Colors.primary
                    }
                  ]}
                />
              </View>
              <Text style={styles.progressText}>
                {achievement.progress}/{achievement.maxProgress}
              </Text>
            </View>
          )}

          <View style={styles.footer}>
            <Text style={[
              styles.rarity,
              !achievement.unlocked && styles.lockedText,
              { color: achievement.unlocked ? getRarityColors()[0] : Colors.gray }
            ]}>
              {achievement.rarity.toUpperCase()}
            </Text>
            <View style={styles.pointsContainer}>
              <Icon 
                name="trophy" 
                size={14} 
                color={achievement.unlocked ? Colors.warning : Colors.gray} 
              />
              <Text style={[
                styles.points,
                !achievement.unlocked && styles.lockedText
              ]}>
                {achievement.points}
              </Text>
            </View>
          </View>

          {achievement.unlocked && achievement.unlockedAt && (
            <Text style={styles.unlockedDate}>
              Unlocked {new Date(achievement.unlockedAt).toLocaleDateString()}
            </Text>
          )}
        </View>
      </View>
    </Animated.View>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        {content}
      </TouchableOpacity>
    );
  }

  return content;
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.white,
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    padding: 16,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  lockedCard: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  commonCard: {
    borderWidth: 2,
    borderColor: Colors.common,
  },
  rareCard: {
    borderWidth: 2,
    borderColor: Colors.rare,
  },
  epicCard: {
    borderWidth: 2,
    borderColor: Colors.epic,
  },
  legendaryCard: {
    borderWidth: 2,
    borderColor: Colors.legendary,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconContainer: {
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    position: 'relative',
  },
  icon: {
    fontSize: 36,
  },
  lockedIcon: {
    opacity: 0.3,
  },
  lockOverlay: {
    position: 'absolute',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    padding: 4,
    borderRadius: 20,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 8,
    lineHeight: 20,
  },
  lockedText: {
    color: Colors.gray,
  },
  progressContainer: {
    marginTop: 8,
    marginBottom: 8,
  },
  progressBar: {
    height: 6,
    backgroundColor: Colors.lightGray,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  rarity: {
    fontSize: 12,
    fontWeight: '600',
  },
  pointsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  points: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.textPrimary,
  },
  unlockedDate: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 4,
  },
});