import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { BigNumberish, CairoCustomEnum, CairoOption, CairoOptionVariant } from 'starknet';
import * as models from '../dojo/bindings'; // Assuming bindings are imported

// Re-export types from bindings for consistency
export type {
  Player,
  Game,
  Inventory,
  Market,
  Action,
  AssetStats,
  ActionExecuted,
  GameStarted,
  GameEnded,
  PlayerJoined,
  SabotageSuccess,
  AssetBurned
} from '../dojo/bindings';

// String enum types for easier handling
export type AssetType = 'Gold' | 'Water' | 'Oil';
export type ActionType = 'Buy' | 'Sell' | 'Burn' | 'Sabotage';

// Proper types for game state
interface GameState {
  id: string;
  players: any[];
  currentRound: number;
  status: 'waiting' | 'playing' | 'finished';
  market: any;
}

interface CurrentPlayer {
  id: string;
  name: string;
  balance: number;
  assets: Record<AssetType, number>;
}

// Utility functions for type conversion
export const AssetTypeUtils = {
  // Convert string to CairoCustomEnum
  toCairoEnum: (asset: AssetType): CairoCustomEnum => {
    try {
      switch (asset) {
        case 'Gold':
          return new CairoCustomEnum({ Gold: "", Water: undefined, Oil: undefined });
        case 'Water':
          return new CairoCustomEnum({ Gold: undefined, Water: "", Oil: undefined });
        case 'Oil':
          return new CairoCustomEnum({ Gold: undefined, Water: undefined, Oil: "" });
        default:
          throw new Error(`Invalid asset type: ${asset}`);
      }
    } catch (error) {
      console.error('Error converting asset to Cairo enum:', error);
      throw error;
    }
  },

  // Convert CairoCustomEnum to string
  fromCairoEnum: (cairoEnum: CairoCustomEnum): AssetType => {
    try {
      if (cairoEnum.variant.Gold !== undefined) return 'Gold';
      if (cairoEnum.variant.Water !== undefined) return 'Water';
      if (cairoEnum.variant.Oil !== undefined) return 'Oil';
      throw new Error('Invalid asset type enum');
    } catch (error) {
      console.error('Error converting Cairo enum to asset:', error);
      throw error;
    }
  },

  // Get all asset types
  all: (): AssetType[] => ['Gold', 'Water', 'Oil']
};

export const ActionTypeUtils = {
  // Convert string to CairoCustomEnum
  toCairoEnum: (action: ActionType): CairoCustomEnum => {
    try {
      switch (action) {
        case 'Buy':
          return new CairoCustomEnum({ Buy: "", Sell: undefined, Burn: undefined, Sabotage: undefined });
        case 'Sell':
          return new CairoCustomEnum({ Buy: undefined, Sell: "", Burn: undefined, Sabotage: undefined });
        case 'Burn':
          return new CairoCustomEnum({ Buy: undefined, Sell: undefined, Burn: "", Sabotage: undefined });
        case 'Sabotage':
          return new CairoCustomEnum({ Buy: undefined, Sell: undefined, Burn: undefined, Sabotage: "" });
        default:
          throw new Error(`Invalid action type: ${action}`);
      }
    } catch (error) {
      console.error('Error converting action to Cairo enum:', error);
      throw error;
    }
  },

  // Convert CairoCustomEnum to string
  fromCairoEnum: (cairoEnum: CairoCustomEnum): ActionType => {
    try {
      if (cairoEnum.variant.Buy !== undefined) return 'Buy';
      if (cairoEnum.variant.Sell !== undefined) return 'Sell';
      if (cairoEnum.variant.Burn !== undefined) return 'Burn';
      if (cairoEnum.variant.Sabotage !== undefined) return 'Sabotage';
      throw new Error('Invalid action type enum');
    } catch (error) {
      console.error('Error converting Cairo enum to action:', error);
      throw error;
    }
  }
};

// BigNumber utilities
export const BigNumberUtils = {
  // Convert BigNumberish to number for display
  toNumber: (value: BigNumberish): number => {
    try {
      if (typeof value === 'number') return value;
      if (typeof value === 'string') return parseInt(value, 10);
      if (typeof value === 'bigint') return Number(value);
      return 0;
    } catch (error) {
      console.error('Error converting BigNumber to number:', error);
      return 0;
    }
  },

  // Convert number to BigNumberish
  fromNumber: (value: number): BigNumberish => value,

  // Format for display
  format: (value: BigNumberish): string => {
    const num = BigNumberUtils.toNumber(value);
    return num.toLocaleString();
  },

  // Compare two BigNumberish values
  equals: (a: BigNumberish, b: BigNumberish): boolean => {
    return BigNumberUtils.toNumber(a) === BigNumberUtils.toNumber(b);
  },

  // Add two BigNumberish values
  add: (a: BigNumberish, b: BigNumberish): BigNumberish => {
    return BigNumberUtils.toNumber(a) + BigNumberUtils.toNumber(b);
  },

  // Subtract two BigNumberish values
  subtract: (a: BigNumberish, b: BigNumberish): BigNumberish => {
    return BigNumberUtils.toNumber(a) - BigNumberUtils.toNumber(b);
  }
};

