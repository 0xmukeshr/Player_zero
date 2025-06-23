import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

interface SocketContextType {
  socket: Socket | null;
  connected: boolean;
  gameId: string | null;
  playerId: string | null;
  playerName: string | null;
  setGameInfo: (gameId: string, playerId: string, playerName: string) => void;
  clearGameInfo: () => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

interface SocketProviderProps {
  children: React.ReactNode;
}

// Global socket instance to prevent dual connections in React StrictMode
let globalSocket: Socket | null = null;
let globalSocketPromise: Promise<Socket> | null = null;

// Function to get or create socket singleton
const getSocket = (): Promise<Socket> => {
  if (globalSocket && globalSocket.connected) {
    return Promise.resolve(globalSocket);
  }
  
  if (globalSocketPromise) {
    return globalSocketPromise;
  }
  
  globalSocketPromise = new Promise((resolve) => {
    const serverUrl = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001';
    console.log('SocketContext: Creating new socket connection to:', serverUrl);
    
    const socket = io(serverUrl, {
      // Add connection options to prevent duplicate connections
      forceNew: false,
      reconnection: true,
      timeout: 5000,
    });
    
    socket.on('connect', () => {
      console.log('SocketContext: Socket connected with ID:', socket.id);
      globalSocket = socket;
      resolve(socket);
    });
    
    socket.on('connect_error', (error) => {
      console.error('SocketContext: Connection error:', error);
      globalSocketPromise = null;
    });
  });
  
  return globalSocketPromise;
};

export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [gameId, setGameId] = useState<string | null>(null);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [playerName, setPlayerName] = useState<string | null>(null);

  // Load persisted game info on mount
  useEffect(() => {
    try {
      const storedGameInfo = localStorage.getItem('currentGameInfo');
      if (storedGameInfo) {
        const { gameId: storedGameId, playerId: storedPlayerId, playerName: storedPlayerName } = JSON.parse(storedGameInfo);
        console.log('SocketContext: Loading persisted game info:', { storedGameId, storedPlayerId, storedPlayerName });
        setGameId(storedGameId);
        setPlayerId(storedPlayerId);
        setPlayerName(storedPlayerName);
      }
    } catch (error) {
      console.error('Failed to load persisted game info:', error);
      localStorage.removeItem('currentGameInfo');
    }
  }, []);

  useEffect(() => {
    let isActiveConnection = true;
    
    const initializeSocket = async () => {
      try {
        console.log('SocketContext: Initializing socket connection...');
        const socketInstance = await getSocket();
        
        // Check if this effect is still active (not cleaned up)
        if (!isActiveConnection) {
          console.log('SocketContext: Connection cancelled, effect was cleaned up');
          return;
        }
        
        console.log('SocketContext: Socket instance obtained:', socketInstance.id);
        setSocket(socketInstance);
        setConnected(socketInstance.connected);
        
        // Set up event listeners
        const handleConnect = () => {
          console.log('SocketContext: Connected to server with socket ID:', socketInstance.id);
          setConnected(true);
        };
        
        const handleDisconnect = () => {
          console.log('SocketContext: Disconnected from server');
          setConnected(false);
        };
        
        const handleConnectError = (error: any) => {
          console.error('SocketContext: Connection error:', error);
        };

        const handleGameCreated = (data: { gameId: string; playerId: string }) => {
          console.log('SocketContext: Game created event received on socket:', socketInstance.id, data);
          if (!isActiveConnection) return;
          
          setGameId(data.gameId);
          setPlayerId(data.playerId);
          
          // Try to get player name from stored profile
          try {
            const existingProfile = localStorage.getItem('userProfile');
            if (existingProfile) {
              const profile = JSON.parse(existingProfile);
              console.log('SocketContext: Setting player name from profile:', profile.name);
              setPlayerName(profile.name);
              
              // Store complete game info in localStorage
              localStorage.setItem('currentGameInfo', JSON.stringify({
                gameId: data.gameId,
                playerId: data.playerId,
                playerName: profile.name
              }));
            }
          } catch (error) {
            console.error('SocketContext: Error getting player name from profile:', error);
          }
        };

        const handleGameJoined = (data: { gameId: string; playerId: string }) => {
          console.log('SocketContext: Game joined event received on socket:', socketInstance.id, data);
          if (!isActiveConnection) return;
          
          setGameId(data.gameId);
          setPlayerId(data.playerId);
          
          // Try to get player name from stored profile
          try {
            const existingProfile = localStorage.getItem('userProfile');
            if (existingProfile) {
              const profile = JSON.parse(existingProfile);
              console.log('SocketContext: Setting player name from profile:', profile.name);
              setPlayerName(profile.name);
              
              // Store complete game info in localStorage
              localStorage.setItem('currentGameInfo', JSON.stringify({
                gameId: data.gameId,
                playerId: data.playerId,
                playerName: profile.name
              }));
            }
          } catch (error) {
            console.error('SocketContext: Error getting player name from profile:', error);
          }
        };
        
        // Add event listeners
        socketInstance.on('connect', handleConnect);
        socketInstance.on('disconnect', handleDisconnect);
        socketInstance.on('connect_error', handleConnectError);
        socketInstance.on('game-created', handleGameCreated);
        socketInstance.on('game-joined', handleGameJoined);
        
        // Cleanup function
        return () => {
          console.log('SocketContext: Cleaning up event listeners for socket:', socketInstance.id);
          socketInstance.off('connect', handleConnect);
          socketInstance.off('disconnect', handleDisconnect);
          socketInstance.off('connect_error', handleConnectError);
          socketInstance.off('game-created', handleGameCreated);
          socketInstance.off('game-joined', handleGameJoined);
        };
      } catch (error) {
        console.error('SocketContext: Failed to initialize socket:', error);
      }
    };
    
    const cleanup = initializeSocket();
    
    return () => {
      console.log('SocketContext: Effect cleanup called');
      isActiveConnection = false;
      cleanup.then((cleanupFn) => {
        if (cleanupFn) cleanupFn();
      });
    };
  }, []);

  const setGameInfo = (newGameId: string, newPlayerId: string, newPlayerName: string) => {
    console.log('SocketContext: Setting game info:', { newGameId, newPlayerId, newPlayerName });
    setGameId(newGameId);
    setPlayerId(newPlayerId);
    setPlayerName(newPlayerName);
    
    // Also store in localStorage for persistence
    try {
      localStorage.setItem('currentGameInfo', JSON.stringify({
        gameId: newGameId,
        playerId: newPlayerId,
        playerName: newPlayerName
      }));
    } catch (error) {
      console.error('Failed to store game info in localStorage:', error);
    }
  };

  const clearGameInfo = () => {
    console.log('Clearing game info');
    setGameId(null);
    setPlayerId(null);
    setPlayerName(null);
    
    // Also clear from localStorage
    try {
      localStorage.removeItem('currentGameInfo');
    } catch (error) {
      console.error('Failed to clear game info from localStorage:', error);
    }
  };

  return (
    <SocketContext.Provider
      value={{
        socket,
        connected,
        gameId,
        playerId,
        playerName,
        setGameInfo,
        clearGameInfo,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

