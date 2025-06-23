import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Create a single Supabase client for interacting with your database
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Use service role for server operations

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase configuration. Please check your environment variables.');
  console.log('SUPABASE_URL:', supabaseUrl ? 'Set' : 'Not set');
  console.log('SUPABASE_SERVICE_ROLE_KEY:', supabaseKey ? 'Set' : 'Not set');
  throw new Error('Supabase configuration required');
}

export const supabase = createClient(supabaseUrl, supabaseKey);

// Database operations for games
export class GameDatabase {
  
// Create a new game in the database
  static async createGame(gameData) {
    try {
      console.log('Attempting to create game with data:', {
        gameName: gameData.gameName,
        gameId: gameData.gameId,
        isPrivate: gameData.isPrivate,
        playersCount: gameData.players ? gameData.players.length : 0
      });
      
      const { data, error } = await supabase
        .from('games')
        .insert([
          {
            game_name: gameData.gameName,
            game_id: gameData.gameId,
            status: 'waiting',
            visibility: gameData.isPrivate ? 'private' : 'public',
            players: gameData.players || [],
            game_state: gameData.gameState || {},
            host_player_id: gameData.hostPlayerId,
            current_players: gameData.players ? gameData.players.length : 0,
            max_players: 4
          }
        ])
        .select()
        .single();

      if (error) {
        console.error('Supabase error creating game:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        return null;
      }

      console.log('Game created successfully:', data);
      return data;
    } catch (err) {
      console.error('Database error creating game:', {
        message: err.message,
        stack: err.stack,
        name: err.name,
        cause: err.cause
      });
      return null;
    }
  }

  // Get a game by game_id
  static async getGame(gameId) {
    try {
      const { data, error } = await supabase
        .from('games')
        .select('*')
        .eq('game_id', gameId)
        .single();

      if (error) {
        console.error('Error fetching game:', error);
        return null;
      }

      return data;
    } catch (err) {
      console.error('Database error fetching game:', err);
      return null;
    }
  }

  // Update game state
  static async updateGame(gameId, updateData) {
    try {
      const { data, error } = await supabase
        .from('games')
        .update(updateData)
        .eq('game_id', gameId)
        .select()
        .single();

      if (error) {
        console.error('Error updating game:', error);
        return null;
      }

      return data;
    } catch (err) {
      console.error('Database error updating game:', err);
      return null;
    }
  }

  // Get all public games that are waiting for players
  static async getPublicGames() {
    try {
      const { data, error } = await supabase
        .from('public_games')
        .select('*');

      if (error) {
        console.error('Error fetching public games:', error);
        return [];
      }

      return data || [];
    } catch (err) {
      console.error('Database error fetching public games:', err);
      return [];
    }
  }

  // Add a player to a game
  static async addPlayerToGame(gameId, playerData) {
    try {
      // First get the current game
      const game = await this.getGame(gameId);
      if (!game) return null;

      // Add player to the players array
      const updatedPlayers = [...game.players, playerData];
      const currentPlayerCount = updatedPlayers.length;

      const { data, error } = await supabase
        .from('games')
        .update({
          players: updatedPlayers,
          current_players: currentPlayerCount
        })
        .eq('game_id', gameId)
        .select()
        .single();

      if (error) {
        console.error('Error adding player to game:', error);
        return null;
      }

      return data;
    } catch (err) {
      console.error('Database error adding player:', err);
      return null;
    }
  }

  // Update game status (waiting, playing, finished)
  static async updateGameStatus(gameId, status) {
    try {
      const { data, error } = await supabase
        .from('games')
        .update({ status })
        .eq('game_id', gameId)
        .select()
        .single();

      if (error) {
        console.error('Error updating game status:', error);
        return null;
      }

      return data;
    } catch (err) {
      console.error('Database error updating status:', err);
      return null;
    }
  }

  // Delete a game (cleanup)
  static async deleteGame(gameId) {
    try {
      const { error } = await supabase
        .from('games')
        .delete()
        .eq('game_id', gameId);

      if (error) {
        console.error('Error deleting game:', error);
        return false;
      }

      return true;
    } catch (err) {
      console.error('Database error deleting game:', err);
      return false;
    }
  }

  // Clean up old finished games (run periodically)
  static async cleanupOldGames(hoursOld = 24) {
    try {
      const cutoffTime = new Date();
      cutoffTime.setHours(cutoffTime.getHours() - hoursOld);

      const { error } = await supabase
        .from('games')
        .delete()
        .eq('status', 'finished')
        .lt('updated_at', cutoffTime.toISOString());

      if (error) {
        console.error('Error cleaning up old games:', error);
        return false;
      }

      console.log(`Cleaned up games older than ${hoursOld} hours`);
      return true;
    } catch (err) {
      console.error('Database error cleaning up games:', err);
      return false;
    }
  }
}

