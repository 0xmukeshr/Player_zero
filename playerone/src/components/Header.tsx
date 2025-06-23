import React, { useState, useEffect } from 'react';
import { Bell, Sword, User } from 'lucide-react';
import { useAudio } from '../hooks/useAudio';

interface HeaderProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

export function Header({ currentPage, onNavigate }: HeaderProps) {
  const { playSound } = useAudio();
  const [userProfile, setUserProfile] = useState<{ name: string; wallet: string; avatar: string } | null>(null);
  
  // Load user profile from localStorage
  useEffect(() => {
    const loadProfile = () => {
      const existingProfile = localStorage.getItem('userProfile');
      if (existingProfile) {
        try {
          const profile = JSON.parse(existingProfile);
          setUserProfile(profile);
        } catch (error) {
          console.error('Error loading profile in header:', error);
        }
      }
    };
    
    loadProfile();
    
    // Listen for profile changes (when profile is created)
    const handleStorageChange = () => {
      loadProfile();
    };
    
    window.addEventListener('storage', handleStorageChange);
    // Also listen for custom event when profile is created in same tab
    window.addEventListener('profileUpdated', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('profileUpdated', handleStorageChange);
    };
  }, []);
  
  const navItems = [
    { id: 'home', label: 'Home' },
    { id: 'games', label: 'Games' },
    { id: 'profile', label: 'Profile' }
  ];

  return (
    <header className="bg-pixel-dark-gray pixel-panel border-pixel-gray border-b-4 px-6 py-4">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center space-x-4">
          <div className="flex items-center justify-center w-10 h-10 bg-pixel-primary pixel-avatar">
            <Sword className="w-6 h-6 text-pixel-black" />
          </div>
          <h1 className="text-pixel-lg font-bold text-pixel-primary uppercase tracking-wider">Player Zero</h1>
        </div>

        <nav className="flex items-center space-x-2">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                playSound('rollover');
                onNavigate(item.id);
              }}
              className={`px-4 py-2 pixel-nav-item text-pixel-sm font-bold uppercase tracking-wider ${
                currentPage === item.id
                  ? 'bg-pixel-primary text-pixel-black active'
                  : 'text-pixel-primary hover:text-pixel-black hover:bg-pixel-primary'
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <div className="flex items-center space-x-4">
          <div className="relative">
            <div className="pixel-notification bg-pixel-secondary border-pixel-black w-8 h-8 flex items-center justify-center cursor-pointer hover:bg-pixel-warning transition-colors">
              <Bell className="w-4 h-4 text-pixel-black" />
            </div>
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-pixel-error pixel-avatar"></div>
          </div>
          
          {/* User Profile Display */}
          {userProfile ? (
            <div className="flex items-center space-x-3">
              {/* User Avatar and Name */}
              <div className="flex items-center space-x-2">
                <div className="w-10 h-10 bg-pixel-accent pixel-avatar flex items-center justify-center text-xl">
                  {userProfile.avatar}
                </div>
                <div className="hidden md:block">
                  <div className="text-pixel-xs font-bold text-pixel-primary uppercase">
                    {userProfile.name}
                  </div>
                  <div className="text-pixel-xs text-pixel-gray font-mono">
                    {userProfile.wallet.substring(0, 6)}...{userProfile.wallet.substring(userProfile.wallet.length - 4)}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="w-10 h-10 bg-pixel-gray pixel-avatar flex items-center justify-center">
              <User className="w-5 h-5 text-pixel-light-gray" />
            </div>
          )}
        </div>
      </div>
    </header>
  );
}