import dotenv from 'dotenv';
// Load environment variables FIRST
dotenv.config();

import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { GameDatabase } from './src/services/database.js';

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: true, // Allow all origins for development
    methods: ["GET", "POST"],
    credentials: true
  }
});

app.use(cors());
app.use(express.json());

// Store active game states in memory for real-time operations
// Database stores persistent data, memory stores real-time state
const activeGameStates = new Map();
const players = new Map(); // socketId -> playerInfo
const gameTimers = new Map(); // gameId -> timer objects
const inactivityTimers = new Map(); // gameId -> inactivity timer

// Helper function to generate game ID
function generateGameId() {
  return Math.random().toString(36).substr(2, 9).toUpperCase();
}

// Helper function to generate player ID
function generatePlayerId() {
  return 'player_' + Math.random().toString(36).substr(2, 9);
}

// Initial game state template
function createInitialGameState() {
  return {
    currentRound: 1,
    maxRounds: 20,
    timeRemaining: { hours: 0, minutes: 1, seconds: 0 },
    players: [],
    marketChanges: [
      { resource: 'gold', change: 0, percentage: '+0%' },
      { resource: 'water', change: 0, percentage: '+0%' },
      { resource: 'oil', change: 0, percentage: '+0%' }
    ],
    recentActions: [],
    status: 'waiting', // waiting, playing, finished
    host: null,
    timerActive: false
  };
}

