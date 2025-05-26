import React from 'react';
import { Check } from 'lucide-react';
import { User } from '../store/types';

interface ProfileProps {
  user: User;
  setUser: (user: User) => void;
}

export const Profile: React.FC<ProfileProps> = ({ user, setUser }) => {
  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Profile Settings</h1>
      
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
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <Check className="w-5 h-5 text-green-600" />
              <div>
                <p className="font-semibold text-gray-900">Pro Subscriber</p>
                <p className="text-sm text-gray-600">Unlimited alerts and premium features</p>
              </div>
            </div>
          </div>
        ) : (
          <div>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
              <p className="font-semibold text-gray-900">Free Plan</p>
              <p className="text-sm text-gray-600">Limited to 3 price alerts</p>
            </div>
            <button
              onClick={() => setUser({ ...user, isSubscriber: true })}
              className="w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 transition-colors font-semibold"
            >
              Upgrade to Pro - $9.99/month
            </button>
            <div className="mt-4 text-sm text-gray-600">
              <p className="font-semibold mb-2">Pro features include:</p>
              <ul className="space-y-1">
                <li>• Unlimited price alerts</li>
                <li>• Real-time price monitoring</li>
                <li>• Advanced filtering options</li>
                <li>• Priority customer support</li>
                <li>• Export trips to calendar</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};