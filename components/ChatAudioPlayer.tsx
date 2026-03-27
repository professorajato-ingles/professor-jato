'use client';

import React, { useState, useRef } from 'react';
import { Play, Pause } from 'lucide-react';

interface AudioPlayerProps {
  audioData: string;
  title?: string;
}

export const AudioPlayer = ({ audioData, title }: AudioPlayerProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const togglePlay = () => {
    if (!audioRef.current) {
      audioRef.current = new Audio(audioData);
      audioRef.current.addEventListener('timeupdate', () => {
        const progress = (audioRef.current!.currentTime / audioRef.current!.duration) * 100;
        setProgress(progress);
      });
      audioRef.current.addEventListener('ended', () => {
        setIsPlaying(false);
        setProgress(0);
      });
    }

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  return (
    <div className="bg-slate-800 rounded-xl p-4 border border-slate-700 my-3">
      <div className="flex items-center gap-4">
        <button
          onClick={togglePlay}
          className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
            isPlaying 
              ? 'bg-emerald-500 hover:bg-emerald-400' 
              : 'bg-emerald-600 hover:bg-emerald-500'
          }`}
        >
          {isPlaying ? (
            <Pause className="w-5 h-5 text-white" />
          ) : (
            <Play className="w-5 h-5 text-white ml-0.5" />
          )}
        </button>
        
        <div className="flex-1">
          {title && (
            <p className="text-sm font-medium text-white mb-1">{title}</p>
          )}
          <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-emerald-500 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {isPlaying ? 'Reproduzindo...' : 'Clique para ouvir'}
          </p>
        </div>
      </div>
    </div>
  );
};

export const parseAudioInMessage = (text: string): { content: string; audioIds: string[] } => {
  const audioRegex = /\[AUDIO:([^\]]+)\]/g;
  const audioIds: string[] = [];
  
  const content = text.replace(audioRegex, (_, audioId) => {
    audioIds.push(audioId);
    return '';
  });

  return { content: content.trim(), audioIds };
};