// Create initial player state
function createPlayer(playerId, playerName, socketId) {
  return {
    id: playerId,
    name: playerName,
    socketId: socketId,
    tokens: 1000,
    assets: { gold: 50, water: 25, oil: 10 },
    totalAssets: 85,
    connected: true
  };
}

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Get public games list
  socket.on('get-public-games', async () => {
    try {
      const publicGames = await GameDatabase.getPublicGames();
      
      // Format for frontend
      const formattedGames = publicGames.map(game => ({
        id: game.game_id,
        name: game.game_name,
        status: game.current_players >= game.max_players ? 'Full' : 'Open',
        currentPlayers: game.current_players,
        maxPlayers: game.max_players,
        hostName: game.host_name || 'Unknown',
        createdAt: game.created_at
      }));
      
      socket.emit('public-games-list', formattedGames);
    } catch (error) {
      console.error('Error fetching public games:', error);
      socket.emit('public-games-list', []);
    }
  });

  // Create a new game
  socket.on('create-game', async (data) => {
    try {
      const { gameName, playerName, isPrivate } = data;
      const gameId = generateGameId();
      const playerId = generatePlayerId();
      
      const gameState = createInitialGameState();
      const player = createPlayer(playerId, playerName, socket.id);
      
      gameState.players.push(player);
      gameState.host = playerId;
      gameState.gameName = gameName;
      gameState.isPrivate = isPrivate || false;
      gameState.createdAt = new Date();
      
      // Save to database
      const dbGame = await GameDatabase.createGame({
        gameName,
        gameId,
        isPrivate: isPrivate || false,
        players: [player],
        gameState,
        hostPlayerId: playerId
      });
      
      if (!dbGame) {
        socket.emit('error', { message: 'Failed to create game' });
        return;
      }
      
      // Store in memory for real-time operations
      activeGameStates.set(gameId, gameState);
      players.set(socket.id, { gameId, playerId, playerName });
      
      // Join the game room
      socket.join(gameId);
      
      console.log(`Server: Emitting game-created and game-state for game ${gameId}`);
      socket.emit('game-created', { gameId, playerId });
      
      // Add a small delay to ensure game-created is processed first
      setTimeout(() => {
        console.log(`Server: Sending initial game state for game ${gameId}`);
        socket.emit('game-state', gameState);
      }, 100);
      
      console.log(`Game created: ${gameId} by ${playerName}`);
    } catch (error) {
      console.error('Error creating game:', {
        message: error.message,
        details: error.stack,
        hint: error.hint || '',
        code: error.code || ''
      });
      socket.emit('error', { 
        message: 'Failed to create game',
        details: error.message,
        errorType: error.name || 'UnknownError'
      });
    }
  });

  // Join an existing game
  socket.on('join-game', async (data) => {
    try {
      const { gameId, playerName } = data;
      
      // Check if game exists in memory first, otherwise load from database
      let game = activeGameStates.get(gameId);
      if (!game) {
        const dbGame = await GameDatabase.getGame(gameId);
        if (!dbGame) {
          socket.emit('error', { message: 'Game not found' });
          return;
        }
        
        // Reconstruct game state from database
        game = {
          ...dbGame.game_state,
          players: dbGame.players,
          gameName: dbGame.game_name,
          isPrivate: dbGame.visibility === 'private',
          status: dbGame.status,
          host: dbGame.host_player_id,
          createdAt: new Date(dbGame.created_at)
        };
        
        activeGameStates.set(gameId, game);
      }
      
      if (game.players.length >= 4) {
        socket.emit('error', { message: 'Game is full' });
        return;
      }
      
      if (game.status !== 'waiting') {
        socket.emit('error', { message: 'Game already in progress' });
        return;
      }
      
      const playerId = generatePlayerId();
      const player = createPlayer(playerId, playerName, socket.id);
      
      game.players.push(player);
      activeGameStates.set(gameId, game);
      players.set(socket.id, { gameId, playerId, playerName });
      
      // Update database
      await GameDatabase.addPlayerToGame(gameId, player);
      
      // Join the game room
      socket.join(gameId);
      
      console.log(`Server: Player ${playerName} joined game ${gameId}, sending game state`);
      
      // Notify all players in the game
      socket.emit('game-joined', { gameId, playerId });
      
      // Send game state to all players
      setTimeout(() => {
        console.log(`Server: Broadcasting game state to all players in game ${gameId}`);
        io.to(gameId).emit('game-state', game);
        io.to(gameId).emit('player-joined', { playerName });
      }, 100);
      
      console.log(`${playerName} joined game: ${gameId}`);
    } catch (error) {
      console.error('Error joining game:', error);
      socket.emit('error', { message: 'Failed to join game' });
    }
  });

  // Get current game state (useful when player enters an existing game)
  socket.on('get-game-state', async (data) => {
    try {
      console.log('Server: get-game-state request received:', data);
      const { gameId } = data;
      
      if (!gameId) {
        console.error('Server: No gameId provided in get-game-state request');
        socket.emit('error', { message: 'No game ID provided' });
        return;
      }
      
      // Check if game exists in memory first
      let game = activeGameStates.get(gameId);
      console.log(`Server: Game ${gameId} found in memory:`, !!game);
      
      if (!game) {
        console.log(`Server: Game ${gameId} not in memory, checking database...`);
        // Try to load from database
        const dbGame = await GameDatabase.getGame(gameId);
        if (!dbGame) {
          console.error(`Server: Game ${gameId} not found in database`);
          socket.emit('error', { message: 'Game not found' });
          return;
        }
        
        console.log(`Server: Game ${gameId} found in database, reconstructing state`);
        // Reconstruct game state from database
        game = {
          ...dbGame.game_state,
          players: dbGame.players,
          gameName: dbGame.game_name,
          isPrivate: dbGame.visibility === 'private',
          status: dbGame.status,
          host: dbGame.host_player_id,
          createdAt: new Date(dbGame.created_at)
        };
        
        activeGameStates.set(gameId, game);
      }
      
      console.log(`Server: Sending game state to player for game: ${gameId}`, {
        status: game.status,
        playerCount: game.players?.length || 0,
        host: game.host
      });
      socket.emit('game-state', game);
      
    } catch (error) {
      console.error('Error getting game state:', error);
      socket.emit('error', { message: 'Failed to get game state' });
    }
  });

  // Start the game
  socket.on('start-game', async () => {
    try {
      const playerInfo = players.get(socket.id);
      if (!playerInfo) return;
      
      const game = activeGameStates.get(playerInfo.gameId);
      if (!game || game.host !== playerInfo.playerId) {
        socket.emit('error', { message: 'Only the host can start the game' });
        return;
      }
      
      if (game.players.length < 2) {
        socket.emit('error', { message: 'Need at least 2 players to start' });
        return;
      }
      
      game.status = 'playing';
      game.timerActive = true;
      activeGameStates.set(playerInfo.gameId, game);
      
      // Update database status
      await GameDatabase.updateGameStatus(playerInfo.gameId, 'playing');
      
      io.to(playerInfo.gameId).emit('game-started');
      io.to(playerInfo.gameId).emit('game-state', game);
      
      // Start the game timer
      startGameTimer(playerInfo.gameId);
      
      console.log(`Game started: ${playerInfo.gameId}`);
    } catch (error) {
      console.error('Error starting game:', error);
      socket.emit('error', { message: 'Failed to start game' });
    }
  });

  // Handle player exit
  socket.on('exit-game', async (data) => {
    try {
      const playerInfo = players.get(socket.id);
      if (!playerInfo) return;
      
      const game = activeGameStates.get(playerInfo.gameId);
      if (!game) return;
      
      console.log(`Player ${playerInfo.playerName} is exiting game ${playerInfo.gameId}`);
      
      // Initialize exitedPlayers array if it doesn't exist
      if (!game.exitedPlayers) {
        game.exitedPlayers = new Set();
      }
      
      // Add player to exited players list
      game.exitedPlayers.add(playerInfo.playerId);
      
      // Reset inactivity timer since there's activity
      resetInactivityTimer(playerInfo.gameId);
      
      // Check if all players have exited
      const allPlayersExited = game.players.every(player => 
        game.exitedPlayers.has(player.id) || !player.connected
      );
      
      if (allPlayersExited) {
        console.log(`All players exited game ${playerInfo.gameId}, closing game`);
        await closeGame(playerInfo.gameId, 'All players exited');
      } else {
        // Just remove this player and update game state
        removePlayerFromGame(playerInfo.gameId, playerInfo.playerId);
        
        // Notify remaining players
        io.to(playerInfo.gameId).emit('player-disconnected', { 
          playerName: playerInfo.playerName,
          reason: 'exited'
        });
      }
      
      // Remove player from socket tracking
      players.delete(socket.id);
      socket.leave(playerInfo.gameId);
      
    } catch (error) {
      console.error('Error handling player exit:', error);
    }
  });

  // Handle player actions
  socket.on('player-action', (data) => {
    const playerInfo = players.get(socket.id);
    if (!playerInfo) return;
    
    const game = activeGameStates.get(playerInfo.gameId);
    if (!game || game.status !== 'playing') return;
    
    // Reset inactivity timer since there's activity
    resetInactivityTimer(playerInfo.gameId);
    
    const { action, resource, amount, targetPlayer } = data;
    const player = game.players.find(p => p.id === playerInfo.playerId);
    
    if (!player) return;
    
    let actionText = '';
    const resourcePrices = { gold: 10, water: 15, oil: 25 };
    const price = resourcePrices[resource] * amount;
    
    switch (action) {
      case 'buy':
        if (player.tokens >= price) {
          player.tokens -= price;
          player.assets[resource] += amount;
          actionText = `${player.name} bought ${amount} ${resource.charAt(0).toUpperCase() + resource.slice(1)} for ${price} tokens`;
        }
        break;
        
      case 'sell':
        if (player.assets[resource] >= amount) {
          const sellPrice = Math.floor(price * 0.8);
          player.tokens += sellPrice;
          player.assets[resource] -= amount;
          actionText = `${player.name} sold ${amount} ${resource.charAt(0).toUpperCase() + resource.slice(1)} for ${sellPrice} tokens`;
        }
        break;
        
      case 'burn':
        if (player.assets[resource] >= amount) {
          player.assets[resource] -= amount;
          // Update market changes
          const marketChange = game.marketChanges.find(m => m.resource === resource);
          if (marketChange) {
            marketChange.change += amount * 3;
            marketChange.percentage = `${marketChange.change > 0 ? '+' : ''}${marketChange.change}%`;
          }
          actionText = `${player.name} burned ${amount} ${resource.charAt(0).toUpperCase() + resource.slice(1)} to boost market price`;
        }
        break;
        
      case 'sabotage':
        if (player.tokens >= 100 && targetPlayer) {
          player.tokens -= 100;
          const target = game.players.find(p => p.name === targetPlayer);
          if (target) {
            target.assets[resource] = Math.max(0, target.assets[resource] - amount);
            target.totalAssets = target.assets.gold + target.assets.water + target.assets.oil;
            actionText = `${player.name} sabotaged ${target.name}'s ${resource.charAt(0).toUpperCase() + resource.slice(1)} reserves`;
          }
        }
        break;
    }
    
    // Update player's total assets
    player.totalAssets = player.assets.gold + player.assets.water + player.assets.oil;
    
    // Add action to recent actions
    if (actionText) {
      game.recentActions.unshift(actionText);
      game.recentActions = game.recentActions.slice(0, 10); // Keep only last 10 actions
    }
    
    activeGameStates.set(playerInfo.gameId, game);
    io.to(playerInfo.gameId).emit('game-state', game);
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    
    const playerInfo = players.get(socket.id);
    if (playerInfo) {
      const game = activeGameStates.get(playerInfo.gameId);
      if (game) {
        // Mark player as disconnected
        const player = game.players.find(p => p.id === playerInfo.playerId);
        if (player) {
          player.connected = false;
        }
        
        // If host disconnects, assign new host
        if (game.host === playerInfo.playerId) {
          const connectedPlayers = game.players.filter(p => p.connected);
          if (connectedPlayers.length > 0) {
            game.host = connectedPlayers[0].id;
          }
        }
        
        activeGameStates.set(playerInfo.gameId, game);
        io.to(playerInfo.gameId).emit('game-state', game);
        io.to(playerInfo.gameId).emit('player-disconnected', { playerName: playerInfo.playerName });
      }
      
      players.delete(socket.id);
    }
  });
});

