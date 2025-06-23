import { useState, useCallback, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import { useAccount } from "@starknet-react/core";
import { Account, BigNumberish } from "starknet";
import { useDojoSDK } from "@dojoengine/sdk/react";
import { useStarknetConnect } from "./useStarknetConnect";
import { usePlayer } from "./usePlayer";
import useAppStore from "../../zustand/store";

// Types
interface NextRoundState {
  isProcessing: boolean;
  error: string | null;
  completed: boolean;
  step: 'checking' | 'processing' | 'loading' | 'success';
  txHash: string | null;
  txStatus: 'PENDING' | 'SUCCESS' | 'REJECTED' | null;
}

interface NextRoundResponse {
  success: boolean;
  transactionHash?: string;
  error?: string;
  newRound?: BigNumberish;
}

export const useNextRound = () => {
  const { useDojoStore, client } = useDojoSDK();
  const dojoState = useDojoStore((state) => state);
  const { account } = useAccount();
  const { status } = useStarknetConnect();
  const { player } = usePlayer();
  const { 
    currentGame, 
    updateGameRound,
    setLoading 
  } = useAppStore();

  // Local state
  const [nextRoundState, setNextRoundState] = useState<NextRoundState>({
    isProcessing: false,
    error: null,
    completed: false,
    step: 'checking',
    txHash: null,
    txStatus: null
  });

  // Tracking if we are processing
  const [isProcessing, setIsProcessing] = useState(false);

  /**
   * Advances the game to the next round
   */
  const nextRound = useCallback(async (gameId: BigNumberish): Promise<NextRoundResponse> => {
    if (isProcessing) {
      return { success: false, error: "Already processing next round action" };
    }

    setIsProcessing(true);

    // Validation: Check that the controller is connected
    if (status !== "connected") {
      const error = "Controller not connected. Please connect your controller first.";
      setNextRoundState(prev => ({ ...prev, error }));
      setIsProcessing(false);
      return { success: false, error };
    }

    // Validation: Check that the account exists
    if (!account) {
      const error = "No account found. Please connect your controller.";
      setNextRoundState(prev => ({ ...prev, error }));
      setIsProcessing(false);
      return { success: false, error };
    }

    // Validation: Check that player exists
    if (!player) {
      const error = "Player not found. Please initialize your player first.";
      setNextRoundState(prev => ({ ...prev, error }));
      setIsProcessing(false);
      return { success: false, error };
    }

    // Validation: Check that game exists
    if (!currentGame) {
      const error = "No active game found.";
      setNextRoundState(prev => ({ ...prev, error }));
      setIsProcessing(false);
      return { success: false, error };
    }

    // Validation: Check that game is active
    if (!currentGame.is_active) {
      const error = "Game is not active.";
      setNextRoundState(prev => ({ ...prev, error }));
      setIsProcessing(false);
      return { success: false, error };
    }

    const transactionId = uuidv4();

    try {
      setNextRoundState(prev => ({
        ...prev,
        isProcessing: true,
        error: null,
        step: 'processing'
      }));

      console.log("🎮 Advancing to next round for game:", gameId);

      // Execute next round transaction
      const nextRoundTx = await client.actions.nextRound(account as Account, gameId);
      console.log("📥 Next round transaction response:", nextRoundTx);

      if (nextRoundTx?.transaction_hash) {
        setNextRoundState(prev => ({
          ...prev,
          txHash: nextRoundTx.transaction_hash,
          txStatus: 'PENDING'
        }));
      }

      if (nextRoundTx && nextRoundTx.code === "SUCCESS") {
        console.log("🎉 Next round processed successfully!");

        setNextRoundState(prev => ({
          ...prev,
          txStatus: 'SUCCESS',
          step: 'loading'
        }));

        // Wait for the transaction to be processed
        console.log("⏳ Waiting for transaction to be processed...");
        await new Promise(resolve => setTimeout(resolve, 3500));

        // Update local game state - increment round
        const newRound = Number(currentGame.round) + 1;
        updateGameRound(newRound);

        setNextRoundState(prev => ({
          ...prev,
          completed: true,
          isProcessing: false,
          step: 'success'
        }));

        dojoState.confirmTransaction(transactionId);
        setIsProcessing(false);

        return {
          success: true,
          transactionHash: nextRoundTx.transaction_hash,
          newRound
        };
      } else {
        setNextRoundState(prev => ({
          ...prev,
          txStatus: 'REJECTED'
        }));
        throw new Error("Next round transaction failed with code: " + nextRoundTx?.code);
      }

    } catch (error) {
      const errorMessage = error instanceof Error
        ? error.message
        : "Failed to advance to next round. Please try again.";

      console.error("❌ Error advancing to next round:", error);
      dojoState.revertOptimisticUpdate(transactionId);

      setNextRoundState(prev => ({
        ...prev,
        error: errorMessage,
        isProcessing: false,
        step: 'checking',
        txStatus: 'REJECTED'
      }));

      setIsProcessing(false);
      return { success: false, error: errorMessage };
    }
  }, [status, account, player, currentGame, isProcessing, client.actions, dojoState, updateGameRound]);

  /**
   * Reset the next round state
   */
  const resetNextRoundState = useCallback(() => {
    console.log("🔄 Resetting next round state...");
    setIsProcessing(false);
    setNextRoundState({
      isProcessing: false,
      error: null,
      completed: false,
      step: 'checking',
      txHash: null,
      txStatus: null
    });
  }, []);

  // Sync loading state with the store
  useEffect(() => {
    setLoading(nextRoundState.isProcessing);
  }, [nextRoundState.isProcessing, setLoading]);

  return {
    // State
    isProcessing: nextRoundState.isProcessing,
    error: nextRoundState.error,
    completed: nextRoundState.completed,
    currentStep: nextRoundState.step,
    txHash: nextRoundState.txHash,
    txStatus: nextRoundState.txStatus,
    isConnected: status === "connected",
    currentRound: currentGame?.round || 0,
    maxRounds: currentGame?.max_rounds || 0,
    canAdvanceRound: currentGame?.is_active && !nextRoundState.isProcessing,

    // Actions
    nextRound,
    resetNextRoundState
  };
};