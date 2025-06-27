// import React, { useState, useEffect } from 'react';
// import { Timer } from './Timer';
// import { PlayerWallet } from './PlayerWallet';
// import { AssetsList } from './AssetsList';
// import { PlayerStats } from './PlayerStats';
// import { ActionPanel } from './ActionPanel';
// import { useSocket } from '../context/SocketContext';
// import { useAudio } from '../hooks/useAudio';
// import useAppStore, { AssetType, ActionType } from '../zustand/store';
// import { useUnifiedActions } from '../hooks/useUnifiedActions';

// interface GameInterfaceProps {
//   onExitGame: () => void;
// }

// export function GameInterface({ onExitGame }: GameInterfaceProps) {
//   const { socket, connected, gameId, playerId, playerName, clearGameInfo } = useSocket();
  
//   // Fallback to localStorage if gameId is not available from context
//   const [effectiveGameId, setEffectiveGameId] = useState<string | null>(null);
//   const [effectivePlayerId, setEffectivePlayerId] = useState<string | null>(null);
//   const [effectivePlayerName, setEffectivePlayerName] = useState<string | null>(null);
//   const [contextLoaded, setContextLoaded] = useState(false);
  
//   // Initialize effective values from context or localStorage
//   useEffect(() => {
//     console.log('GameInterface: Context values update:', { gameId, playerId, playerName });
    
//     // If context has values, use them
//     if (gameId && playerId && playerName) {
//       console.log('GameInterface: Using context values');
//       setEffectiveGameId(gameId);
//       setEffectivePlayerId(playerId);
//       setEffectivePlayerName(playerName);
//       setContextLoaded(true);
//       return;
//     }
    
//     // If context doesn't have values, try localStorage
//     try {
//       const storedGameInfo = localStorage.getItem('currentGameInfo');
//       if (storedGameInfo) {
//         const { gameId: storedGameId, playerId: storedPlayerId, playerName: storedPlayerName } = JSON.parse(storedGameInfo);
//         console.log('GameInterface: Using stored game info:', { storedGameId, storedPlayerId, storedPlayerName });
        
//         if (storedGameId && storedPlayerId) {
//           setEffectiveGameId(storedGameId);
//           setEffectivePlayerId(storedPlayerId);
//           setEffectivePlayerName(storedPlayerName || 'Unknown Player');
//           setContextLoaded(true);
//           return;
//         }
//       }
//     } catch (error) {
//       console.error('GameInterface: Error loading stored game info:', error);
//     }
    
//     // If still no game info found, try to get from user profile and check for recently created games
//     try {
//       const userProfile = localStorage.getItem('userProfile');
//       if (userProfile) {
//         const profile = JSON.parse(userProfile);
//         console.log('GameInterface: User profile found:', profile.name);
        
//         // Set at least the player name if we have it
//         if (profile.name) {
//           setEffectivePlayerName(profile.name);
//         }
//       }
//     } catch (error) {
//       console.error('GameInterface: Error loading user profile:', error);
//     }
    
//     // Mark as loaded even if no values found to avoid infinite loading
//     setContextLoaded(true);
//   }, [gameId, playerId, playerName]);
//   const { playSound } = useAudio();
  
//   // Use Zustand store for application state
//   const {
//     currentGame,
//     market,
//     player: dojoPlayerFromStore,
//     inventory,
//     gameStarted,
//     selectedAsset,
//     selectedAction: selectedActionFromStore,
//     isLoading,
//     error,
//     setCurrentGame,
//     setPlayer,
//     setInventory,
//     setMarket,
//     setSelectedAsset,
//     setSelectedAction,
//     startGame: storeStartGame,
//     endGame: storeEndGame,
//     setLoading,
//     setError,
//     getAssetPrice,
//     getAssetAmount,
//     canAffordAsset,
//     getTotalPortfolioValue
//   } = useAppStore();
  
//   // Prioritize Dojo data over socket data when available
//   const effectivePlayer = dojoPlayer || dojoPlayerFromStore || currentPlayer;
//   const effectiveInventory = inventory || { gold: "0", water: "0", oil: "0" };
//   const effectiveMarket = dojoMarket || market;
  
//   // Local UI state that doesn't need to persist
//   const [gameState, setGameState] = useState<any>(null); // Keep for socket-based game state
//   const [isHost, setIsHost] = useState(false);
//   const [currentPlayer, setCurrentPlayer] = useState<any>(null); // Socket player data
//   const [selectedAction, setSelectedActionLocal] = useState<ActionType>('Buy');
//   const [selectedResource, setSelectedResource] = useState<AssetType>('Gold');
//   const [amount, setAmount] = useState<number>(1);
//   const [targetPlayer, setTargetPlayer] = useState<string>('');
//   const [notifications, setNotifications] = useState<string[]>([]);
//   const [previousPlayerCount, setPreviousPlayerCount] = useState(0);
//   const [previousRecentActions, setPreviousRecentActions] = useState<string[]>([]);
//   const [showWinnerModal, setShowWinnerModal] = useState(false);
//   const [gameFinished, setGameFinished] = useState(false);
//   const [isLastThreeSeconds, setIsLastThreeSeconds] = useState(false);
  
//   // Mobile UI state
//   const [activeTab, setActiveTab] = useState<'wallet' | 'assets' | 'actions' | 'stats'>('actions');
//   const [showMobileMenu, setShowMobileMenu] = useState(false);
//   const [isLandscape, setIsLandscape] = useState(window.innerWidth > window.innerHeight);
//   const [isMobile, setIsMobile] = useState(window.innerWidth < 768);


//   // Initialize Dojo hooks properly (no try-catch needed for hooks)
//   const { buyAssetState, executeBuyAsset, canBuyAsset, resetBuyAssetState } = useBuyAsset();
//   const { sellAssetState, executeSellAsset, canSellAsset, resetSellAssetState } = useSellAsset();
//   const { burnAssetState, executeBurnAsset, canBurnAsset, resetBurnAssetState } = useBurnAsset();
//   const { sabotageState, executeSabotage, canSabotage, resetSabotageState } = useSabotage();
//   const { nextRound, resetNextRoundState, isProcessing: nextRoundProcessing, error: nextRoundError, canAdvanceRound } = useNextRound();
//   const { player: dojoPlayer, isLoading: playerLoading, error: playerError, refetch: refetchPlayer } = usePlayer();
//   const { currentGame: dojoGame, createGame, joinGame, startGame: dojoStartGame, isProcessing: gameProcessing, error: gameError } = useGame();
//   const { market: dojoMarket, isLoading: marketLoading, error: marketError, refetch: refetchMarket } = useMarket();
  
//   // Round timer management for hosts
//   const {
//     timeUntilNextRound,
//     isAutoAdvanceEnabled,
//     toggleAutoAdvance,
//     manualAdvanceRound
//   } = useRoundTimer({
//     isHost,
//     gameState,
//     gameStarted,
//     onRoundAdvance: () => {
//       addNotification('🔄 Round advanced! Market data updated.');
//     }
//   });
  
//   // Market sync for non-host players
//   useMarketSync({
//     isHost,
//     gameStarted,
//     onMarketFetched: () => {
//       addNotification('📊 Market data synchronized!');
//     }
//   });
  
