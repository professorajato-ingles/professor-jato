'use client';

import React, { useState, useRef } from 'react';
import { Play, Pause, Volume2, Maximize } from 'lucide-react';

interface VideoPlayerProps {
  videoData?: {
    title: string;
    clipUrl: string;
    sourceUrl: string;
    contextText: string;
  };
  title?: string;
  clipUrl?: string;
  sourceUrl?: string;
  contextText?: string;
}

export const VideoPlayer = ({ videoData, title, clipUrl, sourceUrl, contextText }: VideoPlayerProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef<HTMLIFrameElement>(null);
  
  const videoTitle = videoData?.title || title;
  const videoClipUrl = videoData?.clipUrl || clipUrl;
  const videoSourceUrl = videoData?.sourceUrl || sourceUrl;
  const videoContextText = videoData?.contextText || contextText;

  const getYoutubeEmbedUrl = (url: string): string => {
    if (!url) return '';
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&]+)/);
    if (match) {
      return `https://www.youtube.com/embed/${match[1]}?enablejsapi=1`;
    }
    return url;
  };

  const embedUrl = videoClipUrl ? getYoutubeEmbedUrl(videoClipUrl) : '';

  return (
    <div className="bg-slate-800 rounded-xl p-4 border border-slate-700 my-3 overflow-hidden">
      {videoTitle && (
        <p className="text-sm font-medium text-white mb-2">{videoTitle}</p>
      )}
      
      <div className="relative aspect-video bg-slate-900 rounded-lg overflow-hidden">
        <iframe
          ref={videoRef}
          src={embedUrl}
          className="w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>

      {videoContextText && (
        <p className="text-xs text-slate-400 mt-2">{videoContextText}</p>
      )}

      <div className="flex items-center gap-3 mt-3">
        {videoSourceUrl && (
          <a 
            href={videoSourceUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
          >
            <Play className="w-3 h-3" />
            Ver no YouTube
          </a>
        )}
      </div>
    </div>
  );
};

export const parseVideoInMessage = (text: string): { content: string; videoIds: string[] } => {
  const videoRegex = /\[VIDEO:([a-f0-9-]+)\]/g;
  const videoIds: string[] = [];
  
  const content = text.replace(videoRegex, (_, videoId) => {
    videoIds.push(videoId);
    return '';
  });

  return { content: content.trim(), videoIds };
};