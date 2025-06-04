import React from 'react';
import { X, TrendingDown, BarChart3 } from 'lucide-react';
import { PriceAlert } from '../../store/types';
import { formatCurrency, formatDateTime } from '../../utils/formatters';

interface PriceAlertCardProps {
  alert: PriceAlert;
  onCheck: (id: string) => void;
  onDelete: (id: string) => void;
  onShowHistory?: (origin: string, destination: string) => void;
}

export const PriceAlertCard: React.FC<PriceAlertCardProps> = ({ 
  alert, 
  onCheck, 
  onDelete,
  onShowHistory 
}) => {
  const priceChange = ((alert.currentPrice - alert.targetPrice) / alert.targetPrice) * 100;
  const isGoodDeal = alert.currentPrice <= alert.targetPrice;

  return (
    <div className={`bg-white rounded-lg shadow-md p-6 border-2 ${
      isGoodDeal ? 'border-green-500' : 'border-transparent'
    }`}>
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            {alert.origin} → {alert.destination}
            {isGoodDeal && (
              <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full">
                Price Target Met!
              </span>
            )}
          </h3>
          <p className="text-sm text-gray-600">
            Last checked: {formatDateTime(alert.lastChecked)}
          </p>
        </div>
        <button
          onClick={() => onDelete(alert.id)}
          className="text-gray-400 hover:text-red-600 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
      
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-sm text-gray-600">Target Price</p>
          <p className="text-xl font-bold text-gray-900">{formatCurrency(alert.targetPrice)}</p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Current Price</p>
          <p className={`text-xl font-bold ${
            isGoodDeal ? 'text-green-600' : 'text-gray-900'
          }`}>
            {formatCurrency(alert.currentPrice)}
          </p>
          <p className={`text-sm ${
            priceChange < 0 ? 'text-green-600' : 'text-red-600'
          }`}>
            {priceChange > 0 ? '+' : ''}{priceChange.toFixed(1)}%
          </p>
        </div>
      </div>
      
      <div className="flex gap-2">
        <button
          onClick={() => onCheck(alert.id)}
          className="flex-1 bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition-colors font-semibold flex items-center justify-center gap-2"
        >
          <TrendingDown className="w-4 h-4" />
          Check Price
        </button>
        {onShowHistory && (
          <button
            onClick={() => onShowHistory(alert.origin, alert.destination)}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-semibold flex items-center justify-center gap-2"
          >
            <BarChart3 className="w-4 h-4" />
            History
          </button>
        )}
      </div>
    </div>
  );
};