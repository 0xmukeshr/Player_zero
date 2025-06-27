import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { useAccount } from "@starknet-react/core";
import { BigNumberish } from "starknet";
import { dojoConfig } from "../dojoConfig";
import { Market, Game } from '../../zustand/store';
import useAppStore from '../../zustand/store';

interface UseGameReturn {
  game: Game | null;
  isLoading: boolean;
  error: Error | null;
  refetch: (gameId?: string) => Promise<void>;
}

// Constants
const TORII_URL = dojoConfig.toriiUrl + "/graphql";
const GAME_QUERY = `
    query GetGame($gameId: felt252!) {
        playerzeroGameModels(where: { id: $gameId }) {
            edges {
                node {
                    id
                    round
                    is_active
                    max_rounds
                    num_players
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

// Function to fetch game data from GraphQL
const fetchGameData = async (gameId: string): Promise<{ game: Game | null}> => {
  try {
    console.log("🔍 Fetching game data for game:", gameId);

    const response = await fetch(TORII_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: GAME_QUERY,
        variables: { gameId: gameId.toString() }
      }),
    });

    const result = await response.json();
    console.log("📡 Game GraphQL response:", result);

    let gameData: Game | null = null;

    // Extract game data
    if (result.data?.playerzeroGameModels?.edges?.length) {
      const rawGameData = result.data.playerzeroGameModels.edges[0].node;
      console.log("🎮 Raw game data:", rawGameData);

      gameData = {
        id: toBigNumberish(rawGameData.id),
        round: toBigNumberish(rawGameData.round),
        is_active: Boolean(rawGameData.is_active),
        max_rounds: toBigNumberish(rawGameData.max_rounds),
        num_players: toBigNumberish(rawGameData.num_players),
      };

      console.log("✅ Game data after conversion:", gameData);
    } else {
      console.log("❌ No game found in response");
    }

    return { game: gameData};
    
  } catch (error) {
    console.error("❌ Error fetching game data:", error);
    throw error;
  }
};

// Main hook with manual gameId support
export const UseGameData = (gameId?: string): UseGameReturn => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  
  // CRITICAL FIX: Use separate selectors to avoid circular dependencies
  const currentGame = useAppStore(state => state.currentGame);
  const setCurrentGame = useAppStore(state => state.setCurrentGame);
  const updateGameRound = useAppStore(state => state.updateGameRound);

  // Use provided gameId or current game's id
  const activeGameId = useMemo(() => {
    return gameId || currentGame?.id;
  }, [gameId, currentGame?.id]);

  const isFetchingRef = useRef<boolean>(false); 
 
  // Memoize the refetch function to prevent recreation on every render
  const refetch = useCallback(async (manualGameId?: string) => {
    const targetGameId = manualGameId || activeGameId;
    
    if (!targetGameId) {
      console.log("❌ No game ID available for fetch");
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const { game } = await fetchGameData(targetGameId);
      console.log("🎮 Game data fetched:", { game });

      // Update game data in store only if it's different
      if (game) {
        const currentStoreGame = useAppStore.getState().currentGame;
        
        if (!currentStoreGame || currentStoreGame.id !== game.id) {
          // Set new game
          setCurrentGame(game);
          console.log("📝 Set new game in store:", game);
        } else {
          // Check if update is needed
          const needsUpdate = 
            game.round !== currentStoreGame.round ||
            game.is_active !== currentStoreGame.is_active ||
            game.num_players !== currentStoreGame.num_players;

          if (needsUpdate) {
            // Update specific fields to avoid unnecessary re-renders
            if (game.round !== currentStoreGame.round) {
              updateGameRound(game.round);
            }
            
            // Update other properties if they changed
            setCurrentGame({
              ...currentStoreGame,
              ...game
            });
            console.log("🔄 Updated existing game in store:", game);
          } else {
            console.log("✨ No update needed, game data unchanged");
          }
        }
      }

    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error occurred');
      console.error("❌ Error in game refetch:", error);
      setError(error);
    } finally {
      setIsLoading(false);
      isFetchingRef.current = false;
    }
  }, [activeGameId, setCurrentGame, updateGameRound]);

  // Auto-fetch when gameId changes (only if no manual gameId provided)
  useEffect(() => {
    if (activeGameId && !gameId) {
      console.log("🔄 Game ID changed, refetching game data");
      refetch();
    }
  }, [activeGameId, refetch, gameId]);

  return {
    game: currentGame,
    isLoading,
    error,
    refetch
  };
};