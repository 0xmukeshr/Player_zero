import React, { useState, useEffect } from 'react';
import { Wallet } from 'lucide-react';
import { useAudio } from '../hooks/useAudio';

interface ProfileCreationPageProps {
  onProfileCreated: (profile: { name: string; wallet: string; avatar: string }) => void;
}

export function ProfileCreationPage({ onProfileCreated }: ProfileCreationPageProps) {
  const [isConnecting, setIsConnecting] = useState(false);
  const { playSound } = useAudio();

  // Name prefixes and suffixes for unique name generation
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

  const generateUniqueName = () => {
    const prefix = namePrefixes[Math.floor(Math.random() * namePrefixes.length)];
    const suffix = nameSuffixes[Math.floor(Math.random() * nameSuffixes.length)];
    const number = Math.floor(Math.random() * 999) + 1;
    return `${prefix}${suffix}${number}`;
  };

  const generateWalletAddress = () => {
    // Simulate wallet connection - generate realistic looking address
    const chars = '0123456789abcdef';
    let address = '0x';
    for (let i = 0; i < 40; i++) {
      address += chars[Math.floor(Math.random() * chars.length)];
    }
    return address;
  };

  const generateAvatar = () => {
    return avatarEmojis[Math.floor(Math.random() * avatarEmojis.length)];
  };

  const handleConnectWallet = async () => {
    setIsConnecting(true);
    playSound('click');

    // Simulate wallet connection with loading animation
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Auto-generate random profile
    const newName = generateUniqueName();
    const newWallet = generateWalletAddress();
    const newAvatar = generateAvatar();

    const profile = { 
      name: newName, 
      wallet: newWallet, 
      avatar: newAvatar,
      createdAt: new Date().toISOString() 
    };

    // Store profile in localStorage
    localStorage.setItem('userProfile', JSON.stringify(profile));
    
    // Dispatch custom event for real-time updates
    window.dispatchEvent(new CustomEvent('profileUpdated'));
    
    playSound('switch');
    onProfileCreated(profile);
  };

  // Check if user already has a profile
  useEffect(() => {
    const existingProfile = localStorage.getItem('userProfile');
    if (existingProfile) {
      try {
        const profile = JSON.parse(existingProfile);
        onProfileCreated(profile);
      } catch (error) {
        console.error('Error loading existing profile:', error);
        localStorage.removeItem('userProfile'); // Clear corrupted profile
      }
    }
  }, [onProfileCreated]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center p-4 z-50">
      <div className="bg-pixel-dark-gray pixel-panel border-pixel-primary p-8 max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-pixel-xl font-bold text-pixel-primary uppercase tracking-wider mb-2">
            Connect Wallet
          </h1>
          <p className="text-pixel-sm text-pixel-base-gray">
            Connect your wallet to enter Player Zero
          </p>
        </div>


        {/* Connect Button */}
        <button
          onClick={handleConnectWallet}
          disabled={isConnecting}
          className="w-full px-6 py-4 bg-pixel-primary hover:bg-pixel-accent text-pixel-black font-bold text-pixel-base pixel-btn border-pixel-black uppercase tracking-wider flex items-center justify-center space-x-3 disabled:opacity-50 mb-4"
        >
          {isConnecting ? (
            <>
              <div className="w-5 h-5 border-2 border-pixel-black border-t-transparent rounded-full"></div>
              <span>Connecting...</span>
            </>
          ) : (
            <>
              <Wallet className="w-5 h-5" />
              <span>Connect Wallet</span>
            </>
          )}
        </button>

        {/* Info Text */}
        <div className="text-center">
          <p className="text-pixel-xs text-pixel-gray">
            A random name and avatar will be assigned automatically
          </p>
        </div>
      </div>
    </div>
  );
}

