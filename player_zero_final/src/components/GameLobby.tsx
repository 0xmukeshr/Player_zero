import React, { useState, useEffect } from "react";
import { useSocket } from "../context/SocketContext";
import { useGame } from "../dojo/hooks/useGame";
import { useAccount } from "@starknet-react/core";
import { addAddressPadding } from "starknet";
import useAppStore from "../zustand/store";

interface GameLobbyProps {
  onPlayGame: () => void;
}

interface PublicGame {
  id: string;
  name: string;
  status: string;
  currentPlayers: number;
  maxPlayers: number;
  hostName: string;
  createdAt: string;
}

export function GameLobby({ onPlayGame }: GameLobbyProps) {
  const { socket, connected, setGameInfo } = useSocket();
  const { createGame, joinGame } = useGame();
  const { account } = useAccount();

  const [userProfile, setUserProfile] = useState<{ name: string } | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [joinGameId, setJoinGameId] = useState("");
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState("");

  // Public games state
  const [publicGames, setPublicGames] = useState<PublicGame[]>([]);
  const [refreshingGames, setRefreshingGames] = useState(false);
  const [joiningGameId, setJoiningGameId] = useState<string | null>(null);

  // Create game modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [gameName, setGameName] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [loading, setLoading] = useState(false);

  // Load user profile
  useEffect(() => {
    const profile = localStorage.getItem("userProfile");
    if (profile) {
      try {
        setUserProfile(JSON.parse(profile));
      } catch (e) {
        console.error("Error loading profile:", e);
      }
    }
  }, []);

  // Load public games on mount
  useEffect(() => {
    if (!socket) return;

    loadPublicGames();

    // Set up socket event listeners
    socket.on("public-games-list", (games: PublicGame[]) => {
      setPublicGames(games);
      setRefreshingGames(false);
    });

    socket.on("game-created", (data: { gameId: string; playerId: string }) => {
      console.log("Game created:", data);
      if (userProfile?.name) {
        setGameInfo(data.gameId, data.playerId, userProfile.name);
        setIsCreating(false);
        onPlayGame();
      }
    });

    socket.on("game-joined", (data: { gameId: string; playerId: string }) => {
      console.log("Game joined via ID:", data);
      if (userProfile?.name) {
        setGameInfo(data.gameId, data.playerId, userProfile.name);
        setIsJoining(false);
        onPlayGame();
      }
    });

    socket.on("error", (err: { message: string }) => {
      setError(err.message);
      setIsCreating(false);
      setIsJoining(false);
    });

    return () => {
      socket.off("public-games-list");
      socket.off("game-created");
      socket.off("game-joined");
      socket.off("error");
    };
  }, [socket, userProfile, setGameInfo, onPlayGame]);

  const loadPublicGames = () => {
    if (!socket || !connected) {
      console.log("Socket not connected, skipping public games load");
      return;
    }
    setRefreshingGames(true);
    socket.emit("get-public-games");
  };

  const handleCreateGame = async () => {
    if (!userProfile?.name || !account || !gameName.trim()) {
      setError("Need profile, wallet, and game name");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await createGame(20);
      

      if (response.success) {
        const game = useAppStore.getState().currentGame;
        console.log("game created...joining game",game);
        await joinGame(game?.id!, userProfile.name);
        console.log("game created...joined game");
        if (game?.id) {
          socket?.emit("create-game", {
            gameName: gameName.trim(),
            gameId: game.id,
            playerName: userProfile.name,
            isPrivate: isPrivate,
            walletAddress: addAddressPadding(account.address).toLowerCase(),
          });

          // Close modal and reset form
          setShowCreateModal(false);
          setGameName("");
          setIsPrivate(false);
        } else {
          throw new Error("Game ID not available");
        }
      } else {
        throw new Error(response.error || "Failed to create game");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create game");
      setLoading(false);
    }
  };

  const handleJoinPublicGame = async (gameId: string) => {
    if (!userProfile?.name || !account) {
      setError("Need profile and wallet");
      return;
    }

    setJoiningGameId(gameId);
    setError("");

    try {
      await joinGame(gameId, userProfile.name);
      const playerAddress = addAddressPadding(account.address).toLowerCase();

      socket?.emit("join-game", {
        gameId: gameId,
        playerName: userProfile.name,
        walletAddress: playerAddress,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to join game");
      setJoiningGameId(null);
    }
  };

  const handleJoinGame = async () => {
    if (!userProfile?.name || !account || !joinGameId.trim()) {
      setError("Missing required information");
      return;
    }

    setIsJoining(true);
    setError("");
    await joinGame(joinGameId, userProfile.name);
    const playerAddress = addAddressPadding(account.address).toLowerCase();

    socket?.emit("join-game", {
      gameId: joinGameId.trim(),
      playerName: userProfile.name,
      walletAddress: playerAddress,
    });
  };

  if (!connected) {
    return (
      <div className="min-h-screen bg-pixel-black flex items-center justify-center p-4">
        <div className="bg-pixel-dark-gray pixel-panel border-pixel-gray p-8 text-center">
          <h2 className="text-pixel-xl font-bold text-pixel-primary mb-4">
            Connecting...
          </h2>
          <p className="text-pixel-base-gray">
            Please wait while we connect to the server
          </p>
        </div>
      </div>
    );
  }

  if (!userProfile?.name) {
    return (
      <div className="min-h-screen bg-pixel-black flex items-center justify-center p-4">
        <div className="bg-pixel-dark-gray pixel-panel border-pixel-gray p-8 text-center">
          <h2 className="text-pixel-xl font-bold text-pixel-primary mb-4">
            Profile Required
          </h2>
          <p className="text-pixel-base-gray mb-4">
            Please set up your profile first
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-pixel-primary hover:bg-pixel-success text-pixel-black font-bold pixel-btn"
          >
            Reload Page
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-pixel-black scanlines font-pixel">
      <div className="max-w-6xl mx-auto p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-pixel-2xl font-bold text-pixel-primary uppercase tracking-wider">
            Lobby
          </h1>
          <div className="flex items-center space-x-4">
            <div className="text-pixel-base-gray text-pixel-sm font-bold pixel-notification bg-pixel-dark-gray border-pixel-gray px-3 py-2">
              Welcome {userProfile.name}!
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-pixel-error pixel-panel border-pixel-black p-4 mb-6">
            <p className="text-pixel-black font-bold text-center">{error}</p>
          </div>
        )}

        {/* Main Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Quick Actions */}
          <div className="space-y-4">
            {/* Create Game */}
            <div className="bg-pixel-dark-gray pixel-panel border-pixel-gray p-4">
              <h3 className="text-pixel-sm font-bold text-pixel-primary uppercase tracking-wider mb-3">
                Create Game
              </h3>
              <p className="text-pixel-base-gray text-pixel-xs mb-4">
                Start a new multiplayer game
              </p>
              <button
                onClick={() => setShowCreateModal(true)}
                disabled={isCreating || !account}
                className="w-full px-4 py-3 bg-pixel-primary hover:bg-pixel-success text-pixel-black font-bold text-pixel-sm pixel-btn border-pixel-black uppercase tracking-wider disabled:opacity-50"
              >
                {isCreating ? "Creating..." : "Create Game"}
              </button>
            </div>

            {/* Join by ID */}
            <div className="bg-pixel-dark-gray pixel-panel border-pixel-gray p-4">
              <h3 className="text-pixel-sm font-bold text-pixel-primary uppercase tracking-wider mb-3">
                Join by ID
              </h3>
              <input
                type="text"
                value={joinGameId}
                onChange={(e) => setJoinGameId(e.target.value)}
                placeholder="Enter Game ID"
                className="w-full px-3 py-2 mb-3 bg-pixel-gray border-2 border-pixel-light-gray text-pixel-primary font-bold text-pixel-sm focus:outline-none focus:border-pixel-accent"
                maxLength={20}
              />
              <button
                onClick={handleJoinGame}
                disabled={isJoining || !joinGameId.trim() || !account}
                className="w-full px-4 py-2 bg-pixel-accent hover:bg-pixel-warning text-pixel-black font-bold text-pixel-sm pixel-btn border-pixel-black uppercase tracking-wider disabled:opacity-50"
              >
                {isJoining ? "Joining..." : "Join Game"}
              </button>
            </div>
          </div>
          {/* Middle Column - Public Games List */}
          <div className="lg:col-span-2">
            <div className="bg-pixel-dark-gray pixel-panel border-pixel-gray p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-pixel-lg font-bold text-pixel-primary uppercase tracking-wider">
                  Public Games
                </h3>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={loadPublicGames}
                    disabled={refreshingGames}
                    className="px-3 py-1 bg-pixel-accent hover:bg-pixel-warning text-pixel-black font-bold text-pixel-xs pixel-btn border-pixel-black uppercase tracking-wider disabled:opacity-50"
                  >
                    {refreshingGames ? "Refreshing..." : "Refresh"}
                  </button>
                  <div className="flex items-center space-x-1">
                    <div
                      className="w-2 h-2 bg-pixel-success pixel-notification border-pixel-success"
                      title="Live Updates Active"
                    ></div>
                    <span className="text-pixel-xs text-pixel-success font-bold">
                      LIVE
                    </span>
                  </div>
                </div>
              </div>

              {refreshingGames ? (
                <div className="text-center py-8">
                  <div className="text-pixel-warning text-pixel-sm font-bold">
                    Loading games...
                  </div>
                </div>
              ) : publicGames.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-pixel-base-gray text-pixel-sm">
                    No public games available
                  </div>
                  <div className="text-pixel-xs text-pixel-base-gray mt-2">
                    Be the first to create one!
                  </div>
                </div>
              ) : (
                <>
                  {/* Mobile Card Layout */}
                  <div className="block sm:hidden space-y-3">
                    {publicGames.map((game, index) => (
                      <div
                        key={game.id}
                        className="bg-pixel-gray pixel-panel border-pixel-light-gray p-3 space-y-3"
                      >
                        {/* Top Row - Game Name and Status */}
                        <div className="flex justify-between items-start gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="text-pixel-primary font-bold text-pixel-sm truncate">
                              {game.name}
                            </div>
                            <div className="text-pixel-base-gray text-pixel-xs mt-1">
                              Host: {game.hostName}
                            </div>
                          </div>
                          <span
                            className={`text-pixel-xs px-2 py-1 pixel-notification border-pixel-black font-bold uppercase tracking-wider flex-shrink-0 ${
                              game.status === "Open"
                                ? "bg-pixel-success text-pixel-black"
                                : "bg-pixel-warning text-pixel-black"
                            }`}
                          >
                            {game.status}
                          </span>
                        </div>
                        
                        {/* Bottom Row - Players and Join Button */}
                        <div className="flex justify-between items-center gap-2">
                          <div className="text-pixel-base-gray text-pixel-sm font-bold">
                            Players: {game.currentPlayers}/{game.maxPlayers}
                          </div>
                          <button
                            onClick={() => handleJoinPublicGame(game.id)}
                            disabled={
                              joiningGameId === game.id || game.status !== "Open"
                            }
                            className="px-3 py-2 bg-pixel-primary hover:bg-pixel-success text-pixel-black font-bold text-pixel-xs border-2 border-pixel-black uppercase tracking-wide disabled:opacity-50 flex-shrink-0 min-w-[60px]"
                          >
                            {joiningGameId === game.id ? "..." : "Join"}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Desktop Table Layout */}
                  <div className="hidden sm:block">
                    <div className="bg-pixel-gray pixel-panel border-pixel-light-gray overflow-x-auto">
                      {/* Table Header */}
                      <div className="grid grid-cols-5 gap-4 p-3 bg-pixel-dark-gray border-b-2 border-pixel-light-gray min-w-[600px]">
                        <div className="text-pixel-sm font-bold text-pixel-primary uppercase tracking-wider">
                          Game Name
                        </div>
                        <div className="text-pixel-sm font-bold text-pixel-primary uppercase tracking-wider">
                          Status
                        </div>
                        <div className="text-pixel-sm font-bold text-pixel-primary uppercase tracking-wider">
                          Host
                        </div>
                        <div className="text-pixel-sm font-bold text-pixel-primary uppercase tracking-wider">
                          Players
                        </div>
                        <div className="text-pixel-sm font-bold text-pixel-primary uppercase tracking-wider text-center">
                          Join
                        </div>
                      </div>

                      {/* Table Rows */}
                      {publicGames.map((game, index) => (
                        <div
                          key={game.id}
                          className={`grid grid-cols-5 gap-4 p-3 items-center border-b border-pixel-light-gray hover:bg-pixel-dark-gray transition-colors min-w-[600px] ${
                            index % 2 === 0
                              ? "bg-pixel-gray"
                              : "bg-pixel-light-gray"
                          }`}
                        >
                          {/* Game Name */}
                          <div
                            className="text-pixel-primary font-bold text-pixel-sm truncate"
                            title={game.name}
                          >
                            {game.name}
                          </div>

                          {/* Status */}
                          <div>
                            <span
                              className={`text-pixel-xs px-2 py-1 pixel-notification border-pixel-black font-bold uppercase tracking-wider ${
                                game.status === "Open"
                                  ? "bg-pixel-success text-pixel-black"
                                  : "bg-pixel-warning text-pixel-black"
                              }`}
                            >
                              {game.status}
                            </span>
                          </div>

                          {/* Host */}
                          <div
                            className="text-pixel-base-gray text-pixel-sm truncate"
                            title={game.hostName}
                          >
                            {game.hostName}
                          </div>

                          {/* Players */}
                          <div className="text-pixel-base-gray text-pixel-sm font-bold">
                            {game.currentPlayers}/{game.maxPlayers}
                          </div>

                          {/* Join Button */}
                          <div className="text-center">
                            <button
                              onClick={() => handleJoinPublicGame(game.id)}
                              disabled={
                                joiningGameId === game.id || game.status !== "Open"
                              }
                              className="px-3 py-1 bg-pixel-primary hover:bg-pixel-success text-pixel-black font-bold text-pixel-xs pixel-btn border-pixel-black uppercase tracking-wider disabled:opacity-50"
                            >
                              {joiningGameId === game.id ? "Joining..." : "Join"}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {publicGames.length > 0 && (
                <div className="mt-4 text-center">
                  <div className="text-pixel-xs text-pixel-base-gray">
                    {publicGames.length} public game
                    {publicGames.length !== 1 ? "s" : ""} available
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Create Game Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
            <div className="bg-pixel-dark-gray pixel-panel border-pixel-gray p-6 mx-4 max-w-md w-full">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-pixel-lg font-bold text-pixel-primary uppercase tracking-wider">
                  Create Game
                </h3>
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-pixel-primary pixel-notification border-pixel-primary"></div>
                  <span className="text-pixel-xs text-pixel-primary font-bold">
                    NEW
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-pixel-sm font-bold text-pixel-primary mb-2 uppercase tracking-wider">
                    Game Name
                  </label>
                  <input
                    type="text"
                    placeholder="Enter game name..."
                    value={gameName}
                    onChange={(e) => setGameName(e.target.value)}
                    className="w-full px-3 py-2 bg-pixel-gray border-2 border-pixel-light-gray text-pixel-primary font-bold text-pixel-sm focus:outline-none focus:border-pixel-accent"
                    maxLength={30}
                  />
                  <div className="text-pixel-xs text-pixel-base-gray mt-1">
                    {gameName.length}/30 characters
                  </div>
                </div>

                <div className="bg-pixel-gray pixel-panel border-pixel-light-gray p-3">
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id="private-game"
                      checked={isPrivate}
                      onChange={() => setIsPrivate(!isPrivate)}
                      className="w-4 h-4"
                    />
                    <label
                      htmlFor="private-game"
                      className="text-pixel-sm font-bold text-pixel-primary uppercase tracking-wider"
                    >
                      Private Game
                    </label>
                  </div>
                  <div className="text-pixel-xs text-pixel-base-gray mt-2">
                    {isPrivate
                      ? "Only players with the Game ID can join"
                      : "Visible in public games list"}
                  </div>
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={handleCreateGame}
                    disabled={!gameName.trim() || loading}
                    className="flex-1 px-4 py-3 bg-pixel-primary hover:bg-pixel-success text-pixel-black font-bold text-pixel-sm pixel-btn border-pixel-black uppercase tracking-wider disabled:opacity-50"
                  >
                    {loading ? "Creating..." : "Create"}
                  </button>
                  <button
                    onClick={() => {
                      setShowCreateModal(false);
                      setGameName("");
                      setIsPrivate(false);
                      setError("");
                    }}
                    className="px-4 py-3 bg-pixel-gray hover:bg-pixel-error text-pixel-primary hover:text-pixel-white font-bold text-pixel-sm pixel-btn border-pixel-gray uppercase tracking-wider"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        {/* Status Info */}
        <div className="mt-4 bg-pixel-gray pixel-panel border-pixel-light-gray p-4 text-center">
          <div className="text-pixel-xs text-pixel-base-gray">
            <span className="text-pixel-primary">Status:</span>{" "}
            {connected ? "🟢 Connected" : "🔴 Disconnected"} |
            <span className="text-pixel-primary"> Wallet:</span>{" "}
            {account ? "🟢 Connected" : "🔴 Not Connected"}
          </div>
        </div>
      </div>
    </div>
  );
}
