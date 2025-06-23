import React from 'react';
import { Circle, TrendingUp, TrendingDown } from 'lucide-react';
import { MarketChange } from '../types/game';

interface MarketChangesProps {
  changes: MarketChange[];
}

export function MarketChanges({ changes }: MarketChangesProps) {
  const getResourceColor = (resource: string) => {
    switch (resource) {
      case 'gold': return { color: 'text-pixel-yellow', bgColor: 'bg-pixel-yellow', borderColor: 'border-pixel-yellow' };
      case 'water': return { color: 'text-pixel-blue', bgColor: 'bg-pixel-blue', borderColor: 'border-pixel-blue' };
      case 'oil': return { color: 'text-pixel-magenta', bgColor: 'bg-pixel-magenta', borderColor: 'border-pixel-magenta' };
      default: return { color: 'text-pixel-light-gray', bgColor: 'bg-pixel-light-gray', borderColor: 'border-pixel-light-gray' };
    }
  };

  return (
    <div className="bg-pixel-dark-gray pixel-panel border-pixel-gray p-2 max-w-xs">
      <h3 className="text-pixel-sm font-bold text-pixel-primary mb-2 uppercase tracking-wider text-center">Market Trends</h3>
      
      <div className="space-y-1">
        {changes.map((change) => {
          const colors = getResourceColor(change.resource);
          const isPositive = change.change > 0;
          
          return (
            <div key={change.resource} className={`pixel-card bg-pixel-gray ${colors.borderColor} p-3.5`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className={`w-6 h-6 ${colors.bgColor} pixel-avatar flex items-center justify-center`}>
                    <Circle className="w-3 h-3 text-pixel-black fill-current" />
                  </div>
                  <div className="text-pixel-primary font-bold text-pixel-xs uppercase">{change.resource}</div>
                </div>
                <div className={`flex items-center space-x-1 font-bold text-pixel-xs ${
                  isPositive ? 'text-pixel-success' : 'text-pixel-error'
                }`}>
                  {isPositive ? (
                    <TrendingUp className="w-2 h-2" />
                  ) : (
                    <TrendingDown className="w-2 h-2" />
                  )}
                  <span>{change.percentage}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
