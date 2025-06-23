import { useState, useEffect, useCallback } from 'react';
import { Game } from '../types/game';

export function useGames() {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadGames = useCallback(() => {
    try {
      setLoading(true);
      
      // Get public games from localStorage
      const publicGamesData = JSON.parse(localStorage.getItem('publicGames') || '[]');
      const clientGames: Game[] = publicGamesData.map((gameInfo: any) => {
        const gameState = localStorage.getItem(`game_${gameInfo.id}`);
        if (gameState) {
          const parsedState = JSON.parse(gameState);
          return {
            id: gameInfo.id,
            name: gameInfo.name,
            status: parsedState.status === 'waiting' ? 'Open' : 
                    parsedState.status === 'playing' ? 'In Progress' : 'Finished',
            currentPlayers: parsedState.players.length,
            maxPlayers: 4,
            createdAt: new Date(gameInfo.createdAt),
            currentRound: parsedState.currentRound,
            maxRounds: parsedState.maxRounds,
            isPrivate: gameInfo.isPrivate,
            hostName: parsedState.players.find((p: any) => p.id === parsedState.host)?.name || 'Unknown'
          };
        }
        return null;
      }).filter(Boolean);
      
      setGames(clientGames);
      setError(null);
    } catch (err) {
      setError('Failed to load games');
      setGames([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadGames();
  }, [loadGames]);

  const refreshGames = useCallback(() => {
    loadGames();
  }, [loadGames]);

  const joinGame = useCallback((gameId: string) => {
    // This is handled by the PeerContext now
    // Just refresh the games list
    refreshGames();
  }, [refreshGames]);

  const viewGame = useCallback((gameId: string) => {
    const game = games.find(g => g.id === gameId);
    if (game) {
      alert(`Viewing game: ${game.name}\nStatus: ${game.status}\nPlayers: ${game.currentPlayers}/${game.maxPlayers}\nRound: ${game.currentRound}/${game.maxRounds}`);
    }
  }, [games]);

  return {
    games,
    loading,
    error,
    joinGame,
    viewGame,
    refreshGames
  };
}
