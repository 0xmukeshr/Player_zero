import { useState, useCallback } from "react";
import { useAccount } from "@starknet-react/core";
import { useDojoSDK } from "@dojoengine/sdk/react";
import { Account, CairoCustomEnum } from "starknet";
import useAppStore, { AssetType } from "../../zustand/store";

interface SellAssetActionState {
  isLoading: boolean;
  error: string | null;
  txHash: string | null;
  txStatus: 'PENDING' | 'SUCCESS' | 'REJECTED' | null;
}

interface UseSellAssetReturn {
  sellAssetState: SellAssetActionState;
  executeSellAsset: (asset: AssetType) => Promise<void>;
  canSellAsset: boolean;
  resetSellAssetState: () => void;
}

export const useSellAsset = (): UseSellAssetReturn => {
  const { account, status } = useAccount();
  const { client } = useDojoSDK();
  const { 
    player, 
    currentGame, 
    inventory,  
    updateInventoryAsset,
    updatePlayerBalance,
    getAssetPrice,
    getAssetAmount
  } = useAppStore();

  const [sellAssetState, setSellAssetState] = useState<SellAssetActionState>({
    isLoading: false,
    error: null,
    txHash: null,
    txStatus: null
  });

  const isConnected = status === "connected";
  const hasPlayer = player !== null;
  const hasActiveGame = currentGame?.is_active === true;
  const canSellAsset = isConnected && hasPlayer && hasActiveGame && !sellAssetState.isLoading;

  const executeSellAsset = useCallback(async (asset: AssetType) => {
    if (!canSellAsset || !account || !currentGame) {
      setSellAssetState(prev => ({
        ...prev,
        error: !account ? "Please connect your controller" : 
               !currentGame ? "No active game found" : 
               "Cannot sell asset right now"
      }));
      return;
    }

    // Check if player has the asset to sell
    const assetAmount = getAssetAmount(asset);
    
    if (Number(assetAmount) <= 0) {
      setSellAssetState(prev => ({
        ...prev,
        error: `You don't have any ${asset} to sell`
      }));
      return;
    }

    try {
      setSellAssetState({
        isLoading: true,
        error: null,
        txHash: null,
        txStatus: 'PENDING'
      });

      console.log(`📤 Executing sell ${asset} transaction...`);

      // Create asset enum for the transaction
      const assetEnum = new CairoCustomEnum({ 
        [asset]: asset === 'Gold' ? "" : undefined,
        Gold: asset === 'Gold' ? "" : undefined,
        Water: asset === 'Water' ? "" : undefined,
        Oil: asset === 'Oil' ? "" : undefined,
      });

      const tx = await client.actions.sellAsset(
        account as Account, 
        currentGame.id, 
        assetEnum
      );
      
      console.log("📥 Sell asset transaction response:", tx);

      if (tx?.transaction_hash) {
        setSellAssetState(prev => ({ ...prev, txHash: tx.transaction_hash }));
      }

      if (tx && tx.code === "SUCCESS") {
        console.log(`✅ Sell ${asset} transaction successful!`);

        // Optimistic updates
        const assetPrice = getAssetPrice(asset);
        const currentAssetAmount = Number(assetAmount);
        const newAssetAmount = currentAssetAmount - 1;
        const currentPlayerBalance = Number(player?.token_balance || 0);
        const newPlayerBalance = currentPlayerBalance + Number(assetPrice);

        updateInventoryAsset(asset, newAssetAmount);
        updatePlayerBalance(newPlayerBalance);

        setSellAssetState(prev => ({
          ...prev,
          txStatus: 'SUCCESS',
          isLoading: false
        }));

        // Auto-clear after 3 seconds
        setTimeout(() => {
          setSellAssetState({
            isLoading: false,
            error: null,
            txHash: null,
            txStatus: null
          });
        }, 3000);

      } else {
        throw new Error(`Sell asset transaction failed with code: ${tx?.code || 'unknown'}`);
      }

    } catch (error) {
      console.error(`❌ Error executing sell ${asset}:`, error);

      setSellAssetState({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        txHash: null,
        txStatus: 'REJECTED'
      });

      // Auto-clear error after 5 seconds
      setTimeout(() => {
        setSellAssetState({
          isLoading: false,
          error: null,
          txHash: null,
          txStatus: null
        });
      }, 5000);
    }
  }, [
    canSellAsset, 
    account, 
    currentGame, 
    client.actions, 
    player, 
    inventory,
    getAssetPrice,
    getAssetAmount,
    updateInventoryAsset,
    updatePlayerBalance
  ]);

  const resetSellAssetState = useCallback(() => {
    setSellAssetState({
      isLoading: false,
      error: null,
      txHash: null,
      txStatus: null
    });
  }, []);

  return {
    sellAssetState,
    executeSellAsset,
    canSellAsset,
    resetSellAssetState
  };
};