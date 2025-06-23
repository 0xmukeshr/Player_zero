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
    <div className="min-h-screen flex items-center justify-center px-4">
      {/* Centered Hero Section */}
      <div className="text-center max-w-4xl mx-auto">
        <h1 className="text-5xl md:text-6xl font-bold text-pixel-primary mb-8 uppercase tracking-wider">
          <span className="relative -top-[20px] block">Welcome</span>
          <span className="text-pixel-accent">Player_Zero</span>
        </h1>

        <p className="text-pixel-lg text-pixel-base-gray mb-12 max-w-3xl mx-auto leading-relaxed">
          Master the art of strategic warfare in intense multiplayer battles. 
          Join thousands of players in the ultimate test of tactical prowess.
        </p>
        <button
          onClick={() => {
            playSound('switch');
            onNavigateToGames();
          }}
          className="px-12 py-6 bg-pixel-primary text-pixel-black font-bold text-pixel-xl uppercase tracking-wider pixel-btn border-pixel-black"
        >
          Enter Game Lobby
        </button>
      </div>
    </div>
  );
}