// Event data interfaces for real-time updates
interface GameEvent {
  type: 'GameStarted' | 'GameEnded' | 'PlayerJoined' | 'ActionExecuted' | 'SabotageSuccess' | 'AssetBurned';
  data: any;
  timestamp: number;
}

// Application state
interface AppState {
  // Player data
  player: models.Player | null;
  inventory: models.Inventory | null;
  
  // Game data
  currentGame: models.Game | null;
  market: models.Market | null;
  gameActions: models.Action[];
  
  // UI state
  isLoading: boolean;
  error: string | null;
  
  // Game state
  gameStarted: boolean;
  selectedAsset: AssetType | null;
  selectedAction: ActionType | null;
  
  // Events
  recentEvents: GameEvent[];
  
  // Connection state
  isConnected: boolean;
  
  // Game Interface state
  gameState: GameState | null;
  currentPlayer: CurrentPlayer | null;
  isHost: boolean;
  amount: number;
  targetPlayer: string;
  notifications: string[];
  gameFinished: boolean;
  showWinnerModal: boolean;
  
  // Mobile UI state
  activeTab: 'wallet' | 'assets' | 'actions' | 'stats';
  showMobileMenu: boolean;
  isLandscape: boolean;
  isMobile: boolean;
}

// Store actions
interface AppActions {
  // Player actions
  setPlayer: (player: models.Player | null) => void;
  updatePlayerBalance: (balance: BigNumberish) => void;
  setInventory: (inventory: models.Inventory | null) => void;
  updateInventoryAsset: (asset: AssetType, amount: BigNumberish) => void;
  
  // Game actions
  setCurrentGame: (game: models.Game | null) => void;
  setMarket: (market: models.Market | null) => void;
  updateGameRound: (round: BigNumberish) => void;
  addGameAction: (action: models.Action) => void;
  clearGameActions: () => void;
  
  // UI actions
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setSelectedAsset: (asset: AssetType | null) => void;
  setSelectedAction: (action: ActionType | null) => void;
  
  // Game flow actions
  startGame: () => void;
  endGame: () => void;
  
  // Event handling
  addEvent: (event: GameEvent) => void;
  clearEvents: () => void;
  handleGameStarted: (data: models.GameStarted) => void;
  handleGameEnded: (data: models.GameEnded) => void;
  handlePlayerJoined: (data: models.PlayerJoined) => void;
  handleActionExecuted: (data: models.ActionExecuted) => void;
  handleSabotageSuccess: (data: models.SabotageSuccess) => void;
  handleAssetBurned: (data: models.AssetBurned) => void;
  
  // Connection actions
  setConnected: (connected: boolean) => void;
  
  // Utility actions
  resetStore: () => void;
  getAssetPrice: (asset: AssetType) => BigNumberish;
  getAssetAmount: (asset: AssetType) => BigNumberish;
  getAssetStats: (asset: AssetType) => models.AssetStats | null;
  canAffordAsset: (asset: AssetType) => boolean;
  getTotalPortfolioValue: () => BigNumberish;
  getPlayerActions: (playerId?: string) => models.Action[];
  
  // Market utilities
  getPriceChange: (asset: AssetType, previousPrice: BigNumberish) => number;
  getMarketVolatility: () => BigNumberish;
  
  // Game Interface actions
  setGameState: (gameState: GameState | null) => void;
  setCurrentPlayer: (player: CurrentPlayer | null) => void;
  setIsHost: (isHost: boolean) => void;
  setAmount: (amount: number) => void;
  setTargetPlayer: (target: string) => void;
  addNotification: (message: string) => void;
  removeNotification: (message: string) => void;
  clearNotifications: () => void;
  setGameFinished: (finished: boolean) => void;
  setShowWinnerModal: (show: boolean) => void;
  
  // Mobile UI actions
  setActiveTab: (tab: 'wallet' | 'assets' | 'actions' | 'stats') => void;
  setShowMobileMenu: (show: boolean) => void;
  setIsLandscape: (landscape: boolean) => void;
  setIsMobile: (mobile: boolean) => void;
}

// Combine state and actions
type AppStore = AppState & AppActions;

