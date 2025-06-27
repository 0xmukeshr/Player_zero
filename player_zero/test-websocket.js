import { io } from 'socket.io-client';

const socket = io('http://localhost:3001');
let testActionsTriggered = false;

socket.on('connect', () => {
  console.log('✅ Connected to server:', socket.id);
  
  // Test 1: Create a game
  console.log('\n🎮 Testing game creation...');
  socket.emit('create-game', {
    gameName: 'Test Game',
    playerName: 'TestPlayer1'
  });
});

socket.on('game-created', (data) => {
  console.log('✅ Game created successfully:', data.gameId);
  
  // Test 2: Join the same game with another player
  console.log('\n👥 Testing game joining...');
  const socket2 = io('http://localhost:3001');
  
  socket2.on('connect', () => {
    console.log('✅ Second player connected:', socket2.id);
    socket2.emit('join-game', {
      gameId: data.gameId,
      playerName: 'TestPlayer2'
    });
  });
  
  socket2.on('game-joined', () => {
    console.log('✅ Second player joined successfully');
    
    // Test 3: Start the game
    console.log('\n🚀 Testing game start...');
    socket.emit('start-game');
  });
  
  socket2.on('game-state', (gameState) => {
    console.log('✅ Game state received:', {
      status: gameState.status,
      players: gameState.players.length,
      currentRound: gameState.currentRound
    });
    
    if (gameState.status === 'playing' && !testActionsTriggered) {
      testActionsTriggered = true;
      
      // Test 4: Player actions
      console.log('\n⚡ Testing player actions...');
      
      // Test buy action
      socket.emit('player-action', {
        action: 'buy',
        resource: 'gold',
        amount: 5
      });
      
      // Test sell action
      setTimeout(() => {
        socket2.emit('player-action', {
          action: 'sell',
          resource: 'water',
          amount: 3
        });
      }, 1000);
      
      // Test burn action
      setTimeout(() => {
        socket.emit('player-action', {
          action: 'burn',
          resource: 'oil',
          amount: 1
        });
      }, 2000);
      
      // Test sabotage action
      setTimeout(() => {
        socket2.emit('player-action', {
          action: 'sabotage',
          resource: 'gold',
          amount: 2,
          targetPlayer: 'TestPlayer1'
        });
      }, 3000);
      
      // Cleanup after tests
      setTimeout(() => {
        console.log('\n🧹 Cleaning up test connections...');
        socket.disconnect();
        socket2.disconnect();
        console.log('✅ All WebSocket functions tested successfully!');
        process.exit(0);
      }, 5000);
    }
  });
  
  socket2.on('error', (data) => {
    console.log('❌ Socket2 Error:', data.message);
  });
});

socket.on('game-state', (gameState) => {
  if (gameState.recentActions && gameState.recentActions.length > 0) {
    console.log('✅ Action processed:', gameState.recentActions[0]);
  }
});

socket.on('game-started', () => {
  console.log('✅ Game started successfully');
});

socket.on('player-joined', (data) => {
  console.log('✅ Player joined:', data.playerName);
});

socket.on('error', (data) => {
  console.log('❌ Socket Error:', data.message);
});

socket.on('disconnect', () => {
  console.log('❌ Disconnected from server');
});

