import { NextRequest, NextResponse } from 'next/server';
import { generateContentWithFallback } from '@/lib/ai';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const { contents, config, userId } = await req.json();

    console.log('[API/AI] Received request, contents length:', contents?.length);

    if (!contents || !Array.isArray(contents)) {
      return NextResponse.json({ error: 'Invalid contents' }, { status: 400 });
    }

    const response = await generateContentWithFallback({
      model: 'gemini-2.0-flash',
      contents,
      config: config || {},
    });

    if (userId && supabaseAdmin) {
      const today = new Date().toISOString().split('T')[0];
      
      const { data: user } = await supabaseAdmin
        .from('users')
        .select('last_interaction_date, interactions_today')
        .eq('uid', userId)
        .single();

      if (user) {
        const newInteractions = user.last_interaction_date === today 
          ? user.interactions_today + 1 
          : 1;

        await supabaseAdmin
          .from('users')
          .update({
            interactions_today: newInteractions,
            last_interaction_date: today,
            updated_at: new Date().toISOString(),
          })
          .eq('uid', userId);

        const { data: stats } = await supabaseAdmin
          .from('global_stats')
          .select('total_interactions')
          .eq('id', 1)
          .single();

        if (stats) {
          await supabaseAdmin
            .from('global_stats')
            .update({
              total_interactions: stats.total_interactions + 1,
              updated_at: new Date().toISOString(),
            })
            .eq('id', 1);
        }
      }
    }

    console.log('[API/AI] Success, response length:', response?.length);
    return NextResponse.json({ text: response }, { 
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      }
    });
  } catch (error: any) {
    console.error('[API/AI] Error:', error);
    console.error('[API/AI] Error stack:', error.stack);
    return NextResponse.json(
      { error: error.message || 'AI generation failed', stack: error.stack },
      { status: 500 }
    );
  }
}
