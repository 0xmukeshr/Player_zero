import { useCallback } from 'react';
import { AssetType, ActionType } from '../zustand/store';
import { useBuyAsset } from '../dojo/hooks/useBuyAsset';
import { useSellAsset } from '../dojo/hooks/useSellAsset';
import { useBurnAsset } from '../dojo/hooks/useBurnAsset';
import { useSabotage } from '../dojo/hooks/useSabotage';
import { useSocket } from '../context/SocketContext';

interface UseUnifiedActionsReturn {
  executeAction: (
    actionType: ActionType,
    assetType: AssetType,
    targetPlayer?: string
  ) => Promise<{
    success: boolean;
    dojoSuccess?: boolean;
    socketSuccess?: boolean;
    error?: string;
  }>;
  isProcessing: boolean;
  canExecuteAction: (actionType: ActionType) => boolean;
}

export const useUnifiedActions = (): UseUnifiedActionsReturn => {
  const { socket } = useSocket();
  
  // Dojo hooks
  const { executeBuyAsset, canBuyAsset, buyAssetState } = useBuyAsset();
  const { executeSellAsset, canSellAsset, sellAssetState } = useSellAsset();
  const { executeBurnAsset, canBurnAsset, burnAssetState } = useBurnAsset();
  const { executeSabotage, canSabotage, sabotageState } = useSabotage();

  const isProcessing = 
    buyAssetState.isLoading ||
    sellAssetState.isLoading ||
    burnAssetState.isLoading ||
    sabotageState.isLoading;

  const canExecuteAction = useCallback((actionType: ActionType): boolean => {
    switch (actionType) {
      case 'Buy':
        return canBuyAsset;
      case 'Sell':
        return canSellAsset;
      case 'Burn':
        return canBurnAsset;
      case 'Sabotage':
        return canSabotage;
      default:
        return false;
    }
  }, [canBuyAsset, canSellAsset, canBurnAsset, canSabotage]);

  const executeAction = useCallback(async (
    actionType: ActionType,
    assetType: AssetType,
    targetPlayer?: string
  ) => {
    let dojoSuccess = false;
    let socketSuccess = false;
    let error: string | undefined;

    console.log(`🎮 Executing unified action: ${actionType} ${assetType}`, { targetPlayer });

    // Execute Dojo action first
    try {
      switch (actionType) {
        case 'Buy':
          console.log("buying 1",canBuyAsset);
          if (canBuyAsset) {
            
            await executeBuyAsset(assetType);
            dojoSuccess = true;
            console.log(`✅ Dojo ${actionType} executed successfully`);
          } else {
            throw new Error('Cannot execute buy action via Dojo');
          }
          break;
        
        case 'Sell':
          if (canSellAsset) {
            await executeSellAsset(assetType);
            dojoSuccess = true;
            console.log(`✅ Dojo ${actionType} executed successfully`);
          } else {
            throw new Error('Cannot execute sell action via Dojo');
          }
          break;
        
        case 'Burn':
          if (canBurnAsset) {
            await executeBurnAsset(assetType);
            dojoSuccess = true;
            console.log(`✅ Dojo ${actionType} executed successfully`);
          } else {
            throw new Error('Cannot execute burn action via Dojo');
          }
          break;
        
        case 'Sabotage':
          if (canSabotage && targetPlayer) {
            await executeSabotage(targetPlayer, assetType);
            dojoSuccess = true;
            console.log(`✅ Dojo ${actionType} executed successfully`);
          } else {
            throw new Error('Cannot execute sabotage action via Dojo');
          }
          break;
        
        default:
          throw new Error(`Unknown action type: ${actionType}`);
      }
    } catch (err) {
      console.error(`❌ Dojo ${actionType} failed:`, err);
      error = err instanceof Error ? err.message : 'Dojo action failed';
    }
    // Execute socket action (for UI updates and legacy compatibility)
    try {
      
      
      if (socket) {
        const actionData = {
          action: actionType,
          resource: assetType,
          amount: 1, // Default amount
          targetPlayer: actionType === 'Sabotage' ? targetPlayer : undefined
        };
        console.log("actionData",actionData);
        
        socket.emit('player-action', actionData);
        socketSuccess = true;
        console.log(`✅ Socket ${actionType} emitted successfully`);
      } else {
        console.warn('⚠️ No socket connection available');
      }
    } catch (err) {
      console.error(`❌ Socket ${actionType} failed:`, err);
      // Don't update error here since socket failure is not critical
    }

    const success = dojoSuccess; // Primary success is based on Dojo
    
    return {
      success,
      dojoSuccess,
      socketSuccess,
      error: success ? undefined : error
    };
  }, [
    socket,
    executeBuyAsset,
    executeSellAsset,
    executeBurnAsset,
    executeSabotage,
    canBuyAsset,
    canSellAsset,
    canBurnAsset,
    canSabotage
  ]);

  return {
    executeAction,
    isProcessing,
    canExecuteAction
  };
};
