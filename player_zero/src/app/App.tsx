import React, { useState, useEffect } from 'react';
import { Header } from '../components/Header';
import { HomePage } from '../components/HomePage';
import { GameLobby } from '../components/GameLobby';
import { ProfilePage } from '../components/ProfilePage';
import { ProfileCreationPage } from '../components/ProfileCreationPage';
import { GameInterface } from '../components/GameInterface';
import { SocketProvider } from '../context/SocketContext';
import { useStarknetConnect } from '../dojo/hooks/useStarknetConnect';

function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const [userProfile, setUserProfile] = useState<{ name: string; wallet: string; avatar: string } | null>(null);
  const { status, handleConnect } = useStarknetConnect();

  // Check for existing profile on app load
  useEffect(() => {
    const existingProfile = localStorage.getItem('userProfile');
    if (existingProfile) {
      try {
        const profile = JSON.parse(existingProfile);
        setUserProfile(profile);
      } catch (error) {
        console.error('Error loading profile:', error);
        localStorage.removeItem('userProfile'); // Clear corrupted profile
      }
    }
  }, []);

  const handleNavigate = (page: string) => {
    setCurrentPage(page);
  };

  const generateRandomProfile = () => {
    const namePrefixes = [
      'Pixel', 'Crypto', 'Byte', 'Zero', 'Neon', 'Cyber', 'Quantum', 'Matrix',
      'Digital', 'Binary', 'Hex', 'Alpha', 'Beta', 'Gamma', 'Delta', 'Omega',
      'Shadow', 'Ghost', 'Phoenix', 'Nova', 'Vortex', 'Nexus', 'Echo', 'Flux'
    ];
    
    const nameSuffixes = [
      'Player', 'Master', 'Hunter', 'Warrior', 'Guardian', 'Knight', 'Sage',
      'Wizard', 'Hacker', 'Trader', 'Rebel', 'Hero', 'Legend', 'Champion',
      'Fighter', 'Slayer', 'Ninja', 'Samurai', 'Pilot', 'Ranger', 'Scout'
    ];
    
    const avatarEmojis = [
      '🤖', '👾', '🎮', '⚡', '🔥', '💎', '🌟', '🚀', '🛡️', '⚔️',
      '👑', '🎯', '🎲', '🔮', '💫', '🌈', '🎨', '🎭', '🎪', '🎊'
    ];
    
    const prefix = namePrefixes[Math.floor(Math.random() * namePrefixes.length)];
    const suffix = nameSuffixes[Math.floor(Math.random() * nameSuffixes.length)];
    const number = Math.floor(Math.random() * 999) + 1;
    const newName = `${prefix}${suffix}${number}`;
    
    // Generate a realistic looking wallet address
    const chars = '0123456789abcdef';
    let newWallet = '0x';
    for (let i = 0; i < 40; i++) {
      newWallet += chars[Math.floor(Math.random() * chars.length)];
    }
    
    const newAvatar = avatarEmojis[Math.floor(Math.random() * avatarEmojis.length)];
    
    return { name: newName, wallet: newWallet, avatar: newAvatar };
  };

  const handleNavigateToGames = async () => {
    if (status !== 'connected') {
      await handleConnect();
    }

    if (!userProfile) {
      const profile = generateRandomProfile();
      localStorage.setItem('userProfile', JSON.stringify(profile));
      setUserProfile(profile);
    }

    setCurrentPage('games');
  };

  const handleProfileCreated = (profile: { name: string; wallet: string; avatar: string }) => {
    setUserProfile(profile);
    setCurrentPage('games');
  };

  const handlePlayGame = () => {
    // Navigate to game interface - it has its own validation and fallback mechanisms
    setCurrentPage('game');
  };

  const handleExitGame = () => {
    setCurrentPage('games');
  };

  const renderCurrentPage = () => {
    if (currentPage === 'game') {
      return <GameInterface onExitGame={handleExitGame} />;
    }

    switch (currentPage) {
      case 'home':
        return <HomePage onNavigateToGames={handleNavigateToGames} />;
      case 'createProfile':
        return <ProfileCreationPage onProfileCreated={handleProfileCreated} />;
      case 'games':
        return <GameLobby onPlayGame={handlePlayGame} />;
      case 'profile':
        return <ProfilePage />;
      default:
        return <HomePage onNavigateToGames={handleNavigateToGames} />;
    }
  };

  return (
    <SocketProvider>
      <div className="min-h-screen bg-pixel-black scanlines font-pixel">
        {currentPage !== 'game' && <Header currentPage={currentPage} onNavigate={handleNavigate} />}
        <main className="relative">
          {renderCurrentPage()}
        </main>
      </div>
    </SocketProvider>
  );
}

export default App;