//   // Socket event listeners setup (only once)
//   useEffect(() => {
//     if (!socket) {
//       console.log('GameInterface: No socket available');
//       return;
//     }


//     socket.on('game-state', (state: any) => {
//       if (state) {
//         setGameState(state);

//         if (state.status === 'playing' && !gameStarted) {
//           storeStartGame();
//         }
//       }
//     });

//     socket.on('game-started', () => {
//       console.log('🎮 Game started - fetching market data');
//       playSound('switch');
//       // Fetch market data when game starts
//       if (refetchMarket) {
//         refetchMarket().then(() => {
//           console.log('✅ Market data fetched on game start');
//         }).catch((error) => {
//           console.error('❌ Error fetching market data on game start:', error);
//         });
//       }
//     });

//     // Listen for next round events
//     socket.on('next-round', (data: { round: number; delay: number }) => {
//       addNotification(`🔄 Round ${data.round} starting in ${data.delay / 1000} seconds...`);

//       setTimeout(() => {
//         if (refetchMarket) {
//           refetchMarket().then(() => {
//             addNotification(`📊 Market data updated for round ${data.round}`);
//           });
//         }
//       }, data.delay);
//     });

//     // Listen for round started events
//     socket.on('round-started', (data: { round: number }) => {
//       console.log(`🎯 Round ${data.round} has started`);
//       addNotification(`🎯 Round ${data.round} started!`);
//       playSound('click');
//     });

//     socket.on('game-finished', (finalState: any) => {
//       setGameState(finalState);
//       playSound('action');
//     });

//     socket.on('player-joined', (data: { playerName: string }) => {
//       playSound('click');
//     });

//     socket.on('player-disconnected', (data: { playerName: string }) => {
//       console.log(`${data.playerName} disconnected`);
//     });

//     socket.on('error', (error: { message: string }) => {
//       console.error('Game error:', error.message);
//     });

//     socket.on('game-closed', (data: { reason: string }) => {
//       console.log('Game closed by server:', data.reason);
//       addNotification(`🚪 Game closed: ${data.reason}`);
      
//       // Auto-exit to lobby after a short delay
//       setTimeout(() => {
//         clearGameInfo();
//         onExitGame();
//       }, 3000);
//     });

//     return () => {
//       socket.off('game-state');
//       socket.off('game-started');
//       socket.off('next-round');
//       socket.off('round-started');
//       socket.off('game-finished');
//       socket.off('player-joined');
//       socket.off('player-disconnected');
//       socket.off('error');
//       socket.off('game-closed');
//     };
//   }, [socket]); // Only depend on socket
  

//   // Separate effect for basic player and game state updates
//   useEffect(() => {
//     if (gameState) {
//       const player = gameState.players.find((p: any) => p.id === effectivePlayerId);
//       setCurrentPlayer(player || null);
      
//       // Fix: Only consider game started when status is 'playing'
//       // currentRound can be > 0 even in waiting room (for game setup)
//       const shouldBeStarted = gameState.status === 'playing';
      
//       // Debug first to see what's happening
//       console.log('GameInterface: Game state updated:', {
//         playerCount: gameState.players.length,
//         isHost: gameState.host === effectivePlayerId,
//         status: gameState.status,
//         currentRound: gameState.currentRound,
//         shouldBeStarted,
//         currentGameStarted: gameStarted,
//         willCallStartGame: shouldBeStarted && !gameStarted,
//         willCallEndGame: !shouldBeStarted && gameStarted
//       });
      
//       // CRITICAL FIX: Always call storeStartGame if game should be started, regardless of current state
//       if (shouldBeStarted) {
//         console.log('GameInterface: Game should be started, calling storeStartGame()');
//         storeStartGame();
        
//         // Check store immediately to confirm update
//         const newGameStarted = useAppStore.getState().gameStarted;
//         console.log('GameInterface: Store gameStarted immediately after storeStartGame():', newGameStarted);
//       } else if (!shouldBeStarted && gameStarted) {
//         console.log('GameInterface: Game should NOT be started, calling storeEndGame()');
//         storeEndGame();
//       }
//     }
//   }, [gameState?.status, gameState?.currentRound, effectivePlayerId]); // Removed gameStarted from dependencies to prevent loops
  
//   // Clean host detection - simple and reliable
//   useEffect(() => {
//     if (!gameState || !effectivePlayerId) {
//       console.log('GameInterface: Host detection skipped - missing data:', {
//         hasGameState: !!gameState,
//         effectivePlayerId
//       });
//       return;
//     }

//     // Enhanced host check: compare player ID with host ID and also check wallet addresses
//     let amHost = false;
    
//     // Method 1: Direct player ID comparison
//     if (gameState.host === effectivePlayerId) {
//       amHost = true;
//     }
    
//     // Method 2: Compare wallet addresses (for cases where player ID format differs)
//     if (!amHost && gameState.players) {
//       const currentPlayer = gameState.players.find((p: any) => p.id === effectivePlayerId);
//       const hostPlayer = gameState.players.find((p: any) => p.id === gameState.host);
      
//       if (currentPlayer?.walletAddress && hostPlayer?.walletAddress) {
//         amHost = currentPlayer.walletAddress.toLowerCase() === hostPlayer.walletAddress.toLowerCase();
//       }
//     }
    
//     // Method 3: Check if this is marked as creator in localStorage
//     if (!amHost) {
//       try {
//         const storedGameInfo = localStorage.getItem('currentGameInfo');
//         if (storedGameInfo) {
//           const gameInfo = JSON.parse(storedGameInfo);
//           if (gameInfo.isCreator === true && gameInfo.gameId === gameState.gameId) {
//             amHost = true;
//           }
//         }
//       } catch (error) {
//         console.error('Error checking localStorage for creator status:', error);
//       }
//     }
    
//     console.log('GameInterface: Enhanced host detection check:', {
//       gameStateHost: gameState.host,
//       effectivePlayerId,
//       currentPlayerWallet: gameState.players?.find((p: any) => p.id === effectivePlayerId)?.walletAddress,
//       hostPlayerWallet: gameState.players?.find((p: any) => p.id === gameState.host)?.walletAddress,
//       isCreatorInStorage: (() => {
//         try {
//           const stored = localStorage.getItem('currentGameInfo');
//           return stored ? JSON.parse(stored).isCreator : false;
//         } catch { return false; }
//       })(),
//       amHost,
//       previousIsHost: isHost
//     });
    
//     setIsHost(amHost);
    
//     // Additional debugging
//     if (amHost !== isHost) {
//       console.log('GameInterface: Host status changed from', isHost, 'to', amHost);
//     }
//   }, [gameState?.host, effectivePlayerId, gameState?.players]);
  
//   // Get actionsByRound from game state - combine actionHistory with current round actions
//   const actionsByRound = React.useMemo(() => {
//     if (!gameState) return {};
    
//     const combined = { ...gameState.actionHistory };
    
//     // Add current round actions if any exist
//     if (gameState.recentActions && gameState.recentActions.length > 0 && gameState.currentRound) {
//       combined[gameState.currentRound] = gameState.recentActions;
//     }
    
