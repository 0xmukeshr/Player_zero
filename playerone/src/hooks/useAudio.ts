import { useCallback, useRef } from 'react';

type SoundType = 'click' | 'rollover' | 'switch' | 'action';

// Audio elements cache
const audioCache = new Map<string, HTMLAudioElement>();

// Background music element
let backgroundMusic: HTMLAudioElement | null = null;

export function useAudio() {
  const playSound = useCallback((soundType: SoundType) => {
    try {
      let audioSrc = '';
      
      switch (soundType) {
        case 'click':
          audioSrc = '/click1.ogg';
          break;
        case 'rollover':
          audioSrc = '/rollover5.ogg';
          break;
        case 'switch':
          audioSrc = '/switch24.ogg';
          break;
        case 'action':
          audioSrc = '/action_switch.ogg';
          break;
        default:
          return;
      }
      
      // Get or create audio element
      let audio = audioCache.get(audioSrc);
      if (!audio) {
        audio = new Audio(audioSrc);
        audio.volume = 0.3; // Lower volume for sound effects
        
        // Handle load errors gracefully
        audio.addEventListener('error', (e) => {
          console.debug(`Audio file not found or invalid: ${audioSrc}`);
          // Remove from cache so we don't keep trying to play broken audio
          audioCache.delete(audioSrc);
        });
        
        audioCache.set(audioSrc, audio);
      }
      
      // Reset and play
      audio.currentTime = 0;
      audio.play().catch(err => {
        // Handle both autoplay policy errors and missing file errors
        console.debug('Audio play failed:', err);
        // If it's a missing file error, remove from cache
        if (err.name === 'NotSupportedError' || err.message.includes('not suitable')) {
          audioCache.delete(audioSrc);
        }
      });
    } catch (error) {
      console.debug('Audio error:', error);
    }
  }, []);
  
  const playBackgroundMusic = useCallback((src: string, volume: number = 0.2, loop: boolean = true) => {
    try {
      // Stop any existing background music
      if (backgroundMusic) {
        backgroundMusic.pause();
        backgroundMusic.currentTime = 0;
      }
      
      // Create new background music element
      backgroundMusic = new Audio(src);
      backgroundMusic.volume = volume;
      backgroundMusic.loop = loop;
      
      // Play background music
      backgroundMusic.play().catch(err => {
        console.debug('Background music play failed:', err);
      });
      
      return backgroundMusic;
    } catch (error) {
      console.debug('Background music error:', error);
      return null;
    }
  }, []);
  
  const stopBackgroundMusic = useCallback(() => {
    if (backgroundMusic) {
      backgroundMusic.pause();
      backgroundMusic.currentTime = 0;
    }
  }, []);
  
  const pauseBackgroundMusic = useCallback(() => {
    if (backgroundMusic) {
      backgroundMusic.pause();
    }
  }, []);
  
  const resumeBackgroundMusic = useCallback(() => {
    if (backgroundMusic) {
      backgroundMusic.play().catch(err => {
        console.debug('Background music resume failed:', err);
      });
    }
  }, []);

  return { 
    playSound, 
    playBackgroundMusic, 
    stopBackgroundMusic, 
    pauseBackgroundMusic, 
    resumeBackgroundMusic 
  };
}

