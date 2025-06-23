import React, { useState, useEffect, useRef } from 'react';
import { GameState, Action, Player } from '../types/game';
import { Timer } from './Timer';
import { PlayerWallet } from './PlayerWallet';
import { AssetsList } from './AssetsList';
import { PlayerStats } from './PlayerStats';
import { ActionPanel } from './ActionPanel';
import { RecentActions } from './RecentActions';
import { useSocket } from '../context/SocketContext';
import { useAudio } from '../hooks/useAudio';

// Dojo hooks
import { useBuyAsset } from '../dojo/hooks/useBuyAsset';
import { useSellAsset } from '../dojo/hooks/useSellAsset';
import { useBurnAsset } from '../dojo/hooks/useBurnAsset';
import { useSabotage } from '../dojo/hooks/useSabotage';
import { useNextRound } from '../dojo/hooks/useNextRound';
import { usePlayer } from '../dojo/hooks/usePlayer';
import { useGame } from '../dojo/hooks/useGame';
import { useMarket } from '../dojo/hooks/fetchMarket';
import { AssetType } from '../zustand/store';

interface GameInterfaceProps {
  onExitGame: () => void;
}

export function GameInterface({ onExitGame }: GameInterfaceProps) {
  const { socket, connected, gameId, playerId, playerName, clearGameInfo } = useSocket();
  
  // Fallback to localStorage if gameId is not available from context
  const [effectiveGameId, setEffectiveGameId] = useState<string | null>(null);
  const [effectivePlayerId, setEffectivePlayerId] = useState<string | null>(null);
  const [effectivePlayerName, setEffectivePlayerName] = useState<string | null>(null);
  const [contextLoaded, setContextLoaded] = useState(false);
  
  // Initialize effective values from context or localStorage
  useEffect(() => {
    console.log('GameInterface: Context values update:', { gameId, playerId, playerName });
    
    // If context has values, use them
    if (gameId && playerId && playerName) {
      console.log('GameInterface: Using context values');
      setEffectiveGameId(gameId);
      setEffectivePlayerId(playerId);
      setEffectivePlayerName(playerName);
      setContextLoaded(true);
      return;
    }
    
    // If context doesn't have values, try localStorage
    try {
      const storedGameInfo = localStorage.getItem('currentGameInfo');
      if (storedGameInfo) {
        const { gameId: storedGameId, playerId: storedPlayerId, playerName: storedPlayerName } = JSON.parse(storedGameInfo);
        console.log('GameInterface: Using stored game info:', { storedGameId, storedPlayerId, storedPlayerName });
        
        if (storedGameId && storedPlayerId && storedPlayerName) {
          setEffectiveGameId(storedGameId);
          setEffectivePlayerId(storedPlayerId);
          setEffectivePlayerName(storedPlayerName);
          setContextLoaded(true);
          return;
        }
      }
    } catch (error) {
      console.error('GameInterface: Error loading stored game info:', error);
    }
    
    // Mark as loaded even if no values found to avoid infinite loading
    setContextLoaded(true);
  }, [gameId, playerId, playerName]);
  const { playSound } = useAudio();
  const [gameState, setGameState] = useState<GameState>(null);
  const [isHost, setIsHost] = useState(false);
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
  const [selectedAction, setSelectedAction] = useState<Action['type']>('buy');
  const [selectedResource, setSelectedResource] = useState<'gold' | 'water' | 'oil'>('gold');
  const [amount, setAmount] = useState<number>(1);
  const [targetPlayer, setTargetPlayer] = useState<string>('');
  const [gameStarted, setGameStarted] = useState(false);
  const [notifications, setNotifications] = useState<string[]>([]);
  // Use actionHistory from game state instead of local state
  const [previousPlayerCount, setPreviousPlayerCount] = useState(0);
  const [previousRecentActions, setPreviousRecentActions] = useState<string[]>([]);
  const [showWinnerModal, setShowWinnerModal] = useState(false);
  const [gameFinished, setGameFinished] = useState(false);
  const [isLastThreeSeconds, setIsLastThreeSeconds] = useState(false);

  // Track if we've already requested game state
  const gameStateRequestedRef = useRef(false);

  // Initialize Dojo hooks with error handling
  let buyAssetState, executeBuyAsset, canBuyAsset, resetBuyAssetState;
  let sellAssetState, executeSellAsset, canSellAsset, resetSellAssetState;
  let burnAssetState, executeBurnAsset, canBurnAsset, resetBurnAssetState;
  let sabotageState, executeSabotage, canSabotage, resetSabotageState;
  let nextRound, resetNextRoundState, nextRoundProcessing, nextRoundError, canAdvanceRound;
  let dojoPlayer, playerLoading, playerError, refetchPlayer;
  let dojoGame, createGame, joinGame, dojoStartGame, gameProcessing, gameError;
  let dojoMarket, marketLoading, marketError, refetchMarket;

  try {
    const buyAssetHook = useBuyAsset();
    buyAssetState = buyAssetHook.buyAssetState;
    executeBuyAsset = buyAssetHook.executeBuyAsset;
    canBuyAsset = buyAssetHook.canBuyAsset;
    resetBuyAssetState = buyAssetHook.resetBuyAssetState;
  } catch (error) {
    console.error('Error initializing useBuyAsset:', error);
    buyAssetState = { isLoading: false, error: null, txStatus: null, txHash: null };
    executeBuyAsset = async () => {};
    canBuyAsset = false;
    resetBuyAssetState = () => {};
  }

  try {
    const sellAssetHook = useSellAsset();
    sellAssetState = sellAssetHook.sellAssetState;
    executeSellAsset = sellAssetHook.executeSellAsset;
    canSellAsset = sellAssetHook.canSellAsset;
    resetSellAssetState = sellAssetHook.resetSellAssetState;
  } catch (error) {
    console.error('Error initializing useSellAsset:', error);
    sellAssetState = { isLoading: false, error: null, txStatus: null, txHash: null };
    executeSellAsset = async () => {};
    canSellAsset = false;
    resetSellAssetState = () => {};
  }

  try {
    const burnAssetHook = useBurnAsset();
    burnAssetState = burnAssetHook.burnAssetState;
    executeBurnAsset = burnAssetHook.executeBurnAsset;
    canBurnAsset = burnAssetHook.canBurnAsset;
    resetBurnAssetState = burnAssetHook.resetBurnAssetState;
  } catch (error) {
    console.error('Error initializing useBurnAsset:', error);
    burnAssetState = { isLoading: false, error: null, txStatus: null, txHash: null };
    executeBurnAsset = async () => {};
    canBurnAsset = false;
    resetBurnAssetState = () => {};
  }

  try {
    const sabotageHook = useSabotage();
    sabotageState = sabotageHook.sabotageState;
    executeSabotage = sabotageHook.executeSabotage;
    canSabotage = sabotageHook.canSabotage;
    resetSabotageState = sabotageHook.resetSabotageState;
  } catch (error) {
    console.error('Error initializing useSabotage:', error);
    sabotageState = { isLoading: false, error: null, txStatus: null, txHash: null };
    executeSabotage = async () => {};
    canSabotage = false;
    resetSabotageState = () => {};
  }

  try {
    const nextRoundHook = useNextRound();
    nextRound = nextRoundHook.nextRound;
    resetNextRoundState = nextRoundHook.resetNextRoundState;
    nextRoundProcessing = nextRoundHook.isProcessing;
    nextRoundError = nextRoundHook.error;
    canAdvanceRound = nextRoundHook.canAdvanceRound;
  } catch (error) {
    console.error('Error initializing useNextRound:', error);
    nextRound = async () => ({ success: false, error: 'Hook failed' });
    resetNextRoundState = () => {};
    nextRoundProcessing = false;
    nextRoundError = null;
    canAdvanceRound = false;
  }

  try {
    const playerHook = usePlayer();
    dojoPlayer = playerHook.player;
    playerLoading = playerHook.isLoading;
    playerError = playerHook.error;
    refetchPlayer = playerHook.refetch;
  } catch (error) {
    console.error('Error initializing usePlayer:', error);
    dojoPlayer = null;
    playerLoading = false;
    playerError = null;
    refetchPlayer = () => {};
  }

  try {
    const gameHook = useGame();
    dojoGame = gameHook.currentGame;
    createGame = gameHook.createGame;
    joinGame = gameHook.joinGame;
    dojoStartGame = gameHook.startGame;
    gameProcessing = gameHook.isProcessing;
    gameError = gameHook.error;
  } catch (error) {
    console.error('Error initializing useGame:', error);
    dojoGame = null;
    createGame = async () => {};
    joinGame = async () => {};
    dojoStartGame = async () => {};
    gameProcessing = false;
    gameError = null;
  }

  try {
    const marketHook = useMarket();
    dojoMarket = marketHook.market;
    marketLoading = marketHook.isLoading;
    marketError = marketHook.error;
    refetchMarket = marketHook.refetch;
  } catch (error) {
    console.error('Error initializing useMarket:', error);
    dojoMarket = null;
    marketLoading = false;
    marketError = null;
    refetchMarket = () => {};
  }
  
  // Socket event listeners setup (only once)
  useEffect(() => {
    if (!socket) {
      console.log('GameInterface: No socket available');
      return;
    }

    console.log('GameInterface: Setting up socket event listeners');

    socket.on('game-state', (state: any) => {
      console.log('GameInterface: Received game state:', state);
      if (state) {
        setGameState(state);
        // Don't set isHost here, it will be set in the separate effect
        console.log('GameInterface: Game state set successfully');
      } else {
        console.error('GameInterface: Received null/undefined game state');
      }
    });

    socket.on('game-started', () => {
      playSound('switch');
    });

    socket.on('game-finished', (finalState: any) => {
      setGameState(finalState);
      playSound('action');
    });

    socket.on('player-joined', (data: { playerName: string }) => {
      playSound('click');
    });

    socket.on('player-disconnected', (data: { playerName: string }) => {
      console.log(`${data.playerName} disconnected`);
    });

    socket.on('error', (error: { message: string }) => {
      console.error('Game error:', error.message);
    });

    socket.on('game-closed', (data: { reason: string }) => {
      console.log('Game closed by server:', data.reason);
      addNotification(`🚪 Game closed: ${data.reason}`);
      
      // Auto-exit to lobby after a short delay
      setTimeout(() => {
        clearGameInfo();
        onExitGame();
      }, 3000);
    });

    return () => {
      socket.off('game-state');
      socket.off('game-started');
      socket.off('game-finished');
      socket.off('player-joined');
      socket.off('player-disconnected');
      socket.off('error');
      socket.off('game-closed');
    };
  }, [socket]); // Only depend on socket
  
  // Separate effect for requesting game state (only once)
  useEffect(() => {
    if (!socket || !contextLoaded || !effectiveGameId || !connected || gameStateRequestedRef.current) {
      return;
    }

    console.log('GameInterface: Requesting game state for effectiveGameId:', effectiveGameId);
    socket.emit('get-game-state', { gameId: effectiveGameId });
    gameStateRequestedRef.current = true;
  }, [socket, contextLoaded, effectiveGameId, connected]);

  // Separate effect for basic player and game state updates
  useEffect(() => {
    if (gameState) {
      const player = gameState.players.find((p: any) => p.id === effectivePlayerId);
      setCurrentPlayer(player || null);
      setGameStarted(gameState.status === 'playing');
      
      // Debug logs for Start Game button
      console.log('GameInterface: Game state updated:', {
        playerCount: gameState.players.length,
        isHost: gameState.host === effectivePlayerId,
        status: gameState.status,
        gameStarted: gameState.status === 'playing'
      });
    }
  }, [gameState, effectivePlayerId]);
  
  // Separate effect to update isHost when player or host changes
  useEffect(() => {
    if (gameState && effectivePlayerId) {
      const newIsHost = gameState.host === effectivePlayerId;
      console.log('GameInterface: Updating isHost:', {
        effectivePlayerId,
        gameStateHost: gameState.host,
        newIsHost,
        currentIsHost: isHost
      });
      setIsHost(newIsHost);
    }
  }, [gameState?.host, effectivePlayerId]);
  
  // Get actionsByRound from game state - combine actionHistory with current round actions
  const actionsByRound = React.useMemo(() => {
    if (!gameState) return {};
    
    const combined = { ...gameState.actionHistory };
    
    // Add current round actions if any exist
    if (gameState.recentActions && gameState.recentActions.length > 0 && gameState.currentRound) {
      combined[gameState.currentRound] = gameState.recentActions;
    }
    
    return combined;
  }, [gameState?.actionHistory, gameState?.recentActions, gameState?.currentRound]);
  
  // Player count monitoring disabled for performance optimization
  // useEffect(() => {
  //   // Continuous player monitoring disabled to prevent 100% CPU usage
  // }, [gameState?.players?.length]);
  
  // Action monitoring disabled for performance optimization
  // useEffect(() => {
  //   // Continuous action monitoring disabled to prevent 100% CPU usage
  // }, [gameState?.recentActions]);
  useEffect(() => {
    if (gameState) {
      // Check if game finished
      if (gameState.status === 'finished' && !gameFinished) {
        setGameFinished(true);
        setShowWinnerModal(true);
        
        // Play victory sound
        playSound('switch');
        
        addNotification('🏁 Game finished!');
        
        // Show winner from game state (calculated by host)
        if (gameState.winner) {
          addNotification(`🏆 Winner: ${gameState.winner.name} (${gameState.winner.finalScore} points)!`);
        }
      }
      
      // Check if game returned to waiting after being finished
      if (gameState.status === 'waiting' && gameFinished) {
        setGameFinished(false);
        setShowWinnerModal(false);
        addNotification('🔄 Ready for rematch!');
      }
    }
  }, [gameState?.status, gameState?.winner?.name, gameState?.winner?.finalScore, gameFinished]);

  // Timer monitoring disabled for performance optimization
  // useEffect(() => {
  //   // Timer monitoring disabled to prevent 100% CPU usage
  // }, [gameState?.timeRemaining]);

  const addNotification = (message: string) => {
    setNotifications(prev => [message, ...prev.slice(0, 4)]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n !== message));
    }, 5000);
  };

  const handleStartGame = () => {
    if (isHost && socket) {
      socket.emit('start-game');
      addNotification('Starting game...');
    }
  };

  const handleExitGame = () => {
    // Emit exit-game event to server
    if (socket && effectiveGameId && effectivePlayerId) {
      socket.emit('exit-game', {
        gameId: effectiveGameId,
        playerId: effectivePlayerId
      });
    }
    
    // Clear game info from context
    clearGameInfo();
    onExitGame();
  };

  const handleAction = async () => {
    if (!currentPlayer || amount <= 0) return;

    const actionData = {
      action: selectedAction,
      resource: selectedResource,
      amount: amount,
      targetPlayer: selectedAction === 'sabotage' ? targetPlayer : undefined
    };

    // Convert resource to AssetType for Dojo hooks
    const assetType: AssetType = selectedResource === 'gold' ? 'Gold' : 
                                selectedResource === 'water' ? 'Water' : 'Oil';

    try {
      // Execute Dojo action based on selected action type
      switch (selectedAction) {
        case 'buy':
          if (canBuyAsset) {
            console.log(`🎮 Executing Dojo buy ${assetType}`);
            await executeBuyAsset(assetType);
            addNotification(`📤 Dojo: Buying ${assetType}...`);
          } else {
            console.warn('⚠️ Cannot execute buy asset via Dojo');
          }
          break;
        
        case 'sell':
          if (canSellAsset) {
            console.log(`🎮 Executing Dojo sell ${assetType}`);
            await executeSellAsset(assetType);
            addNotification(`📤 Dojo: Selling ${assetType}...`);
          } else {
            console.warn('⚠️ Cannot execute sell asset via Dojo');
          }
          break;
        
        case 'burn':
          if (canBurnAsset) {
            console.log(`🎮 Executing Dojo burn ${assetType}`);
            await executeBurnAsset(assetType);
            addNotification(`📤 Dojo: Burning ${assetType}...`);
          } else {
            console.warn('⚠️ Cannot execute burn asset via Dojo');
          }
          break;
        
        case 'sabotage':
          if (canSabotage && targetPlayer) {
            console.log(`🎮 Executing Dojo sabotage ${assetType} on ${targetPlayer}`);
            // Note: The Dojo sabotage hook expects a player address, but we have player name
            // We need to find the player's address from the target player name
            const targetPlayerData = gameState?.players.find((p: any) => p.name === targetPlayer);
            if (targetPlayerData?.address) {
              await executeSabotage(targetPlayerData.address, assetType);
              addNotification(`📤 Dojo: Sabotaging ${targetPlayer}'s ${assetType}...`);
            } else {
              console.warn('⚠️ Cannot find target player address for sabotage');
              addNotification('⚠️ Cannot find target player address for Dojo sabotage');
            }
          } else {
            console.warn('⚠️ Cannot execute sabotage via Dojo');
          }
          break;
        
        default:
          console.warn(`⚠️ Unknown action type: ${selectedAction}`);
      }
    } catch (error) {
      console.error(`❌ Error executing Dojo action ${selectedAction}:`, error);
      addNotification(`❌ Dojo transaction failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // Also emit to socket system (alongside Dojo)
    if (socket) {
      console.log('📡 Emitting socket action:', actionData);
      socket.emit('player-action', actionData);
    }

    // Reset form
    setAmount(1);
    setTargetPlayer('');
  };

  // Handle next round - integrate both Dojo and socket systems
  const handleNextRound = async () => {
    if (!dojoGame?.id) {
      console.warn('⚠️ No Dojo game ID available for next round');
      return;
    }

    try {
      console.log('🎮 Executing Dojo next round...');
      addNotification('📤 Dojo: Advancing to next round...');
      
      const result = await nextRound(dojoGame.id);
      
      if (result.success) {
        addNotification('✅ Dojo: Round advanced successfully!');
        // Optionally refresh market and player data
        refetchMarket();
        refetchPlayer();
      } else {
        addNotification(`❌ Dojo next round failed: ${result.error}`);
      }
    } catch (error) {
      console.error('❌ Error executing Dojo next round:', error);
      addNotification(`❌ Dojo next round error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // Also emit to socket system (if applicable)
    if (socket) {
      console.log('📡 Emitting socket next round...');
      socket.emit('next-round');
    }
  };

  // Loading state - show different messages based on what's missing
  if (!contextLoaded || !connected || !gameState) {
    let loadingMessage = 'Loading Game...';
    let showRetryButton = false;
    
    if (!contextLoaded) {
      loadingMessage = 'Initializing...';
    } else if (!connected) {
      loadingMessage = 'Connecting to server...';
    } else if (!effectiveGameId) {
      loadingMessage = 'No game selected...';
      showRetryButton = true;
    } else if (!gameState) {
      loadingMessage = 'Loading Game State...';
      showRetryButton = true;
    }
    
    console.log('GameInterface Loading State:', {
      contextLoaded,
      connected,
      effectiveGameId,
      gameState: !!gameState,
      loadingMessage
    });
    
    return (
      <div className="min-h-screen bg-pixel-black scanlines p-6 font-pixel flex items-center justify-center">
        <div className="bg-pixel-dark-gray pixel-panel border-pixel-gray p-8">
          <h2 className="text-pixel-xl font-bold text-pixel-primary text-center mb-4">
            {loadingMessage}
          </h2>
          <p className="text-pixel-base-gray text-center">Game ID: {effectiveGameId || 'Unknown'}</p>
          {showRetryButton && connected && effectiveGameId && (
            <div className="mt-4 text-center">
              <button
                onClick={() => {
                  console.log('Retrying game state request...');
                  if (socket && effectiveGameId) {
                    socket.emit('get-game-state', { gameId: effectiveGameId });
                  }
                }}
                className="px-4 py-2 bg-pixel-primary hover:bg-pixel-success text-pixel-black font-bold text-pixel-sm pixel-btn border-pixel-black uppercase tracking-wider mr-4"
              >
                Retry
              </button>
            </div>
          )}
          <div className="mt-6 text-center">
            <button
              onClick={handleExitGame}
              className="px-6 py-3 bg-pixel-gray hover:bg-pixel-light-gray text-pixel-primary font-bold text-pixel-base pixel-btn border-pixel-gray uppercase tracking-wider"
            >
              Exit to Lobby
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Waiting room state
  if (!gameStarted) {
    return (
      <div className="min-h-screen bg-pixel-black scanlines p-6 font-pixel">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-pixel-2xl font-bold text-pixel-primary uppercase tracking-wider">
              Waiting Room
            </h1>
            <button
              onClick={() => {
                playSound('click');
                handleExitGame();
              }}
              className="px-4 py-2 bg-pixel-error hover:bg-pixel-warning text-pixel-black font-bold text-pixel-sm pixel-btn border-pixel-black uppercase tracking-wider"
            >
              Exit Game
            </button>
          </div>

          {/* Game Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="bg-pixel-dark-gray pixel-panel border-pixel-gray p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-pixel-lg font-bold text-pixel-primary">Game Info</h3>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-pixel-success pixel-notification border-pixel-success" title="Live Sync Active"></div>
                  <span className="text-pixel-xs text-pixel-success font-bold">LIVE</span>
                </div>
              </div>
              <div className="space-y-2 text-pixel-base-gray">
                <p><span className="text-pixel-primary">Game ID:</span> {effectiveGameId}</p>
                <p><span className="text-pixel-primary">Host:</span> {isHost ? 'You' : gameState.players.find((p: any) => p.id === gameState.host)?.name || 'Unknown'}</p>
                <p><span className="text-pixel-primary">Players:</span> {gameState.players.length}/4</p>
                <p><span className="text-pixel-primary">Status:</span> Waiting for players</p>
              </div>
            </div>

            <div className="bg-pixel-dark-gray pixel-panel border-pixel-gray p-6">
              <h3 className="text-pixel-lg font-bold text-pixel-primary mb-4">How to Invite</h3>
              <div className="space-y-2 text-pixel-base-gray text-pixel-sm">
                <p>1. Share the Game ID with friends</p>
                <p>2. They join using "Join by ID"</p>
                <p>3. Host starts the game when ready</p>
              </div>
              <button
                onClick={() => {
                  playSound('click');
                  navigator.clipboard.writeText(effectiveGameId || '');
                }}
                className="mt-4 w-full px-4 py-2 bg-pixel-accent hover:bg-pixel-success text-pixel-black font-bold text-pixel-sm pixel-btn border-pixel-black uppercase tracking-wider"
              >
                Copy Game ID
              </button>
            </div>
          </div>

          {/* Players List */}
          <div className="bg-pixel-dark-gray pixel-panel border-pixel-gray p-6 mb-6">
            <h3 className="text-pixel-lg font-bold text-pixel-primary mb-4">Players ({gameState.players.length}/4)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {gameState.players.map((player: any, index: number) => (
                <div key={player.id} className="bg-pixel-gray pixel-panel border-pixel-light-gray p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-pixel-primary font-bold">
                      {player.name} {player.id === effectivePlayerId && '(You)'}
                    </span>
                    <div className="flex items-center space-x-2">
                      {player.id === gameState.host && (
                        <span className="text-pixel-xs bg-pixel-warning text-pixel-black px-2 py-1 pixel-notification border-pixel-black">
                          HOST
                        </span>
                      )}
                      <div className={`w-3 h-3 pixel-notification border-pixel-black ${
                        player.connected ? 'bg-pixel-success' : 'bg-pixel-error'
                      }`} title={player.connected ? 'Connected' : 'Disconnected'} />
                    </div>
                  </div>
                </div>
              ))}
              {Array.from({ length: 4 - gameState.players.length }).map((_, index) => (
                <div key={`empty-${index}`} className="bg-pixel-black pixel-panel border-pixel-gray p-4">
                  <span className="text-pixel-base-gray font-bold">Waiting for player...</span>
                </div>
              ))}
            </div>
          </div>

          {/* Start Game Button */}
          {isHost && (
            <div className="text-center">
              <button
                onClick={() => {
                  console.log('Start Game button clicked:', {
                    playerCount: gameState.players.length,
                    isHost,
                    status: gameState.status
                  });
                  playSound('click');
                  handleStartGame();
                }}
                disabled={gameState.players.length < 2}
                className="px-8 py-4 bg-pixel-primary hover:bg-pixel-success text-pixel-black font-bold text-pixel-lg pixel-btn border-pixel-black uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {gameState.players.length < 2 ? 'Need 2+ Players' : 'Start Game'}
              </button>
              <p className="text-pixel-base-gray text-pixel-xs mt-2">
                Minimum 2 players required to start
              </p>
              <p className="text-pixel-base-gray text-pixel-xs mt-1">
                Debug: Players: {gameState.players.length}, IsHost: {isHost.toString()}, Status: {gameState.status}
              </p>
              <p className="text-pixel-base-gray text-pixel-xs mt-1">
                Debug IDs: Player: {effectivePlayerId}, Host: {gameState.host}, Match: {(effectivePlayerId === gameState.host).toString()}
              </p>
            </div>
          )}

          {/* Notifications */}
          {notifications.length > 0 && (
            <div className="fixed top-4 right-4 space-y-2 z-50">
              {notifications.map((notification, index) => (
                <div key={index} className="bg-pixel-accent text-pixel-black p-3 pixel-panel border-pixel-black">
                  <p className="font-bold text-pixel-sm">{notification}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen scanlines p-6 font-pixel ${
      isLastThreeSeconds 
        ? 'bg-red-900 bg-opacity-50' 
        : 'bg-pixel-black'
    }`}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-pixel-lg font-bold text-pixel-primary uppercase tracking-wider">Trading Game</h1>
          <div className="flex items-center space-x-3">
            <div className="text-pixel-base-gray text-pixel-sm font-bold pixel-notification bg-pixel-dark-gray border-pixel-gray px-2 py-1">
              Round {gameState.currentRound}/{gameState.maxRounds}
            </div>
            <button
              onClick={onExitGame}
              className="px-3 py-1 bg-pixel-error hover:bg-pixel-warning text-pixel-black font-bold text-pixel-xs pixel-btn border-pixel-black uppercase tracking-wider"
            >
              Exit
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
          {/* Left Column - Compact Info Panels */}
          <div className="lg:col-span-3 space-y-3">
            <Timer timeRemaining={gameState.timeRemaining} />
            <AssetsList assets={currentPlayer?.assets || { gold: 0, water: 0, oil: 0 }} marketChanges={gameState.marketChanges} />
            <RecentActions 
              actions={gameState.recentActions} 
              currentRound={gameState.currentRound} 
              maxRounds={gameState.maxRounds} 
              actionsByRound={actionsByRound}
            />
          </div>

          {/* Middle Column - Player Info */}
          <div className="lg:col-span-5 space-y-3">
            <PlayerWallet 
              tokens={currentPlayer?.tokens || 0} 
              assets={currentPlayer?.assets || { gold: 0, water: 0, oil: 0 }} 
            />
            <PlayerStats players={gameState.players} />
          </div>

          {/* Right Column - Actions */}
          <div className="lg:col-span-4 space-y-3">
            <ActionPanel
              selectedAction={selectedAction}
              selectedResource={selectedResource}
              amount={amount}
              targetPlayer={targetPlayer}
              players={gameState.players}
              currentPlayer={currentPlayer || { id: '', name: '', tokens: 0, assets: { gold: 0, water: 0, oil: 0 }, totalAssets: 0 }}
              onActionChange={setSelectedAction}
              onResourceChange={setSelectedResource}
              onAmountChange={setAmount}
              onTargetChange={setTargetPlayer}
              onConfirmAction={handleAction}
            />
            
            {/* Dojo Transaction Status Panel */}
            {(buyAssetState.isLoading || sellAssetState.isLoading || burnAssetState.isLoading || sabotageState.isLoading || nextRoundProcessing ||
              buyAssetState.error || sellAssetState.error || burnAssetState.error || sabotageState.error || nextRoundError ||
              buyAssetState.txStatus === 'SUCCESS' || sellAssetState.txStatus === 'SUCCESS' || burnAssetState.txStatus === 'SUCCESS' || sabotageState.txStatus === 'SUCCESS') && (
              <div className="bg-pixel-dark-gray pixel-panel border-pixel-gray p-3">
                <h3 className="text-pixel-sm font-bold text-pixel-primary uppercase tracking-wider mb-2">Dojo Status</h3>
                
                {/* Buy Asset Status */}
                {(buyAssetState.isLoading || buyAssetState.error || buyAssetState.txStatus) && (
                  <div className="mb-2 p-2 bg-pixel-gray border-pixel-light-gray pixel-panel">
                    <div className="text-pixel-xs font-bold text-pixel-primary">Buy Asset</div>
                    {buyAssetState.isLoading && (
                      <div className="text-pixel-xs text-pixel-warning">⏳ Processing...</div>
                    )}
                    {buyAssetState.error && (
                      <div className="text-pixel-xs text-pixel-error">❌ {buyAssetState.error}</div>
                    )}
                    {buyAssetState.txStatus === 'SUCCESS' && (
                      <div className="text-pixel-xs text-pixel-success">✅ Transaction successful!</div>
                    )}
                    {buyAssetState.txHash && (
                      <div className="text-pixel-xs text-pixel-base-gray">TX: {buyAssetState.txHash.slice(0, 10)}...</div>
                    )}
                  </div>
                )}
                
                {/* Sell Asset Status */}
                {(sellAssetState.isLoading || sellAssetState.error || sellAssetState.txStatus) && (
                  <div className="mb-2 p-2 bg-pixel-gray border-pixel-light-gray pixel-panel">
                    <div className="text-pixel-xs font-bold text-pixel-primary">Sell Asset</div>
                    {sellAssetState.isLoading && (
                      <div className="text-pixel-xs text-pixel-warning">⏳ Processing...</div>
                    )}
                    {sellAssetState.error && (
                      <div className="text-pixel-xs text-pixel-error">❌ {sellAssetState.error}</div>
                    )}
                    {sellAssetState.txStatus === 'SUCCESS' && (
                      <div className="text-pixel-xs text-pixel-success">✅ Transaction successful!</div>
                    )}
                    {sellAssetState.txHash && (
                      <div className="text-pixel-xs text-pixel-base-gray">TX: {sellAssetState.txHash.slice(0, 10)}...</div>
                    )}
                  </div>
                )}
                
                {/* Burn Asset Status */}
                {(burnAssetState.isLoading || burnAssetState.error || burnAssetState.txStatus) && (
                  <div className="mb-2 p-2 bg-pixel-gray border-pixel-light-gray pixel-panel">
                    <div className="text-pixel-xs font-bold text-pixel-primary">Burn Asset</div>
                    {burnAssetState.isLoading && (
                      <div className="text-pixel-xs text-pixel-warning">⏳ Processing...</div>
                    )}
                    {burnAssetState.error && (
                      <div className="text-pixel-xs text-pixel-error">❌ {burnAssetState.error}</div>
                    )}
                    {burnAssetState.txStatus === 'SUCCESS' && (
                      <div className="text-pixel-xs text-pixel-success">✅ Transaction successful!</div>
                    )}
                    {burnAssetState.txHash && (
                      <div className="text-pixel-xs text-pixel-base-gray">TX: {burnAssetState.txHash.slice(0, 10)}...</div>
                    )}
                  </div>
                )}
                
                {/* Sabotage Status */}
                {(sabotageState.isLoading || sabotageState.error || sabotageState.txStatus) && (
                  <div className="mb-2 p-2 bg-pixel-gray border-pixel-light-gray pixel-panel">
                    <div className="text-pixel-xs font-bold text-pixel-primary">Sabotage</div>
                    {sabotageState.isLoading && (
                      <div className="text-pixel-xs text-pixel-warning">⏳ Processing...</div>
                    )}
                    {sabotageState.error && (
                      <div className="text-pixel-xs text-pixel-error">❌ {sabotageState.error}</div>
                    )}
                    {sabotageState.txStatus === 'SUCCESS' && (
                      <div className="text-pixel-xs text-pixel-success">✅ Transaction successful!</div>
                    )}
                    {sabotageState.txHash && (
                      <div className="text-pixel-xs text-pixel-base-gray">TX: {sabotageState.txHash.slice(0, 10)}...</div>
                    )}
                  </div>
                )}
                
                {/* Next Round Status */}
                {(nextRoundProcessing || nextRoundError) && (
                  <div className="mb-2 p-2 bg-pixel-gray border-pixel-light-gray pixel-panel">
                    <div className="text-pixel-xs font-bold text-pixel-primary">Next Round</div>
                    {nextRoundProcessing && (
                      <div className="text-pixel-xs text-pixel-warning">⏳ Advancing round...</div>
                    )}
                    {nextRoundError && (
                      <div className="text-pixel-xs text-pixel-error">❌ {nextRoundError}</div>
                    )}
                  </div>
                )}
                
                {/* Reset buttons */}
                <div className="flex space-x-1 mt-2">
                  {buyAssetState.error && (
                    <button
                      onClick={resetBuyAssetState}
                      className="px-2 py-1 bg-pixel-secondary hover:bg-pixel-warning text-pixel-black font-bold text-pixel-xs pixel-btn border-pixel-black"
                    >
                      Clear Buy
                    </button>
                  )}
                  {sellAssetState.error && (
                    <button
                      onClick={resetSellAssetState}
                      className="px-2 py-1 bg-pixel-secondary hover:bg-pixel-warning text-pixel-black font-bold text-pixel-xs pixel-btn border-pixel-black"
                    >
                      Clear Sell
                    </button>
                  )}
                  {burnAssetState.error && (
                    <button
                      onClick={resetBurnAssetState}
                      className="px-2 py-1 bg-pixel-secondary hover:bg-pixel-warning text-pixel-black font-bold text-pixel-xs pixel-btn border-pixel-black"
                    >
                      Clear Burn
                    </button>
                  )}
                  {sabotageState.error && (
                    <button
                      onClick={resetSabotageState}
                      className="px-2 py-1 bg-pixel-secondary hover:bg-pixel-warning text-pixel-black font-bold text-pixel-xs pixel-btn border-pixel-black"
                    >
                      Clear Sabotage
                    </button>
                  )}
                  {nextRoundError && (
                    <button
                      onClick={resetNextRoundState}
                      className="px-2 py-1 bg-pixel-secondary hover:bg-pixel-warning text-pixel-black font-bold text-pixel-xs pixel-btn border-pixel-black"
                    >
                      Clear Round
                    </button>
                  )}
                </div>
              </div>
            )}
            
            {/* Dojo Player & Game Info Panel */}
            {(dojoPlayer || dojoGame || dojoMarket) && (
              <div className="bg-pixel-dark-gray pixel-panel border-pixel-gray p-3">
                <h3 className="text-pixel-sm font-bold text-pixel-primary uppercase tracking-wider mb-2">Dojo Data</h3>
                
                {dojoPlayer && (
                  <div className="mb-2 p-2 bg-pixel-gray border-pixel-light-gray pixel-panel">
                    <div className="text-pixel-xs font-bold text-pixel-primary">Player</div>
                    <div className="text-pixel-xs text-pixel-base-gray">Balance: {dojoPlayer.token_balance}</div>
                    <div className="text-pixel-xs text-pixel-base-gray">Address: {dojoPlayer.address.slice(0, 10)}...</div>
                  </div>
                )}
                
                {dojoGame && (
                  <div className="mb-2 p-2 bg-pixel-gray border-pixel-light-gray pixel-panel">
                    <div className="text-pixel-xs font-bold text-pixel-primary">Game</div>
                    <div className="text-pixel-xs text-pixel-base-gray">ID: {dojoGame.id}</div>
                    <div className="text-pixel-xs text-pixel-base-gray">Round: {dojoGame.round}/{dojoGame.max_rounds}</div>
                    <div className="text-pixel-xs text-pixel-base-gray">Active: {dojoGame.is_active ? 'Yes' : 'No'}</div>
                  </div>
                )}
                
                {dojoMarket && (
                  <div className="mb-2 p-2 bg-pixel-gray border-pixel-light-gray pixel-panel">
                    <div className="text-pixel-xs font-bold text-pixel-primary">Market</div>
                    <div className="text-pixel-xs text-pixel-base-gray">Gold: {dojoMarket.gold_price}</div>
                    <div className="text-pixel-xs text-pixel-base-gray">Water: {dojoMarket.water_price}</div>
                    <div className="text-pixel-xs text-pixel-base-gray">Oil: {dojoMarket.oil_price}</div>
                  </div>
                )}
                
                {/* Data refresh buttons */}
                <div className="flex space-x-1 mt-2">
                  <button
                    onClick={refetchPlayer}
                    className="px-2 py-1 bg-pixel-accent hover:bg-pixel-success text-pixel-black font-bold text-pixel-xs pixel-btn border-pixel-black"
                  >
                    Refresh Player
                  </button>
                  <button
                    onClick={refetchMarket}
                    className="px-2 py-1 bg-pixel-accent hover:bg-pixel-success text-pixel-black font-bold text-pixel-xs pixel-btn border-pixel-black"
                  >
                    Refresh Market
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Notifications */}
        {notifications.length > 0 && (
          <div className="fixed top-4 right-4 space-y-2 z-40">
            {notifications.map((notification, index) => (
              <div key={index} className="bg-pixel-accent text-pixel-black p-3 pixel-panel border-pixel-black">
                <p className="font-bold text-pixel-sm">{notification}</p>
              </div>
            ))}
          </div>
        )}

        {/* Winner Modal - Simple Center Popup */}
        {showWinnerModal && gameState?.status === 'finished' && gameState?.winner && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-90 z-50">
            <div className="bg-pixel-primary p-12 pixel-panel border-pixel-black max-w-lg w-full mx-4 text-center">
              {/* Winner Crown */}
              <div className="text-8xl mb-6">
                👑
              </div>
              
              {/* Game Finished */}
              <h2 className="text-pixel-3xl font-bold text-pixel-black mb-4 uppercase tracking-wider">
                Game Finished!
              </h2>
              
              {/* Winner Announcement */}
              <div className="bg-pixel-black p-6 pixel-panel border-pixel-black mb-6">
                <h3 className="text-pixel-2xl font-bold text-pixel-primary mb-2 uppercase tracking-wider">
                  🏆 Winner
                </h3>
                <div className="text-pixel-3xl font-bold text-pixel-success mb-2">
                  {gameState.winner.name}
                </div>
                <div className="text-pixel-lg font-bold text-pixel-base-gray">
                  Final Score: {gameState.winner.finalScore} Points
                </div>
                {gameState.winner.id === effectivePlayerId && (
                  <div className="text-pixel-lg font-bold text-pixel-warning mt-2">
                    🎉 Congratulations! 🎉
                  </div>
                )}
              </div>
              
              {/* Action Buttons */}
              <div className="flex space-x-4">
                <button
                  onClick={() => {
                    playSound('click');
                    setShowWinnerModal(false);
                  }}
                  className="flex-1 px-6 py-3 bg-pixel-success hover:bg-pixel-accent text-pixel-black font-bold text-pixel-base pixel-btn border-pixel-black uppercase tracking-wider"
                >
                  Continue
                </button>
                <button
                  onClick={() => {
                    playSound('click');
                    handleExitGame();
                  }}
                  className="flex-1 px-6 py-3 bg-pixel-error hover:bg-pixel-warning text-pixel-black font-bold text-pixel-base pixel-btn border-pixel-black uppercase tracking-wider"
                >
                  Exit Game
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
