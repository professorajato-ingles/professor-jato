'use client';

import React, { useState, useEffect } from 'react';
import { Play, Pause, Loader2 } from 'lucide-react';

interface AudioPlayerProps {
  audioId?: string;
  audioUrl?: string;
  audioData?: string;
  title?: string;
}

export const AudioPlayer = ({ audioId, audioUrl: directUrl, audioData: directData, title }: AudioPlayerProps) => {
  const [audioUrl, setAudioUrl] = useState<string | null>(directUrl || directData || null);
  const [loading, setLoading] = useState(!directUrl && !directData && !!audioId);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const fetchAudio = async () => {
      if (!audioId) {
        setHasError(true);
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/audio?id=${audioId}`);
        if (response.ok) {
          const data = await response.json();
          if (data.audioData) {
            setAudioUrl(data.audioData);
          } else {
            setHasError(true);
          }
        } else {
          setHasError(true);
        }
      } catch {
        setHasError(true);
      } finally {
        setLoading(false);
      }
    };

    if (directUrl || directData) {
      setAudioUrl(directUrl || directData || null);
      setLoading(false);
    } else if (audioId) {
      fetchAudio();
    } else {
      setHasError(true);
      setLoading(false);
    }
  }, [audioId, directUrl, directData]);

  useEffect(() => {
    if (audioUrl) {
      try {
        const audio = new Audio(audioUrl);
        audio.onended = () => setIsPlaying(false);
        audio.onerror = () => {
          setHasError(true);
          setAudioUrl(null);
        };
        setAudioElement(audio);
      } catch {
        setHasError(true);
        setAudioUrl(null);
      }
    }
  }, [audioUrl]);

  useEffect(() => {
    return () => {
      if (audioElement) {
        audioElement.pause();
        audioElement.src = '';
      }
    };
  }, [audioElement]);

  const togglePlay = () => {
    if (!audioElement) return;
    
    if (isPlaying) {
      audioElement.pause();
      setIsPlaying(false);
    } else {
      audioElement.play();
      setIsPlaying(true);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 p-3 bg-slate-800/50 rounded-lg border border-slate-700/50 w-fit my-2">
        <Loader2 className="w-5 h-5 text-emerald-400 animate-spin" />
        <span className="text-sm text-slate-400">Carregando áudio...</span>
      </div>
    );
  }

  if (hasError || !audioUrl) {
    console.log('AudioPlayer: erro ou sem URL, audioId:', audioId);
    return (
      <div className="flex items-center gap-2 p-3 bg-red-500/10 rounded-lg border border-red-500/20 w-fit my-2">
        <span className="text-sm text-red-400">Áudio não encontrado (ID: {audioId})</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 p-3 bg-slate-800 rounded-xl border border-slate-700 w-fit my-2 shadow-sm">
      <button
        onClick={togglePlay}
        className="w-10 h-10 flex items-center justify-center bg-emerald-500 hover:bg-emerald-400 text-white rounded-full transition-colors shadow-sm"
      >
        {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-1" />}
      </button>
      <div className="flex flex-col">
        <span className="text-sm font-medium text-slate-200">{title || 'Áudio da Lição'}</span>
        <span className="text-xs text-slate-400">{isPlaying ? 'Tocando...' : 'Clique para ouvir'}</span>
      </div>
    </div>
  );
};