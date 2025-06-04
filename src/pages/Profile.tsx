import React, { useState, useEffect, useRef } from 'react';
import { Check, CreditCard, Loader, AlertCircle, Download, Upload, Cloud, Bell, BellOff } from 'lucide-react';
import { User } from '../store/types';
import { subscriptionService } from '../services/subscriptionService';
import { persistenceService } from '../services/persistenceService';
import { cloudSyncService } from '../services/cloudSyncService';
import { notificationService } from '../services/notificationService';

interface ProfileProps {
  user: User;
  setUser: (user: User) => void;
}

export const Profile: React.FC<ProfileProps> = ({ user, setUser }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [subscriptionDetails, setSubscriptionDetails] = useState<any>(null);
  const [message, setMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  // Check for subscription success/cancel in URL params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const status = params.get('subscription');
    
    if (status === 'success') {
      setMessage('🎉 Subscription activated successfully!');
      // Verify subscription status
      verifyUserSubscription();
      // Clean URL
      window.history.replaceState({}, '', '/profile');
    } else if (status === 'cancelled') {
      setMessage('Subscription cancelled. You can try again anytime.');
      window.history.replaceState({}, '', '/profile');
    }
  }, []);

  // Verify subscription on component mount
  useEffect(() => {
    if (user.email) {
      verifyUserSubscription();
    }
    
    // Check notification status
    setNotificationsEnabled(notificationService.isEnabled());
  }, [user.email]);

  const verifyUserSubscription = async () => {
    try {
      const status = await subscriptionService.verifySubscription(user.email);
      setUser({ ...user, isSubscriber: status.isSubscribed });
      if (status.subscription) {
        setSubscriptionDetails(status.subscription);
      }
    } catch (error) {
      console.error('Failed to verify subscription:', error);
    }
  };

  const handleToggleNotifications = async () => {
    if (notificationsEnabled) {
      // Can't really disable notifications programmatically
      setMessage('To disable notifications, use your browser settings');
    } else {
      const enabled = await notificationService.requestPermission();
      if (enabled) {
        await notificationService.initialize();
        setNotificationsEnabled(true);
        setMessage('✅ Push notifications enabled!');
      } else {
        setMessage('❌ Notification permission denied');
      }
    }
  };

  const handleSubscribe = async () => {
    setIsLoading(true);
    try {
      const { url } = await subscriptionService.createCheckoutSession(user.email);
      window.location.href = url;
    } catch (error) {
      setMessage('Failed to start subscription. Please try again.');
      setIsLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    setIsLoading(true);
    try {
      await subscriptionService.openCustomerPortal();
    } catch (error) {
      setMessage('Failed to open billing portal. Please try again.');
      setIsLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!window.confirm('Are you sure you want to cancel your subscription?')) {
      return;
    }

    setIsLoading(true);
    try {
      const result = await subscriptionService.cancelSubscription();
      if (result.success) {
        setMessage('Subscription will be cancelled at the end of the billing period.');
        await verifyUserSubscription();
      }
    } catch (error) {
      setMessage('Failed to cancel subscription. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackup = async () => {
    try {
      if (cloudSyncService.isAvailable()) {
        await cloudSyncService.syncToCloud();
        setMessage('✅ Data backed up successfully!');
      } else {
        const data = persistenceService.exportData();
        cloudSyncService.downloadBackup(data);
        setMessage('✅ Backup downloaded successfully!');
      }
    } catch (error) {
      setMessage('❌ Backup failed. Please try again.');
    }
  };

  const handleRestore = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const success = await cloudSyncService.importFromFile(file);
      if (success) {
        setMessage('✅ Data restored successfully! Refreshing...');
        setTimeout(() => window.location.reload(), 1500);
      } else {
        setMessage('❌ Failed to restore data. Invalid file format.');
      }
    } catch (error) {
      setMessage('❌ Restore failed. Please try again.');
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Profile Settings</h1>
      
      {message && (
        <div className={`mb-6 p-4 rounded-lg flex items-center gap-2 ${
          message.includes('success') || message.includes('🎉') 
            ? 'bg-green-50 border border-green-200 text-green-800'
            : 'bg-blue-50 border border-blue-200 text-blue-800'
        }`}>
          <AlertCircle className="w-5 h-5" />
          {message}
        </div>
      )}
      
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Account Information</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              type="text"
              value={user.name}
              onChange={(e) => setUser({ ...user, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={user.email}
              onChange={(e) => setUser({ ...user, email: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Subscription Status</h2>
        {user.isSubscriber ? (
          <div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
              <div className="flex items-center gap-3">
                <Check className="w-5 h-5 text-green-600" />
                <div>
                  <p className="font-semibold text-gray-900">Pro Subscriber</p>
                  <p className="text-sm text-gray-600">Unlimited alerts and premium features</p>
                  {subscriptionDetails && (
                    <p className="text-xs text-gray-500 mt-1">
                      Next billing date: {new Date(subscriptionDetails.current_period_end * 1000).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={handleManageSubscription}
                disabled={isLoading}
                className="flex-1 bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition-colors font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <Loader className="w-4 h-4 animate-spin" />
                ) : (
                  <CreditCard className="w-4 h-4" />
                )}
                Manage Billing
              </button>
              <button
                onClick={handleCancelSubscription}
                disabled={isLoading}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-semibold disabled:opacity-50"
              >
                Cancel Subscription
              </button>
            </div>
          </div>
        ) : (
          <div>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
              <p className="font-semibold text-gray-900">Free Plan</p>
              <p className="text-sm text-gray-600">Limited to 3 price alerts</p>
            </div>
            
            <button
              onClick={handleSubscribe}
              disabled={isLoading}
              className="w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 transition-colors font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CreditCard className="w-4 h-4" />
                  Upgrade to Pro - $6.99/month
                </>
              )}
            </button>
            
            <div className="mt-4 text-sm text-gray-600">
              <p className="font-semibold mb-2">Pro features include:</p>
              <ul className="space-y-1">
                <li>• Unlimited price alerts</li>
                <li>• Real-time price monitoring (every hour)</li>
                <li>• Price history charts</li>
                <li>• Advanced filtering options</li>
                <li>• Priority customer support</li>
                <li>• Export trips to calendar</li>
                <li>• Achievement system & rewards</li>
              </ul>
            </div>
          </div>
        )}
      </div>
      
      <div className="bg-white rounded-lg shadow-md p-6 mt-6">
        <h2 className="text-xl font-semibold mb-4">Data Backup & Sync</h2>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="font-semibold text-gray-900">Cloud Sync</p>
              <p className="text-sm text-gray-600">
                {cloudSyncService.isAvailable() 
                  ? 'Auto-sync enabled for your device' 
                  : 'Manual backup available'}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Last sync: {persistenceService.getLastSync()?.toLocaleString() || 'Never'}
              </p>
            </div>
            <Cloud className="w-6 h-6 text-indigo-600" />
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={handleBackup}
              className="flex-1 bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition-colors font-semibold flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              Backup Data
            </button>
            
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 bg-gray-200 text-gray-800 py-2 rounded-lg hover:bg-gray-300 transition-colors font-semibold flex items-center justify-center gap-2"
            >
              <Upload className="w-4 h-4" />
              Restore Data
            </button>
            
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleRestore}
              className="hidden"
            />
          </div>
          
          <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
            <p className="font-semibold mb-1">💡 Pro Tip:</p>
            <p>Your data is automatically saved locally. Use backup to transfer data between devices or create a safety copy.</p>
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow-md p-6 mt-6">
        <h2 className="text-xl font-semibold mb-4">Notification Settings</h2>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              {notificationsEnabled ? (
                <Bell className="w-6 h-6 text-green-600" />
              ) : (
                <BellOff className="w-6 h-6 text-gray-400" />
              )}
              <div>
                <p className="font-semibold text-gray-900">Push Notifications</p>
                <p className="text-sm text-gray-600">
                  {notificationsEnabled 
                    ? 'Receive instant alerts for price drops' 
                    : 'Enable notifications to never miss a deal'}
                </p>
              </div>
            </div>
            <button
              onClick={handleToggleNotifications}
              className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                notificationsEnabled
                  ? 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                  : 'bg-indigo-600 text-white hover:bg-indigo-700'
              }`}
            >
              {notificationsEnabled ? 'Enabled' : 'Enable'}
            </button>
          </div>
          
          <div className="text-sm text-gray-600 space-y-2">
            <p className="font-semibold">You'll receive notifications for:</p>
            <ul className="space-y-1 ml-4">
              <li>• Price drops on your alerts</li>
              <li>• Achievement unlocks</li>
              <li>• Trip reminders (1 day before)</li>
              <li>• Special deals and offers</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};