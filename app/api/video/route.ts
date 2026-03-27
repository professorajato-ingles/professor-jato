import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ydhdfhlcznrnvmehmwnj.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'sb_publishable_ImGVTuRrLAAJ0uMNfJx47w_5bwH929s';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const videoId = searchParams.get('id');
  const level = searchParams.get('level');
  const limit = searchParams.get('limit') || '10';

  console.log('[API/VIDEO] Request for videoId:', videoId);

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    if (videoId) {
      const { data, error } = await supabase
        .from('videos')
        .select('id, title, clip_url, source_url, context_text, created_at')
        .eq('id', videoId)
        .single();

      console.log('[API/VIDEO] Single query result:', { data, error });

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

    let query = supabase
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
    console.error('[API/VIDEO] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}