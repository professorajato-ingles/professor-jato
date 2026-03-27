import { NextRequest, NextResponse } from 'next/server';
import { generateContentWithFallback } from '@/lib/ai';
import { supabaseAdmin } from '@/lib/supabase';
import { validateUser } from '@/lib/api-security';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const userId = req.headers.get('x-user-id');
    const { contents, config } = await req.json();

    if (!contents || !Array.isArray(contents)) {
      return NextResponse.json({ error: 'Invalid contents' }, { status: 400 });
    }

    if (userId) {
      const user = await validateUser(userId);
      
      if (!user) {
        return NextResponse.json({ error: 'Invalid or inactive user' }, { status: 401 });
      }

      if (user.plan === 'free' && supabaseAdmin) {
        const today = new Date().toISOString().split('T')[0];
        
        const { data: userData } = await supabaseAdmin
          .from('users')
          .select('last_interaction_date, interactions_today')
          .eq('uid', userId)
          .single();

        if (userData) {
          const newInteractions = userData.last_interaction_date === today 
            ? userData.interactions_today + 1 
            : 1;

          if (newInteractions > 20) {
            return NextResponse.json({ 
              error: 'Daily limit reached. Upgrade to Premium for unlimited interactions.' 
            }, { status: 429 });
          }

          await supabaseAdmin
            .from('users')
            .update({
              interactions_today: newInteractions,
              last_interaction_date: today,
              updated_at: new Date().toISOString(),
            })
            .eq('uid', userId);
        }
      }

      if (supabaseAdmin) {
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

    const response = await generateContentWithFallback({
      model: 'gemini-2.0-flash',
      contents,
      config: config || {},
    });

    return NextResponse.json({ text: response }, { 
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      }
    });
  } catch (error: any) {
    console.error('[API/AI] Error:', error.message);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