//     return combined;
//   }, [gameState?.actionHistory, gameState?.recentActions, gameState?.currentRound]);
  
//   // Player count monitoring disabled for performance optimization
//   // useEffect(() => {
//   //   // Continuous player monitoring disabled to prevent 100% CPU usage
//   // }, [gameState?.players?.length]);
  
//   // Action monitoring disabled for performance optimization
//   // useEffect(() => {
//   //   // Continuous action monitoring disabled to prevent 100% CPU usage
//   // }, [gameState?.recentActions]);
//   useEffect(() => {
//     if (gameState) {
//       // Check if game finished
//       if (gameState.status === 'finished' && !gameFinished) {
//         setGameFinished(true);
//         setShowWinnerModal(true);
        
//         // Play victory sound
//         playSound('switch');
        
//         addNotification('🏁 Game finished!');
        
//         // Show winner from game state (calculated by host)
//         if (gameState.winner) {
//           addNotification(`🏆 Winner: ${gameState.winner.name} (${gameState.winner.finalScore} points)!`);
//         }
//       }
      
//       // Check if game returned to waiting after being finished
//       if (gameState.status === 'waiting' && gameFinished) {
//         setGameFinished(false);
//         setShowWinnerModal(false);
//         addNotification('🔄 Ready for rematch!');
//       }
//     }
//   }, [gameState?.status, gameState?.winner?.name, gameState?.winner?.finalScore, gameFinished]);

//   // Timer monitoring disabled for performance optimization
//   // useEffect(() => {
//   //   // Timer monitoring disabled to prevent 100% CPU usage
//   // }, [gameState?.timeRemaining]);

//   const addNotification = (message: string) => {
//     setNotifications(prev => [message, ...prev.slice(0, 4)]);
//     setTimeout(() => {
//       setNotifications(prev => prev.filter(n => n !== message));
//     }, 5000);
//   };

//   const handleStartGame = () => {
//     if (isHost && socket) {
//       socket.emit('start-game');
//       addNotification('Starting game...');
//     }
//   };

//   const handleExitGame = () => {
//     // Emit exit-game event to server
//     if (socket && effectiveGameId && effectivePlayerId) {
//       socket.emit('exit-game', {
//         gameId: effectiveGameId,
//         playerId: effectivePlayerId
//       });
//     }
    
//     // Clear game info from context
//     clearGameInfo();
//     onExitGame();
//   };

//   const handlePlayerAction = async () => {
//     await handleAction();
//   };

//   const handleAction = async () => {
//     if (!currentPlayer || amount <= 0) return;

//     const actionData = {
//       action: selectedAction,
//       resource: selectedResource,
//       amount: amount,
//       targetPlayer: selectedAction === 'Sabotage' ? targetPlayer : undefined
//     };

//     // Use the store-managed selected resource and action
//     const assetType: AssetType = selectedResource;
//     const actionType: ActionType = selectedAction;

//     try {
//       // Execute Dojo action based on selected action type
//       switch (actionType) {
//         case 'Buy':
//           if (canBuyAsset) {
//             console.log(`🎮 Executing Dojo buy ${assetType}`);
//             await executeBuyAsset(assetType);
//             addNotification(`📤 Dojo: Buying ${assetType}...`);
//           } else {
//             console.warn('⚠️ Cannot execute buy asset via Dojo');
//           }
//           break;
        
//         case 'Sell':
//           if (canSellAsset) {
//             console.log(`🎮 Executing Dojo sell ${assetType}`);
//             await executeSellAsset(assetType);
//             addNotification(`📤 Dojo: Selling ${assetType}...`);
//           } else {
//             console.warn('⚠️ Cannot execute sell asset via Dojo');
//           }
//           break;
        
//         case 'Burn':
//           if (canBurnAsset) {
//             console.log(`🎮 Executing Dojo burn ${assetType}`);
//             await executeBurnAsset(assetType);
//             addNotification(`📤 Dojo: Burning ${assetType}...`);
//           } else {
//             console.warn('⚠️ Cannot execute burn asset via Dojo');
//           }
//           break;
        
//         case 'Sabotage':
//           if (canSabotage && targetPlayer) {
//             console.log(`🎮 Executing Dojo sabotage ${assetType} on ${targetPlayer}`);
//             // Note: The Dojo sabotage hook expects a player address, but we have player name
//             // We need to find the player's address from the target player name
//             const targetPlayerData = gameState?.players.find((p: any) => p.name === targetPlayer);
//             if (targetPlayerData?.address) {
//               await executeSabotage(targetPlayerData.address, assetType);
//               addNotification(`📤 Dojo: Sabotaging ${targetPlayer}'s ${assetType}...`);
//             } else {
//               console.warn('⚠️ Cannot find target player address for sabotage');
//               addNotification('⚠️ Cannot find target player address for Dojo sabotage');
//             }
//           } else {
//             console.warn('⚠️ Cannot execute sabotage via Dojo');
//           }
//           break;
        
//         default:
//           console.warn(`⚠️ Unknown action type: ${actionType}`);
//       }
//     } catch (error) {
//       console.error(`❌ Error executing Dojo action ${selectedAction}:`, error);
//       addNotification(`❌ Dojo transaction failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
//     }

//     // Also emit to socket system (alongside Dojo)
//     if (socket) {
//       console.log('📡 Emitting socket action:', actionData);
//       socket.emit('player-action', actionData);
//     }

//     // Reset form
//     setAmount(1);
//     setTargetPlayer('');
//   };

//   // Handle next round - integrate both Dojo and socket systems
//   const handleNextRound = async () => {
//     if (!dojoGame?.id) {
//       console.warn('⚠️ No Dojo game ID available for next round');
//       return;
//     }

//     try {
//       console.log('🎮 Executing Dojo next round...');
//       addNotification('📤 Dojo: Advancing to next round...');
      
//       const result = await nextRound(dojoGame.id);
      
//       if (result.success) {
//         addNotification('✅ Dojo: Round advanced successfully!');
//         addNotification('⏳ Waiting 10 seconds to sync market data...');
        
//         // Wait 10 seconds before refreshing market data to sync with on-chain state
//         setTimeout(async () => {
//           console.log('🔄 Refreshing market data after round advance...');
//           await refetchMarket();
//           await refetchPlayer();
//           addNotification('📊 Market data synced with on-chain state!');
//         }, 10000); // 10 second wait
//       } else {
//         addNotification(`❌ Dojo next round failed: ${result.error}`);
//       }
//     } catch (error) {
//       console.error('❌ Error executing Dojo next round:', error);
//       addNotification(`❌ Dojo next round error: ${error instanceof Error ? error.message : 'Unknown error'}`);
//     }

//     // Also emit to socket system (if applicable)
//     if (socket) {
//       console.log('📡 Emitting socket next round...');
//       socket.emit('next-round');
//     }
//   };

//   // Show initial loading only for critical missing pieces
//   if (!contextLoaded) {
//     return (
//       <div className="min-h-screen bg-pixel-black scanlines p-6 font-pixel flex items-center justify-center">
//         <div className="bg-pixel-dark-gray pixel-panel border-pixel-gray p-8">
//           <h2 className="text-pixel-xl font-bold text-pixel-primary text-center mb-4">
//             Initializing...
//           </h2>
//         </div>
//       </div>
//     );
//   }

