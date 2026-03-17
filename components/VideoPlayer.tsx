import React, { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Loader2, ExternalLink } from 'lucide-react';

export const VideoPlayer = ({ videoId }: { videoId: string }) => {
  const [videoData, setVideoData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVideo = async () => {
      try {
        const docRef = doc(db, 'videos', videoId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setVideoData(docSnap.data());
        }
      } catch (error) {
        console.error("Error fetching video:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchVideo();
  }, [videoId]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 p-4 bg-slate-800/50 rounded-xl border border-slate-700/50 w-full max-w-md my-4">
        <Loader2 className="w-5 h-5 text-emerald-400 animate-spin" />
        <span className="text-sm text-slate-400">Carregando vídeo...</span>
      </div>
    );
  }

  if (!videoData) {
    return (
      <div className="flex items-center gap-2 p-4 bg-red-500/10 rounded-xl border border-red-500/20 w-full max-w-md my-4 text-red-400 text-sm">
        Vídeo não encontrado.
      </div>
    );
  }

  // Helper function to convert standard YouTube URLs to embed URLs
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
        // Preserve time parameters if they exist (e.g. t=1m30s -> start=90)
        let timeParam = '';
        const t = urlObj.searchParams.get('t');
        if (t) {
          const seconds = parseInt(t.replace('s', ''));
          if (!isNaN(seconds)) {
            timeParam = `?start=${seconds}`;
          }
        }
        return id ? `https://www.youtube.com/embed/${id}${timeParam}` : url;
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

  const embedUrl = getEmbedUrl(videoData.clipUrl);

  return (
    <div className="flex flex-col gap-3 p-4 bg-slate-800 rounded-2xl border border-slate-700 w-full max-w-md my-4 shadow-lg overflow-hidden">
      <h4 className="font-semibold text-slate-200 text-sm">{videoData.title}</h4>
      <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-slate-900">
        <iframe 
          src={embedUrl} 
          title={videoData.title}
          className="absolute top-0 left-0 w-full h-full border-0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
          allowFullScreen
        ></iframe>
      </div>
      <a 
        href={videoData.sourceUrl} 
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
