import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ydhdfhlcznrnvmehmwnj.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const { userId } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    const stripeSecretKey = process.env.STRIPE_SECRET_KEY?.trim();
    const appUrl = (process.env.APP_URL || 'https://professorjato.beend.tech').trim();

    if (!stripeSecretKey) {
      return NextResponse.json({ error: 'STRIPE_SECRET_KEY not configured' }, { status: 500 });
    }

    if (!supabase) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    const { data: user } = await supabase
      .from('users')
      .select('stripe_customer_id')
      .eq('uid', userId)
      .single();

    if (!user?.stripe_customer_id) {
      return NextResponse.json({ error: 'No active subscription found' }, { status: 400 });
    }

    const response = await fetch('https://api.stripe.com/v1/billing_portal/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${stripeSecretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        customer: user.stripe_customer_id,
        return_url: appUrl,
      }),
    });

    const session = await response.json();

    if (!response.ok) {
      console.error('[PORTAL] Stripe error:', session);
      return NextResponse.json({ error: session.error?.message || 'Failed to create portal session' }, { status: 500 });
    }

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error('[PORTAL] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