//   // Show connection loading
//   if (!connected) {
//     return (
//       <div className="min-h-screen bg-pixel-black scanlines p-6 font-pixel flex items-center justify-center">
//         <div className="bg-pixel-dark-gray pixel-panel border-pixel-gray p-8">
//           <h2 className="text-pixel-xl font-bold text-pixel-primary text-center mb-4">
//             Connecting to server...
//           </h2>
//         </div>
//       </div>
//     );
//   }

//   // Show error for missing game ID
//   if (!effectiveGameId) {
//     return (
//       <div className="min-h-screen bg-pixel-black scanlines p-6 font-pixel flex items-center justify-center">
//         <div className="bg-pixel-dark-gray pixel-panel border-pixel-gray p-8">
//           <h2 className="text-pixel-xl font-bold text-pixel-primary text-center mb-4">
//             No game selected...
//           </h2>
//           <div className="mt-6 text-center">
//             <button
//               onClick={handleExitGame}
//               className="px-6 py-3 bg-pixel-gray hover:bg-pixel-light-gray text-pixel-primary font-bold text-pixel-base pixel-btn border-pixel-gray uppercase tracking-wider"
//             >
//               Exit to Lobby
//             </button>
//           </div>
//         </div>
//       </div>
//     );
//   }

//   // If we have gameId but no gameState yet, show retry option
//   if (!gameState) {
//     let loadingMessage = 'Loading Game State...';
//     let showRetryButton = true;
//     let showExitButton = true;
    
//     console.log('GameInterface Loading State:', {
//       contextLoaded,
//       connected,
//       effectiveGameId,
//       gameState: !!gameState,
//       loadingMessage,
//       localStorageGameInfo: localStorage.getItem('currentGameInfo'),
//       contextGameId: gameId,
//       contextPlayerId: playerId,
//       contextPlayerName: playerName
//     });
    
//     return (
//       <div className="min-h-screen bg-pixel-black scanlines p-6 font-pixel flex items-center justify-center">
//         <div className="bg-pixel-dark-gray pixel-panel border-pixel-gray p-8">
//           <h2 className="text-pixel-xl font-bold text-pixel-primary text-center mb-4">
//             {loadingMessage}
//           </h2>
//           <p className="text-pixel-base-gray text-center">Game ID: {effectiveGameId || 'Unknown'}</p>
//           {showRetryButton && connected && effectiveGameId && (
//             <div className="mt-4 text-center">
//               <button
//                 onClick={() => {
//                   console.log('Retrying game state request...');
//                   if (socket && effectiveGameId) {
//                     socket.emit('get-game-state', { gameId: effectiveGameId });
//                   }
//                 }}
//                 className="px-4 py-2 bg-pixel-primary hover:bg-pixel-success text-pixel-black font-bold text-pixel-sm pixel-btn border-pixel-black uppercase tracking-wider mr-4"
//               >
//                 Retry
//               </button>
//             </div>
//           )}
//           <div className="mt-6 text-center">
//             <button
//               onClick={handleExitGame}
//               className="px-6 py-3 bg-pixel-gray hover:bg-pixel-light-gray text-pixel-primary font-bold text-pixel-base pixel-btn border-pixel-gray uppercase tracking-wider"
//             >
//               Exit to Lobby
//             </button>
//           </div>
//         </div>
//       </div>
//     );
//   }

//   // Waiting room state
//   if (!gameStarted) {
//     return (
//       <div className="min-h-screen bg-pixel-black scanlines p-6 font-pixel">
//         <div className="max-w-4xl mx-auto">
//           {/* Header */}
//           <div className="flex items-center justify-between mb-6">
//             <h1 className="text-pixel-2xl font-bold text-pixel-primary uppercase tracking-wider">
//               Waiting Room
//             </h1>
//             <button
//               onClick={() => {
//                 playSound('click');
//                 handleExitGame();
//               }}
//               className="px-4 py-2 bg-pixel-error hover:bg-pixel-warning text-pixel-black font-bold text-pixel-sm pixel-btn border-pixel-black uppercase tracking-wider"
//             >
//               Exit Game
//             </button>
//           </div>

//           {/* Game Info */}
//           <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
//             <div className="bg-pixel-dark-gray pixel-panel border-pixel-gray p-6">
//               <div className="flex items-center justify-between mb-4">
//                 <h3 className="text-pixel-lg font-bold text-pixel-primary">Game Info</h3>
//                 <div className="flex items-center space-x-2">
//                   <div className="w-2 h-2 bg-pixel-success pixel-notification border-pixel-success" title="Live Sync Active"></div>
//                   <span className="text-pixel-xs text-pixel-success font-bold">LIVE</span>
//                 </div>
//               </div>
//               <div className="space-y-2 text-pixel-base-gray">
//                 <p><span className="text-pixel-primary">Game ID:</span> {effectiveGameId}</p>
//                 <p><span className="text-pixel-primary">Host:</span> {isHost ? 'You' : gameState.players.find((p: any) => p.id === gameState.host)?.name || 'Unknown'}</p>
//                 <p><span className="text-pixel-primary">Players:</span> {gameState.players.length}/4</p>
//                 <p><span className="text-pixel-primary">Status:</span> Waiting for players</p>
//               </div>
//             </div>

//             <div className="bg-pixel-dark-gray pixel-panel border-pixel-gray p-6">
//               <h3 className="text-pixel-lg font-bold text-pixel-primary mb-4">How to Invite</h3>
//               <div className="space-y-2 text-pixel-base-gray text-pixel-sm">
//                 <p>1. Share the Game ID with friends</p>
//                 <p>2. They join using "Join by ID"</p>
//                 <p>3. Host starts the game when ready</p>
//               </div>
//               <button
//                 onClick={() => {
//                   playSound('click');
//                   if (effectiveGameId) {
//                     navigator.clipboard.writeText(effectiveGameId)
//                       .then(() => {
//                         addNotification('📋 Game ID copied to clipboard!');
//                       })
//                       .catch((err) => {
//                         console.error('Failed to copy game ID:', err);
//                         addNotification('❌ Failed to copy Game ID');
//                       });
//                   } else {
//                     addNotification('❌ No Game ID to copy');
//                   }
//                 }}
//                 className="mt-4 w-full px-4 py-2 bg-pixel-accent hover:bg-pixel-success text-pixel-black font-bold text-pixel-sm pixel-btn border-pixel-black uppercase tracking-wider"
//               >
//                 Copy Game ID
//               </button>
//             </div>
//           </div>

