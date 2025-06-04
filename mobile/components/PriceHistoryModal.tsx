import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import Svg, { Line, Polyline, Circle, Text as SvgText } from 'react-native-svg';
import { Colors } from '../theme/colors';
import { formatCurrency } from '../utils/formatters';

interface PriceHistoryModalProps {
  origin: string;
  destination: string;
  onClose: () => void;
}

interface PricePoint {
  date: Date;
  price: number;
}

const { width: screenWidth } = Dimensions.get('window');
const chartWidth = screenWidth - 48;
const chartHeight = 200;

export const PriceHistoryModal: React.FC<PriceHistoryModalProps> = ({
  origin,
  destination,
  onClose,
}) => {
  const [loading, setLoading] = useState(true);
  const [priceHistory, setPriceHistory] = useState<PricePoint[]>([]);
  const [stats, setStats] = useState({
    current: 0,
    lowest: 0,
    highest: 0,
    average: 0,
    trend: 'stable' as 'up' | 'down' | 'stable',
  });

  useEffect(() => {
    loadPriceHistory();
  }, [origin, destination]);

  const loadPriceHistory = async () => {
    setLoading(true);
    try {
      // Mock data - replace with actual API call
      const mockHistory: PricePoint[] = Array.from({ length: 30 }, (_, i) => ({
        date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000),
        price: 300 + Math.random() * 200 + Math.sin(i / 5) * 50,
      }));

      setPriceHistory(mockHistory);
      
      const prices = mockHistory.map(p => p.price);
      const current = prices[prices.length - 1];
      const lowest = Math.min(...prices);
      const highest = Math.max(...prices);
      const average = prices.reduce((a, b) => a + b, 0) / prices.length;
      
      // Calculate trend
      const recentAvg = prices.slice(-7).reduce((a, b) => a + b, 0) / 7;
      const previousAvg = prices.slice(-14, -7).reduce((a, b) => a + b, 0) / 7;
      let trend: 'up' | 'down' | 'stable' = 'stable';
      if (recentAvg > previousAvg * 1.05) trend = 'up';
      else if (recentAvg < previousAvg * 0.95) trend = 'down';

      setStats({ current, lowest, highest, average, trend });
    } catch (error) {
      console.error('Failed to load price history:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderChart = () => {
    if (priceHistory.length === 0) return null;

    const prices = priceHistory.map(p => p.price);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const priceRange = maxPrice - minPrice;
    const padding = 20;

    // Calculate points for the line
    const points = priceHistory
      .map((point, index) => {
        const x = (index / (priceHistory.length - 1)) * (chartWidth - padding * 2) + padding;
        const y = ((maxPrice - point.price) / priceRange) * (chartHeight - padding * 2) + padding;
        return `${x},${y}`;
      })
      .join(' ');

    return (
      <View style={styles.chartContainer}>
        <Svg width={chartWidth} height={chartHeight}>
          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((fraction) => (
            <Line
              key={fraction}
              x1={padding}
              y1={fraction * (chartHeight - padding * 2) + padding}
              x2={chartWidth - padding}
              y2={fraction * (chartHeight - padding * 2) + padding}
              stroke={Colors.lightGray}
              strokeWidth="1"
            />
          ))}

          {/* Price line */}
          <Polyline
            points={points}
            fill="none"
            stroke={Colors.primary}
            strokeWidth="2"
          />

          {/* Average line */}
          <Line
            x1={padding}
            y1={((maxPrice - stats.average) / priceRange) * (chartHeight - padding * 2) + padding}
            x2={chartWidth - padding}
            y2={((maxPrice - stats.average) / priceRange) * (chartHeight - padding * 2) + padding}
            stroke={Colors.success}
            strokeWidth="2"
            strokeDasharray="5,5"
          />

          {/* Data points */}
          {priceHistory.map((point, index) => {
            const x = (index / (priceHistory.length - 1)) * (chartWidth - padding * 2) + padding;
            const y = ((maxPrice - point.price) / priceRange) * (chartHeight - padding * 2) + padding;
            return (
              <Circle
                key={index}
                cx={x}
                cy={y}
                r="4"
                fill={Colors.primary}
              />
            );
          })}
        </Svg>

        {/* X-axis labels */}
        <View style={styles.xAxisLabels}>
          <Text style={styles.axisLabel}>
            {priceHistory[0].date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </Text>
          <Text style={styles.axisLabel}>
            {priceHistory[priceHistory.length - 1].date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </Text>
        </View>
      </View>
    );
  };

  const getTrendIcon = () => {
    switch (stats.trend) {
      case 'up':
        return <Icon name="trending-up" size={20} color={Colors.error} />;
      case 'down':
        return <Icon name="trending-down" size={20} color={Colors.success} />;
      default:
        return <Icon name="remove" size={20} color={Colors.gray} />;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Price History</Text>
          <Text style={styles.route}>{origin} → {destination}</Text>
        </View>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Icon name="close" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
          </View>
        ) : (
          <>
            {/* Current Price Section */}
            <View style={styles.currentPriceSection}>
              <View style={styles.currentPriceInfo}>
                <Text style={styles.currentPriceLabel}>Current Price</Text>
                <View style={styles.priceRow}>
                  <Text style={styles.currentPrice}>{formatCurrency(stats.current)}</Text>
                  {getTrendIcon()}
                </View>
              </View>
            </View>

            {/* Chart */}
            {renderChart()}

            {/* Stats Grid */}
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Icon name="arrow-down" size={20} color={Colors.success} />
                <Text style={styles.statLabel}>Lowest</Text>
                <Text style={styles.statValue}>{formatCurrency(stats.lowest)}</Text>
              </View>
              <View style={styles.statCard}>
                <Icon name="analytics" size={20} color={Colors.info} />
                <Text style={styles.statLabel}>Average</Text>
                <Text style={styles.statValue}>{formatCurrency(stats.average)}</Text>
              </View>
              <View style={styles.statCard}>
                <Icon name="arrow-up" size={20} color={Colors.error} />
                <Text style={styles.statLabel}>Highest</Text>
                <Text style={styles.statValue}>{formatCurrency(stats.highest)}</Text>
              </View>
            </View>

            {/* Insights */}
            <View style={styles.insightsSection}>
              <Text style={styles.insightsTitle}>Price Insights</Text>
              <View style={styles.insight}>
                <Icon name="bulb" size={16} color={Colors.warning} />
                <Text style={styles.insightText}>
                  {stats.trend === 'down' 
                    ? 'Prices have been decreasing. Good time to book!'
                    : stats.trend === 'up'
                    ? 'Prices are trending up. Consider booking soon.'
                    : 'Prices have been stable recently.'}
                </Text>
              </View>
              <View style={styles.insight}>
                <Icon name="information-circle" size={16} color={Colors.info} />
                <Text style={styles.insightText}>
                  Best price was {formatCurrency(stats.lowest)} 
                  {' '}({Math.round(((stats.current - stats.lowest) / stats.lowest) * 100)}% higher now)
                </Text>
              </View>
            </View>
          </>
        )}
      </ScrollView>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.textPrimary,
  },
  route: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  closeButton: {
    padding: 4,
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 100,
  },
  currentPriceSection: {
    backgroundColor: Colors.white,
    padding: 20,
    marginBottom: 16,
  },
  currentPriceInfo: {
    alignItems: 'center',
  },
  currentPriceLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  currentPrice: {
    fontSize: 32,
    fontWeight: 'bold',
    color: Colors.textPrimary,
  },
  chartContainer: {
    backgroundColor: Colors.white,
    padding: 16,
    marginBottom: 16,
  },
  xAxisLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginTop: 8,
  },
  axisLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  statsGrid: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.white,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 8,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.textPrimary,
    marginTop: 4,
  },
  insightsSection: {
    backgroundColor: Colors.white,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
  },
  insightsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  insight: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  insightText: {
    flex: 1,
    fontSize: 14,
    color: Colors.textSecondary,
    marginLeft: 8,
    lineHeight: 20,
  },
});