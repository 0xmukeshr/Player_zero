import { useState, useCallback, useEffect, useRef } from "react";
import { v4 as uuidv4 } from "uuid";
import { useAccount } from "@starknet-react/core";
import { Account, BigNumberish, CairoCustomEnum } from "starknet";
import { useDojoSDK } from "@dojoengine/sdk/react";
import { useStarknetConnect } from "./useStarknetConnect";
import { usePlayer } from "./usePlayer";
import useAppStore from "../../zustand/store";
import { UseGameData } from "./fetchGame";

// Configuration
const DEFAULT_TIMEOUT = 5000; // 5 seconds instead of hardcoded 3.5s
const MAX_RETRY_ATTEMPTS = 3;

// Types
interface GameActionState {
  isProcessing: boolean;
  error: string | null;
  completed: boolean;
  step: 'idle' | 'validating' | 'creating' | 'joining' | 'starting' | 'confirming' | 'success' | 'failed';
  txHash: string | null;
  txStatus: 'PENDING' | 'SUCCESS' | 'REJECTED' | null;
  retryCount: number;
}

interface GameActionResponse {
  success: boolean;
  transactionHash?: string;
  error?: string;
  gameId?: BigNumberish;
}

interface TransactionReceipt {
  transaction_hash: string;
  status: string;
  events?: Array<{
    keys: string[];
    data: string[];
  }>;
  [key: string]: any;
}

// Validation helper
const validateGameAction = (status: string, account: any, player: any): string | null => {
  if (status !== "connected") {
    console.log("Controller not connected. Please connect your controller first.");
    
    return "Controller not connected. Please connect your controller first.";
  }
  
  if (!account) {
    console.log("No account found. Please connect your controller.");
    return "No account found. Please connect your controller.";
  }
  
  if (!player) {
    console.log("Player not found. Please initialize your player first.");
    return "Player not found. Please initialize your player first.";
  }
  
  return null;
};

