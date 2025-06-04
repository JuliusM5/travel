import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  Alert,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';

import { PriceAlert, User } from '../types';
import { PriceAlertCard } from '../components/PriceAlertCard';
import { PriceAlertForm } from '../components/PriceAlertForm';
import { PriceHistoryModal } from '../components/PriceHistoryModal';
import { persistenceService } from '../services/persistenceService';
import { priceService } from '../services/priceService';
import { notificationService } from '../services/notificationService';
import { achievementService } from '../services/achievementService';
import { Colors } from '../theme/colors';
import { generateId } from '../utils/helpers';

export const AlertsScreen: React.FC = () => {
  const [alerts, setAlerts] = useState<PriceAlert[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [showAlertForm, setShowAlertForm] = useState(false);
  const [showPriceHistory, setShowPriceHistory] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState<{origin: string; destination: string} | null>(null);
  const [isCheckingPrices, setIsCheckingPrices] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadData();
    startPriceMonitoring();
  }, []);

  const loadData = async () => {
    const [loadedAlerts, loadedUser] = await Promise.all([
      persistenceService.loadAlerts(),
      persistenceService.loadUser(),
    ]);
    setAlerts(loadedAlerts);
    setUser(loadedUser);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    await checkAllPrices();
    setRefreshing(false);
  };

  const startPriceMonitoring = () => {
    // Check prices every hour
    const interval = setInterval(() => {
      checkAllPrices();
    }, 60 * 60 * 1000); // 1 hour

    return () => clearInterval(interval);
  };

  const handleCreateAlert = async (alertData: any) => {
    if (!user) return;

    if (!user.isSubscriber && alerts.length >= 3) {
      Alert.alert(
        'Limit Reached',
        'You have reached the free tier limit of 3 alerts. Upgrade to Pro for unlimited alerts!',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Upgrade', onPress: () => navigateToUpgrade() }
        ]
      );
      return;
    }

    setIsCheckingPrices(true);
    try {
      const currentPrice = await priceService.checkPrice(alertData.origin, alertData.destination);
      
      const newAlert: PriceAlert = {
        id: generateId(),
        ...alertData,
        currentPrice,
        lastChecked: new Date(),
        triggered: currentPrice <= alertData.targetPrice
      };
      
      const updatedAlerts = [...alerts, newAlert];
      setAlerts(updatedAlerts);
      await persistenceService.saveAlerts(updatedAlerts);
      
      // Update achievement stats
      achievementService.updateStats({ alertsCreated: updatedAlerts.length });
      
      setShowAlertForm(false);
      
      if (newAlert.triggered) {
        await notificationService.showPriceDropNotification(
          newAlert.origin,
          newAlert.destination,
          newAlert.targetPrice,
          newAlert.currentPrice
        );
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to check prices. Please try again.');
    } finally {
      setIsCheckingPrices(false);
    }
  };

  const handleCheckAlert = async (alertId: string) => {
    const alert = alerts.find(a => a.id === alertId);
    if (!alert) return;

    try {
      const currentPrice = await priceService.checkPrice(alert.origin, alert.destination);
      const wasTriggered = alert.triggered;
      
      const updatedAlert = {
        ...alert,
        currentPrice,
        lastChecked: new Date(),
        triggered: currentPrice <= alert.targetPrice
      };
      
      const updatedAlerts = alerts.map(a => a.id === alertId ? updatedAlert : a);
      setAlerts(updatedAlerts);
      await persistenceService.saveAlerts(updatedAlerts);
      
      if (!wasTriggered && updatedAlert.triggered) {
        await notificationService.showPriceDropNotification(
          alert.origin,
          alert.destination,
          alert.targetPrice,
          currentPrice
        );
        
        // Track savings for achievements
        const saved = alert.targetPrice - currentPrice;
        if (saved > 0) {
          const stats = achievementService.getStats();
          achievementService.updateStats({ 
            totalSaved: stats.totalSaved + saved,
            priceDropsCaught: stats.priceDropsCaught + 1
          });
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to check price. Please try again.');
    }
  };

  const handleDeleteAlert = (alertId: string) => {
    Alert.alert(
      'Delete Alert',
      'Are you sure you want to delete this price alert?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            const updatedAlerts = alerts.filter(a => a.id !== alertId);
            setAlerts(updatedAlerts);
            await persistenceService.saveAlerts(updatedAlerts);
          }
        }
      ]
    );
  };

  const checkAllPrices = async () => {
    if (alerts.length === 0) return;
    
    setIsCheckingPrices(true);
    try {
      const updatedAlerts = await Promise.all(
        alerts.map(async (alert) => {
          const currentPrice = await priceService.checkPrice(alert.origin, alert.destination);
          const wasTriggered = alert.triggered;
          const triggered = currentPrice <= alert.targetPrice;
          
          if (!wasTriggered && triggered) {
            await notificationService.showPriceDropNotification(
              alert.origin,
              alert.destination,
              alert.targetPrice,
              currentPrice
            );
          }
          
          return {
            ...alert,
            currentPrice,
            lastChecked: new Date(),
            triggered
          };
        })
      );
      
      setAlerts(updatedAlerts);
      await persistenceService.saveAlerts(updatedAlerts);
    } catch (error) {
      console.error('Failed to check all prices:', error);
    } finally {
      setIsCheckingPrices(false);
    }
  };

  const handleShowHistory = (origin: string, destination: string) => {
    setSelectedRoute({ origin, destination });
    setShowPriceHistory(true);
  };

  const navigateToUpgrade = () => {
    // Navigate to profile/subscription
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <View>
        <Text style={styles.headerTitle}>Price Alerts</Text>
        <Text style={styles.headerSubtitle}>
          {user?.isSubscriber ? 'Unlimited alerts' : `${3 - alerts.length} alerts remaining`}
        </Text>
      </View>
      <View style={styles.headerButtons}>
        {alerts.length > 0 && (
          <TouchableOpacity
            style={[styles.headerButton, { marginRight: 8 }]}
            onPress={checkAllPrices}
            disabled={isCheckingPrices}
          >
            {isCheckingPrices ? (
              <ActivityIndicator size="small" color={Colors.white} />
            ) : (
              <Icon name="refresh" size={20} color={Colors.white} />
            )}
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => setShowAlertForm(true)}
        >
          <Icon name="add" size={24} color={Colors.white} />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Icon name="notifications-outline" size={80} color={Colors.lightGray} />
      <Text style={styles.emptyStateTitle}>No price alerts set</Text>
      <Text style={styles.emptyStateSubtitle}>Get notified when flight prices drop!</Text>
      <TouchableOpacity
        style={styles.emptyStateButton}
        onPress={() => setShowAlertForm(true)}
      >
        <Text style={styles.emptyStateButtonText}>Create Price Alert</Text>
      </TouchableOpacity>
    </View>
  );

  const renderUpgradePrompt = () => {
    if (!user || user.isSubscriber || alerts.length < 3) return null;

    return (
      <TouchableOpacity style={styles.upgradePrompt} onPress={navigateToUpgrade}>
        <LinearGradient
          colors={['#FEF3C7', '#FDE68A']}
          style={styles.upgradeGradient}
        >
          <Icon name="alert-circle" size={20} color="#92400E" />
          <View style={styles.upgradeContent}>
            <Text style={styles.upgradeTitle}>Limited to 3 alerts on free plan</Text>
            <Text style={styles.upgradeSubtitle}>Upgrade to Pro for unlimited price tracking</Text>
          </View>
          <Text style={styles.upgradePrice}>$6.99/mo</Text>
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={alerts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <PriceAlertCard
            alert={item}
            onCheck={() => handleCheckAlert(item.id)}
            onDelete={() => handleDeleteAlert(item.id)}
            onShowHistory={() => handleShowHistory(item.origin, item.destination)}
          />
        )}
        ListHeaderComponent={
          <>
            {renderHeader()}
            {renderUpgradePrompt()}
          </>
        }
        ListEmptyComponent={renderEmptyState()}
        contentContainerStyle={[
          styles.content,
          alerts.length === 0 && styles.emptyContent
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[Colors.primary]}
          />
        }
      />

      {/* Alert Form Modal */}
      <Modal
        visible={showAlertForm}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <PriceAlertForm
          onSave={handleCreateAlert}
          onCancel={() => setShowAlertForm(false)}
          isLoading={isCheckingPrices}
        />
      </Modal>

      {/* Price History Modal */}
      {selectedRoute && (
        <Modal
          visible={showPriceHistory}
          animationType="slide"
          presentationStyle="pageSheet"
        >
          <PriceHistoryModal
            origin={selectedRoute.origin}
            destination={selectedRoute.destination}
            onClose={() => {
              setShowPriceHistory(false);
              setSelectedRoute(null);
            }}
          />
        </Modal>
      )}
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
  emptyContent: {
    flex: 1,
  },
  header: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.white,
  },
  headerSubtitle: {
    fontSize: 14,
    color: Colors.white,
    opacity: 0.8,
    marginTop: 4,
  },
  headerButtons: {
    flexDirection: 'row',
  },
  headerButton: {
    width: 40,
    height: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
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
  upgradePrompt: {
    marginHorizontal: 16,
    marginVertical: 8,
  },
  upgradeGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
  },
  upgradeContent: {
    flex: 1,
    marginLeft: 12,
  },
  upgradeTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#92400E',
  },
  upgradeSubtitle: {
    fontSize: 14,
    color: '#92400E',
    marginTop: 2,
  },
  upgradePrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#92400E',
  },
});