// Helper function to remove player from game
function removePlayerFromGame(gameId, playerId) {
  const game = activeGameStates.get(gameId);
  if (!game) return;
  
  game.players = game.players.filter(p => p.id !== playerId);
  activeGameStates.set(gameId, game);
}

// Helper function to close and cleanup a game
async function closeGame(gameId, reason = 'Game closed') {
  try {
    console.log(`Closing game ${gameId}: ${reason}`);
    
    // Clear any timers
    const timer = gameTimers.get(gameId);
    if (timer) {
      clearInterval(timer);
      gameTimers.delete(gameId);
    }
    
    const inactivityTimer = inactivityTimers.get(gameId);
    if (inactivityTimer) {
      clearTimeout(inactivityTimer);
      inactivityTimers.delete(gameId);
    }
    
    // Notify all remaining players
    io.to(gameId).emit('game-closed', { reason });
    
    // Remove from active games
    activeGameStates.delete(gameId);
    
    // Update database status
    await GameDatabase.updateGameStatus(gameId, 'closed');
    
    // Disconnect all sockets from this room
    const room = io.sockets.adapter.rooms.get(gameId);
    if (room) {
      room.forEach(socketId => {
        const socket = io.sockets.sockets.get(socketId);
        if (socket) {
          socket.leave(gameId);
          // Clear player tracking for this socket
          const playerInfo = players.get(socketId);
          if (playerInfo && playerInfo.gameId === gameId) {
            players.delete(socketId);
          }
        }
      });
    }
    
    console.log(`Game ${gameId} successfully closed and cleaned up`);
  } catch (error) {
    console.error(`Error closing game ${gameId}:`, error);
  }
}

