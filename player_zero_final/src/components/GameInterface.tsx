import React, { useState, useEffect, useRef, useCallback } from "react";
import { Timer } from "./Timer";
import { PlayerWallet } from "./PlayerWallet";
import { AssetsList } from "./AssetsList";
import { PlayerStats } from "./PlayerStats";
import { ActionPanel } from "./ActionPanelSimple";
import { RecentActions } from "./RecentActions";
import { GameErrorBoundary } from "./GameErrorBoundary";
import { useSocket } from "../context/SocketContext";
import { useAudio } from "../hooks/useAudio";
import { useGame } from "../dojo/hooks/useGame";
import useAppStore, { AssetType, ActionType } from "../zustand/store";
import { useUnifiedActions } from "../hooks/useUnifiedActions";
import { UseGameData } from "../dojo/hooks/fetchGame";
import { useNextRound } from "../dojo/hooks/useNextRound";
import { useMarket } from "../dojo/hooks/fetchMarket";

interface GameInterfaceProps {
  onExitGame: () => void;
}

function GameInterfaceInner({ onExitGame }: GameInterfaceProps) {
  const { socket, connected, gameId, playerId, playerName, clearGameInfo } =
    useSocket();
  const { playSound } = useAudio();

  // Add useGame hook
  const {
    startGame,
    isProcessing: gameActionProcessing,
    error: gameActionError,
    currentStep,
    resetGameState,
  } = useGame();

  // Zustand store
  const {
    currentGame,
    market,
    player,
    inventory,
    gameStarted,
    selectedAsset,
    selectedAction,
    setSelectedAsset,
    setSelectedAction,
    startGame: storeStartGame,
    endGame: storeEndGame,
  } = useAppStore();
  const { nextRound } = useNextRound();
  const { refetch: fetchGameData } = UseGameData();
  const { refetch: fetchMarketData } = useMarket();
  
  // Unified actions
  const { executeAction, isProcessing } = useUnifiedActions();

  // Local state - minimal
  const [gameState, setGameState] = useState<any>(null);
  const [currentPlayer, setCurrentPlayer] = useState<any>(null);
  const [isHost, setIsHost] = useState(false);
  const [notifications, setNotifications] = useState<string[]>([]);
  const [targetPlayer, setTargetPlayer] = useState<string>("");
  const [gameIdCopied, setGameIdCopied] = useState(false);
  
  // Mobile responsive state
  const [activeTab, setActiveTab] = useState<'timer' | 'assets' | 'wallet' | 'stats' | 'actions'>('actions');
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  
  // Responsive breakpoint detection
  useEffect(() => {
    const checkScreenSize = () => {
      const width = window.innerWidth;
      setIsMobile(width < 768);
      setIsTablet(width >= 768 && width < 1024);
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Loading states to prevent multiple updates
  const [isUpdatingGameData, setIsUpdatingGameData] = useState(false);
  const [isUpdatingMarketData, setIsUpdatingMarketData] = useState(false);
  
  // Refs to track update states and prevent duplicates
  const gameDataUpdateRef = useRef<boolean>(false);
  const marketDataUpdateRef = useRef<boolean>(false);
  const lastRoundProcessedRef = useRef<number>(-1);

  // Debounced update functions
  const updateGamedata = useCallback(async () => {
    if (isUpdatingGameData || gameDataUpdateRef.current) {
      console.log("Game data update already in progress, skipping...");
      return;
    }

    console.log("updating gamedata");
    setIsUpdatingGameData(true);
    gameDataUpdateRef.current = true;

    try {
      await fetchGameData(currentGame?.id);
      console.log("gamedata updated");
    } catch (error) {
      console.error("Failed to update game data:", error);
    } finally {
      setIsUpdatingGameData(false);
      gameDataUpdateRef.current = false;
    }
  }, [fetchGameData, currentGame?.id, isUpdatingGameData]);

  const updateMarketdata = useCallback(async () => {
    if (isUpdatingMarketData || marketDataUpdateRef.current) {
      console.log("Market data update already in progress, skipping...");
      return;
    }

    console.log("updating Market data");
    setIsUpdatingMarketData(true);
    marketDataUpdateRef.current = true;

    try {
      await fetchMarketData(currentGame?.id);
      console.log("Market data updated");
    } catch (error) {
      console.error("Failed to update market data:", error);
    } finally {
      setIsUpdatingMarketData(false);
      marketDataUpdateRef.current = false;
    }
  }, [fetchMarketData, currentGame?.id, isUpdatingMarketData]);

  // Socket event listeners
  useEffect(() => {
    if (!socket) return;

    const handleRoundEnded = async (data: any) => {
      // Prevent duplicate processing of the same round
      if (lastRoundProcessedRef.current >= data.round) {
        console.log(`Round ${data.round} already processed, skipping...`);
        return;
      }

      lastRoundProcessedRef.current = data.round;

      try {
        addNotification("Advancing to next round...");
        
        if (isHost) {
          const result = await nextRound(currentGame?.id!);
          if (result.success) {
            addNotification(`Round ${data.round} started!`);
          } else {
            addNotification(`Failed to advance round: ${result.error}`);
          }
        }

        // Wait 6.5 seconds then fetch market data (only once per round)
        setTimeout(async () => {
          await updateMarketdata();
          addNotification("Market data updated");

        }, 6500);

        // Send updated market prices to server
          if (market && socket) {
            socket.emit("update-market-prices", {
              gameId,
              marketPrices: market,
            });
          }
      } catch (error) {
        addNotification(`Round advancement failed: ${error}`);
      }
    };

    const handleGameState = (state: any) => {
      setGameState(state);

      if (state?.status === "playing" && !gameStarted) {
        storeStartGame();
      }
      if (state?.status !== "playing" && gameStarted) {
        storeEndGame();
      }
    };

    const handleGameStarted = async () => {
      await updateGamedata();
      playSound("switch");
      addNotification("Game started!");
    };

    const handleGameFinished = () => {
      playSound("action");
      addNotification("Game finished!");
    };

    // Add event listeners
    socket.on("round-ended", handleRoundEnded);
    socket.on("game-state", handleGameState);
    socket.on("game-started", handleGameStarted);
    socket.on("game-finished", handleGameFinished);

    return () => {
      socket.off("round-ended", handleRoundEnded);
      socket.off("game-state", handleGameState);
      socket.off("game-started", handleGameStarted);
      socket.off("game-finished", handleGameFinished);
    };
  }, [
    socket, 
    gameStarted, 
    storeStartGame, 
    storeEndGame, 
    isHost, 
    currentGame?.id, 
    nextRound, 
    updateGamedata, 
    updateMarketdata, 
    market, 
    gameId, 
    playSound
  ]);

  // Update current player and host status
  useEffect(() => {
    if (!gameState || !playerId) return;

    const player = gameState.players?.find((p: any) => p.id === playerId);
    setCurrentPlayer(player || null);
    setIsHost(gameState.host === playerId);
  }, [gameState, playerId]);

  // Handle game action errors
  useEffect(() => {
    if (gameActionError) {
      addNotification(`Error: ${gameActionError}`);
    }
  }, [gameActionError]);

  const addNotification = (message: string) => {
    setNotifications((prev) => [message, ...prev.slice(0, 2)]);
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n !== message));
    }, 3000);
  };

  const handleStartGame = async () => {
    console.log(currentGame?.id);

    try {
      addNotification("Starting game on blockchain...");

      // Start game on blockchain first
      const result = await startGame(currentGame?.id!);

      if (result.success) {
        // Then emit to socket for real-time updates
        socket?.emit("start-game");
        addNotification("Game started successfully!");
        playSound("switch");
      } else {
        addNotification(`Failed to start game: ${result.error}`);
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      addNotification(`Failed to start game: ${errorMessage}`);
    }
  };

  const handleExitGame = () => {
    if (socket && gameId && playerId) {
      socket.emit("exit-game", { gameId, playerId });
    }

    // Reset game action state when exiting
    resetGameState();
    clearGameInfo();
    
    // Reset refs
    gameDataUpdateRef.current = false;
    marketDataUpdateRef.current = false;
    lastRoundProcessedRef.current = -1;
    
    onExitGame();
  };

  const handlePlayerAction = async () => {
    console.log("Action call", selectedAction, selectedAsset);
    if (!selectedAction || !selectedAsset) return;

    try {
      const result = await executeAction(
        selectedAction,
        selectedAsset,
        selectedAction === "Sabotage" ? targetPlayer : undefined
      );

      if (result.success) {
        addNotification(`${selectedAction} ${selectedAsset} successful!`);
      } else {
        addNotification(`${selectedAction} failed: ${result.error}`);
      }
    } catch (error) {
      addNotification(
        `Action failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }

    // Reset target player
    setTargetPlayer("");
  };

  // Loading states
  if (!connected) {
    return (
      <div className="min-h-screen bg-pixel-black flex items-center justify-center">
        <div className="bg-pixel-dark-gray pixel-panel border-pixel-gray p-8">
          <h2 className="text-pixel-xl font-bold text-pixel-primary text-center">
            Connecting...
          </h2>
        </div>
      </div>
    );
  }

  if (!gameId) {
    return (
      <div className="min-h-screen bg-pixel-black flex items-center justify-center">
        <div className="bg-pixel-dark-gray pixel-panel border-pixel-gray p-8">
          <h2 className="text-pixel-xl font-bold text-pixel-primary text-center mb-4">
            No game selected
          </h2>
          <button
            onClick={handleExitGame}
            className="px-6 py-3 bg-pixel-gray hover:bg-pixel-light-gray text-pixel-primary font-bold pixel-btn"
          >
            Exit to Lobby
          </button>
        </div>
      </div>
    );
  }

  if (!gameState) {
    return (
      <div className="min-h-screen bg-pixel-black flex items-center justify-center">
        <div className="bg-pixel-dark-gray pixel-panel border-pixel-gray p-8">
          <h2 className="text-pixel-xl font-bold text-pixel-primary text-center mb-4">
            Loading game...
          </h2>
          <p className="text-pixel-base-gray text-center">Game ID: {gameId}</p>
          <div className="mt-6 text-center">
            <button
              onClick={handleExitGame}
              className="px-6 py-3 bg-pixel-gray hover:bg-pixel-light-gray text-pixel-primary font-bold pixel-btn"
            >
              Exit to Lobby
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Waiting room
  if (!gameStarted) {
    const handleCopyGameId = async () => {
      if (gameId) {
        try {
          await navigator.clipboard.writeText(gameId);
          setGameIdCopied(true);
          addNotification("Game ID copied to clipboard!");

          // Reset the copied state after 2 seconds
          setTimeout(() => {
            setGameIdCopied(false);
          }, 2000);
        } catch (err) {
          console.error("Failed to copy game ID:", err);
          addNotification("Failed to copy Game ID");
        }
      } else {
        addNotification("No Game ID to copy");
      }
    };

    return (
      <div className="min-h-screen bg-pixel-black scanlines p-6 font-pixel">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-pixel-2xl font-bold text-pixel-primary uppercase tracking-wider">
              Waiting Room
            </h1>
            <button
              onClick={handleExitGame}
              className="px-4 py-2 bg-pixel-error hover:bg-pixel-warning text-pixel-black font-bold text-pixel-sm pixel-btn border-pixel-black uppercase tracking-wider"
            >
              Exit Game
            </button>
          </div>

          {/* Game Info - Split into two halves */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Left Half - Game Details */}
            <div className="bg-pixel-dark-gray pixel-panel border-pixel-gray p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-pixel-lg font-bold text-pixel-primary">
                  Game Info
                </h3>
                <div className="flex items-center space-x-2">
                  <div
                    className="w-2 h-2 bg-pixel-success pixel-notification border-pixel-success"
                    title="Live Sync Active"
                  ></div>
                  <span className="text-pixel-xs text-pixel-success font-bold">
                    LIVE
                  </span>
                </div>
              </div>
              <div className="space-y-2 text-pixel-base-gray">
                <p>
                  <span className="text-pixel-primary">Game Name:</span>{" "}
                  {gameState?.gameName || "Unnamed Game"}
                </p>
                <p>
                  <span className="text-pixel-primary">Game ID:</span> {gameId}
                </p>
                <p>
                  <span className="text-pixel-primary">Host:</span>{" "}
                  {isHost
                    ? "You"
                    : gameState?.players?.find(
                        (p: any) => p.id === gameState.host
                      )?.name || "Unknown"}
                </p>
                <p>
                  <span className="text-pixel-primary">Players:</span>{" "}
                  {gameState?.players?.length || 0}/4
                </p>
                <p>
                  <span className="text-pixel-primary">Status:</span> Waiting
                  for players
                </p>
              </div>
            </div>

            {/* Right Half - How to Invite */}
            <div className="bg-pixel-dark-gray pixel-panel border-pixel-gray p-6">
              <h3 className="text-pixel-lg font-bold text-pixel-primary mb-4">
                How to Invite
              </h3>
              <div className="space-y-2 text-pixel-base-gray text-pixel-sm">
                <p>1. Share the Game ID with friends</p>
                <p>2. They join using "Join by ID"</p>
                <p>3. Host starts the game when ready</p>
              </div>
              <button
                onClick={handleCopyGameId}
                disabled={gameIdCopied}
                className={`mt-4 w-full px-4 py-2 font-bold text-pixel-sm pixel-btn border-pixel-black uppercase tracking-wider transition-colors ${
                  gameIdCopied
                    ? "bg-pixel-success text-pixel-black"
                    : "bg-pixel-accent hover:bg-pixel-success text-pixel-black"
                }`}
              >
                {gameIdCopied ? "Copied!" : "Copy Game ID"}
              </button>
            </div>
          </div>

          {/* Players List */}
          <div className="bg-pixel-dark-gray pixel-panel border-pixel-gray p-6 mb-6">
            <h3 className="text-pixel-lg font-bold text-pixel-primary mb-4">
              Players ({gameState.players?.length || 0}/4)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {gameState.players?.map((player: any) => (
                <div
                  key={player.id}
                  className="bg-pixel-gray pixel-panel border-pixel-light-gray p-4"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-pixel-primary font-bold">
                      {player.name} {player.id === playerId && "(You)"}
                    </span>
                    {player.id === gameState.host && (
                      <span className="text-pixel-xs bg-pixel-warning text-pixel-black px-2 py-1 pixel-notification">
                        HOST
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Start Game Button */}
          {isHost && (
            <div className="text-center">
              <button
                onClick={handleStartGame}
                disabled={
                  (gameState.players?.length || 0) < 2 || gameActionProcessing
                }
                className="px-8 py-4 bg-pixel-primary hover:bg-pixel-success text-pixel-black font-bold text-pixel-lg pixel-btn disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {gameActionProcessing
                  ? "Starting Game..."
                  : (gameState.players?.length || 0) < 2
                  ? "Need 2+ Players"
                  : "Start Game"}
              </button>
            </div>
          )}

          {!isHost && (
            <div className="text-center">
              <div className="bg-pixel-warning pixel-panel border-pixel-black p-4">
                <p className="text-pixel-black font-bold">
                  {gameActionProcessing
                    ? "Host is starting the game..."
                    : "Waiting for host to start the game..."}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Game interface (rest remains the same)
  return (
    <div className="min-h-screen bg-pixel-black p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-pixel-xl font-bold text-pixel-primary">
           Game
          </h1>
          <div className="flex items-center space-x-4">
            <div className="text-pixel-base-gray font-bold bg-pixel-dark-gray border-pixel-gray px-3 py-1 pixel-panel">
              Round {gameState.currentRound}/{gameState.maxRounds}
            </div>
            <button
              onClick={handleExitGame}
              className="px-4 py-2 bg-pixel-error hover:bg-pixel-warning text-pixel-black font-bold pixel-btn"
            >
              Exit
            </button>
          </div>
        </div>

        {/* Fixed Timer and Recent Actions for Mobile */}
        {isMobile && (
          <div className="space-y-4 mb-4">
            <Timer timeRemaining={gameState.timeRemaining} />
            <RecentActions
              actions={gameState.recentActions || []}
              currentRound={gameState.currentRound || 1}
              maxRounds={gameState.maxRounds || 10}
              actionsByRound={gameState.actionHistory || {}}
            />
          </div>
        )}

        {/* Mobile Navigation */}
        {isMobile && (
          <div className="bg-pixel-dark-gray pixel-panel border-pixel-gray mb-4">
            <div className="flex overflow-x-auto">
              {[
                { id: 'assets', label: 'Assets'},
                { id: 'wallet', label: 'Wallet'},
                { id: 'stats', label: 'Stats'},
                { id: 'actions', label: 'Actions'}
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    playSound('click');
                    setActiveTab(tab.id as typeof activeTab);
                  }}
                  className={`flex-1 min-w-0 px-3 py-2 text-pixel-xs font-bold uppercase tracking-wider whitespace-nowrap transition-colors ${
                    activeTab === tab.id
                      ? 'bg-pixel-gray text-pixel-primary border-b-2 border-pixel-primary'
                      : 'text-pixel-base-gray hover:text-pixel-primary hover:bg-pixel-gray'
                  }`}
                >
                  <div className="flex flex-col items-center space-y-1">
                    <span className="text-sm">{tab.icon}</span>
                    <span>{tab.label}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Responsive Layout */}
        {isMobile ? (
          /* Mobile Layout - Single Column with Tabs */
          <div className="space-y-4">
            {activeTab === 'assets' && (
              <AssetsList
                assets={currentPlayer?.assets || { gold: 0, water: 0, oil: 0 }}
                marketChanges={gameState.marketChanges || []}
                marketPrices={gameState.marketPrices || { gold: 100, water: 50, oil: 150 }}
                currentRound={gameState.currentRound || 1}
              />
            )}
            {activeTab === 'wallet' && (
              <PlayerWallet
                tokens={currentPlayer?.tokens || 0}
                assets={inventory}
              />
            )}
            {activeTab === 'stats' && (
              <PlayerStats players={gameState.players || []} />
            )}
            {activeTab === 'actions' && (
              <div className="space-y-4">
                <ActionPanel
                  selectedAction={selectedAction || "Buy"}
                  selectedResource={selectedAsset || "Gold"}
                  amount={1}
                  targetPlayer={targetPlayer}
                  players={gameState.players || []}
                  currentPlayer={
                    currentPlayer || {
                      id: "",
                      name: "",
                      tokens: 0,
                      assets: { gold: 0, water: 0, oil: 0 },
                      totalAssets: 0,
                    }
                  }
                  onActionChange={(action: ActionType) => setSelectedAction(action)}
                  onResourceChange={(resource: AssetType) =>
                    setSelectedAsset(resource)
                  }
                  onAmountChange={() => {}}
                  onTargetChange={setTargetPlayer}
                  onConfirmAction={handlePlayerAction}
                />
                
                {/* Processing Status */}
                {(isProcessing || gameActionProcessing || isUpdatingGameData || isUpdatingMarketData) && (
                  <div className="bg-pixel-dark-gray pixel-panel border-pixel-gray p-4">
                    <div className="text-pixel-sm font-bold text-pixel-primary mb-2">
                      {gameActionProcessing
                        ? "Blockchain Processing..."
                        : isUpdatingGameData
                        ? "Updating Game Data..."
                        : isUpdatingMarketData
                        ? "Updating Market Data..."
                        : "Processing..."}
                    </div>
                    <div className="text-pixel-xs text-pixel-warning">
                      {gameActionProcessing
                        ? "Transaction in progress"
                        : isUpdatingGameData || isUpdatingMarketData
                        ? "Data sync in progress"
                        : "Action in progress"}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : isTablet ? (
          /* Tablet Layout - Two Column */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Left Column */}
            <div className="space-y-4">
              <Timer timeRemaining={gameState.timeRemaining} />
              <AssetsList
                assets={currentPlayer?.assets || { gold: 0, water: 0, oil: 0 }}
                marketChanges={gameState.marketChanges || []}
                marketPrices={gameState.marketPrices || { gold: 100, water: 50, oil: 150 }}
                currentRound={gameState.currentRound || 1}
              />
              <RecentActions
                actions={gameState.recentActions || []}
                currentRound={gameState.currentRound || 1}
                maxRounds={gameState.maxRounds || 10}
                actionsByRound={gameState.actionHistory || {}}
              />
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              <PlayerWallet
                tokens={currentPlayer?.tokens || 0}
                assets={inventory}
              />
              <PlayerStats players={gameState.players || []} />
              <ActionPanel
                selectedAction={selectedAction || "Buy"}
                selectedResource={selectedAsset || "Gold"}
                amount={1}
                targetPlayer={targetPlayer}
                players={gameState.players || []}
                currentPlayer={
                  currentPlayer || {
                    id: "",
                    name: "",
                    tokens: 0,
                    assets: { gold: 0, water: 0, oil: 0 },
                    totalAssets: 0,
                  }
                }
                onActionChange={(action: ActionType) => setSelectedAction(action)}
                onResourceChange={(resource: AssetType) =>
                  setSelectedAsset(resource)
                }
                onAmountChange={() => {}}
                onTargetChange={setTargetPlayer}
                onConfirmAction={handlePlayerAction}
              />
              
              {/* Processing Status */}
              {(isProcessing || gameActionProcessing || isUpdatingGameData || isUpdatingMarketData) && (
                <div className="bg-pixel-dark-gray pixel-panel border-pixel-gray p-4">
                  <div className="text-pixel-sm font-bold text-pixel-primary mb-2">
                    {gameActionProcessing
                      ? "Blockchain Processing..."
                      : isUpdatingGameData
                      ? "Updating Game Data..."
                      : isUpdatingMarketData
                      ? "Updating Market Data..."
                      : "Processing..."}
                  </div>
                  <div className="text-pixel-xs text-pixel-warning">
                    {gameActionProcessing
                      ? "Transaction in progress"
                      : isUpdatingGameData || isUpdatingMarketData
                      ? "Data sync in progress"
                      : "Action in progress"}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Desktop Layout - Three Column */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Left Column */}
            <div className="lg:col-span-3 space-y-4">
              <Timer timeRemaining={gameState.timeRemaining} />
              <AssetsList
                assets={currentPlayer?.assets || { gold: 0, water: 0, oil: 0 }}
                marketChanges={gameState.marketChanges || []}
                marketPrices={gameState.marketPrices || { gold: 100, water: 50, oil: 150 }}
                currentRound={gameState.currentRound || 1}
              />
              <RecentActions
                actions={gameState.recentActions || []}
                currentRound={gameState.currentRound || 1}
                maxRounds={gameState.maxRounds || 10}
                actionsByRound={gameState.actionHistory || {}}
              />
            </div>

            {/* Middle Column */}
            <div className="lg:col-span-6 space-y-4">
              <PlayerWallet
                tokens={currentPlayer?.tokens || 0}
                assets={inventory}
              />
              <PlayerStats players={gameState.players || []} />
            </div>

            {/* Right Column */}
            <div className="lg:col-span-3 space-y-4">
              <ActionPanel
                selectedAction={selectedAction || "Buy"}
                selectedResource={selectedAsset || "Gold"}
                amount={1}
                targetPlayer={targetPlayer}
                players={gameState.players || []}
                currentPlayer={
                  currentPlayer || {
                    id: "",
                    name: "",
                    tokens: 0,
                    assets: { gold: 0, water: 0, oil: 0 },
                    totalAssets: 0,
                  }
                }
                onActionChange={(action: ActionType) => setSelectedAction(action)}
                onResourceChange={(resource: AssetType) =>
                  setSelectedAsset(resource)
                }
                onAmountChange={() => {}}
                onTargetChange={setTargetPlayer}
                onConfirmAction={handlePlayerAction}
              />

              {/* Processing Status */}
              {(isProcessing || gameActionProcessing || isUpdatingGameData || isUpdatingMarketData) && (
                <div className="bg-pixel-dark-gray pixel-panel border-pixel-gray p-4">
                  <div className="text-pixel-sm font-bold text-pixel-primary mb-2">
                    {gameActionProcessing
                      ? "Blockchain Processing..."
                      : isUpdatingGameData
                      ? "Updating Game Data..."
                      : isUpdatingMarketData
                      ? "Updating Market Data..."
                      : "Processing..."}
                  </div>
                  <div className="text-pixel-xs text-pixel-warning">
                    {gameActionProcessing
                      ? "Transaction in progress"
                      : isUpdatingGameData || isUpdatingMarketData
                      ? "Data sync in progress"
                      : "Action in progress"}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Notifications */}
        {notifications.length > 0 && (
          <div className="fixed top-4 right-4 space-y-2 z-50">
            {notifications.map((notification, index) => (
              <div
                key={index}
                className="bg-pixel-accent text-pixel-black p-3 pixel-panel border-pixel-black"
              >
                <p className="font-bold text-pixel-sm">{notification}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Export wrapped component with error boundary
export const GameInterface: React.FC<GameInterfaceProps> = ({ onExitGame }) => (
  <GameErrorBoundary>
    <GameInterfaceInner onExitGame={onExitGame} />
  </GameErrorBoundary>
);