//           {/* Players List */}
//           <div className="bg-pixel-dark-gray pixel-panel border-pixel-gray p-6 mb-6">
//             <h3 className="text-pixel-lg font-bold text-pixel-primary mb-4">Players ({gameState.players.length}/4)</h3>
//             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//               {gameState.players.map((player: any, index: number) => (
//                 <div key={player.id} className="bg-pixel-gray pixel-panel border-pixel-light-gray p-4">
//                   <div className="flex items-center justify-between">
//                     <span className="text-pixel-primary font-bold">
//                       {player.name} {player.id === effectivePlayerId && '(You)'}
//                     </span>
//                     <div className="flex items-center space-x-2">
//                       {player.id === gameState.host && (
//                         <span className="text-pixel-xs bg-pixel-warning text-pixel-black px-2 py-1 pixel-notification border-pixel-black">
//                           HOST
//                         </span>
//                       )}
//                       <div className={`w-3 h-3 pixel-notification border-pixel-black ${
//                         player.connected ? 'bg-pixel-success' : 'bg-pixel-error'
//                       }`} title={player.connected ? 'Connected' : 'Disconnected'} />
//                     </div>
//                   </div>
//                 </div>
//               ))}
//               {Array.from({ length: 4 - gameState.players.length }).map((_, index) => (
//                 <div key={`empty-${index}`} className="bg-pixel-black pixel-panel border-pixel-gray p-4">
//                   <span className="text-pixel-base-gray font-bold">Waiting for player...</span>
//                 </div>
//               ))}
//             </div>
//           </div>


//           {/* Start Game Button - Show ONLY for host */}
//           {isHost && (
//             <div className="text-center">
//               <button
//                 onClick={() => {
//                   playSound('click');
//                   handleStartGame();
//                 }}
//                 disabled={gameState.players.length < 2}
//                 className="px-8 py-4 bg-pixel-primary hover:bg-pixel-success text-pixel-black font-bold text-pixel-lg pixel-btn border-pixel-black uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed"
//               >
//                 {gameState.players.length < 2 ? 'Need 2+ Players' : 'Start Game'}
//               </button>
//               <p className="text-pixel-base-gray text-pixel-xs mt-2">
//                 Minimum 2 players required to start
//               </p>
//               <p className="text-pixel-success text-pixel-xs mt-1">
//                 You are the host - you can start the game when ready
//               </p>
//             </div>
//           )}
          
//           {/* Waiting for Host Message */}
//           {!isHost && (
//             <div className="text-center">
//               <div className="bg-pixel-warning pixel-panel border-pixel-black p-4">
//                 <p className="text-pixel-black font-bold">Waiting for host to start the game...</p>
//                 <p className="text-pixel-black text-pixel-xs mt-1">
//                   Host: {gameState.players.find(p => p.id === gameState.host)?.name || 'Unknown'}
//                 </p>
//                 <p className="text-pixel-black text-pixel-xs mt-1">
//                   Only the host can start the game
//                 </p>
//               </div>
//             </div>
//           )}

//           {/* Notifications */}
//           {notifications.length > 0 && (
//             <div className="fixed top-4 right-4 space-y-2 z-50">
//               {notifications.map((notification, index) => (
//                 <div key={index} className="bg-pixel-accent text-pixel-black p-3 pixel-panel border-pixel-black">
//                   <p className="font-bold text-pixel-sm">{notification}</p>
//                 </div>
//               ))}
//             </div>
//           )}
//         </div>
//       </div>
//     );
//   }

//   // Mobile tab content renderer
//   const renderMobileTabContent = () => {
//     switch (activeTab) {
//       case 'wallet':
//         return (
//           <PlayerWallet 
//             tokens={currentPlayer?.tokens || 0} 
//             assets={currentPlayer?.assets || { gold: 0, water: 0, oil: 0 }} 
//           />
//         );
//       case 'assets':
//         return (
//           <AssetsList 
//             assets={currentPlayer?.assets || { gold: 0, water: 0, oil: 0 }} 
//           />
//         );
//       case 'actions':
//         return (
//           <ActionPanel
//             selectedAction={selectedAction}
//             selectedResource={selectedResource}
//             amount={amount}
//             targetPlayer={targetPlayer}
//             players={gameState.players}
//             currentPlayer={currentPlayer || { id: '', name: '', tokens: 0, assets: { gold: 0, water: 0, oil: 0 }, totalAssets: 0 }}
//             onActionChange={(action: ActionType) => {
//               setSelectedActionLocal(action);
//               setSelectedAction(action);
//             }}
//             onResourceChange={(resource: AssetType) => {
//               setSelectedResource(resource);
//               setSelectedAsset(resource);
//             }}
//             onAmountChange={setAmount}
//             onTargetChange={setTargetPlayer}
//             onConfirmAction={handlePlayerAction}
//           />
//         );
//       case 'stats':
//         return <PlayerStats players={gameState.players} />;
//       default:
//         return null;
//     }
//   };

//   return (
//     <div className={`min-h-screen-safe scanlines font-pixel ${
//       isLastThreeSeconds 
//         ? 'bg-red-900 bg-opacity-50' 
//         : 'bg-pixel-black'
//     }`}>
//       <div className="w-full mx-auto p-2 sm:p-4">
//         {/* Header */}
//         <div className="flex items-center justify-between mb-2">
//           <h1 className="text-pixel-xs sm:text-pixel-base font-bold text-pixel-primary uppercase tracking-wider">
//             <span className="hidden sm:inline"> Game</span>
//             <span className="sm:hidden">Game</span>
//           </h1>
//           <div className="flex items-center space-x-2 sm:space-x-3">
//             <div className="text-pixel-base-gray text-pixel-xs sm:text-pixel-sm font-bold pixel-notification bg-pixel-dark-gray border-pixel-gray px-2 py-1">
//               R {gameState.currentRound}/{gameState.maxRounds}
//             </div>
//             {/* Portrait mode warning for mobile */}
//             {isMobile && !isLandscape && (
//               <div className="text-pixel-xs text-pixel-warning bg-pixel-dark-gray border-pixel-warning px-2 py-1 pixel-notification">
//                 📱 Rotate for better view
//               </div>
//             )}
//             <button
//               onClick={onExitGame}
//               className="px-2 sm:px-3 py-1 bg-pixel-error hover:bg-pixel-warning text-pixel-black font-bold text-pixel-xs pixel-btn border-pixel-black uppercase tracking-wider min-h-touch"
//             >
//               <span className="hidden sm:inline">Exit</span>
//               <span className="sm:hidden">❌</span>
//             </button>
//           </div>
//         </div>

//         {/* Timer - Always visible on mobile */}
//         <div className="md:hidden mb-3">
//           <Timer timeRemaining={gameState.timeRemaining} />
//         </div>

//         {/* Desktop Layout */}
//         <div className="hidden md:grid md:grid-cols-12 gap-3">
//           {/* Left Column - Compact Info Panels */}
//           <div className="md:col-span-3 space-y-3">
//             <Timer timeRemaining={gameState.timeRemaining} />
//             <AssetsList assets={currentPlayer?.assets || { gold: 0, water: 0, oil: 0 }} />
//             <RecentActions 
//               actions={gameState.recentActions} 
//               currentRound={gameState.currentRound} 
//               maxRounds={gameState.maxRounds} 
//               actionsByRound={actionsByRound}
//             />
//           </div>

//           {/* Middle Column - Player Info */}
//           <div className="md:col-span-5 space-y-3">
//             <PlayerWallet 
//               tokens={currentPlayer?.tokens || 0} 
//               assets={currentPlayer?.assets || { gold: 0, water: 0, oil: 0 }} 
//             />
//             <PlayerStats players={gameState.players} />
//           </div>

