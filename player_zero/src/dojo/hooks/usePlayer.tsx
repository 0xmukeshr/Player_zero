import { useEffect, useState, useMemo } from "react";
import { useAccount } from "@starknet-react/core";
import { addAddressPadding } from "starknet";
import { dojoConfig } from "../dojoConfig";
import { Player, Inventory } from '../../zustand/store';
import useAppStore from '../../zustand/store';
import { BigNumberUtils } from '../../zustand/store';

interface UsePlayerReturn {
  player: Player | null;
  inventory: Inventory | null;
  isLoading: boolean; 
  refetch: () => Promise<void>;
  refetchPlayer: () => Promise<void>;
  refetchInventory: () => Promise<void>;
}


// Constants
const TORII_URL = dojoConfig.toriiUrl + "/graphql";

// GraphQL Queries
const PLAYER_QUERY = `
    query GetPlayerAndInventory($playerAddress: ContractAddress!) {
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

const INVENTORY_QUERY = `
    query GetInventory($playerAddress: ContractAddress!) {
        playerzeroInventoryModels(where: { player: $playerAddress }) {
            edges {
                node {
                    player
                    gold
                    water
                    oil
                }
            }
            totalCount
        }
    }
`;

const COMBINED_QUERY = `
    query GetPlayerAndInventory($playerAddress: ContractAddress!) {
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
        playerzeroInventoryModels(where: { player: $playerAddress }) {
            edges {
                node {
                    player
                    gold
                    water
                    oil
                }
            }
            totalCount
        }
    }
