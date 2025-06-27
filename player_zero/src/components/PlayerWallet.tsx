import React from 'react';
import { DollarSign, Circle } from 'lucide-react';
import useAppStore, { Inventory } from '../zustand/store';
import { BigNumberUtils } from '../zustand/store';

interface PlayerWalletProps {
  tokens: number;
  assets: Inventory | null;
}

export function PlayerWallet({ tokens, assets }: PlayerWalletProps) {
  return (
    <div className="bg-pixel-dark-gray pixel-panel border-pixel-gray p-3">
      <h3 className="text-pixel-sm font-bold text-pixel-primary mb-3 uppercase tracking-wider text-center">Wallet</h3>
      
      <div className="space-y-2">
        <div className="pixel-card bg-pixel-gray border-pixel-primary p-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-pixel-primary pixel-avatar flex items-center justify-center">
                <DollarSign className="w-3 h-3 text-pixel-black" />
              </div>
              <div className="text-pixel-primary font-bold text-pixel-xs uppercase">Tokens</div>
            </div>
            <div className="text-pixel-success font-bold text-pixel-base">{tokens}</div>
          </div>
        </div>

        <div className="pixel-card bg-pixel-gray border-pixel-yellow p-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-pixel-yellow pixel-avatar flex items-center justify-center">
                <Circle className="w-3 h-3 text-pixel-black fill-current" />
              </div>
              <div className="text-pixel-primary font-bold text-pixel-xs uppercase">Gold</div>
            </div>
            <div className="text-pixel-yellow font-bold text-pixel-base">{Number(assets?.gold)}</div>
          </div>
        </div>

        <div className="pixel-card bg-pixel-gray border-pixel-blue p-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-pixel-blue pixel-avatar flex items-center justify-center">
                <Circle className="w-3 h-3 text-pixel-black fill-current" />
              </div>
              <div className="text-pixel-primary font-bold text-pixel-xs uppercase">Water</div>
            </div>
            <div className="text-pixel-blue font-bold text-pixel-base">{Number(assets?.water)}</div>
          </div>
        </div>

        <div className="pixel-card bg-pixel-gray border-pixel-magenta p-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-pixel-magenta pixel-avatar flex items-center justify-center">
                <Circle className="w-3 h-3 text-pixel-black fill-current" />
              </div>
              <div className="text-pixel-primary font-bold text-pixel-xs uppercase">Oil</div>
            </div>
            <div className="text-pixel-magenta font-bold text-pixel-base">{Number(assets?.oil)}</div>
          </div>
        </div>
      </div>
    </div>
  );
}