export const useGame = () => {
  const { useDojoStore, client } = useDojoSDK();
  const dojoState = useDojoStore((state) => state);
  const { account } = useAccount();
  const { status } = useStarknetConnect();
  const { player } = usePlayer();
  const { 
    currentGame, 
    setCurrentGame, 
    setLoading, 
    startGame: setGameStarted,
    endGame 
  } = useAppStore();
  const { refetch: fetchGameData } = UseGameData();

  // Refs for cleanup
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const transactionIdRef = useRef<string | null>(null);

  // Local state
  const [gameState, setGameState] = useState<GameActionState>({
    isProcessing: false,
    error: null,
    completed: false,
    step: 'idle',
    txHash: null,
    txStatus: null,
    retryCount: 0
  });

  // Cleanup function
  const cleanup = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    
    if (transactionIdRef.current && dojoState) {
      dojoState.revertOptimisticUpdate(transactionIdRef.current);
      transactionIdRef.current = null;
    }
  }, [dojoState]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  // Generic error handler
  const handleError = useCallback((error: unknown, defaultMessage: string, transactionId?: string) => {
    const errorMessage = error instanceof Error ? error.message : defaultMessage;
    
    console.error("❌ Game action error:", error);
    
    if (transactionId) {
      dojoState.revertOptimisticUpdate(transactionId);
    }
    
    setGameState(prev => ({
      ...prev,
      error: errorMessage,
      isProcessing: false,
      step: 'failed',
      txStatus: 'REJECTED'
    }));
    
    return { success: false, error: errorMessage };
  }, [dojoState]);

  // Generic transaction executor
  const executeTransaction = useCallback(async (
    transactionFn: () => Promise<any>,
    step: GameActionState['step'],
    successMessage: string
  ): Promise<{ success: boolean; txResponse?: any; error?: string }> => {
    try {
      setGameState(prev => ({ ...prev, step }));
      
      const txResponse = await transactionFn();
      console.log(`📥 ${successMessage} transaction response:`, txResponse);
      
      if (txResponse?.transaction_hash) {
        setGameState(prev => ({
          ...prev,
          txHash: txResponse.transaction_hash,
          txStatus: 'PENDING'
        }));
      }
      
      if (txResponse && txResponse.code === "SUCCESS") {
        console.log(`🎉 ${successMessage}!`);
        return { success: true, txResponse };
      } else {
        throw new Error(`${successMessage} transaction failed with code: ${txResponse?.code || 'UNKNOWN'}`);
      }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Transaction failed' };
    }
  }, []);

  // Wait for transaction confirmation with timeout
  const waitForTransactionConfirmation = useCallback(async (
    txHash: string,
    timeoutMs: number = DEFAULT_TIMEOUT
  ): Promise<TransactionReceipt | null> => {
    if (!account) return null;
    
    return new Promise((resolve) => {
      const timeoutId = setTimeout(() => {
        console.warn("Transaction confirmation timeout");
        resolve(null);
      }, timeoutMs);
      
      timeoutRef.current = timeoutId;
      
      (account as Account).waitForTransaction(txHash)
        .then((receipt) => {
          clearTimeout(timeoutId);
          timeoutRef.current = null;
          resolve(receipt as TransactionReceipt);
        })
        .catch((error) => {
          console.error("Transaction confirmation failed:", error);
          clearTimeout(timeoutId);
          timeoutRef.current = null;
          resolve(null);
        });
    });
  }, [account]);

  /**
   * Creates a new game
   */
  const createGame = useCallback(async (maxRounds: BigNumberish): Promise<GameActionResponse> => {
    console.log("🎮 Creating new game with max rounds:", maxRounds);

    // Validation
    if (status !== "connected") {
      throw new Error("Controller not connected. Please connect your controller first.");
    }
  
    if (!account) {
      throw new Error("No account found. Please connect your controller.");
    }

    const transactionId = uuidv4();
    transactionIdRef.current = transactionId;

    try {
      setGameState(prev => ({
        ...prev,
        isProcessing: true,
        error: null,
        step: 'validating',
        completed: false,
        retryCount: 0
      }));

      // Execute transaction
      const { success, txResponse, error } = await executeTransaction(
        () => client.actions.createGame(account as Account, maxRounds),
        'creating',
        'Game created'
      );

      if (!success || !txResponse) {
        return handleError(new Error(error || 'Transaction failed'), "Failed to create game", transactionId);
      }

      // Update state to confirming
      setGameState(prev => ({ ...prev, step: 'confirming', txStatus: 'SUCCESS' }));

      // Wait for transaction confirmation
      if (txResponse.transaction_hash) {
        const receipt = await (account as Account).waitForTransaction(txResponse.transaction_hash);
        
        if (receipt) {
          const gameId: string = await receipt.value.events[0].data[1];
          console.log("Game created with ID:", gameId);
          
          // Set the created game as current game with basic info
          setCurrentGame({
            id: gameId,
            round: "0",
            is_active: false,
            max_rounds: maxRounds.toString(),
            num_players: "1"
          });
        } else {
          console.warn("⚠️ Game created but couldn't get receipt");
        }
      }

      // Confirm transaction and update state
      dojoState.confirmTransaction(transactionId);
      transactionIdRef.current = null;

      setGameState(prev => ({
        ...prev,
        completed: true,
        isProcessing: false,
        step: 'success'
      }));

      return {
        success: true,
        transactionHash: txResponse.transaction_hash
      };

    } catch (error) {
      return handleError(error, "Failed to create game. Please try again.", transactionId);
    }
  }, [status, account, client.actions, dojoState, executeTransaction, handleError]);

  /**
   * Joins an existing game and sets it as current game
   */
  const joinGame = useCallback(async (gameId: string, playerName: string): Promise<GameActionResponse> => {
    if (gameState.isProcessing) {
      return { success: false, error: "Already processing a game action" };
    }

    const transactionId = uuidv4();
    transactionIdRef.current = transactionId;

    try {
      setGameState(prev => ({
        ...prev,
        isProcessing: true,
        error: null,
        step: 'validating',
        completed: false,
        retryCount: 0
      }));

      console.log("🎮 Joining game:", gameId, "with name:", playerName);

      // Execute transaction
      const { success, txResponse, error } = await executeTransaction(
        () => client.actions.joinGame(account as Account, gameId, playerName),
        'joining',
        'Joined game'
      );

      if (!success || !txResponse) {
        return handleError(new Error(error || 'Transaction failed'), "Failed to join game", transactionId);
      }

      // Update state to confirming
      setGameState(prev => ({ ...prev, step: 'confirming', txStatus: 'SUCCESS' }));

      // Wait for confirmation
      if (txResponse.transaction_hash) {
        await waitForTransactionConfirmation(txResponse.transaction_hash);
      }

      // Fetch fresh game data and set as current game
      console.log("🔄 Fetching game data to set as current game...");
      
      // Temporarily set the game ID to fetch data
      const tempGame = { id: gameId, round: "0", is_active: false, max_rounds: "0", num_players: "0" };
      setCurrentGame(tempGame);
      
      // Now fetch the complete game data
      await fetchGameData(gameId);
      console.log("✅ Game data fetched and set as current game");

      // Confirm transaction
      dojoState.confirmTransaction(transactionId);
      transactionIdRef.current = null;

      setGameState(prev => ({
        ...prev,
        completed: true,
        isProcessing: false,
        step: 'success'
      }));

      return {
        success: true,
        transactionHash: txResponse.transaction_hash,
        gameId
      };

    } catch (error) {
      return handleError(error, "Failed to join game. Please try again.", transactionId);
    }
  }, [gameState.isProcessing, client.actions, dojoState, executeTransaction, waitForTransactionConfirmation, handleError, setCurrentGame, fetchGameData]);

  /**
   * Starts an existing game
   */
  const startGame = useCallback(async (gameId: string): Promise<GameActionResponse> => {
    if (gameState.isProcessing) {
      return { success: false, error: "Already processing a game action" };
    }

    const validationError = validateGameAction(status, account, player);
    if (validationError) {
      return { success: false, error: validationError };
    }

    const transactionId = uuidv4();
    transactionIdRef.current = transactionId;

    try {
      setGameState(prev => ({
        ...prev,
        isProcessing: true,
        error: null,
        step: 'validating',
        completed: false,
        retryCount: 0
      }));

      console.log("🎮 Starting game:", gameId);

      // Execute transaction
      const { success, txResponse, error } = await executeTransaction(
        () => client.actions.startGame(account as Account, gameId),
        'starting',
        'Game started'
      ); 
      
      if (!success || !txResponse) {
        return handleError(new Error(error || 'Transaction failed'), "Failed to start game", transactionId);
      }

      // Update state to confirming
      setGameState(prev => ({ ...prev, step: 'confirming', txStatus: 'SUCCESS' }));

      // Wait for confirmation
      if (txResponse.transaction_hash) {
        await waitForTransactionConfirmation(txResponse.transaction_hash);
      }

      // Update local game state
      setGameStarted();
      
      // Update current game to active
      if (currentGame && currentGame.id === gameId) {
        setCurrentGame({
          ...currentGame,
          is_active: true
        });
      }

      // Confirm transaction
      dojoState.confirmTransaction(transactionId);
      transactionIdRef.current = null;

      setGameState(prev => ({
        ...prev,
        completed: true,
        isProcessing: false,
        step: 'success'
      }));

      return {
        success: true,
        transactionHash: txResponse.transaction_hash,
        gameId
      };

    } catch (error) {
      return handleError(error, "Failed to start game. Please try again.", transactionId);
    }
  }, [status, account, player, gameState.isProcessing, client.actions, dojoState, executeTransaction, waitForTransactionConfirmation, handleError, setGameStarted, currentGame, setCurrentGame]);

  /**
   * Reset the game state
   */
  const resetGameState = useCallback(() => {
    console.log("🔄 Resetting game state...");
    cleanup();
    setGameState({
      isProcessing: false,
      error: null,
      completed: false,
      step: 'idle',
      txHash: null,
      txStatus: null,
      retryCount: 0
    });
  }, [cleanup]);

  /**
   * Retry failed action
   */
  const retryAction = useCallback(() => {
    if (gameState.retryCount < MAX_RETRY_ATTEMPTS) {
      setGameState(prev => ({
        ...prev,
        error: null,
        step: 'idle',
        retryCount: prev.retryCount + 1
      }));
    }
  }, [gameState.retryCount]);

  // Sync loading state with the store
  useEffect(() => {
    setLoading(gameState.isProcessing);
  }, [gameState.isProcessing, setLoading]);

  return {
    // State
    isProcessing: gameState.isProcessing,
    error: gameState.error,
    completed: gameState.completed,
    currentStep: gameState.step,
    txHash: gameState.txHash,
    txStatus: gameState.txStatus,
    retryCount: gameState.retryCount,
    canRetry: gameState.retryCount < MAX_RETRY_ATTEMPTS,
    isConnected: status === "connected",
    currentGame,

    // Actions
    createGame,
    joinGame,
    startGame,
    resetGameState,
    retryAction,
    
    // Store actions
    setCurrentGame,
    endGame
  };
};