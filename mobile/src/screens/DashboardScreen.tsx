import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';

import { Trip } from '../types';
import { TripCard } from '../components/TripCard';
import { TripForm } from '../components/TripForm';
import { persistenceService } from '../services/persistenceService';
import { achievementService } from '../services/achievementService';
import { Colors } from '../theme/colors';
import { generateId } from '../utils/helpers';

export const DashboardScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showTripForm, setShowTripForm] = useState(false);
  const [editingTrip, setEditingTrip] = useState<Trip | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadTrips();
  }, []);

  useEffect(() => {
    // Track trip stats for achievements
    const stats = achievementService.getStats();
    if (stats.tripsPlanned !== trips.length) {
      achievementService.updateStats({ tripsPlanned: trips.length });
    }
  }, [trips.length]);

  const loadTrips = async () => {
    const loadedTrips = await persistenceService.loadTrips();
    setTrips(loadedTrips);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTrips();
    setRefreshing(false);
  };

  const handleCreateTrip = async (tripData: any) => {
    const newTrip: Trip = {
      id: generateId(),
      ...tripData,
      spent: 0,
      activities: []
    };
    
    const updatedTrips = [...trips, newTrip];
    setTrips(updatedTrips);
    await persistenceService.saveTrips(updatedTrips);
    setShowTripForm(false);
    setEditingTrip(null);
  };

  const handleUpdateTrip = async (tripData: any) => {
    if (editingTrip) {
      const updatedTrip = { ...editingTrip, ...tripData };
      const updatedTrips = trips.map(t => 
        t.id === editingTrip.id ? updatedTrip : t
      );
      setTrips(updatedTrips);
      await persistenceService.saveTrips(updatedTrips);
      setEditingTrip(null);
      setShowTripForm(false);
    }
  };

  const handleDeleteTrip = (tripId: string) => {
    Alert.alert(
      'Delete Trip',
      'Are you sure you want to delete this trip?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            const updatedTrips = trips.filter(t => t.id !== tripId);
            setTrips(updatedTrips);
            await persistenceService.saveTrips(updatedTrips);
          }
        }
      ]
    );
  };

  const filteredTrips = trips.filter(trip =>
    trip.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    trip.destination.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const upcomingTrips = filteredTrips.filter(trip =>
    new Date(trip.startDate) > new Date()
  ).sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());

  const pastTrips = filteredTrips.filter(trip =>
    new Date(trip.endDate) < new Date()
  ).sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());

  const renderTripSection = (title: string, data: Trip[]) => {
    if (data.length === 0) return null;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <FlatList
          data={data}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TripCard
              trip={item}
              onPress={() => navigation.navigate('TripDetails', { trip: item })}
              onEdit={() => {
                setEditingTrip(item);
                setShowTripForm(true);
              }}
              onDelete={() => handleDeleteTrip(item.id)}
            />
          )}
          contentContainerStyle={styles.tripList}
        />
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Icon name="airplane-outline" size={80} color={Colors.lightGray} />
      <Text style={styles.emptyStateTitle}>No trips planned yet</Text>
      <Text style={styles.emptyStateSubtitle}>Start planning your next adventure!</Text>
      <TouchableOpacity
        style={styles.emptyStateButton}
        onPress={() => setShowTripForm(true)}
      >
        <Text style={styles.emptyStateButtonText}>Create Your First Trip</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={[Colors.gradientStart, Colors.gradientEnd]}
        style={styles.header}
      >
        <View style={styles.searchContainer}>
          <Icon name="search" size={20} color={Colors.gray} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search trips..."
            placeholderTextColor={Colors.gray}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowTripForm(true)}
        >
          <Icon name="add" size={24} color={Colors.white} />
        </TouchableOpacity>
      </LinearGradient>

      {/* Content */}
      <FlatList
        data={[{ key: 'content' }]}
        renderItem={() => (
          <>
            {trips.length === 0 ? (
              renderEmptyState()
            ) : (
              <>
                {renderTripSection('Upcoming Adventures', upcomingTrips)}
                {renderTripSection('Past Trips', pastTrips)}
              </>
            )}
          </>
        )}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[Colors.primary]}
          />
        }
        contentContainerStyle={styles.content}
      />

      {/* Trip Form Modal */}
      <Modal
        visible={showTripForm}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <TripForm
          trip={editingTrip}
          onSave={editingTrip ? handleUpdateTrip : handleCreateTrip}
          onCancel={() => {
            setShowTripForm(false);
            setEditingTrip(null);
          }}
        />
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 16,
    color: Colors.textPrimary,
  },
  addButton: {
    width: 44,
    height: 44,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    paddingBottom: 20,
  },
  section: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.textPrimary,
    marginHorizontal: 16,
    marginBottom: 12,
  },
  tripList: {
    paddingHorizontal: 16,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 100,
  },
  emptyStateTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.textPrimary,
    marginTop: 20,
    marginBottom: 8,
  },
  emptyStateSubtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginBottom: 24,
  },
  emptyStateButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyStateButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
});