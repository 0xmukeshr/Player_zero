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

  const handleAction = () => {
    if (!currentPlayer || amount <= 0) return;

    const actionData = {
      action: selectedAction,
      resource: selectedResource,
      amount: amount,
      targetPlayer: selectedAction === 'sabotage' ? targetPlayer : undefined
    };

    if (socket) {
      socket.emit('player-action', actionData);
    }

    // Reset form
    setAmount(1);
    setTargetPlayer('');
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
      loadingMessage = 'Loading Game...';
      showRetryButton = true;
    }
    
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
