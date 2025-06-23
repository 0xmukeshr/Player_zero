import { useEffect, useState, useMemo, useCallback } from "react";
import { useAccount } from "@starknet-react/core";
import { BigNumberish } from "starknet";
import { dojoConfig } from "../dojoConfig";
import { Market } from '../../zustand/store';
import useAppStore from '../../zustand/store';

interface UseMarketReturn {
  market: Market | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

// Constants
const TORII_URL = dojoConfig.toriiUrl + "/graphql";
const MARKET_QUERY = `
    query GetMarket($gameId: u32!) {
        playerzeroMarketModels(where: { game_id: $gameId }) {
            edges {
                node {
                    game_id
                    gold_price
                    water_price
                    oil_price
                    volatility_seed
                    gold_stats {
                        bought
                        sold
                        burned
                        sabotaged
                    }
                    water_stats {
                        bought
                        sold
                        burned
                        sabotaged
                    }
                    oil_stats {
                        bought
                        sold
                        burned
                        sabotaged
                    }
                }
            }
            totalCount
        }
    }
`;

// Helper to convert hex/string values to BigNumberish
const toBigNumberish = (value: string | number): string => {
  if (typeof value === 'number') return value.toString();
  
  if (typeof value === 'string' && value.startsWith('0x')) {
    return parseInt(value, 16).toString();
  }
  
  if (typeof value === 'string') {
    return value;
  }
  
  return "0";
};

// Function to fetch market data from GraphQL
const fetchMarketData = async (gameId: BigNumberish): Promise<Market | null> => {
  try {
    console.log("🔍 Fetching market data for game:", gameId);

    const response = await fetch(TORII_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: MARKET_QUERY,
        variables: { gameId: Number(gameId) }
      }),
    });

    const result = await response.json();
    console.log("📡 Market GraphQL response:", result);

    if (!result.data?.playerzeroMarketModels?.edges?.length) {
      console.log("❌ No market found in response");
      return null;
    }

    // Extract market data
    const rawMarketData = result.data.playerzeroMarketModels.edges[0].node;
    console.log("📄 Raw market data:", rawMarketData);

    // Convert to Market structure
    const marketData: Market = {
      game_id: toBigNumberish(rawMarketData.game_id),
      gold_price: toBigNumberish(rawMarketData.gold_price),
      water_price: toBigNumberish(rawMarketData.water_price),
      oil_price: toBigNumberish(rawMarketData.oil_price),
      volatility_seed: toBigNumberish(rawMarketData.volatility_seed),
      gold_stats: {
        bought: toBigNumberish(rawMarketData.gold_stats.bought),
        sold: toBigNumberish(rawMarketData.gold_stats.sold),
        burned: toBigNumberish(rawMarketData.gold_stats.burned),
        sabotaged: toBigNumberish(rawMarketData.gold_stats.sabotaged),
      },
      water_stats: {
        bought: toBigNumberish(rawMarketData.water_stats.bought),
        sold: toBigNumberish(rawMarketData.water_stats.sold),
        burned: toBigNumberish(rawMarketData.water_stats.burned),
        sabotaged: toBigNumberish(rawMarketData.water_stats.sabotaged),
      },
      oil_stats: {
        bought: toBigNumberish(rawMarketData.oil_stats.bought),
        sold: toBigNumberish(rawMarketData.oil_stats.sold),
        burned: toBigNumberish(rawMarketData.oil_stats.burned),
        sabotaged: toBigNumberish(rawMarketData.oil_stats.sabotaged),
      }
    };

    console.log("✅ Market data after conversion:", marketData);
    return marketData;

  } catch (error) {
    console.error("❌ Error fetching market:", error);
    throw error;
  }
};

// Main hook
export const useMarket = (gameId?: BigNumberish): UseMarketReturn => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const { account } = useAccount();

  const storeMarket = useAppStore(state => state.market);
  const setMarket = useAppStore(state => state.setMarket);
  const currentGame = useAppStore(state => state.currentGame);

  // Use provided gameId or current game's id
  const activeGameId = useMemo(() => {
    return gameId || currentGame?.id;
  }, [gameId, currentGame?.id]);

  const refetch = useCallback(async () => {
    if (!activeGameId) {
      console.log("❌ No game ID available for market fetch");
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const marketData = await fetchMarketData(activeGameId);
      console.log("💰 Market data fetched:", marketData);

      setMarket(marketData);

      const updatedMarket = useAppStore.getState().market;
      console.log("💾 Market in store after update:", updatedMarket);

    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error occurred');
      console.error("❌ Error in market refetch:", error);
      setError(error);
      setMarket(null);
    } finally {
      setIsLoading(false);
    }
  }, [activeGameId, setMarket]);

  // Auto-fetch when gameId changes
  useEffect(() => {
    if (activeGameId) {
      console.log("🔄 Game ID changed, refetching market data");
      refetch();
    }
  }, [activeGameId, refetch]);

  // Clear market when no account
  useEffect(() => {
    if (!account) {
      console.log("❌ No account, clearing market data");
      setMarket(null);
      setError(null);
      setIsLoading(false);
    }
  }, [account, setMarket]);

  // Clear market when no game
  useEffect(() => {
    if (!currentGame) {
      console.log("❌ No current game, clearing market data");
      setMarket(null);
      setError(null);
      setIsLoading(false);
    }
  }, [currentGame, setMarket]);

  return {
    market: storeMarket,
    isLoading,
    error,
    refetch
  };
};