import React from 'react';

interface TimerProps {
  timeRemaining: {
    hours: number;
    minutes: number;
    seconds: number;
  };
}

export function Timer({ timeRemaining }: TimerProps) {
  const formatTime = (time: number) => time.toString().padStart(2, '0');

  return (
    <div className="bg-pixel-dark-gray pixel-panel border-pixel-gray p-3 max-w-xs">
      <h3 className="text-pixel-sm font-bold text-pixel-primary mb-2 uppercase tracking-wider text-center">Timer</h3>
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-pixel-gray pixel-card border-pixel-primary p-2 text-center">
          <div className="text-pixel-lg font-bold text-pixel-success mb-1">
            {formatTime(timeRemaining.minutes)}
          </div>
          <div className="text-pixel-xs text-pixel-light-gray font-bold uppercase">MIN</div>
        </div>
        <div className="bg-pixel-gray pixel-card border-pixel-primary p-2 text-center">
          <div className="text-pixel-lg font-bold text-pixel-success mb-1">
            {formatTime(timeRemaining.seconds)}
          </div>
          <div className="text-pixel-xs text-pixel-light-gray font-bold uppercase">SEC</div>
        </div>
      </div>
    </div>
  );
}