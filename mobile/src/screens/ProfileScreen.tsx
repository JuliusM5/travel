import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import Share from 'react-native-share';
import RNFS from 'react-native-fs';
import DocumentPicker from 'react-native-document-picker';
import * as Keychain from 'react-native-keychain';
import { 
  requestPurchase, 
  getProducts, 
  initConnection, 
  endConnection,
  purchaseUpdatedListener,
  purchaseErrorListener,
  getAvailablePurchases,
  Product,
} from 'react-native-iap';

import { User } from '../types';
import { persistenceService } from '../services/persistenceService';
import { notificationService } from '../services/notificationService';
import { Colors } from '../theme/colors';

const SKU_IDS = Platform.select({
  ios: ['com.travelmate.pro.monthly'],
  android: ['com.travelmate.pro.monthly'],
}) || [];

export const ProfileScreen: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [settings, setSettings] = useState({
    notifications: true,
    biometrics: false,
    autoBackup: true,
  });

  useEffect(() => {
    loadUserData();
    loadSettings();
    initializeIAP();

    return () => {
      endConnection();
    };
  }, []);

  const loadUserData = async () => {
    const userData = await persistenceService.loadUser();
    setUser(userData);
  };

  const loadSettings = async () => {
    const savedSettings = await persistenceService.loadSettings();
    setSettings({ ...settings, ...savedSettings });
  };

  const initializeIAP = async () => {
    try {
      await initConnection();
      const products = await getProducts({ skus: SKU_IDS });
      setProducts(products);

      // Check for existing purchases
      const purchases = await getAvailablePurchases();
      if (purchases.length > 0 && user) {
        setUser({ ...user, isSubscriber: true });
      }

      // Set up purchase listeners
      const purchaseUpdateSubscription = purchaseUpdatedListener((purchase) => {
        handlePurchaseUpdate(purchase);
      });

      const purchaseErrorSubscription = purchaseErrorListener((error) => {
        console.error('Purchase error:', error);
      });

      return () => {
        purchaseUpdateSubscription.remove();
        purchaseErrorSubscription.remove();
      };
    } catch (error) {
      console.error('IAP initialization error:', error);
    }
  };

  const handlePurchaseUpdate = async (purchase: any) => {
    if (purchase.purchaseStateAndroid === 1 || purchase.transactionState === 'purchased') {
      // Verify purchase with your server here
      if (user) {
        const updatedUser = { ...user, isSubscriber: true };
        setUser(updatedUser);
        await persistenceService.saveUser(updatedUser);
        Alert.alert('Success', 'Welcome to TravelMate Pro!');
      }
    }
  };

  const handleSubscribe = async () => {
    if (products.length === 0) {
      Alert.alert('Error', 'Products not loaded. Please try again.');
      return;
    }

    setLoading(true);
    try {
      await requestPurchase({ sku: SKU_IDS[0] });
    } catch (error) {
      console.error('Purchase error:', error);
      Alert.alert('Error', 'Purchase failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async () => {
    if (!user) return;
    await persistenceService.saveUser(user);
    Alert.alert('Success', 'Profile updated successfully');
  };

  const handleToggleSetting = async (key: keyof typeof settings) => {
    const newSettings = { ...settings, [key]: !settings[key] };
    setSettings(newSettings);
    await persistenceService.saveSettings(newSettings);

    if (key === 'notifications') {
      if (newSettings.notifications) {
        await notificationService.requestPermission();
      }
    }
  };

  const handleBackup = async () => {
    try {
      const data = await persistenceService.exportData();
      const path = `${RNFS.DocumentDirectoryPath}/travelmate-backup-${Date.now()}.json`;
      await RNFS.writeFile(path, data, 'utf8');

      await Share.open({
        url: `file://${path}`,
        type: 'application/json',
        filename: 'travelmate-backup.json',
      });
    } catch (error) {
      if (error !== 'User did not share') {
        Alert.alert('Error', 'Failed to create backup');
      }
    }
  };

  const handleRestore = async () => {
    try {
      const result = await DocumentPicker.pick({
        type: [DocumentPicker.types.allFiles],
      });

      const content = await RNFS.readFile(result[0].uri, 'utf8');
      const success = await persistenceService.importData(content);

      if (success) {
        Alert.alert('Success', 'Data restored successfully', [
          { text: 'OK', onPress: () => loadUserData() }
        ]);
      } else {
        Alert.alert('Error', 'Failed to restore data');
      }
    } catch (error) {
      if (!DocumentPicker.isCancel(error)) {
        Alert.alert('Error', 'Failed to restore backup');
      }
    }
  };

  const renderSubscriptionSection = () => {
    const product = products[0];
    const price = product?.localizedPrice || '$6.99';

    if (user?.isSubscriber) {
      return (
        <View style={styles.section}>
          <LinearGradient
            colors={[Colors.success + '20', Colors.success + '10']}
            style={styles.subscriberCard}
          >
            <Icon name="checkmark-circle" size={48} color={Colors.success} />
            <Text style={styles.subscriberTitle}>Pro Subscriber</Text>
            <Text style={styles.subscriberSubtitle}>
              Unlimited alerts and premium features
            </Text>
          </LinearGradient>
        </View>
      );
    }

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Subscription</Text>
        <View style={styles.subscriptionCard}>
          <Text style={styles.subscriptionTitle}>Upgrade to Pro</Text>
          <Text style={styles.subscriptionPrice}>{price}/month</Text>
          <View style={styles.features}>
            {[
              'Unlimited price alerts',
              'Real-time price monitoring',
              'Price history charts',
              'Priority support',
              'Export to calendar',
              'Achievement rewards',
            ].map((feature, index) => (
              <View key={index} style={styles.featureItem}>
                <Icon name="checkmark" size={16} color={Colors.success} />
                <Text style={styles.featureText}>{feature}</Text>
              </View>
            ))}
          </View>
          <TouchableOpacity
            style={styles.subscribeButton}
            onPress={handleSubscribe}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <>
                <Icon name="star" size={20} color={Colors.white} />
                <Text style={styles.subscribeButtonText}>Subscribe Now</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (!user) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Profile Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account Information</Text>
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Name</Text>
          <TextInput
            style={styles.input}
            value={user.name}
            onChangeText={(text) => setUser({ ...user, name: text })}
            placeholder="Enter your name"
            placeholderTextColor={Colors.gray}
          />
        </View>
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Email</Text>
          <TextInput
            style={styles.input}
            value={user.email}
            onChangeText={(text) => setUser({ ...user, email: text })}
            placeholder="Enter your email"
            placeholderTextColor={Colors.gray}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>
        <TouchableOpacity style={styles.updateButton} onPress={handleUpdateProfile}>
          <Text style={styles.updateButtonText}>Update Profile</Text>
        </TouchableOpacity>
      </View>

      {/* Subscription Section */}
      {renderSubscriptionSection()}

      {/* Settings Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Settings</Text>
        
        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Icon name="notifications" size={24} color={Colors.primary} />
            <View style={styles.settingText}>
              <Text style={styles.settingTitle}>Push Notifications</Text>
              <Text style={styles.settingSubtitle}>Get alerts for price drops</Text>
            </View>
          </View>
          <Switch
            value={settings.notifications}
            onValueChange={() => handleToggleSetting('notifications')}
            trackColor={{ false: Colors.lightGray, true: Colors.primary }}
            thumbColor={Colors.white}
          />
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Icon name="finger-print" size={24} color={Colors.primary} />
            <View style={styles.settingText}>
              <Text style={styles.settingTitle}>Biometric Login</Text>
              <Text style={styles.settingSubtitle}>Use fingerprint or face ID</Text>
            </View>
          </View>
          <Switch
            value={settings.biometrics}
            onValueChange={() => handleToggleSetting('biometrics')}
            trackColor={{ false: Colors.lightGray, true: Colors.primary }}
            thumbColor={Colors.white}
          />
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Icon name="cloud-upload" size={24} color={Colors.primary} />
            <View style={styles.settingText}>
              <Text style={styles.settingTitle}>Auto Backup</Text>
              <Text style={styles.settingSubtitle}>Backup data to cloud</Text>
            </View>
          </View>
          <Switch
            value={settings.autoBackup}
            onValueChange={() => handleToggleSetting('autoBackup')}
            trackColor={{ false: Colors.lightGray, true: Colors.primary }}
            thumbColor={Colors.white}
          />
        </View>
      </View>

      {/* Data Management Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Data Management</Text>
        
        <TouchableOpacity style={styles.dataButton} onPress={handleBackup}>
          <Icon name="download" size={20} color={Colors.primary} />
          <Text style={styles.dataButtonText}>Backup Data</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.dataButton} onPress={handleRestore}>
          <Icon name="cloud-upload" size={20} color={Colors.primary} />
          <Text style={styles.dataButtonText}>Restore Data</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    paddingBottom: 32,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.textPrimary,
    marginBottom: 16,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  input: {
    backgroundColor: Colors.white,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  updateButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  updateButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  subscriberCard: {
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  subscriberTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.success,
    marginTop: 12,
  },
  subscriberSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  subscriptionCard: {
    backgroundColor: Colors.white,
    padding: 20,
    borderRadius: 12,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  subscriptionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.textPrimary,
  },
  subscriptionPrice: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.primary,
    marginTop: 4,
  },
  features: {
    marginTop: 16,
    marginBottom: 20,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  featureText: {
    fontSize: 14,
    color: Colors.textPrimary,
    marginLeft: 8,
  },
  subscribeButton: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 8,
    gap: 8,
  },
  subscribeButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.white,
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingText: {
    marginLeft: 12,
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  settingSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  dataButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  dataButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
  },
});