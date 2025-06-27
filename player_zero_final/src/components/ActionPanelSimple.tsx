import React from 'react';
import { AssetType, ActionType } from '../zustand/store';

interface Player {
  id: string;
  name: string;
  tokens: number;
  assets: {
    gold: number;
    water: number;
    oil: number;
  };
  totalAssets: number;
}

interface ActionPanelProps {
  selectedAction: ActionType;
  selectedResource: AssetType;
  amount: number;
  targetPlayer: string;
  players: Player[];
  currentPlayer: Player;
  onActionChange: (action: ActionType) => void;
  onResourceChange: (resource: AssetType) => void;
  onAmountChange: (amount: number) => void;
  onTargetChange: (target: string) => void;
  onConfirmAction: () => void;
}

export function ActionPanel({
  selectedAction,
  selectedResource,
  targetPlayer,
  players,
  currentPlayer,
  onActionChange,
  onResourceChange,
  onTargetChange,
  onConfirmAction
}: ActionPanelProps) {
  
  const actions: ActionType[] = ['Buy', 'Sell', 'Burn', 'Sabotage'];
  const resources: AssetType[] = ['Gold', 'Water', 'Oil'];
  
  const resourceEmojis = {
    Gold: '🪙',
    Water: '💧',
    Oil: '🛢️'
  };

  const canPerformAction = () => {
     
    
    const assetKey = selectedResource.toLowerCase() as keyof typeof currentPlayer.assets;
    
    switch (selectedAction) {
      case 'Buy':
        return currentPlayer.tokens >= 10; // Assume minimum cost of 10
      case 'Sell':
      case 'Burn':
        return currentPlayer.assets[assetKey] > 0;
      case 'Sabotage':
        return currentPlayer.tokens >= 100 && targetPlayer && targetPlayer !== '';
      default:
        return false;
    }
  };

  return (
    <div className="bg-pixel-dark-gray pixel-panel border-pixel-gray p-4 space-y-4">
      <h3 className="text-pixel-sm font-bold text-pixel-primary uppercase">Actions</h3>
      
      {/* Action Selection */}
      <div>
        <label className="block text-pixel-xs font-bold text-pixel-primary mb-2">Action</label>
        <div className="grid grid-cols-2 gap-2">
          {actions.map((action) => (
            <button
              key={action}
              onClick={() => onActionChange(action)}
              className={`px-3 py-2 pixel-btn text-pixel-xs font-bold uppercase ${
                selectedAction === action
                  ? 'bg-pixel-primary text-pixel-black border-pixel-black'
                  : 'bg-pixel-gray hover:bg-pixel-light-gray text-pixel-primary border-pixel-light-gray'
              }`}
            >
              {action}
            </button>
          ))}
        </div>
      </div>

      {/* Resource Selection */}
      <div>
        <label className="block text-pixel-xs font-bold text-pixel-primary mb-2">Resource</label>
        <div className="grid grid-cols-3 gap-2">
          {resources.map((resource) => (
            <button
              key={resource}
              onClick={() => onResourceChange(resource)}
              className={`px-2 py-2 pixel-btn text-pixel-xs font-bold uppercase flex flex-col items-center space-y-1 ${
                selectedResource === resource
                  ? 'bg-pixel-accent text-pixel-black border-pixel-black'
                  : 'bg-pixel-gray hover:bg-pixel-light-gray text-pixel-primary border-pixel-light-gray'
              }`}
            >
              <span className="text-base">{resourceEmojis[resource]}</span>
              <span>{resource}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Player Resources Display */}
      <div className="bg-pixel-gray pixel-panel border-pixel-light-gray p-2">
        <div className="text-pixel-xs text-pixel-primary font-bold mb-1">Your Resources</div>
        <div className="text-pixel-xs text-pixel-base-gray">
          Tokens: {currentPlayer.tokens} | 
          Gold: {currentPlayer.assets.gold} | 
          Water: {currentPlayer.assets.water} | 
          Oil: {currentPlayer.assets.oil}
        </div>
      </div>

      {/* Target Selection for Sabotage */}
      {selectedAction === 'Sabotage' && (
        <div>
          <label className="block text-pixel-xs font-bold text-pixel-primary mb-2">Target</label>
          <div className="space-y-1">
            {players
              .filter(p => p.id !== currentPlayer.id)
              .map((player) => (
                <button
                  key={player.id}
                  onClick={() => onTargetChange(player.id)}
                  className={`w-full px-3 py-2 pixel-btn text-pixel-xs font-bold uppercase ${
                    targetPlayer === player.name
                      ? 'bg-pixel-error text-pixel-black border-pixel-black'
                      : 'bg-pixel-gray hover:bg-pixel-light-gray text-pixel-primary border-pixel-light-gray'
                  }`}
                >
                  {player.name}
                </button>
              ))}
          </div>
        </div>
      )}

      {/* Action Cost/Info */}
      <div className="bg-pixel-dark-gray pixel-panel border-pixel-gray p-2">
        <div className="text-pixel-xs text-pixel-primary font-bold">Action Info</div>
        <div className="text-pixel-xs text-pixel-base-gray">
          {selectedAction === 'Buy' && 'Purchase resources with tokens'}
          {selectedAction === 'Sell' && 'Convert resources to tokens'}
          {selectedAction === 'Burn' && 'Destroy resources to boost market'}
          {selectedAction === 'Sabotage' && 'Attack opponent (100 tokens)'}
        </div>
      </div>

      {/* Execute Button */}
      <button
        onClick={onConfirmAction}
        disabled={!canPerformAction()}
        className={`w-full px-4 py-3 pixel-btn font-bold text-pixel-sm uppercase ${
          canPerformAction()
            ? 'bg-pixel-primary hover:bg-pixel-success text-pixel-black border-pixel-black'
            : 'bg-pixel-gray text-pixel-light-gray border-pixel-light-gray cursor-not-allowed'
        }`}
      >
        Execute {selectedAction}
      </button>

      {/* Error Message */}
      {!canPerformAction() && (
        <div className="text-pixel-xs text-pixel-error font-bold text-center">
          {selectedAction === 'Buy' && currentPlayer.tokens < 10 && 'Need more tokens'}
          {(selectedAction === 'Sell' || selectedAction === 'Burn') && 
           currentPlayer.assets[selectedResource.toLowerCase() as keyof typeof currentPlayer.assets] === 0 && 
           'No resources to trade'}
          {selectedAction === 'Sabotage' && !targetPlayer && 'Select a target'}
          {selectedAction === 'Sabotage' && currentPlayer.tokens < 100 && 'Need 100 tokens'}
        </div>
      )}
    </div>
  );
}
