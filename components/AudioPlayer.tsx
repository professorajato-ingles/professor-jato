import React, { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Play, Pause, Loader2 } from 'lucide-react';

export const AudioPlayer = ({ audioId }: { audioId: string }) => {
  const [audioData, setAudioData] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);

  useEffect(() => {
    const fetchAudio = async () => {
      try {
        const docRef = doc(db, 'audios', audioId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setAudioData(docSnap.data().audioData);
        }
      } catch (error) {
        console.error("Error fetching audio:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAudio();
  }, [audioId]);

  useEffect(() => {
    if (audioData) {
      try {
        const audio = new Audio(audioData);
        audio.onended = () => setIsPlaying(false);
        audio.onerror = (e) => {
          console.error("Audio error:", e);
          setAudioData(null);
        };
        setAudioElement(audio);
      } catch (err) {
        console.error("Error creating audio element:", err);
        setAudioData(null);
      }
    }
  }, [audioData]);

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

  if (!audioData) {
    return (
      <div className="flex items-center gap-2 p-3 bg-red-500/10 rounded-lg border border-red-500/20 w-fit my-2 text-red-400 text-sm">
        Áudio não encontrado.
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
        <span className="text-sm font-medium text-slate-200">Áudio da Lição</span>
        <span className="text-xs text-slate-400">{isPlaying ? 'Tocando...' : 'Clique para ouvir'}</span>
      </div>
    </div>
  );
};
