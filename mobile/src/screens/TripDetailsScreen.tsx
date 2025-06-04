import React, { useState, useLayoutEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Share,
  Modal,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';

import { Trip, Activity } from '../types';
import { Colors } from '../theme/colors';
import { formatDate, formatCurrency } from '../utils/formatters';
import { getDaysBetween, generateId } from '../utils/helpers';
import { persistenceService } from '../services/persistenceService';
import { exportService } from '../services/exportService';

type RouteParams = {
  TripDetails: {
    trip: Trip;
  };
};

export const TripDetailsScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<RouteParams, 'TripDetails'>>();
  const [trip, setTrip] = useState<Trip>(route.params.trip);
  const [selectedDay, setSelectedDay] = useState(1);
  const [showActivityForm, setShowActivityForm] = useState(false);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);

  const days = getDaysBetween(trip.startDate, trip.endDate);
  const dayNumbers = Array.from({ length: days }, (_, i) => i + 1);
  const progress = (trip.spent / trip.budget) * 100;

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View style={styles.headerButtons}>
          <TouchableOpacity onPress={handleShare} style={styles.headerButton}>
            <Icon name="share-outline" size={24} color={Colors.white} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleExport} style={styles.headerButton}>
            <Icon name="download-outline" size={24} color={Colors.white} />
          </TouchableOpacity>
        </View>
      ),
    });
  }, [navigation]);

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out my trip to ${trip.destination}! 🌍✈️`,
        title: trip.name,
      });
    } catch (error) {
      console.error('Share failed:', error);
    }
  };

  const handleExport = () => {
    Alert.alert(
      'Export Trip',
      'Choose export format',
      [
        { text: 'Calendar (.ics)', onPress: () => exportService.exportToCalendar(trip) },
        { text: 'PDF', onPress: () => exportService.exportToPDF(trip) },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const handleAddActivity = async (activityData: any) => {
    const newActivity: Activity = {
      ...activityData,
      id: generateId(),
      day: selectedDay,
    };

    const updatedTrip = {
      ...trip,
      activities: [...trip.activities, newActivity],
      spent: trip.spent + activityData.cost,
    };

    setTrip(updatedTrip);
    await saveTrip(updatedTrip);
    setShowActivityForm(false);
    setEditingActivity(null);
  };

  const handleUpdateActivity = async (activityData: any) => {
    if (!editingActivity) return;

    const costDifference = activityData.cost - editingActivity.cost;
    const updatedTrip = {
      ...trip,
      activities: trip.activities.map(a =>
        a.id === editingActivity.id ? { ...editingActivity, ...activityData } : a
      ),
      spent: trip.spent + costDifference,
    };

    setTrip(updatedTrip);
    await saveTrip(updatedTrip);
    setShowActivityForm(false);
    setEditingActivity(null);
  };

  const handleDeleteActivity = async (activityId: string) => {
    const activity = trip.activities.find(a => a.id === activityId);
    if (!activity) return;

    Alert.alert(
      'Delete Activity',
      'Are you sure you want to delete this activity?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const updatedTrip = {
              ...trip,
              activities: trip.activities.filter(a => a.id !== activityId),
              spent: trip.spent - activity.cost,
            };
            setTrip(updatedTrip);
            await saveTrip(updatedTrip);
          },
        },
      ]
    );
  };

  const saveTrip = async (updatedTrip: Trip) => {
    // Update in persistence
    const trips = await persistenceService.loadTrips();
    const updatedTrips = trips.map(t => t.id === updatedTrip.id ? updatedTrip : t);
    await persistenceService.saveTrips(updatedTrips);
  };

  const activitiesForDay = trip.activities
    .filter(a => a.day === selectedDay)
    .sort((a, b) => a.time.localeCompare(b.time));

  const renderDaySelector = () => (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.daySelector}
      contentContainerStyle={styles.daySelectorContent}
    >
      {dayNumbers.map(day => (
        <TouchableOpacity
          key={day}
          style={[
            styles.dayButton,
            selectedDay === day && styles.dayButtonActive,
          ]}
          onPress={() => setSelectedDay(day)}
        >
          <Text style={[
            styles.dayButtonText,
            selectedDay === day && styles.dayButtonTextActive,
          ]}>
            Day {day}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  const renderActivity = (activity: Activity) => (
    <TouchableOpacity
      key={activity.id}
      style={styles.activityCard}
      onPress={() => {
        setEditingActivity(activity);
        setShowActivityForm(true);
      }}
    >
      <View style={styles.activityTime}>
        <Icon name="time-outline" size={16} color={Colors.primary} />
        <Text style={styles.activityTimeText}>{activity.time}</Text>
      </View>
      
      <View style={styles.activityContent}>
        <Text style={styles.activityTitle}>{activity.title}</Text>
        {activity.location && (
          <View style={styles.activityLocation}>
            <Icon name="location-outline" size={14} color={Colors.textSecondary} />
            <Text style={styles.activityLocationText}>{activity.location}</Text>
          </View>
        )}
        {activity.notes && (
          <Text style={styles.activityNotes}>{activity.notes}</Text>
        )}
      </View>

      <View style={styles.activityRight}>
        <Text style={styles.activityCost}>{formatCurrency(activity.cost)}</Text>
        <TouchableOpacity
          onPress={() => handleDeleteActivity(activity.id)}
          style={styles.deleteButton}
        >
          <Icon name="trash-outline" size={18} color={Colors.error} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <LinearGradient
          colors={[Colors.primary, Colors.secondary]}
          style={styles.header}
        >
          <Text style={styles.tripName}>{trip.name}</Text>
          <View style={styles.tripInfo}>
            <Icon name="location" size={16} color={Colors.white} />
            <Text style={styles.tripDestination}>{trip.destination}</Text>
          </View>
          <View style={styles.tripInfo}>
            <Icon name="calendar" size={16} color={Colors.white} />
            <Text style={styles.tripDates}>
              {formatDate(trip.startDate)} - {formatDate(trip.endDate)}
            </Text>
          </View>
        </LinearGradient>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Icon name="wallet-outline" size={24} color={Colors.primary} />
            <Text style={styles.statValue}>{formatCurrency(trip.budget)}</Text>
            <Text style={styles.statLabel}>Budget</Text>
            <Text style={styles.statSubtext}>
              {formatCurrency(trip.budget - trip.spent)} left
            </Text>
          </View>

          <View style={styles.statCard}>
            <Icon name="trending-down-outline" size={24} color={Colors.success} />
            <Text style={styles.statValue}>{formatCurrency(trip.spent)}</Text>
            <Text style={styles.statLabel}>Spent</Text>
            <Text style={styles.statSubtext}>{progress.toFixed(0)}% of budget</Text>
          </View>

          <View style={styles.statCard}>
            <Icon name="calendar-outline" size={24} color={Colors.info} />
            <Text style={styles.statValue}>{trip.activities.length}</Text>
            <Text style={styles.statLabel}>Activities</Text>
            <Text style={styles.statSubtext}>Across {days} days</Text>
          </View>
        </View>

        {/* Budget Progress */}
        <View style={styles.progressSection}>
          <Text style={styles.progressLabel}>Budget Usage</Text>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${Math.min(progress, 100)}%`,
                  backgroundColor:
                    progress > 90 ? Colors.error : progress > 70 ? Colors.warning : Colors.success,
                },
              ]}
            />
          </View>
        </View>

        {/* Itinerary */}
        <View style={styles.itinerarySection}>
          <Text style={styles.sectionTitle}>Itinerary</Text>
          {renderDaySelector()}

          {activitiesForDay.length === 0 ? (
            <View style={styles.emptyState}>
              <Icon name="calendar-outline" size={48} color={Colors.lightGray} />
              <Text style={styles.emptyStateText}>No activities for this day</Text>
            </View>
          ) : (
            <View style={styles.activitiesList}>
              {activitiesForDay.map(renderActivity)}
            </View>
          )}

          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setShowActivityForm(true)}
          >
            <Icon name="add" size={20} color={Colors.white} />
            <Text style={styles.addButtonText}>Add Activity</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Activity Form Modal */}
      <Modal
        visible={showActivityForm}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        {/* Placeholder for ActivityForm component */}
        <View style={styles.modalContent}>
          <Text>Activity Form Placeholder</Text>
          <TouchableOpacity
            onPress={() => {
              setShowActivityForm(false);
              setEditingActivity(null);
            }}
          >
            <Text>Close</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  headerButtons: {
    flexDirection: 'row',
    marginRight: 8,
  },
  headerButton: {
    padding: 8,
  },
  header: {
    padding: 20,
    paddingTop: 40,
  },
  tripName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.white,
    marginBottom: 8,
  },
  tripInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  tripDestination: {
    fontSize: 16,
    color: Colors.white,
    marginLeft: 6,
  },
  tripDates: {
    fontSize: 14,
    color: Colors.white,
    marginLeft: 6,
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.white,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.textPrimary,
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  statSubtext: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  progressSection: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  progressLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
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
    borderRadius: 4,
  },
  itinerarySection: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.textPrimary,
    marginBottom: 16,
  },
  daySelector: {
    marginBottom: 16,
  },
  daySelectorContent: {
    paddingRight: 16,
  },
  dayButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: Colors.white,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  dayButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  dayButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  dayButtonTextActive: {
    color: Colors.white,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginTop: 12,
  },
  activitiesList: {
    marginBottom: 16,
  },
  activityCard: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  activityTime: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  activityTimeText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
    marginLeft: 4,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  activityLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  activityLocationText: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginLeft: 4,
  },
  activityNotes: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontStyle: 'italic',
  },
  activityRight: {
    alignItems: 'flex-end',
  },
  activityCost: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.success,
    marginBottom: 8,
  },
  deleteButton: {
    padding: 4,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: 8,
    gap: 8,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
  },
  modalContent: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
});