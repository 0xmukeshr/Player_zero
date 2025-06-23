import { useState, useCallback, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import { useAccount } from "@starknet-react/core";
import { Account, BigNumberish, CairoCustomEnum } from "starknet";
import { useDojoSDK } from "@dojoengine/sdk/react";
import { useStarknetConnect } from "./useStarknetConnect";
import { usePlayer } from "./usePlayer";
import useAppStore from "../../zustand/store";

// Types
interface GameActionState {
  isProcessing: boolean;
  error: string | null;
  completed: boolean;
  step: 'checking' | 'creating' | 'joining' | 'starting' | 'loading' | 'success';
  txHash: string | null;
  txStatus: 'PENDING' | 'SUCCESS' | 'REJECTED' | null;
}

interface GameActionResponse {
  success: boolean;
  transactionHash?: string;
  error?: string;
  gameId?: BigNumberish;
}

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

  // Local state
  const [gameState, setGameState] = useState<GameActionState>({
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
   * Creates a new game
   */
  const createGame = useCallback(async (maxRounds: BigNumberish): Promise<GameActionResponse> => {
    if (isProcessing) {
      return { success: false, error: "Already processing a game action" };
    }

    setIsProcessing(true);

    // Validation: Check that the controller is connected
    if (status !== "connected") {
      const error = "Controller not connected. Please connect your controller first.";
      setGameState(prev => ({ ...prev, error }));
      setIsProcessing(false);
      return { success: false, error };
    }

    // Validation: Check that the account exists
    if (!account) {
      const error = "No account found. Please connect your controller.";
      setGameState(prev => ({ ...prev, error }));
      setIsProcessing(false);
      return { success: false, error };
    }

    // Validation: Check that player exists
    if (!player) {
      const error = "Player not found. Please initialize your player first.";
      setGameState(prev => ({ ...prev, error }));
      setIsProcessing(false);
      return { success: false, error };
    }

    const transactionId = uuidv4();

    try {
      setGameState(prev => ({
        ...prev,
        isProcessing: true,
        error: null,
        step: 'creating'
      }));

      console.log("🎮 Creating new game with max rounds:", maxRounds);

      // Execute create game transaction
      const createTx = await client.actions.createGame(account as Account, maxRounds);
      console.log("📥 Create game transaction response:", createTx);

      if (createTx?.transaction_hash) {
        setGameState(prev => ({
          ...prev,
          txHash: createTx.transaction_hash,
          txStatus: 'PENDING'
        }));
      }

      if (createTx && createTx.code === "SUCCESS") {
  console.log("🎉 Game created successfully!");

  // Wait for transaction and get receipt
  if (createTx.transaction_hash && account) {
    const receipt = await account.waitForTransaction(createTx.transaction_hash);
    console.log("Create game: ",receipt);
    
    // Extract gameId from receipt events or return data
    const gameId = receipt.value;
        console.log("Created game ID: ",gameId);

    if (gameId) {
      // Update store with new game
      setCurrentGame({
        id: gameId,
        round: 0,
        is_active: true,
        max_rounds: maxRounds,
        num_players: 1
      });
    }
  }

        dojoState.confirmTransaction(transactionId);
        setIsProcessing(false);

        return {
          success: true,
          transactionHash: createTx.transaction_hash
        };
      } else {
        setGameState(prev => ({
          ...prev,
          txStatus: 'REJECTED'
        }));
        throw new Error("Create game transaction failed with code: " + createTx?.code);
      }

    } catch (error) {
      const errorMessage = error instanceof Error
        ? error.message
        : "Failed to create game. Please try again.";

      console.error("❌ Error creating game:", error);
      dojoState.revertOptimisticUpdate(transactionId);

      setGameState(prev => ({
        ...prev,
        error: errorMessage,
        isProcessing: false,
        step: 'checking',
        txStatus: 'REJECTED'
      }));

      setIsProcessing(false);
      return { success: false, error: errorMessage };
    }
  }, [status, account, player, isProcessing, client.actions, dojoState]);

  /**
   * Joins an existing game
   */
  const joinGame = useCallback(async (gameId: BigNumberish, playerName: BigNumberish): Promise<GameActionResponse> => {
    if (isProcessing) {
      return { success: false, error: "Already processing a game action" };
    }

    setIsProcessing(true);

    if (status !== "connected" || !account || !player) {
      const error = "Invalid state for joining game";
      setGameState(prev => ({ ...prev, error }));
      setIsProcessing(false);
      return { success: false, error };
    }

    const transactionId = uuidv4();

    try {
      setGameState(prev => ({
        ...prev,
        isProcessing: true,
        error: null,
        step: 'joining'
      }));

      console.log("🎮 Joining game:", gameId, "with name:", playerName);

      const joinTx = await client.actions.joinGame(account as Account, gameId, playerName);
      console.log("📥 Join game transaction response:", joinTx);

      if (joinTx?.transaction_hash) {
        setGameState(prev => ({
          ...prev,
          txHash: joinTx.transaction_hash,
          txStatus: 'PENDING'
        }));
      }

      if (joinTx && joinTx.code === "SUCCESS") {
        console.log("🎉 Joined game successfully!");

        setGameState(prev => ({
          ...prev,
          txStatus: 'SUCCESS',
          step: 'loading'
        }));

        await new Promise(resolve => setTimeout(resolve, 3500));

        setGameState(prev => ({
          ...prev,
          completed: true,
          isProcessing: false,
          step: 'success'
        }));

        dojoState.confirmTransaction(transactionId);
        setIsProcessing(false);

        return {
          success: true,
          transactionHash: joinTx.transaction_hash,
          gameId
        };
      } else {
        setGameState(prev => ({
          ...prev,
          txStatus: 'REJECTED'
        }));
        throw new Error("Join game transaction failed with code: " + joinTx?.code);
      }

    } catch (error) {
      const errorMessage = error instanceof Error
        ? error.message
        : "Failed to join game. Please try again.";

      console.error("❌ Error joining game:", error);
      dojoState.revertOptimisticUpdate(transactionId);

      setGameState(prev => ({
        ...prev,
        error: errorMessage,
        isProcessing: false,
        step: 'checking',
        txStatus: 'REJECTED'
      }));

      setIsProcessing(false);
      return { success: false, error: errorMessage };
    }
  }, [status, account, player, isProcessing, client.actions, dojoState]);

  /**
   * Starts an existing game
   */
  const startGame = useCallback(async (gameId: BigNumberish): Promise<GameActionResponse> => {
    if (isProcessing) {
      return { success: false, error: "Already processing a game action" };
    }

    setIsProcessing(true);

    if (status !== "connected" || !account || !player) {
      const error = "Invalid state for starting game";
      setGameState(prev => ({ ...prev, error }));
      setIsProcessing(false);
      return { success: false, error };
    }

    const transactionId = uuidv4();

    try {
      setGameState(prev => ({
        ...prev,
        isProcessing: true,
        error: null,
        step: 'starting'
      }));

      console.log("🎮 Starting game:", gameId);

      const startTx = await client.actions.startGame(account as Account, gameId);
      console.log("📥 Start game transaction response:", startTx);

      if (startTx?.transaction_hash) {
        setGameState(prev => ({
          ...prev,
          txHash: startTx.transaction_hash,
          txStatus: 'PENDING'
        }));
      }

      if (startTx && startTx.code === "SUCCESS") {
        console.log("🎉 Game started successfully!");

        setGameState(prev => ({
          ...prev,
          txStatus: 'SUCCESS',
          step: 'loading'
        }));

        await new Promise(resolve => setTimeout(resolve, 3500));

        // Update local game state
        setGameStarted();

        setGameState(prev => ({
          ...prev,
          completed: true,
          isProcessing: false,
          step: 'success'
        }));

        dojoState.confirmTransaction(transactionId);
        setIsProcessing(false);

        return {
          success: true,
          transactionHash: startTx.transaction_hash,
          gameId
        };
      } else {
        setGameState(prev => ({
          ...prev,
          txStatus: 'REJECTED'
        }));
        throw new Error("Start game transaction failed with code: " + startTx?.code);
      }

    } catch (error) {
      const errorMessage = error instanceof Error
        ? error.message
        : "Failed to start game. Please try again.";

      console.error("❌ Error starting game:", error);
      dojoState.revertOptimisticUpdate(transactionId);

      setGameState(prev => ({
        ...prev,
        error: errorMessage,
        isProcessing: false,
        step: 'checking',
        txStatus: 'REJECTED'
      }));

      setIsProcessing(false);
      return { success: false, error: errorMessage };
    }
  }, [status, account, player, isProcessing, client.actions, dojoState, setGameStarted]);

  /**
   * Reset the game state
   */
  const resetGameState = useCallback(() => {
    console.log("🔄 Resetting game state...");
    setIsProcessing(false);
    setGameState({
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
    isConnected: status === "connected",
    currentGame,

    // Actions
    createGame,
    joinGame,
    startGame,
    resetGameState,
    
    // Store actions
    setCurrentGame,
    endGame
  };
};