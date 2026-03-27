import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const level = searchParams.get('level');
  const module = searchParams.get('module');
  const limit = searchParams.get('limit') || '10';

  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
  }

  try {
    let query = supabaseAdmin
      .from('audios')
      .select('id, title, text, level, module')
      .order('created_at', { ascending: false })
      .limit(parseInt(limit));

    if (level) {
      query = query.eq('level', level);
    }
    if (module) {
      query = query.eq('module', module);
    }

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json({ audios: data || [] });
  } catch (error: any) {
    console.error('Error fetching audios:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}