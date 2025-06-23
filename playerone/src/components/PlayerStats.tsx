import React from 'react';
import { Player } from '../types/game';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface PlayerStatsProps {
  players: Player[];
}

export function PlayerStats({ players }: PlayerStatsProps) {
  // Sort players by total points (tokens + assets * market prices)
  const sortedPlayers = [...players].sort((a, b) => {
    // Use finalScore if available (game finished), otherwise calculate live score
    const aPoints = a.finalScore || (a.tokens + (a.assets.gold * 10) + (a.assets.water * 15) + (a.assets.oil * 25));
    const bPoints = b.finalScore || (b.tokens + (b.assets.gold * 10) + (b.assets.water * 15) + (b.assets.oil * 25));
    return bPoints - aPoints;
  });

  const getRankIcon = (index: number) => {
    if (index === 0) return <TrendingUp className="w-3 h-3 text-pixel-success" />;
    if (index === sortedPlayers.length - 1) return <TrendingDown className="w-3 h-3 text-pixel-error" />;
    return <Minus className="w-3 h-3 text-pixel-light-gray" />;
  };

  const getRankColor = (index: number) => {
    if (index === 0) return 'text-pixel-success';
    if (index === 1) return 'text-pixel-blue';
    if (index === 2) return 'text-pixel-secondary';
    return 'text-pixel-primary'; // Changed from light-gray to primary (white)
  };

  return (
    <div className="bg-pixel-dark-gray pixel-panel border-pixel-gray overflow-hidden">
      <div className="px-3 py-2 border-b-2 border-pixel-gray">
        <h3 className="text-pixel-sm font-bold text-pixel-primary uppercase tracking-wider text-center">Leaderboard</h3>
      </div>
      
      {/* Compact Player List */}
      <div className="p-2 space-y-1">
        {sortedPlayers.slice(0, 4).map((player, index) => {
          const totalPoints = player.tokens + (player.assets.gold * 10) + (player.assets.water * 15) + (player.assets.oil * 25);
          
          return (
            <div 
              key={player.id} 
              className="pixel-card bg-pixel-gray border-pixel-light-gray p-3 hover:bg-pixel-light-gray transition-colors"
            >
              <div className="flex items-center justify-between">
                {/* Rank & Player */}
                <div className="flex items-center space-x-2">
                  <div className="flex items-center space-x-2">
                    {getRankIcon(index)}
                    <span className={`font-bold text-pixel-xs ${getRankColor(index)}`}>
                      #{index + 1}
                    </span>
                  </div>
                  <div className="text-pixel-primary font-bold text-pixel-xs truncate max-w-[70px]">
                    {player.name.split(' ')[0]}
                  </div>
                </div>

                {/* Assets */}
                <div className="flex items-center space-x-2">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-pixel-yellow pixel-avatar"></div>
                    <span className="text-pixel-yellow font-bold text-pixel-xs">{player.assets.gold}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-pixel-blue pixel-avatar"></div>
                    <span className="text-pixel-blue font-bold text-pixel-xs">{player.assets.water}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-pixel-magenta pixel-avatar"></div>
                    <span className="text-pixel-magenta font-bold text-pixel-xs">{player.assets.oil}</span>
                  </div>
                </div>

                {/* Total Points */}
                <div className={`font-bold text-pixel-xs ${getRankColor(index)}`}>
                  {Math.floor(totalPoints/100)}K
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Compact Footer */}
      <div className="bg-pixel-gray px-2 py-1 border-t-2 border-pixel-light-gray">
        <div className="text-pixel-xs text-pixel-light-gray font-bold text-center uppercase">
          Pts = Tokens + Assets
        </div>
      </div>
    </div>
  );
}