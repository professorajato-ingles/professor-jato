'use client';

import React, { useState, useEffect } from 'react';
import { Loader2, ExternalLink } from 'lucide-react';

interface VideoPlayerProps {
  videoId?: string;
  videoUrl?: string;
  videoData?: {
    title: string;
    clipUrl: string;
    sourceUrl: string;
  };
}

export const VideoPlayer = ({ videoId, videoUrl, videoData: directData }: VideoPlayerProps) => {
  const [data, setData] = useState<any>(directData || null);
  const [loading, setLoading] = useState(!directData && !!videoId);

  useEffect(() => {
    const fetchVideo = async () => {
      if (!videoId) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/video?id=${videoId}`);
        if (response.ok) {
          const result = await response.json();
          setData(result);
        }
      } catch (error) {
        console.error("Error fetching video:", error);
      } finally {
        setLoading(false);
      }
    };

    if (directData) {
      setData(directData);
      setLoading(false);
    } else if (videoId) {
      fetchVideo();
    } else {
      setLoading(false);
    }
  }, [videoId, directData]);

  const getEmbedUrl = (url: string) => {
    if (!url) return '';
    try {
      if (url.includes('/embed/')) return url;
      
      if (url.includes('youtu.be/')) {
        const id = url.split('youtu.be/')[1]?.split('?')[0];
        return id ? `https://www.youtube.com/embed/${id}` : url;
      }
      
      if (url.includes('youtube.com/watch')) {
        const urlObj = new URL(url);
        const id = urlObj.searchParams.get('v');
        return id ? `https://www.youtube.com/embed/${id}` : url;
      }
      
      if (url.includes('youtube.com/shorts/')) {
        const id = url.split('youtube.com/shorts/')[1]?.split('?')[0];
        return id ? `https://www.youtube.com/embed/${id}` : url;
      }
    } catch (e) {
      console.error("Error parsing video URL:", e);
    }
    return url;
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 p-4 bg-slate-800/50 rounded-xl border border-slate-700/50 w-full max-w-md my-4">
        <Loader2 className="w-5 h-5 text-emerald-400 animate-spin" />
        <span className="text-sm text-slate-400">Carregando vídeo...</span>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const embedUrl = getEmbedUrl(data.clipUrl || data.clipUrl);

  return (
    <div className="flex flex-col gap-3 p-4 bg-slate-800 rounded-2xl border border-slate-700 w-full max-w-md my-4 shadow-lg overflow-hidden">
      <h4 className="font-semibold text-slate-200 text-sm">{data.title}</h4>
      <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-slate-900">
        <iframe 
          src={embedUrl} 
          title={data.title}
          className="absolute top-0 left-0 w-full h-full border-0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
          allowFullScreen
        ></iframe>
      </div>
      <a 
        href={data.sourceUrl} 
        target="_blank" 
        rel="noreferrer"
        className="flex items-center justify-center gap-2 w-full py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-200 text-sm font-medium rounded-xl transition-colors mt-1"
      >
        <ExternalLink className="w-4 h-4" />
        Assistir Vídeo Completo
      </a>
    </div>
  );
};