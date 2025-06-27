import React, { useEffect, useState } from 'react';
import { Trophy, Users, Zap, Target, Volume2, VolumeX } from 'lucide-react';
import { useAudio } from '../hooks/useAudio';

interface HomePageProps {
  onNavigateToGames: () => void;
}

export function HomePage({ onNavigateToGames }: HomePageProps) {
  const { playSound, playBackgroundMusic, stopBackgroundMusic, pauseBackgroundMusic, resumeBackgroundMusic } = useAudio();
  const [musicPlaying, setMusicPlaying] = useState(false);
  const [musicMuted, setMusicMuted] = useState(false);
  
  // Start background music when component mounts
  useEffect(() => {
    // Auto-play background music
    const startMusic = () => {
      playBackgroundMusic('/pixel-paradise.mp3', 0.3, true);
      setMusicPlaying(true);
    };
    
    // Try to start music immediately
    startMusic();
    
    // Also try on first user interaction
    const handleFirstInteraction = () => {
      if (!musicPlaying && !musicMuted) {
        startMusic();
      }
      document.removeEventListener('click', handleFirstInteraction);
      document.removeEventListener('keydown', handleFirstInteraction);
    };
    
    document.addEventListener('click', handleFirstInteraction);
    document.addEventListener('keydown', handleFirstInteraction);
    
    // Cleanup on unmount
    return () => {
      stopBackgroundMusic();
      document.removeEventListener('click', handleFirstInteraction);
      document.removeEventListener('keydown', handleFirstInteraction);
    };
  }, []);
  
  const toggleMusic = () => {
    if (musicMuted) {
      resumeBackgroundMusic();
      setMusicMuted(false);
    } else {
      pauseBackgroundMusic();
      setMusicMuted(true);
    }
  };

  const features = [
    {
      icon: Trophy,
      title: 'Competitive Gaming',
      description: 'Join ranked matches and climb the leaderboards'
    },
    {
      icon: Users,
      title: 'Multiplayer Battles',
      description: 'Team up with friends or face opponents worldwide'
    },
    {
      icon: Zap,
      title: 'Real-time Action',
      description: 'Experience fast-paced strategic gameplay'
    },
    {
      icon: Target,
      title: 'Strategic Depth',
      description: 'Master complex tactics and outsmart your rivals'
    }
  ];

  return (
    <div className="min-h-screen-safe flex items-center justify-center px-4 py-6 relative">
      {/* Music Toggle - Fixed position for mobile */}
      <button
        onClick={toggleMusic}
        className="fixed top-4 right-4 z-10 w-10 h-10 sm:w-14 sm:h-14 bg-pixel-dark-gray hover:bg-pixel-gray pixel-btn border-pixel-light-gray flex items-center justify-center"
        title={musicMuted ? 'Unmute Music' : 'Mute Music'}
      >
        {musicMuted ? (
          <VolumeX className="w-4 h-4 sm:w-5 sm:h-5 text-pixel-primary" />
        ) : (
          <Volume2 className="w-4 h-4 sm:w-5 sm:h-5 text-pixel-primary" />
        )}
      </button>

      {/* Centered Hero Section */}
      <div className="text-center max-w-4xl mx-auto w-full">
        <h1 className="text-pixel-2xl xs:text-pixel-3xl sm:text-4xl md:text-5xl font-bold text-pixel-primary mb-4 sm:mb-6 uppercase tracking-wide">
          <span className="relative block mb-2">Welcome</span>
          <span className="text-pixel-accent block">Player_Zero</span>
        </h1>

        <p className="text-pixel-sm sm:text-pixel-base md:text-pixel-lg text-pixel-base-gray mb-6 sm:mb-8 max-w-3xl mx-auto leading-relaxed px-2">
          Master the art of strategic warfare in intense multiplayer battles. 
          Join thousands of players in the ultimate test of tactical prowess.
        </p>



        {/* Main CTA Button */}
        <button
          onClick={() => {
            playSound('switch');
            onNavigateToGames();
          }}
          className="w-full max-w-sm sm:max-w-none sm:w-auto px-6 sm:px-8 py-3 sm:py-4 bg-pixel-primary hover:bg-pixel-success text-pixel-black font-bold text-pixel-base sm:text-pixel-lg uppercase tracking-wide pixel-btn border-pixel-black transition-colors duration-200 min-h-touch"
        >
          <span className="block sm:inline">Enter Game Lobby</span>
        </button>

        {/* Additional mobile info */}
        <div className="mt-6 sm:hidden">
          <p className="text-pixel-xs text-pixel-base-gray opacity-75">
            Best experienced in landscape mode
          </p>
        </div>
      </div>
    </div>
  );
}