//           {/* Right Column - Actions */}
//           <div className="md:col-span-4 space-y-3">
//             <ActionPanel
//               selectedAction={selectedAction}
//               selectedResource={selectedResource}
//               amount={amount}
//               targetPlayer={targetPlayer}
//               players={gameState.players}
//               currentPlayer={currentPlayer || { id: '', name: '', tokens: 0, assets: { gold: 0, water: 0, oil: 0 }, totalAssets: 0 }}
//               onActionChange={(action: ActionType) => {
//                 setSelectedActionLocal(action);
//                 setSelectedAction(action); // Also update Zustand store
//               }}
//               onResourceChange={(resource: AssetType) => {
//                 setSelectedResource(resource);
//                 setSelectedAsset(resource); // Also update Zustand store
//               }}
//               onAmountChange={setAmount}
//               onTargetChange={setTargetPlayer}
//               onConfirmAction={handlePlayerAction}
//             />
            
//             {/* Dojo Transaction Status Panel */}
//             {(buyAssetState.isLoading || sellAssetState.isLoading || burnAssetState.isLoading || sabotageState.isLoading || nextRoundProcessing ||
//               buyAssetState.error || sellAssetState.error || burnAssetState.error || sabotageState.error || nextRoundError ||
//               buyAssetState.txStatus === 'SUCCESS' || sellAssetState.txStatus === 'SUCCESS' || burnAssetState.txStatus === 'SUCCESS' || sabotageState.txStatus === 'SUCCESS') && (
//               <div className="bg-pixel-dark-gray pixel-panel border-pixel-gray p-3">
//                 <h3 className="text-pixel-sm font-bold text-pixel-primary uppercase tracking-wider mb-2">Dojo Status</h3>
                
//                 {/* Buy Asset Status */}
//                 {(buyAssetState.isLoading || buyAssetState.error || buyAssetState.txStatus) && (
//                   <div className="mb-2 p-2 bg-pixel-gray border-pixel-light-gray pixel-panel">
//                     <div className="text-pixel-xs font-bold text-pixel-primary">Buy Asset</div>
//                     {buyAssetState.isLoading && (
//                       <div className="text-pixel-xs text-pixel-warning">⏳ Processing...</div>
//                     )}
//                     {buyAssetState.error && (
//                       <div className="text-pixel-xs text-pixel-error">❌ {buyAssetState.error}</div>
//                     )}
//                     {buyAssetState.txStatus === 'SUCCESS' && (
//                       <div className="text-pixel-xs text-pixel-success">✅ Transaction successful!</div>
//                     )}
//                     {buyAssetState.txHash && (
//                       <div className="text-pixel-xs text-pixel-base-gray">TX: {buyAssetState.txHash.slice(0, 10)}...</div>
//                     )}
//                   </div>
//                 )}
                
//                 {/* Sell Asset Status */}
//                 {(sellAssetState.isLoading || sellAssetState.error || sellAssetState.txStatus) && (
//                   <div className="mb-2 p-2 bg-pixel-gray border-pixel-light-gray pixel-panel">
//                     <div className="text-pixel-xs font-bold text-pixel-primary">Sell Asset</div>
//                     {sellAssetState.isLoading && (
//                       <div className="text-pixel-xs text-pixel-warning">⏳ Processing...</div>
//                     )}
//                     {sellAssetState.error && (
//                       <div className="text-pixel-xs text-pixel-error">❌ {sellAssetState.error}</div>
//                     )}
//                     {sellAssetState.txStatus === 'SUCCESS' && (
//                       <div className="text-pixel-xs text-pixel-success">✅ Transaction successful!</div>
//                     )}
//                     {sellAssetState.txHash && (
//                       <div className="text-pixel-xs text-pixel-base-gray">TX: {sellAssetState.txHash.slice(0, 10)}...</div>
//                     )}
//                   </div>
//                 )}
                
//                 {/* Burn Asset Status */}
//                 {(burnAssetState.isLoading || burnAssetState.error || burnAssetState.txStatus) && (
//                   <div className="mb-2 p-2 bg-pixel-gray border-pixel-light-gray pixel-panel">
//                     <div className="text-pixel-xs font-bold text-pixel-primary">Burn Asset</div>
//                     {burnAssetState.isLoading && (
//                       <div className="text-pixel-xs text-pixel-warning">⏳ Processing...</div>
//                     )}
//                     {burnAssetState.error && (
//                       <div className="text-pixel-xs text-pixel-error">❌ {burnAssetState.error}</div>
//                     )}
//                     {burnAssetState.txStatus === 'SUCCESS' && (
//                       <div className="text-pixel-xs text-pixel-success">✅ Transaction successful!</div>
//                     )}
//                     {burnAssetState.txHash && (
//                       <div className="text-pixel-xs text-pixel-base-gray">TX: {burnAssetState.txHash.slice(0, 10)}...</div>
//                     )}
//                   </div>
//                 )}
                
//                 {/* Sabotage Status */}
//                 {(sabotageState.isLoading || sabotageState.error || sabotageState.txStatus) && (
//                   <div className="mb-2 p-2 bg-pixel-gray border-pixel-light-gray pixel-panel">
//                     <div className="text-pixel-xs font-bold text-pixel-primary">Sabotage</div>
//                     {sabotageState.isLoading && (
//                       <div className="text-pixel-xs text-pixel-warning">⏳ Processing...</div>
//                     )}
//                     {sabotageState.error && (
//                       <div className="text-pixel-xs text-pixel-error">❌ {sabotageState.error}</div>
//                     )}
//                     {sabotageState.txStatus === 'SUCCESS' && (
//                       <div className="text-pixel-xs text-pixel-success">✅ Transaction successful!</div>
//                     )}
//                     {sabotageState.txHash && (
//                       <div className="text-pixel-xs text-pixel-base-gray">TX: {sabotageState.txHash.slice(0, 10)}...</div>
//                     )}
//                   </div>
//                 )}
                
//                 {/* Next Round Status */}
//                 {(nextRoundProcessing || nextRoundError) && (
//                   <div className="mb-2 p-2 bg-pixel-gray border-pixel-light-gray pixel-panel">
//                     <div className="text-pixel-xs font-bold text-pixel-primary">Next Round</div>
//                     {nextRoundProcessing && (
//                       <div className="text-pixel-xs text-pixel-warning">⏳ Advancing round...</div>
//                     )}
//                     {nextRoundError && (
//                       <div className="text-pixel-xs text-pixel-error">❌ {nextRoundError}</div>
//                     )}
//                   </div>
//                 )}
                
