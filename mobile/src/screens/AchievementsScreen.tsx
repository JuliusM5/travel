import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import { Achievement } from '../types';
import { AchievementCard } from '../components/AchievementCard';
import { achievementService } from '../services/achievementService';
import { Colors } from '../theme/colors';

export const AchievementsScreen: React.FC = () => {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'unlocked' | 'locked'>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    unlocked: 0,
    points: 0,
    completion: 0,
  });

  useEffect(() => {
    loadAchievements();
  }, []);

  const loadAchievements = async () => {
    const loadedAchievements = await achievementService.getAchievements();
    setAchievements(loadedAchievements);
    updateStats(loadedAchievements);
  };

  const updateStats = (achievementsList: Achievement[]) => {
    const unlocked = achievementsList.filter(a => a.unlocked);
    const points = unlocked.reduce((sum, a) => sum + a.points, 0);
    const completion = Math.round((unlocked.length / achievementsList.length) * 100);

    setStats({
      total: achievementsList.length,
      unlocked: unlocked.length,
      points,
      completion,
    });
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAchievements();
    setRefreshing(false);
  };

  const getFilteredAchievements = () => {
    switch (selectedFilter) {
      case 'unlocked':
        return achievements.filter(a => a.unlocked);
      case 'locked':
        return achievements.filter(a => !a.unlocked);
      default:
        return achievements;
    }
  };

  const renderHeader = () => (
    <View>
      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <LinearGradient
          colors={[Colors.primary, Colors.primaryDark]}
          style={styles.statCard}
        >
          <Icon name="trophy" size={32} color={Colors.white} />
          <Text style={styles.statValue}>{stats.unlocked}/{stats.total}</Text>
          <Text style={styles.statLabel}>Achievements</Text>
        </LinearGradient>

        <LinearGradient
          colors={[Colors.secondary, Colors.secondaryDark]}
          style={styles.statCard}
        >
          <Icon name="star" size={32} color={Colors.white} />
          <Text style={styles.statValue}>{stats.points}</Text>
          <Text style={styles.statLabel}>Total Points</Text>
        </LinearGradient>

        <LinearGradient
          colors={[Colors.success, '#059669']}
          style={styles.statCard}
        >
          <Icon name="pie-chart" size={32} color={Colors.white} />
          <Text style={styles.statValue}>{stats.completion}%</Text>
          <Text style={styles.statLabel}>Completion</Text>
        </LinearGradient>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        {(['all', 'unlocked', 'locked'] as const).map(filter => (
          <TouchableOpacity
            key={filter}
            style={[
              styles.filterTab,
              selectedFilter === filter && styles.filterTabActive,
            ]}
            onPress={() => setSelectedFilter(filter)}
          >
            <Text style={[
              styles.filterTabText,
              selectedFilter === filter && styles.filterTabTextActive,
            ]}>
              {filter.charAt(0).toUpperCase() + filter.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Next Achievement to Unlock */}
      {renderNextAchievement()}
    </View>
  );

  const renderNextAchievement = () => {
    const locked = achievements.filter(a => !a.unlocked);
    const withProgress = locked.filter(a => a.progress && a.maxProgress);
    
    if (withProgress.length === 0) return null;

    const next = withProgress.sort((a, b) => {
      const aProgress = (a.progress! / a.maxProgress!) * 100;
      const bProgress = (b.progress! / b.maxProgress!) * 100;
      return bProgress - aProgress;
    })[0];

    const progressPercent = (next.progress! / next.maxProgress!) * 100;

    return (
      <View style={styles.nextAchievement}>
        <Text style={styles.nextAchievementTitle}>Next Achievement</Text>
        <View style={styles.nextAchievementContent}>
          <Text style={styles.nextAchievementIcon}>{next.icon}</Text>
          <View style={styles.nextAchievementInfo}>
            <Text style={styles.nextAchievementName}>{next.title}</Text>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill,
                  { width: `${progressPercent}%` }
                ]}
              />
            </View>
            <Text style={styles.progressText}>
              {next.progress}/{next.maxProgress} - {progressPercent.toFixed(0)}% complete
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const renderSectionHeader = (title: string, count: number) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={styles.sectionCount}>{count}</Text>
    </View>
  );

  const filteredAchievements = getFilteredAchievements();
  const unlockedAchievements = filteredAchievements.filter(a => a.unlocked);
  const lockedAchievements = filteredAchievements.filter(a => !a.unlocked);

  return (
    <View style={styles.container}>
      <FlatList
        data={[
          ...(unlockedAchievements.length > 0 ? [{ type: 'header', title: 'Unlocked', count: unlockedAchievements.length }] : []),
          ...unlockedAchievements.map(a => ({ ...a, type: 'achievement' })),
          ...(lockedAchievements.length > 0 ? [{ type: 'header', title: 'Locked', count: lockedAchievements.length }] : []),
          ...lockedAchievements.map(a => ({ ...a, type: 'achievement' })),
        ]}
        keyExtractor={(item, index) => item.type === 'header' ? `header-${index}` : item.id}
        renderItem={({ item }) => {
          if (item.type === 'header') {
            return renderSectionHeader(item.title, item.count);
          }
          return <AchievementCard achievement={item as Achievement} />;
        }}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[Colors.primary]}
          />
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    paddingBottom: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 20,
    borderRadius: 12,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.white,
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.white,
    opacity: 0.8,
    marginTop: 4,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 16,
    gap: 8,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterTabActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  filterTabTextActive: {
    color: Colors.white,
  },
  nextAchievement: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    backgroundColor: Colors.white,
    borderRadius: 12,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  nextAchievementTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  nextAchievementContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  nextAchievementIcon: {
    fontSize: 32,
  },
  nextAchievementInfo: {
    flex: 1,
  },
  nextAchievementName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  progressBar: {
    height: 8,
    backgroundColor: Colors.lightGray,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.background,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.textPrimary,
  },
  sectionCount: {
    fontSize: 14,
    color: Colors.textSecondary,
    backgroundColor: Colors.lightGray,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
});