import React, { useState } from 'react';
import { MarketChanges } from './MarketChanges';
import { RecentActions } from './RecentActions';
import { useAudio } from '../hooks/useAudio';
import useAppStore from '../zustand/store';

interface MarketProps {
  gameState: any;
  currentRound: number;
  maxRounds: number;
  actionsByRound?: { [round: number]: string[] };
}

export function Market({ gameState, currentRound, maxRounds, actionsByRound = {} }: MarketProps) {
  const [activeTab, setActiveTab] = useState<'changes' | 'actions'>('actions');
  const { playSound } = useAudio();
  const { market } = useAppStore();

  // Calculate market changes (placeholder data for now)
  const marketChanges = [
    { resource: 'gold' as const, change: 5, percentage: '+5%' },
    { resource: 'water' as const, change: -3, percentage: '-3%' },
    { resource: 'oil' as const, change: 8, percentage: '+8%' },
  ];

  return (
    <div className="bg-pixel-dark-gray pixel-panel border-pixel-gray overflow-hidden">
      {/* Tab Header */}
      <div className="border-b-2 border-pixel-gray">
        <div className="flex">
          <button
            onClick={() => {
              playSound('click');
              setActiveTab('actions');
            }}
            className={`flex-1 px-3 py-2 text-pixel-xs font-bold uppercase tracking-wider transition-colors ${
              activeTab === 'actions'
                ? 'bg-pixel-gray text-pixel-primary border-b-2 border-pixel-primary'
                : 'text-pixel-base-gray hover:text-pixel-primary hover:bg-pixel-gray'
            }`}
          >
            Recent Actions
          </button>
          <button
            onClick={() => {
              playSound('click');
              setActiveTab('changes');
            }}
            className={`flex-1 px-3 py-2 text-pixel-xs font-bold uppercase tracking-wider transition-colors ${
              activeTab === 'changes'
                ? 'bg-pixel-gray text-pixel-primary border-b-2 border-pixel-primary'
                : 'text-pixel-base-gray hover:text-pixel-primary hover:bg-pixel-gray'
            }`}
          >
            Market Trends
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="min-h-[300px]">
        {activeTab === 'actions' ? (
          <div className="p-0">
            <RecentActions
              actions={[]} // Will be populated from actionsByRound
              currentRound={currentRound}
              maxRounds={maxRounds}
              actionsByRound={actionsByRound}
            />
          </div>
        ) : (
          <div className="p-3">
            <MarketChanges changes={marketChanges} />
          </div>
        )}
      </div>
    </div>
  );
}