//                 {/* Reset buttons */}
//                 <div className="flex space-x-1 mt-2">
//                   {buyAssetState.error && (
//                     <button
//                       onClick={resetBuyAssetState}
//                       className="px-2 py-1 bg-pixel-secondary hover:bg-pixel-warning text-pixel-black font-bold text-pixel-xs pixel-btn border-pixel-black"
//                     >
//                       Clear Buy
//                     </button>
//                   )}
//                   {sellAssetState.error && (
//                     <button
//                       onClick={resetSellAssetState}
//                       className="px-2 py-1 bg-pixel-secondary hover:bg-pixel-warning text-pixel-black font-bold text-pixel-xs pixel-btn border-pixel-black"
//                     >
//                       Clear Sell
//                     </button>
//                   )}
//                   {burnAssetState.error && (
//                     <button
//                       onClick={resetBurnAssetState}
//                       className="px-2 py-1 bg-pixel-secondary hover:bg-pixel-warning text-pixel-black font-bold text-pixel-xs pixel-btn border-pixel-black"
//                     >
//                       Clear Burn
//                     </button>
//                   )}
//                   {sabotageState.error && (
//                     <button
//                       onClick={resetSabotageState}
//                       className="px-2 py-1 bg-pixel-secondary hover:bg-pixel-warning text-pixel-black font-bold text-pixel-xs pixel-btn border-pixel-black"
//                     >
//                       Clear Sabotage
//                     </button>
//                   )}
//                   {nextRoundError && (
//                     <button
//                       onClick={resetNextRoundState}
//                       className="px-2 py-1 bg-pixel-secondary hover:bg-pixel-warning text-pixel-black font-bold text-pixel-xs pixel-btn border-pixel-black"
//                     >
//                       Clear Round
//                     </button>
//                   )}
//                 </div>
//               </div>
//             )}
            
//             {/* Host Controls Panel */}
//             {isHost && (
//               <div className="bg-pixel-dark-gray pixel-panel border-pixel-gray p-3">
//                 <h3 className="text-pixel-sm font-bold text-pixel-primary uppercase tracking-wider mb-2">Host Controls</h3>
                
//                 {/* Round Timer */}
//                 <div className="mb-3 p-2 bg-pixel-gray border-pixel-light-gray pixel-panel">
//                   <div className="text-pixel-xs font-bold text-pixel-primary mb-1">Round Timer</div>
//                   <div className="text-pixel-sm font-bold text-pixel-warning">
//                     {timeUntilNextRound > 0 ? `${timeUntilNextRound}s remaining` : 'Round ended'}
//                   </div>
//                   <div className="flex items-center space-x-2 mt-1">
//                     <span className="text-pixel-xs text-pixel-base-gray">Auto-advance:</span>
//                     <button
//                       onClick={toggleAutoAdvance}
//                       className={`px-2 py-1 text-pixel-xs font-bold pixel-btn ${
//                         isAutoAdvanceEnabled 
//                           ? 'bg-pixel-success text-pixel-black border-pixel-success' 
//                           : 'bg-pixel-error text-pixel-black border-pixel-error'
//                       }`}
//                     >
//                       {isAutoAdvanceEnabled ? 'ON' : 'OFF'}
//                     </button>
//                   </div>
//                 </div>
                
//                 {/* Manual Round Advance */}
//                 <div className="mb-3">
//                   <button
//                     onClick={manualAdvanceRound}
//                     className="w-full px-3 py-2 bg-pixel-warning hover:bg-pixel-accent text-pixel-black font-bold text-pixel-sm pixel-btn border-pixel-black uppercase tracking-wider"
//                   >
//                     🔄 Next Round
//                   </button>
//                   <div className="text-pixel-xs text-pixel-base-gray mt-1 text-center">
//                     10s delay + market fetch
//                   </div>
//                 </div>
                
//                 {/* Round Status */}
//                 <div className="p-2 bg-pixel-gray border-pixel-light-gray pixel-panel">
//                   <div className="text-pixel-xs font-bold text-pixel-primary">Round Status</div>
//                   <div className="text-pixel-xs text-pixel-base-gray">
//                     Current: {gameState.currentRound}/{gameState.maxRounds}
//                   </div>
//                   <div className="text-pixel-xs text-pixel-base-gray">
//                     In Progress: {gameState.roundInProgress ? 'Yes' : 'No'}
//                   </div>
//                   {gameState.nextRoundStartTime && (
//                     <div className="text-pixel-xs text-pixel-warning">
//                       Next starts in {Math.max(0, Math.ceil((gameState.nextRoundStartTime - Date.now()) / 1000))}s
//                     </div>
//                   )}
//                 </div>
//               </div>
//             )}
            
//             {/* Dojo Player & Game Info Panel */}
//             {(dojoPlayer || dojoGame || dojoMarket) && (
//               <div className="bg-pixel-dark-gray pixel-panel border-pixel-gray p-3">
//                 <h3 className="text-pixel-sm font-bold text-pixel-primary uppercase tracking-wider mb-2">Dojo Data</h3>
                
//                 {dojoPlayer && (
//                   <div className="mb-2 p-2 bg-pixel-gray border-pixel-light-gray pixel-panel">
//                     <div className="text-pixel-xs font-bold text-pixel-primary">Player</div>
//                     <div className="text-pixel-xs text-pixel-base-gray">Balance: {Number(dojoPlayer.token_balance)}</div>
//                     <div className="text-pixel-xs text-pixel-base-gray">Address: {dojoPlayer.address.slice(0, 10)}...</div>
//                   </div>
//                 )}
                
//                 {dojoGame && (
//                   <div className="mb-2 p-2 bg-pixel-gray border-pixel-light-gray pixel-panel">
//                     <div className="text-pixel-xs font-bold text-pixel-primary">Game</div>
//                     <div className="text-pixel-xs text-pixel-base-gray">ID: {dojoGame.id}</div>
//                     <div className="text-pixel-xs text-pixel-base-gray">Round: {Number(dojoGame.round)}/{Number(dojoGame.max_rounds)}</div>
//                     <div className="text-pixel-xs text-pixel-base-gray">Active: {dojoGame.is_active ? 'Yes' : 'No'}</div>
//                   </div>
//                 )}
                
//                 {dojoMarket && (
//                   <div className="mb-2 p-2 bg-pixel-gray border-pixel-light-gray pixel-panel">
//                     <div className="text-pixel-xs font-bold text-pixel-primary">Market</div>
//                     <div className="text-pixel-xs text-pixel-base-gray">Gold: {Number(dojoMarket.gold_price)}</div>
//                     <div className="text-pixel-xs text-pixel-base-gray">Water: {Number(dojoMarket.water_price)}</div>
//                     <div className="text-pixel-xs text-pixel-base-gray">Oil: {Number(dojoMarket.oil_price)}</div>
//                   </div>
//                 )}
                
//                 {/* Data refresh buttons */}
//                 <div className="flex space-x-1 mt-2">
//                   <button
//                     onClick={refetchPlayer}
//                     className="px-2 py-1 bg-pixel-accent hover:bg-pixel-success text-pixel-black font-bold text-pixel-xs pixel-btn border-pixel-black"
//                   >
//                     Refresh Player
//                   </button>
//                   <button
//                     onClick={refetchMarket}
//                     className="px-2 py-1 bg-pixel-accent hover:bg-pixel-success text-pixel-black font-bold text-pixel-xs pixel-btn border-pixel-black"
//                   >
//                     Refresh Market
//                   </button>
//                 </div>
//               </div>
//             )}
//           </div>
//         </div>

