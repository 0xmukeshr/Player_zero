import { useState, useCallback } from "react";
import { useAccount } from "@starknet-react/core";
import { useDojoSDK } from "@dojoengine/sdk/react";
import { Account, CairoCustomEnum } from "starknet";
import useAppStore, { AssetType } from "../../zustand/store";

interface BurnAssetActionState {
  isLoading: boolean;
  error: string | null;
  txHash: string | null;
  txStatus: 'PENDING' | 'SUCCESS' | 'REJECTED' | null;
}

interface UseBurnAssetReturn {
  burnAssetState: BurnAssetActionState;
  executeBurnAsset: (asset: AssetType) => Promise<void>;
  canBurnAsset: boolean;
  resetBurnAssetState: () => void;
}

export const useBurnAsset = (): UseBurnAssetReturn => {
  const { account, status } = useAccount();
  const { client } = useDojoSDK();
  const { 
    player, 
    currentGame, 
    inventory, 
    market,
    updateInventoryAsset,
    getAssetAmount,
    setMarket
  } = useAppStore();

  const [burnAssetState, setBurnAssetState] = useState<BurnAssetActionState>({
    isLoading: false,
    error: null,
    txHash: null,
    txStatus: null
  });

  const isConnected = status === "connected";
  const hasPlayer = player !== null;
  const hasActiveGame = currentGame?.is_active === true;
  const canBurnAsset = isConnected && hasPlayer && hasActiveGame && !burnAssetState.isLoading;

  const executeBurnAsset = useCallback(async (asset: AssetType) => {
    if (!canBurnAsset || !account || !currentGame) {
      setBurnAssetState(prev => ({
        ...prev,
        error: !account ? "Please connect your controller" : 
               !currentGame ? "No active game found" : 
               "Cannot burn asset right now"
      }));
      return;
    }

    // Check if player has the asset to burn
    const assetAmount = getAssetAmount(asset);
    
    if (Number(assetAmount) <= 0) {
      setBurnAssetState(prev => ({
        ...prev,
        error: `You don't have any ${asset} to burn`
      }));
      return;
    }

    try {
      setBurnAssetState({
        isLoading: true,
        error: null,
        txHash: null,
        txStatus: 'PENDING'
      });

      console.log(`📤 Executing burn ${asset} transaction...`);

      // Create asset enum for the transaction
      const assetEnum = new CairoCustomEnum({ 
        [asset]: asset === 'Gold' ? "" : undefined,
        Gold: asset === 'Gold' ? "" : undefined,
        Water: asset === 'Water' ? "" : undefined,
        Oil: asset === 'Oil' ? "" : undefined,
      });

      const tx = await client.actions.burnAsset(
        account as Account, 
        currentGame.id, 
        assetEnum
      );
      
      console.log("📥 Burn asset transaction response:", tx);

      if (tx?.transaction_hash) {
        setBurnAssetState(prev => ({ ...prev, txHash: tx.transaction_hash }));
      }

      if (tx && tx.code === "SUCCESS") {
        console.log(`✅ Burn ${asset} transaction successful!`);

        // Optimistic updates
        const currentAssetAmount = Number(assetAmount);
        const newAssetAmount = currentAssetAmount - 1;

        // Update inventory
        updateInventoryAsset(asset, newAssetAmount);

        // Note: Burning typically affects market prices, but we'd need to 
        // refresh market data from the contract to get accurate new prices
        // For now, we'll just update the inventory
        
        setBurnAssetState(prev => ({
          ...prev,
          txStatus: 'SUCCESS',
          isLoading: false
        }));

        // Auto-clear after 3 seconds
        setTimeout(() => {
          setBurnAssetState({
            isLoading: false,
            error: null,
            txHash: null,
            txStatus: null
          });
        }, 3000);

      } else {
        throw new Error(`Burn asset transaction failed with code: ${tx?.code || 'unknown'}`);
      }

    } catch (error) {
      console.error(`❌ Error executing burn ${asset}:`, error);

      setBurnAssetState({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        txHash: null,
        txStatus: 'REJECTED'
      });

      // Auto-clear error after 5 seconds
      setTimeout(() => {
        setBurnAssetState({
          isLoading: false,
          error: null,
          txHash: null,
          txStatus: null
        });
      }, 5000);
    }
  }, [
    canBurnAsset, 
    account, 
    currentGame, 
    client.actions, 
    player, 
    inventory,
    getAssetAmount,
    updateInventoryAsset,
    setMarket
  ]);

  const resetBurnAssetState = useCallback(() => {
    setBurnAssetState({
      isLoading: false,
      error: null,
      txHash: null,
      txStatus: null
    });
  }, []);

  return {
    burnAssetState,
    executeBurnAsset,
    canBurnAsset,
    resetBurnAssetState
  };
};