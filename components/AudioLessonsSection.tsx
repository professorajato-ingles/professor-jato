'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Play, Pause, Headphones } from 'lucide-react';

interface AudioLesson {
  id: string;
  title: string;
  text: string;
  audio_data: string;
  level: string;
  module: string;
}

export const AudioLessonsSection = () => {
  const [lessons, setLessons] = useState<AudioLesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);

  useEffect(() => {
    fetchLessons();
  }, []);

  const fetchLessons = async () => {
    try {
      const { data, error } = await supabase
        .from('audios')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(6);

      if (error) throw error;
      setLessons(data || []);
    } catch (err) {
      console.error('Error fetching lessons:', err);
    } finally {
      setLoading(false);
    }
  };

  const togglePlay = (lesson: AudioLesson) => {
    if (playingId === lesson.id) {
      audioElement?.pause();
      setPlayingId(null);
    } else {
      if (audioElement) audioElement.pause();
      const newAudio = new Audio(lesson.audio_data);
      newAudio.play();
      newAudio.onended = () => setPlayingId(null);
      setAudioElement(newAudio);
      setPlayingId(lesson.id);
    }
  };

  if (loading) {
    return (
      <section className="py-16 bg-slate-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="animate-pulse">
            <div className="h-8 bg-slate-200 rounded w-1/3 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-32 bg-slate-200 rounded-xl"></div>
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (lessons.length === 0) return null;

  return (
    <section className="py-16 bg-gradient-to-b from-white to-slate-50">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 bg-emerald-100 rounded-2xl">
            <Headphones className="w-6 h-6 text-emerald-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Lições de Áudio</h2>
            <p className="text-slate-500">Ouça e pratique seu inglês</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {lessons.map(lesson => (
            <div 
              key={lesson.id}
              className="bg-white rounded-2xl p-5 border border-slate-200 hover:border-emerald-300 hover:shadow-lg transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-slate-900 line-clamp-1">{lesson.title}</h3>
                  <span className="text-xs text-slate-500">{lesson.module}</span>
                </div>
                <span className="px-2 py-1 text-xs rounded-full bg-slate-100 text-slate-600">
                  {lesson.level}
                </span>
              </div>
              
              <p className="text-sm text-slate-500 line-clamp-2 mb-4">{lesson.text}</p>
              
              <button
                onClick={() => togglePlay(lesson)}
                className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-medium transition-colors ${
                  playingId === lesson.id
                    ? 'bg-red-500 hover:bg-red-600 text-white'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                }`}
              >
                {playingId === lesson.id ? (
                  <>
                    <Pause className="w-4 h-4" />
                    Pausar
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    Ouvir Áudio
                  </>
                )}
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};