//         {/* Mobile Layout */}
//         <div className="md:hidden space-y-3">
//           {/* Mobile Tab Navigation */}
//           <div className="bg-pixel-dark-gray pixel-panel border-pixel-gray p-2">
//             <div className="grid grid-cols-4 gap-1">
//               {[
//                 { id: 'wallet', label: 'Wallet', icon: '💰' },
//                 { id: 'assets', label: 'Assets', icon: '📦' },
//                 { id: 'actions', label: 'Actions', icon: '⚡' },
//                 { id: 'stats', label: 'Stats', icon: '📊' },
//               ].map((tab) => (
//                 <button
//                   key={tab.id}
//                   onClick={() => {
//                     playSound('click');
//                     setActiveTab(tab.id as typeof activeTab);
//                   }}
//                   className={`px-2 py-2 pixel-btn text-pixel-xs font-bold uppercase tracking-wider flex flex-col items-center space-y-1 min-h-touch ${
//                     activeTab === tab.id
//                       ? 'bg-pixel-primary text-pixel-black border-pixel-primary'
//                       : 'bg-pixel-gray text-pixel-primary border-pixel-light-gray hover:bg-pixel-light-gray'
//                   }`}
//                 >
//                   <span className="text-sm">{tab.icon}</span>
//                   <span className="hidden xs:inline">{tab.label}</span>
//                 </button>
//               ))}
//             </div>
//           </div>

//           {/* Mobile Tab Content */}
//           <div className="bg-pixel-dark-gray pixel-panel border-pixel-gray p-3">
//             {renderMobileTabContent()}
//           </div>

//           {/* Mobile Recent Actions - Always visible */}
//           <div className="bg-pixel-dark-gray pixel-panel border-pixel-gray p-3">
//             <h3 className="text-pixel-sm font-bold text-pixel-primary uppercase tracking-wider mb-2">
//               Recent Actions
//             </h3>
//             <div className="space-y-1">
//               {gameState.recentActions?.slice(0, 3).map((action: string, index: number) => (
//                 <div key={index} className="text-pixel-xs text-pixel-base-gray bg-pixel-gray pixel-panel border-pixel-light-gray p-2">
//                   {action}
//                 </div>
//               )) || (
//                 <div className="text-pixel-xs text-pixel-base-gray italic">
//                   No recent actions
//                 </div>
//               )}
//             </div>
//           </div>

//           {/* Mobile Dojo Status - Collapsible */}
//           {(buyAssetState.isLoading || sellAssetState.isLoading || burnAssetState.isLoading || sabotageState.isLoading || 
//             buyAssetState.error || sellAssetState.error || burnAssetState.error || sabotageState.error ||
//             buyAssetState.txStatus || sellAssetState.txStatus || burnAssetState.txStatus || sabotageState.txStatus) && (
//             <div className="bg-pixel-dark-gray pixel-panel border-pixel-gray p-3">
//               <h3 className="text-pixel-sm font-bold text-pixel-primary uppercase tracking-wider mb-2">
//                 Transaction Status
//               </h3>
              
//               {/* Compact status display for mobile */}
//               <div className="space-y-2">
//                 {buyAssetState.isLoading && <div className="text-pixel-xs text-pixel-warning">⏳ Buying...</div>}
//                 {sellAssetState.isLoading && <div className="text-pixel-xs text-pixel-warning">⏳ Selling...</div>}
//                 {burnAssetState.isLoading && <div className="text-pixel-xs text-pixel-warning">⏳ Burning...</div>}
//                 {sabotageState.isLoading && <div className="text-pixel-xs text-pixel-warning">⏳ Sabotaging...</div>}
                
//                 {buyAssetState.error && <div className="text-pixel-xs text-pixel-error">❌ Buy failed</div>}
//                 {sellAssetState.error && <div className="text-pixel-xs text-pixel-error">❌ Sell failed</div>}
//                 {burnAssetState.error && <div className="text-pixel-xs text-pixel-error">❌ Burn failed</div>}
//                 {sabotageState.error && <div className="text-pixel-xs text-pixel-error">❌ Sabotage failed</div>}
                
//                 {buyAssetState.txStatus === 'SUCCESS' && <div className="text-pixel-xs text-pixel-success">✅ Buy successful</div>}
//                 {sellAssetState.txStatus === 'SUCCESS' && <div className="text-pixel-xs text-pixel-success">✅ Sell successful</div>}
//                 {burnAssetState.txStatus === 'SUCCESS' && <div className="text-pixel-xs text-pixel-success">✅ Burn successful</div>}
//                 {sabotageState.txStatus === 'SUCCESS' && <div className="text-pixel-xs text-pixel-success">✅ Sabotage successful</div>}
//               </div>
//             </div>
//           )}
//         </div>

//         {/* Notifications */}
//         {notifications.length > 0 && (
//           <div className="fixed top-4 right-4 space-y-2 z-40">
//             {notifications.map((notification, index) => (
//               <div key={index} className="bg-pixel-accent text-pixel-black p-3 pixel-panel border-pixel-black">
//                 <p className="font-bold text-pixel-sm">{notification}</p>
//               </div>
//             ))}
//           </div>
//         )}

//         {/* Winner Modal - Simple Center Popup */}
//         {showWinnerModal && gameState?.status === 'finished' && gameState?.winner && (
//           <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-90 z-50">
//             <div className="bg-pixel-primary p-12 pixel-panel border-pixel-black max-w-lg w-full mx-4 text-center">
//               {/* Winner Crown */}
//               <div className="text-8xl mb-6">
//                 👑
//               </div>
              
//               {/* Game Finished */}
//               <h2 className="text-pixel-3xl font-bold text-pixel-black mb-4 uppercase tracking-wider">
//                 Game Finished!
//               </h2>
              
//               {/* Winner Announcement */}
//               <div className="bg-pixel-black p-6 pixel-panel border-pixel-black mb-6">
//                 <h3 className="text-pixel-2xl font-bold text-pixel-primary mb-2 uppercase tracking-wider">
//                   🏆 Winner
//                 </h3>
//                 <div className="text-pixel-3xl font-bold text-pixel-success mb-2">
//                   {gameState.winner.name}
//                 </div>
//                 <div className="text-pixel-lg font-bold text-pixel-base-gray">
//                   Final Score: {gameState.winner.finalScore} Points
//                 </div>
//                 {gameState.winner.id === effectivePlayerId && (
//                   <div className="text-pixel-lg font-bold text-pixel-warning mt-2">
//                     🎉 Congratulations! 🎉
//                   </div>
//                 )}
//               </div>
              
//               {/* Action Buttons */}
//               <div className="flex space-x-4">
//                 <button
//                   onClick={() => {
//                     playSound('click');
//                     setShowWinnerModal(false);
//                   }}
//                   className="flex-1 px-6 py-3 bg-pixel-success hover:bg-pixel-accent text-pixel-black font-bold text-pixel-base pixel-btn border-pixel-black uppercase tracking-wider"
//                 >
//                   Continue
//                 </button>
//                 <button
//                   onClick={() => {
//                     playSound('click');
//                     handleExitGame();
//                   }}
//                   className="flex-1 px-6 py-3 bg-pixel-error hover:bg-pixel-warning text-pixel-black font-bold text-pixel-base pixel-btn border-pixel-black uppercase tracking-wider"
//                 >
//                   Exit Game
//                 </button>
//               </div>
//             </div>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }
