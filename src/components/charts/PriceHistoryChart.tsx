import React from 'react';
import { TrendingDown, TrendingUp, Minus } from 'lucide-react';
import { RouteHistory } from '../../services/priceHistoryService';
import { formatCurrency } from '../../utils/formatters';

interface PriceHistoryChartProps {
  history: RouteHistory;
}

export const PriceHistoryChart: React.FC<PriceHistoryChartProps> = ({ history }) => {
  if (history.history.length === 0) {
    return (
      <div className="bg-gray-50 rounded-lg p-8 text-center">
        <p className="text-gray-500">No price history available yet</p>
        <p className="text-sm text-gray-400 mt-2">Check back after a few price updates</p>
      </div>
    );
  }

  // Get last 30 days of data for display
  const displayData = history.history.slice(-30);
  const maxPrice = Math.max(...displayData.map(p => p.price));
  const minPrice = Math.min(...displayData.map(p => p.price));
  const priceRange = maxPrice - minPrice;
  const chartHeight = 200;

  // Calculate trend icon and color
  const getTrendIcon = () => {
    switch (history.trend) {
      case 'up':
        return <TrendingUp className="w-5 h-5 text-red-500" />;
      case 'down':
        return <TrendingDown className="w-5 h-5 text-green-500" />;
      default:
        return <Minus className="w-5 h-5 text-gray-500" />;
    }
  };

  const getTrendText = () => {
    switch (history.trend) {
      case 'up':
        return 'Prices trending up';
      case 'down':
        return 'Prices trending down';
      default:
        return 'Prices stable';
    }
  };

  return (
    <div className="bg-white rounded-lg p-6 shadow-md">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            {history.origin} → {history.destination}
          </h3>
          <div className="flex items-center gap-2 mt-1">
            {getTrendIcon()}
            <span className="text-sm text-gray-600">{getTrendText()}</span>
          </div>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-gray-900">
            {formatCurrency(displayData[displayData.length - 1].price)}
          </p>
          <p className="text-sm text-gray-500">Current price</p>
        </div>
      </div>

      {/* Simple SVG Chart */}
      <div className="relative">
        <svg
          viewBox={`0 0 ${displayData.length * 20} ${chartHeight + 40}`}
          className="w-full h-64"
          preserveAspectRatio="none"
        >
          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((fraction) => (
            <line
              key={fraction}
              x1="0"
              y1={fraction * chartHeight}
              x2={displayData.length * 20}
              y2={fraction * chartHeight}
              stroke="#e5e7eb"
              strokeWidth="1"
            />
          ))}

          {/* Price line */}
          <polyline
            points={displayData
              .map((point, index) => {
                const x = index * 20 + 10;
                const y = priceRange > 0
                  ? ((maxPrice - point.price) / priceRange) * chartHeight
                  : chartHeight / 2;
                return `${x},${y}`;
              })
              .join(' ')}
            fill="none"
            stroke="#6366f1"
            strokeWidth="2"
          />

          {/* Average line */}
          <line
            x1="0"
            y1={((maxPrice - history.averagePrice) / priceRange) * chartHeight}
            x2={displayData.length * 20}
            y2={((maxPrice - history.averagePrice) / priceRange) * chartHeight}
            stroke="#10b981"
            strokeWidth="2"
            strokeDasharray="5,5"
          />

          {/* Data points */}
          {displayData.map((point, index) => {
            const x = index * 20 + 10;
            const y = priceRange > 0
              ? ((maxPrice - point.price) / priceRange) * chartHeight
              : chartHeight / 2;
            return (
              <circle
                key={index}
                cx={x}
                cy={y}
                r="4"
                fill="#6366f1"
                className="hover:r-6 transition-all cursor-pointer"
              >
                <title>
                  {new Date(point.date).toLocaleDateString()}: {formatCurrency(point.price)}
                </title>
              </circle>
            );
          })}
        </svg>

        {/* X-axis labels */}
        <div className="flex justify-between text-xs text-gray-500 mt-2">
          <span>{new Date(displayData[0].date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
          <span>{new Date(displayData[displayData.length - 1].date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mt-6">
        <div className="text-center">
          <p className="text-sm text-gray-600">Lowest</p>
          <p className="text-lg font-semibold text-green-600">{formatCurrency(history.lowestPrice)}</p>
        </div>
        <div className="text-center">
          <p className="text-sm text-gray-600">Average</p>
          <p className="text-lg font-semibold text-gray-900">{formatCurrency(history.averagePrice)}</p>
        </div>
        <div className="text-center">
          <p className="text-sm text-gray-600">Highest</p>
          <p className="text-lg font-semibold text-red-600">{formatCurrency(history.highestPrice)}</p>
        </div>
      </div>
    </div>
  );
};