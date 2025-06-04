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
import { PriceAlert } from '../types';
import { Colors } from '../theme/colors';
import { formatCurrency, formatDateTime } from '../utils/formatters';

interface PriceAlertCardProps {
  alert: PriceAlert;
  onCheck: () => void;
  onDelete: () => void;
  onShowHistory?: () => void;
}

export const PriceAlertCard: React.FC<PriceAlertCardProps> = ({
  alert,
  onCheck,
  onDelete,
  onShowHistory,
}) => {
  const priceChange = ((alert.currentPrice - alert.targetPrice) / alert.targetPrice) * 100;
  const isGoodDeal = alert.currentPrice <= alert.targetPrice;
  const scaleAnim = React.useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.98,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Animated.View
      style={[
        styles.container,
        { transform: [{ scale: scaleAnim }] },
        isGoodDeal && styles.goodDealContainer,
      ]}
    >
      {isGoodDeal && (
        <LinearGradient
          colors={[Colors.success + '20', Colors.success + '10']}
          style={StyleSheet.absoluteFillObject}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
      )}
      
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.routeContainer}>
            <Text style={styles.routeText}>{alert.origin}</Text>
            <Icon name="arrow-forward" size={16} color={Colors.gray} style={styles.arrow} />
            <Text style={styles.routeText}>{alert.destination}</Text>
          </View>
          {isGoodDeal && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>Price Target Met!</Text>
            </View>
          )}
          <Text style={styles.lastChecked}>
            Last checked: {formatDateTime(alert.lastChecked)}
          </Text>
        </View>
        <TouchableOpacity onPress={onDelete} style={styles.deleteButton}>
          <Icon name="close" size={20} color={Colors.gray} />
        </TouchableOpacity>
      </View>

      <View style={styles.priceContainer}>
        <View style={styles.priceItem}>
          <Text style={styles.priceLabel}>Target Price</Text>
          <Text style={styles.priceValue}>{formatCurrency(alert.targetPrice)}</Text>
        </View>
        <View style={styles.priceItem}>
          <Text style={styles.priceLabel}>Current Price</Text>
          <Text style={[
            styles.priceValue,
            isGoodDeal && styles.goodDealPrice
          ]}>
            {formatCurrency(alert.currentPrice)}
          </Text>
          <Text style={[
            styles.priceChange,
            priceChange < 0 ? styles.priceChangeDown : styles.priceChangeUp
          ]}>
            {priceChange > 0 ? '+' : ''}{priceChange.toFixed(1)}%
          </Text>
        </View>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.primaryButton]}
          onPress={onCheck}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
        >
          <Icon name="trending-down" size={16} color={Colors.white} />
          <Text style={styles.primaryButtonText}>Check Price</Text>
        </TouchableOpacity>
        
        {onShowHistory && (
          <TouchableOpacity
            style={[styles.actionButton, styles.secondaryButton]}
            onPress={onShowHistory}
          >
            <Icon name="bar-chart" size={16} color={Colors.gray} />
            <Text style={styles.secondaryButtonText}>History</Text>
          </TouchableOpacity>
        )}
      </View>
    </Animated.View>
  );
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
  },
  goodDealContainer: {
    borderWidth: 2,
    borderColor: Colors.success,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  headerLeft: {
    flex: 1,
  },
  routeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  routeText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.textPrimary,
  },
  arrow: {
    marginHorizontal: 8,
  },
  badge: {
    backgroundColor: Colors.success + '20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 4,
    alignSelf: 'flex-start',
  },
  badgeText: {
    fontSize: 12,
    color: Colors.success,
    fontWeight: '600',
  },
  lastChecked: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  deleteButton: {
    padding: 4,
  },
  priceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  priceItem: {
    flex: 1,
  },
  priceLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  priceValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Colors.textPrimary,
  },
  goodDealPrice: {
    color: Colors.success,
  },
  priceChange: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 2,
  },
  priceChangeDown: {
    color: Colors.success,
  },
  priceChangeUp: {
    color: Colors.error,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 6,
  },
  primaryButton: {
    backgroundColor: Colors.primary,
  },
  secondaryButton: {
    backgroundColor: Colors.lightGray,
  },
  primaryButtonText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: 'bold',
  },
  secondaryButtonText: {
    color: Colors.gray,
    fontSize: 14,
    fontWeight: 'bold',
  },
});