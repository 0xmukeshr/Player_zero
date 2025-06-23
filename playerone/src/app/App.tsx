import React, { useState, useEffect } from 'react';
import { Header } from '../components/Header';
import { HomePage } from '../components/HomePage';
import { GameLobby } from '../components/GameLobby';
import { ProfilePage } from '../components/ProfilePage';
import { ProfileCreationPage } from '../components/ProfileCreationPage';
import { GameInterface } from '../components/GameInterface';
import { SocketProvider } from '../context/SocketContext';

function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const [userProfile, setUserProfile] = useState<{ name: string; wallet: string; avatar: string } | null>(null);

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

  const handleNavigateToGames = () => {
    // Check if user has a profile before allowing access to games
    if (userProfile) {
      setCurrentPage('games');
    } else {
      setCurrentPage('createProfile');
    }
  };

  const handleProfileCreated = (profile: { name: string; wallet: string; avatar: string }) => {
    setUserProfile(profile);
    setCurrentPage('games');
  };

  const handlePlayGame = () => {
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