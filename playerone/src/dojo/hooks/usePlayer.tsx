import { useEffect, useState, useMemo } from "react";
import { useAccount } from "@starknet-react/core";
import { addAddressPadding } from "starknet";
import { dojoConfig } from "../dojoConfig";
import { Player } from '../../zustand/store';
import useAppStore from '../../zustand/store';

interface UsePlayerReturn {
  player: Player | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

// Constants
const TORII_URL = dojoConfig.toriiUrl + "/graphql";
const PLAYER_QUERY = `
    query GetPlayer($playerAddress: ContractAddress!) {
        playerzeroPlayerModels(where: { address: $playerAddress }) {
            edges {
                node {
                    address
                    name
                    token_balance
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

// Function to fetch player data from GraphQL
const fetchPlayerData = async (playerAddress: string): Promise<Player | null> => {
  try {
    console.log("🔍 Fetching player with address:", playerAddress);

    const response = await fetch(TORII_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: PLAYER_QUERY,
        variables: { playerAddress }
      }),
    });

    const result = await response.json();
    console.log("📡 GraphQL response:", result);

    if (!result.data?.playerzeroPlayerModels?.edges?.length) {
      console.log("❌ No player found in response");
      return null;
    }

    // Extract player data
    const rawPlayerData = result.data.playerzeroPlayerModels.edges[0].node;
    console.log("📄 Raw player data:", rawPlayerData);

    // Convert to PlayerZero Player structure
    const playerData: Player = {
      address: rawPlayerData.address,
      name: toBigNumberish(rawPlayerData.name),
      token_balance: toBigNumberish(rawPlayerData.token_balance)
    };

    console.log("✅ Player data after conversion:", playerData);
    return playerData;

  } catch (error) {
    console.error("❌ Error fetching player:", error);
    throw error;
  }
};

// Main hook
export const usePlayer = (): UsePlayerReturn => {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const { account } = useAccount();

  const storePlayer = useAppStore(state => state.player);
  const setPlayer = useAppStore(state => state.setPlayer);

  const userAddress = useMemo(() =>
    account ? addAddressPadding(account.address).toLowerCase() : '',
    [account]
  );

  const refetch = async () => {
    if (!userAddress) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const playerData = await fetchPlayerData(userAddress);
      console.log("🎮 Player data fetched:", playerData);

      setPlayer(playerData);

      const updatedPlayer = useAppStore.getState().player;
      console.log("💾 Player in store after update:", updatedPlayer);

    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error occurred');
      console.error("❌ Error in refetch:", error);
      setError(error);
      setPlayer(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (userAddress) {
      console.log("🔄 Address changed, refetching player data");
      refetch();
    }
  }, [userAddress]);

  useEffect(() => {
    if (!account) {
      console.log("❌ No account, clearing player data");
      setPlayer(null);
      setError(null);
      setIsLoading(false);
    }
  }, [account, setPlayer]);

  return {
    player: storePlayer,
    isLoading,
    error,
    refetch
  };
};