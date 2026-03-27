import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ydhdfhlcznrnvmehmwnj.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'sb_publishable_ImGVTuRrLAAJ0uMNfJx47w_5bwH929s';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const audioId = searchParams.get('id');

  console.log('[API/AUDIO] Request for audioId:', audioId);

  if (!audioId) {
    return NextResponse.json({ error: 'Audio ID required' }, { status: 400 });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const { data, error } = await supabase
      .from('audios')
      .select('id, title, text, audio_data, level, module')
      .eq('id', audioId)
      .single();

    console.log('[API/AUDIO] Query result:', { data, error });

    if (error || !data) {
      return NextResponse.json({ error: 'Audio not found', details: error }, { status: 404 });
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
    console.error('[API/AUDIO] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}