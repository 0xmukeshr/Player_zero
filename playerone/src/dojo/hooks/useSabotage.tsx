import { useState, useCallback } from "react";
import { useAccount } from "@starknet-react/core";
import { useDojoSDK } from "@dojoengine/sdk/react";
import { Account, CairoCustomEnum } from "starknet";
import useAppStore, { AssetType } from "../../zustand/store";

interface SabotageActionState {
  isLoading: boolean;
  error: string | null;
  txHash: string | null;
  txStatus: 'PENDING' | 'SUCCESS' | 'REJECTED' | null;
}

interface UseSabotageReturn {
  sabotageState: SabotageActionState;
  executeSabotage: (targetPlayer: string, asset: AssetType) => Promise<void>;
  canSabotage: boolean;
  resetSabotageState: () => void;
}

export const useSabotage = (): UseSabotageReturn => {
  const { account, status } = useAccount();
  const { client } = useDojoSDK();
  const { 
    player, 
    currentGame, 
    inventory,
    getAssetAmount
  } = useAppStore();

  const [sabotageState, setSabotageState] = useState<SabotageActionState>({
    isLoading: false,
    error: null,
    txHash: null,
    txStatus: null
  });

  const isConnected = status === "connected";
  const hasPlayer = player !== null;
  const hasActiveGame = currentGame?.is_active === true;
  const canSabotage = isConnected && hasPlayer && hasActiveGame && !sabotageState.isLoading;

  const executeSabotage = useCallback(async (targetPlayer: string, asset: AssetType) => {
    if (!canSabotage || !account || !currentGame) {
      setSabotageState(prev => ({
        ...prev,
        error: !account ? "Please connect your controller" : 
               !currentGame ? "No active game found" : 
               "Cannot sabotage right now"
      }));
      return;
    }

    // Validate target player
    if (!targetPlayer || targetPlayer.trim() === "") {
      setSabotageState(prev => ({
        ...prev,
        error: "Please select a target player"
      }));
      return;
    }

    // Check if player is trying to sabotage themselves
    if (targetPlayer === player?.address) {
      setSabotageState(prev => ({
        ...prev,
        error: "You cannot sabotage yourself"
      }));
      return;
    }

    // Optional: Check if player has resources/cost for sabotage
    // This depends on your game mechanics - you might require tokens or specific assets
    
    try {
      setSabotageState({
        isLoading: true,
        error: null,
        txHash: null,
        txStatus: 'PENDING'
      });

      console.log(`📤 Executing sabotage ${asset} on ${targetPlayer}...`);

      // Create asset enum for the transaction
      const assetEnum = new CairoCustomEnum({ 
        [asset]: asset === 'Gold' ? "" : undefined,
        Gold: asset === 'Gold' ? "" : undefined,
        Water: asset === 'Water' ? "" : undefined,
        Oil: asset === 'Oil' ? "" : undefined,
      });

      const tx = await client.actions.sabotagePlayer(
        account as Account, 
        currentGame.id, 
        targetPlayer,
        assetEnum
      );
      
      console.log("📥 Sabotage transaction response:", tx);

      if (tx?.transaction_hash) {
        setSabotageState(prev => ({ ...prev, txHash: tx.transaction_hash }));
      }

      if (tx && tx.code === "SUCCESS") {
        console.log(`✅ Sabotage ${asset} on ${targetPlayer} successful!`);

        // Note: Sabotage success depends on game mechanics
        // You might want to refresh game state to see if sabotage was successful
        // The actual effect (reducing target's assets) should be handled by contract events
        
        setSabotageState(prev => ({
          ...prev,
          txStatus: 'SUCCESS',
          isLoading: false
        }));

        // Auto-clear after 3 seconds
        setTimeout(() => {
          setSabotageState({
            isLoading: false,
            error: null,
            txHash: null,
            txStatus: null
          });
        }, 3000);

      } else {
        throw new Error(`Sabotage transaction failed with code: ${tx?.code || 'unknown'}`);
      }

    } catch (error) {
      console.error(`❌ Error executing sabotage on ${targetPlayer}:`, error);

      setSabotageState({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        txHash: null,
        txStatus: 'REJECTED'
      });

      // Auto-clear error after 5 seconds
      setTimeout(() => {
        setSabotageState({
          isLoading: false,
          error: null,
          txHash: null,
          txStatus: null
        });
      }, 5000);
    }
  }, [
    canSabotage, 
    account, 
    currentGame, 
    client.actions, 
    player,
    getAssetAmount
  ]);

  const resetSabotageState = useCallback(() => {
    setSabotageState({
      isLoading: false,
      error: null,
      txHash: null,
      txStatus: null
    });
  }, []);

  return {
    sabotageState,
    executeSabotage,
    canSabotage,
    resetSabotageState
  };
};