`;

// Helper to convert hex/string values to BigNumberish
const toBigNumberish = (value: string | number | null | undefined): string => {
  if (value === null || value === undefined) return "0";
  
  if (typeof value === 'number') return value.toString();
  
  if (typeof value === 'string' && value.startsWith('0x')) {
    try {
      return parseInt(value, 16).toString();
    }catch (e) {
      console.warn("Failed to parse hex value:", value);
      return "0";
    }
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

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    console.log("📡 Player GraphQL response:", result);

    if (result.errors) {
      throw new Error(`GraphQL errors: ${JSON.stringify(result.errors)}`);
    }

    if (!result.data?.playerzeroPlayerModels?.edges?.length) {
      console.log("❌ No player found in response");
      return null;
    }

    // Extract player data
    const rawPlayerData = result.data.playerzeroPlayerModels.edges[0].node;
    console.log("📄 Raw player data:", rawPlayerData);

    // Convert to PlayerZero Player structure
    // Check if we have a display name in localStorage, otherwise use the hex converted name
    let displayName = toBigNumberish(rawPlayerData.name);
    try {
      const userProfile = localStorage.getItem('userProfile');
      if (userProfile) {
        const profile = JSON.parse(userProfile);
        if (profile.name) {
          displayName = profile.name;
        }
      }
    } catch (error) {
      console.warn('Failed to get display name from userProfile:', error);
    }
    
    const playerData: Player = {
      address: rawPlayerData.address,
      name: displayName,
      token_balance: toBigNumberish(rawPlayerData.token_balance)
    };

    console.log("✅ Player data after conversion:", playerData);
    return playerData;

  } catch (error) {
    console.error("❌ Error fetching player:", error);
    throw error;
  }
};

// Function to fetch inventory data from GraphQL
const fetchInventoryData = async (playerAddress: string): Promise<Inventory | null> => {
  try {
    console.log("🎒 Fetching inventory for address:", playerAddress);

    const response = await fetch(TORII_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: INVENTORY_QUERY,
        variables: { playerAddress }
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    console.log("📡 Inventory GraphQL response:", result);

    if (result.errors) {
      throw new Error(`GraphQL errors: ${JSON.stringify(result.errors)}`);
    }

    if (!result.data?.playerzeroInventoryModels?.edges?.length) {
      console.log("❌ No inventory found in response, creating default");
      // Return default inventory if none exists
      return {
        player: playerAddress,
        gold: "0",
        water: "0", 
        oil: "0"
      };
    }

    // Extract inventory data
    const rawInventoryData = result.data.playerzeroInventoryModels.edges[0].node;
    console.log("📄 Raw inventory data:", rawInventoryData);

    // Convert to PlayerZero Inventory structure
    const inventoryData: Inventory = {
      player: rawInventoryData.player,
      gold: toBigNumberish(rawInventoryData.gold),
      water: toBigNumberish(rawInventoryData.water),
      oil: toBigNumberish(rawInventoryData.oil)
    };

    console.log("✅ Inventory data after conversion:", inventoryData);
    return inventoryData;

  } catch (error) {
    console.error("❌ Error fetching inventory:", error);
    throw error;
  }
};

// Function to fetch both player and inventory data in one query
const fetchPlayerAndInventoryData = async (playerAddress: string): Promise<{
  player: Player | null;
  inventory: Inventory | null;
}> => {
  try {
    console.log("🔍 Fetching player and inventory with address:", playerAddress);

    const response = await fetch(TORII_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: COMBINED_QUERY,
        variables: { playerAddress }
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    console.log("📡 Combined GraphQL response:", result);

    if (result.errors) {
      throw new Error(`GraphQL errors: ${JSON.stringify(result.errors)}`);
    }

    let player: Player | null = null;
    let inventory: Inventory | null = null;

    // Process player data
    if (result.data?.playerzeroPlayerModels?.edges?.length) {
      const rawPlayerData = result.data.playerzeroPlayerModels.edges[0].node;
      
      // Check if we have a display name in localStorage, otherwise use the hex converted name
      let displayName = toBigNumberish(rawPlayerData.name);
      try {
        const userProfile = localStorage.getItem('userProfile');
        if (userProfile) {
          const profile = JSON.parse(userProfile);
          if (profile.name) {
            displayName = profile.name;
          }
        }
      } catch (error) {
        console.warn('Failed to get display name from userProfile:', error);
      }
      
      player = {
        address: rawPlayerData.address,
        name: displayName,
        token_balance: toBigNumberish(rawPlayerData.token_balance)
      };
      console.log("✅ Player data processed:", player);
    }

    // Process inventory data
    if (result.data?.playerzeroInventoryModels?.edges?.length) {
      const rawInventoryData = result.data.playerzeroInventoryModels.edges[0].node;
      inventory = {
        player: rawInventoryData.player,
        gold: toBigNumberish(rawInventoryData.gold),
        water: toBigNumberish(rawInventoryData.water),
        oil: toBigNumberish(rawInventoryData.oil)
      };
      console.log("✅ Inventory data processed:", inventory);
    } else if (player) {
      // Create default inventory if player exists but no inventory found
      inventory = {
        player: playerAddress,
        gold: "0",
        water: "0",
        oil: "0"
      };
      console.log("✅ Default inventory created:", inventory);
    }

    return { player, inventory };

  } catch (error) {
    console.error("❌ Error fetching player and inventory:", error);
    throw error;
  }
};

// Main hook
export const usePlayer = (): UsePlayerReturn => {
  const [isLoading, setIsLoading] = useState<boolean>(true); 
  const { account } = useAccount();

  // Store selectors
  const storePlayer = useAppStore(state => state.player);
  const storeInventory = useAppStore(state => state.inventory);
  const setPlayer = useAppStore(state => state.setPlayer);
  const setInventory = useAppStore(state => state.setInventory);
  const setError = useAppStore(state => state.setError);
  const setLoading = useAppStore(state => state.setLoading);

  const userAddress = useMemo(() =>
    account ? addAddressPadding(account.address).toLowerCase() : '',
    [account]
  );

  // Individual refetch functions
  const refetchPlayer = async () => {
    if (!userAddress) return;

    try {
      setLoading(true);
      const playerData = await fetchPlayerData(userAddress);
      setPlayer(playerData);
      console.log("🎮 Player data refreshed:", playerData);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to fetch player');
      console.error("❌ Error refetching player:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const refetchInventory = async () => {
    if (!userAddress) return;

    try {
      setLoading(true);
      const inventoryData = await fetchInventoryData(userAddress);
      setInventory(inventoryData);
      console.log("🎒 Inventory data refreshed:", inventoryData);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to fetch inventory');
      console.error("❌ Error refetching inventory:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Combined refetch function
  const refetch = async () => {
    if (!userAddress) {
      setIsLoading(false);
      setLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setLoading(true);
      setError(null);
      setError(null);

      const { player, inventory } = await fetchPlayerAndInventoryData(userAddress);
      
      console.log("🎮 Combined data fetched - Player:", player);
      console.log("🎒 Combined data fetched - Inventory:", inventory);

      // Update store
      setPlayer(player);
      setInventory(inventory);

      // Log final store state
      const finalState = useAppStore.getState();
      console.log("💾 Final store state - Player:", finalState.player);
      console.log("💾 Final store state - Inventory:", finalState.inventory);

    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error occurred');
      console.error("❌ Error in refetch:", error);
     
      setError(error.message);
      setPlayer(null);
      setInventory(null);
    } finally {
      setIsLoading(false);
      setLoading(false);
    }
  };

  // Effect to fetch data when address changes
  useEffect(() => {
    if (userAddress) {
      console.log("🔄 Address changed, refetching player and inventory data for:", userAddress);
      refetch();
    }
  }, [userAddress]);

  // Effect to clear data when account disconnects
  useEffect(() => {
    if (!account) {
      console.log("❌ No account, clearing player and inventory data");
      setPlayer(null);
      setInventory(null);
      setError(null);
      setIsLoading(false);
      setLoading(false);
    }
  }, [account, setPlayer, setInventory, setError, setLoading]);

  // Debug logging for store changes
  useEffect(() => {
    console.log("🔄 Store player changed:", storePlayer);
  }, [storePlayer]);

  useEffect(() => {
    console.log("🔄 Store inventory changed:", storeInventory);
  }, [storeInventory]);

  return {
    player: storePlayer,
    inventory: storeInventory,
    isLoading, 
    refetch,
    refetchPlayer,
    refetchInventory
  };
};