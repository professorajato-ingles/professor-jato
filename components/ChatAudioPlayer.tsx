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
    console.log('[AudioPlayer] Component mounted, audioId:', audioId, 'directUrl:', !!directUrl, 'directData:', !!directData);
    
    const fetchAudio = async () => {
      if (!audioId) {
        console.log('[AudioPlayer] No audioId provided');
        setHasError(true);
        setLoading(false);
        return;
      }

      console.log('[AudioPlayer] Fetching audio:', audioId);

      try {
        const response = await fetch(`/api/audio?id=${audioId}`);
        console.log('[AudioPlayer] Response status:', response.status);
        
        if (response.ok) {
          const data = await response.json();
          console.log('[AudioPlayer] Got data, has audioData:', !!data.audioData);
          if (data.audioData) {
            setAudioUrl(data.audioData);
            console.log('[AudioPlayer] Audio URL set, length:', data.audioData.length);
          } else {
            console.log('[AudioPlayer] No audioData in response');
            setHasError(true);
          }
        } else {
          const errorData = await response.json();
          console.log('[AudioPlayer] Error response:', errorData);
          setHasError(true);
        }
      } catch (err) {
        console.log('[AudioPlayer] Catch error:', err);
        setHasError(true);
      } finally {
        setLoading(false);
      }
    };

    if (directUrl || directData) {
      console.log('[AudioPlayer] Using direct URL/data');
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
    console.log('[AudioPlayer] audioUrl changed:', !!audioUrl);
    if (audioUrl) {
      try {
        console.log('[AudioPlayer] Creating Audio element');
        const audio = new Audio(audioUrl);
        audio.onended = () => { console.log('[AudioPlayer] Audio ended'); setIsPlaying(false); };
        audio.onerror = (e) => { console.log('[AudioPlayer] Audio error:', e); setHasError(true); setAudioUrl(null); };
        audio.oncanplay = () => console.log('[AudioPlayer] Audio can play');
        setAudioElement(audio);
      } catch (err) {
        console.log('[AudioPlayer] Error creating audio:', err);
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
    console.log('[AudioPlayer] Rendering loading state');
    return (
      <div className="flex items-center gap-2 p-3 bg-slate-800/50 rounded-lg border border-slate-700/50 w-fit my-2">
        <Loader2 className="w-5 h-5 text-emerald-400 animate-spin" />
        <span className="text-sm text-slate-400">Carregando áudio...</span>
      </div>
    );
  }

  if (hasError || !audioUrl) {
    console.log('[AudioPlayer] Rendering error state, hasError:', hasError, 'audioUrl:', !!audioUrl);
    return (
      <div className="flex items-center gap-2 p-3 bg-amber-500/10 rounded-lg border border-amber-500/30 w-fit my-2">
        <span className="text-sm text-amber-400">🎵 Áudio ({audioId?.slice(0,8)}...)</span>
      </div>
    );
  }

  console.log('[AudioPlayer] Rendering player, isPlaying:', isPlaying);

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