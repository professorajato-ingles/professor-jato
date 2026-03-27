import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const audioId = searchParams.get('id');

  if (!audioId) {
    return NextResponse.json({ error: 'Audio ID required' }, { status: 400 });
  }

  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('audios')
      .select('id, title, text, audio_data, level, module')
      .eq('id', audioId)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: 'Audio not found' }, { status: 404 });
    }

    return NextResponse.json({ 
      id: data.id,
      title: data.title,
      text: data.text,
      audioData: data.audio_data,
      level: data.level,
      module: data.module
    });
  } catch (error: any) {
    console.error('Error fetching audio:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}