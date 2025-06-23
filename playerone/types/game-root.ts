export interface Game {
  id: string;
  name: string;
  status: 'Open' | 'In Progress' | 'Finished';
  currentPlayers: number;
  maxPlayers: number;
  createdAt: Date;
  currentRound?: number;
  maxRounds?: number;
  isPrivate: boolean;
  hostName?: string;
}

export interface User {
  id: string;
  name: string;
  avatar: string;
}

export interface GameState {
  currentRound: number;
  maxRounds: number;
  timeRemaining: {
    hours: number;
    minutes: number;
    seconds: number;
  };
  players: Player[];
  currentPlayer: Player;
  marketChanges: MarketChange[];
  recentActions: string[];
  host:string[];
}

export interface Player {
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

export interface MarketChange {
  resource: 'gold' | 'water' | 'oil';
  change: number;
  percentage: string;
}

export interface Action {
  type: 'buy' | 'sell' | 'burn' | 'sabotage';
  resource: 'gold' | 'water' | 'oil';
  amount: number;
  target?: string; // for sabotage
}