import React from 'react';
import { Circle, TrendingUp, TrendingDown } from 'lucide-react';
import { MarketChange } from '../types/game';

interface AssetsListProps {
  assets: {
    gold: number;
    water: number;
    oil: number;
  };
  marketChanges?: MarketChange[];
}

export function AssetsList({ assets, marketChanges }: AssetsListProps) {
  const getMarketTrend = (resourceName: string) => {
    if (!marketChanges) return null;
    const resource = resourceName.toLowerCase() as 'gold' | 'water' | 'oil';
    return marketChanges.find(change => change.resource === resource);
  };

  const assetData = [
    { name: 'Gold', value: assets.gold, total: 100, color: 'text-pixel-yellow', bgColor: 'bg-pixel-yellow', borderColor: 'border-pixel-yellow' },
    { name: 'Water', value: assets.water, total: 50, color: 'text-pixel-blue', bgColor: 'bg-pixel-blue', borderColor: 'border-pixel-blue' },
    { name: 'Oil', value: assets.oil, total: 20, color: 'text-pixel-magenta', bgColor: 'bg-pixel-magenta', borderColor: 'border-pixel-magenta' }
  ];

  return (
    <div className="bg-pixel-dark-gray pixel-panel border-pixel-gray p-2 max-w-xs">
      <h3 className="text-pixel-xs font-bold text-pixel-primary mb-2 uppercase tracking-wider text-center">Assets</h3>
      
      <div className="space-y-1">
        {assetData.map((asset) => {
          const trend = getMarketTrend(asset.name);
          return (
            <div key={asset.name} className={`pixel-card bg-pixel-gray ${asset.borderColor} p-3`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-1">
                  <div className={`w-4 h-4 ${asset.bgColor} pixel-avatar flex items-center justify-center`}>
                    <Circle className={`w-2 h-2 text-pixel-black fill-current`} />
                  </div>
                  <div className="flex items-center space-x-1">
                    <div className="text-pixel-primary font-bold text-pixel-xs uppercase">{asset.name}</div>
                    {trend && (
                      <div className="flex items-center space-x-1">
                        {trend.change >= 0 ? (
                          <TrendingUp className="w-5 h-5 text-pixel-success" />
                        ) : (
                          <TrendingDown className="w-5 h-5 text-pixel-error" />
                        )}
                        <span className={`text-pixel-xs font-bold ${
                          trend.change >= 0 ? 'text-pixel-success' : 'text-pixel-error'
                        }`}>
                          {trend.percentage}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <div className={`${asset.color} font-bold text-pixel-xs`}>{asset.value}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}