// Helper function to reset inactivity timer
function resetInactivityTimer(gameId) {
  // Clear existing timer
  const existingTimer = inactivityTimers.get(gameId);
  if (existingTimer) {
    clearTimeout(existingTimer);
  }
  
  // Set new 20-minute inactivity timer
  const inactivityTimer = setTimeout(async () => {
    console.log(`Game ${gameId} has been inactive for 20 minutes, auto-closing`);
    await closeGame(gameId, 'Game closed due to 20 minutes of inactivity');
  }, 20 * 60 * 1000); // 20 minutes
  
  inactivityTimers.set(gameId, inactivityTimer);
}

// Game timer function
function startGameTimer(gameId) {
  // Start inactivity timer when game starts
  resetInactivityTimer(gameId);
  const timer = setInterval(async () => {
    const game = activeGameStates.get(gameId);
    if (!game || !game.timerActive) {
      clearInterval(timer);
      return;
    }
    
    const { hours, minutes, seconds } = game.timeRemaining;
    let newSeconds = seconds - 1;
    let newMinutes = minutes;
    let newHours = hours;
    
    if (newSeconds < 0) {
      newSeconds = 59;
      newMinutes -= 1;
    }
    if (newMinutes < 0) {
      newMinutes = 59;
      newHours -= 1;
    }
    
    if (newHours < 0) {
      // Round ended
      game.currentRound += 1;
      
      if (game.currentRound > game.maxRounds) {
        // Game finished
        game.status = 'finished';
        game.timerActive = false;
        
        // Update database status
        await GameDatabase.updateGameStatus(gameId, 'finished');
        
        io.to(gameId).emit('game-finished', game);
      } else {
        // New round
        game.timeRemaining = { hours: 0, minutes: 1, seconds: 0 };
        game.recentActions = [];
        
        // Generate new market trends
        game.marketChanges = game.marketChanges.map(change => {
          const randomChange = Math.floor(Math.random() * 40) - 20;
          return {
            ...change,
            change: randomChange,
            percentage: `${randomChange > 0 ? '+' : ''}${randomChange}%`
          };
        });
      }
    } else {
      game.timeRemaining = { hours: newHours, minutes: newMinutes, seconds: newSeconds };
    }
    
    activeGameStates.set(gameId, game);
    io.to(gameId).emit('game-state', game);
  }, 1000);
}

// Market fluctuations
setInterval(() => {
  activeGameStates.forEach((game, gameId) => {
    if (game.status === 'playing') {
      game.marketChanges = game.marketChanges.map(change => {
        const fluctuation = Math.floor(Math.random() * 10) - 5;
        const newChange = Math.max(-50, Math.min(50, change.change + fluctuation));
        return {
          ...change,
          change: newChange,
          percentage: `${newChange > 0 ? '+' : ''}${newChange}%`
        };
      });
      
      activeGameStates.set(gameId, game);
      io.to(gameId).emit('game-state', game);
    }
  });
}, 5000);

// Cleanup old finished games every hour
setInterval(async () => {
  try {
    await GameDatabase.cleanupOldGames(24); // Remove games older than 24 hours
  } catch (error) {
    console.error('Error during cleanup:', error);
  }
}, 60 * 60 * 1000); // Every hour

const PORT = process.env.PORT || 3001;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Access from other devices: http://YOUR_IP_ADDRESS:${PORT}`);
  console.log('Supabase database integration enabled');
});

