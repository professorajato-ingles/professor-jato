import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const videoId = searchParams.get('id');
  const level = searchParams.get('level');
  const limit = searchParams.get('limit') || '10';

  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
  }

  try {
    if (videoId) {
      const { data, error } = await supabaseAdmin
        .from('videos')
        .select('id, title, clip_url, source_url, context_text, created_at')
        .eq('id', videoId)
        .single();

      if (error || !data) {
        return NextResponse.json({ error: 'Video not found' }, { status: 404 });
      }

      return NextResponse.json({ 
        id: data.id,
        title: data.title,
        clipUrl: data.clip_url,
        sourceUrl: data.source_url,
        contextText: data.context_text
      });
    }

    let query = supabaseAdmin
      .from('videos')
      .select('id, title, clip_url, source_url, context_text')
      .order('created_at', { ascending: false })
      .limit(parseInt(limit));

    if (level) {
      query = query.eq('level', level);
    }

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json({ videos: data || [] });
  } catch (error: any) {
    console.error('Error fetching video:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}