// Initial state - now includes all properties from AppState
const initialState: AppState = {
  // Player data
  player: null,
  inventory: null,
  
  // Game data
  currentGame: null,
  market: null,
  gameActions: [],
  
  // UI state
  isLoading: false,
  error: null,
  
  // Game state
  gameStarted: false,
  selectedAsset: null,
  selectedAction: null,
  
  // Events
  recentEvents: [],
  
  // Connection state
  isConnected: false,
  
  // Game Interface state
  gameState: null,
  currentPlayer: null,
  isHost: false,
  amount: 0,
  targetPlayer: '',
  notifications: [],
  gameFinished: false,
  showWinnerModal: false,
  
  // Mobile UI state
  activeTab: 'wallet',
  showMobileMenu: false,
  isLandscape: false,
  isMobile: false,
};

// Create the store
const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      // Initial state
      ...initialState,

      // Player actions
      setPlayer: (player) => set({ player }),
      
      updatePlayerBalance: (token_balance) => set((state) => ({
        player: state.player ? { ...state.player, token_balance } : null
      })),

      setInventory: (inventory) => set({ inventory }),

      updateInventoryAsset: (asset, amount) => set((state) => {
        if (!state.inventory) return state;
        
        const assetKey = asset.toLowerCase() as keyof Pick<models.Inventory, 'gold' | 'water' | 'oil'>;
        return {
          inventory: {
            ...state.inventory,
            [assetKey]: amount
          }
        };
      }),

      // Game actions
      setCurrentGame: (currentGame) => set({ currentGame }),
      
      setMarket: (market) => set({ market }),

      updateGameRound: (round) => set((state) => ({
        currentGame: state.currentGame ? { ...state.currentGame, round } : null
      })),

      addGameAction: (action) => set((state) => ({
        gameActions: [...state.gameActions, action]
      })),

      clearGameActions: () => set({ gameActions: [] }),

      // UI actions
      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),
      setSelectedAsset: (selectedAsset) => set({ selectedAsset }),
      setSelectedAction: (selectedAction) => set({ selectedAction }),

      // Game flow actions
      startGame: () => set({ gameStarted: true }),
      endGame: () => set({ 
        gameStarted: false, 
        currentGame: null, 
        market: null, 
        inventory: null,
        gameActions: [],
        selectedAsset: null,
        selectedAction: null,
        gameFinished: false,
        showWinnerModal: false
      }),

      // Event handling
      addEvent: (event) => set((state) => ({
        recentEvents: [event, ...state.recentEvents].slice(0, 50) // Keep last 50 events
      })),

      clearEvents: () => set({ recentEvents: [] }),

      handleGameStarted: (data) => {
        try {
          const event: GameEvent = {
            type: 'GameStarted',
            data,
            timestamp: Date.now()
          };
          set((state) => ({
            gameStarted: true,
            recentEvents: [event, ...state.recentEvents].slice(0, 50)
          }));
        } catch (error) {
          console.error('Error handling game started:', error);
          set({ error: 'Failed to handle game started event' });
        }
      },

      handleGameEnded: (data) => {
        try {
          const event: GameEvent = {
            type: 'GameEnded',
            data,
            timestamp: Date.now()
          };
          get().endGame();
          get().addEvent(event);
        } catch (error) {
          console.error('Error handling game ended:', error);
          set({ error: 'Failed to handle game ended event' });
        }
      },

      handlePlayerJoined: (data) => {
        try {
          const event: GameEvent = {
            type: 'PlayerJoined',
            data,
            timestamp: Date.now()
          };
          get().addEvent(event);
        } catch (error) {
          console.error('Error handling player joined:', error);
          set({ error: 'Failed to handle player joined event' });
        }
      },

      handleActionExecuted: (data) => {
        try {
          const event: GameEvent = {
            type: 'ActionExecuted',
            data,
            timestamp: Date.now()
          };
          get().addEvent(event);
        } catch (error) {
          console.error('Error handling action executed:', error);
          set({ error: 'Failed to handle action executed event' });
        }
      },

      handleSabotageSuccess: (data) => {
        try {
          const event: GameEvent = {
            type: 'SabotageSuccess',
            data,
            timestamp: Date.now()
          };
          get().addEvent(event);
        } catch (error) {
          console.error('Error handling sabotage success:', error);
          set({ error: 'Failed to handle sabotage success event' });
        }
      },

      handleAssetBurned: (data) => {
        try {
          const event: GameEvent = {
            type: 'AssetBurned',
            data,
            timestamp: Date.now()
          };
          
          // Update market price
          const { market } = get();
          if (market) {
            const asset = AssetTypeUtils.fromCairoEnum(data.asset);
            const updatedMarket = { ...market };
            
            switch (asset) {
              case 'Gold':
                updatedMarket.gold_price = data.new_price;
                break;
              case 'Water':
                updatedMarket.water_price = data.new_price;
                break;
              case 'Oil':
                updatedMarket.oil_price = data.new_price;
                break;
            }
            
            set({ market: updatedMarket });
          }
          
          get().addEvent(event);
        } catch (error) {
          console.error('Error handling asset burned:', error);
          set({ error: 'Failed to handle asset burned event' });
        }
      },

      // Connection actions
      setConnected: (isConnected) => set({ isConnected }),

      // Utility actions
      resetStore: () => set(initialState),

      getAssetPrice: (asset) => {
        const { market } = get();
        if (!market) return 0;
        
        switch (asset) {
          case 'Gold': return market.gold_price;
          case 'Water': return market.water_price;
          case 'Oil': return market.oil_price;
          default: return 0;
        }
      },

      getAssetAmount: (asset) => {
        const { inventory } = get();
        if (!inventory) return 0;
        
        switch (asset) {
          case 'Gold': return inventory.gold;
          case 'Water': return inventory.water;
          case 'Oil': return inventory.oil;
          default: return 0;
        }
      },

      getAssetStats: (asset) => {
        const { market } = get();
        if (!market) return null;
        
        switch (asset) {
          case 'Gold': return market.gold_stats;
          case 'Water': return market.water_stats;
          case 'Oil': return market.oil_stats;
          default: return null;
        }
      },

      canAffordAsset: (asset) => {
        const { player } = get();
        if (!player) return false;
        
        const price = get().getAssetPrice(asset);
        const balance = BigNumberUtils.toNumber(player.token_balance);
        const assetPrice = BigNumberUtils.toNumber(price);
        
        return balance >= assetPrice;
      },

      getTotalPortfolioValue: () => {
        const { inventory } = get();
        if (!inventory) return 0;
        
        const goldValue = BigNumberUtils.toNumber(inventory.gold) * BigNumberUtils.toNumber(get().getAssetPrice('Gold'));
        const waterValue = BigNumberUtils.toNumber(inventory.water) * BigNumberUtils.toNumber(get().getAssetPrice('Water'));
        const oilValue = BigNumberUtils.toNumber(inventory.oil) * BigNumberUtils.toNumber(get().getAssetPrice('Oil'));
        
        return goldValue + waterValue + oilValue;
      },

      getPlayerActions: (playerId) => {
        const { gameActions, player } = get();
        const targetPlayerId = playerId || player?.address;
        
        if (!targetPlayerId) return [];
        
        return gameActions.filter(action => action.player_id === targetPlayerId);
      },

      getPriceChange: (asset, previousPrice) => {
        const currentPrice = BigNumberUtils.toNumber(get().getAssetPrice(asset));
        const prevPrice = BigNumberUtils.toNumber(previousPrice);
        
        if (prevPrice === 0) return 0;
        
        return ((currentPrice - prevPrice) / prevPrice) * 100;
      },

      getMarketVolatility: () => {
        const { market } = get();
        return market?.volatility_seed || 0;
      },

      // Game Interface actions (previously missing)
      setGameState: (gameState) => set({ gameState }),
      
      setCurrentPlayer: (currentPlayer) => set({ currentPlayer }),
      
      setIsHost: (isHost) => set({ isHost }),
      
      setAmount: (amount) => set({ amount }),
      
      setTargetPlayer: (targetPlayer) => set({ targetPlayer }),
      
      addNotification: (message) => set((state) => ({
        notifications: [...state.notifications, message]
      })),
      
      removeNotification: (message) => set((state) => ({
        notifications: state.notifications.filter(n => n !== message)
      })),
      
      clearNotifications: () => set({ notifications: [] }),
      
      setGameFinished: (gameFinished) => set({ gameFinished }),
      
      setShowWinnerModal: (showWinnerModal) => set({ showWinnerModal }),

      // Mobile UI actions (previously missing)
      setActiveTab: (activeTab) => set({ activeTab }),
      
      setShowMobileMenu: (showMobileMenu) => set({ showMobileMenu }),
      
      setIsLandscape: (isLandscape) => set({ isLandscape }),
      
      setIsMobile: (isMobile) => set({ isMobile }),
    }),
    {
      name: 'playerzero-store',
      partialize: (state) => ({
        player: state.player,
        currentGame: state.currentGame,
        gameStarted: state.gameStarted,
        selectedAsset: state.selectedAsset,
        selectedAction: state.selectedAction,
        isHost: state.isHost,
        gameFinished: state.gameFinished,
        activeTab: state.activeTab,
      }),
    }
  )
);

export default useAppStore;