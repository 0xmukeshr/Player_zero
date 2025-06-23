import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { BigNumberish } from 'starknet';

// Interfaces matching your bindings
export interface Player {
  address: string;
  name: BigNumberish;
  token_balance: BigNumberish;
}

export interface Game {
  id: BigNumberish;
  round: BigNumberish;
  is_active: boolean;
  max_rounds: BigNumberish;
  num_players: BigNumberish;
}

export interface Inventory {
  player: string;
  gold: BigNumberish;
  water: BigNumberish;
  oil: BigNumberish;
}

export interface Market {
  game_id: BigNumberish;
  gold_price: BigNumberish;
  water_price: BigNumberish;
  oil_price: BigNumberish;
  volatility_seed: BigNumberish;
}

export type AssetType = 'Gold' | 'Water' | 'Oil';
export type ActionType = 'Buy' | 'Sell' | 'Burn' | 'Sabotage';

// Application state
interface AppState {
  // Player data
  player: Player | null;
  inventory: Inventory | null;
  
  // Game data
  currentGame: Game | null;
  market: Market | null;
  
  // UI state
  isLoading: boolean;
  error: string | null;
  
  // Game state
  gameStarted: boolean;
  selectedAsset: AssetType | null;
}

// Store actions
interface AppActions {
  // Player actions
  setPlayer: (player: Player | null) => void;
  updatePlayerBalance: (balance: BigNumberish) => void;
  setInventory: (inventory: Inventory | null) => void;
  updateInventoryAsset: (asset: AssetType, amount: BigNumberish) => void;
  
  // Game actions
  setCurrentGame: (game: Game | null) => void;
  setMarket: (market: Market | null) => void;
  updateGameRound: (round: BigNumberish) => void;
  
  // UI actions
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setSelectedAsset: (asset: AssetType | null) => void;
  
  // Game flow actions
  startGame: () => void;
  endGame: () => void;
  
  // Utility actions
  resetStore: () => void;
  getAssetPrice: (asset: AssetType) => BigNumberish;
  getAssetAmount: (asset: AssetType) => BigNumberish;
}

// Combine state and actions
type AppStore = AppState & AppActions;

// Initial state
const initialState: AppState = {
  player: null,
  inventory: null,
  currentGame: null,
  market: null,
  isLoading: false,
  error: null,
  gameStarted: false,
  selectedAsset: null,
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
        
        const assetKey = asset.toLowerCase() as keyof Pick<Inventory, 'gold' | 'water' | 'oil'>;
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

      // UI actions
      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),
      setSelectedAsset: (selectedAsset) => set({ selectedAsset }),

      // Game flow actions
      startGame: () => set({ gameStarted: true }),
      endGame: () => set({ 
        gameStarted: false, 
        currentGame: null, 
        market: null, 
        inventory: null 
      }),

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
    }),
    {
      name: 'playerzero-store',
      partialize: (state) => ({
        player: state.player,
        currentGame: state.currentGame,
        gameStarted: state.gameStarted,
      }),
    }
  )
);

export default useAppStore;