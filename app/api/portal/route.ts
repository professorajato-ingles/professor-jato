import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { validateUser } from '@/lib/api-security';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ydhdfhlcznrnvmehmwnj.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

async function findStripeCustomer(stripeSecretKey: string, email: string): Promise<string | null> {
  const response = await fetch(`https://api.stripe.com/v1/customers?email=${encodeURIComponent(email)}&limit=1`, {
    headers: {
      'Authorization': `Bearer ${stripeSecretKey}`,
    },
  });
  
  const data = await response.json();
  
  if (data.data && data.data.length > 0) {
    return data.data[0].id;
  }
  
  return null;
}

export async function POST(req: NextRequest) {
  try {
    const headerUserId = req.headers.get('x-user-id');
    const { userId: bodyUserId } = await req.json();

    const userId = headerUserId || bodyUserId;

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    const user = await validateUser(userId);
    
    if (!user) {
      return NextResponse.json({ error: 'Invalid or inactive user' }, { status: 401 });
    }

    if (user.plan !== 'premium') {
      return NextResponse.json({ error: 'No active subscription found' }, { status: 400 });
    }

    const stripeSecretKey = process.env.STRIPE_SECRET_KEY?.trim();
    const appUrl = (process.env.APP_URL || 'https://professorjato.beend.tech').trim();

    if (!stripeSecretKey) {
      return NextResponse.json({ error: 'STRIPE_SECRET_KEY not configured' }, { status: 500 });
    }

    if (!supabase) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    const { data: userData } = await supabase
      .from('users')
      .select('stripe_customer_id, email')
      .eq('uid', userId)
      .single();

    let customerId = userData?.stripe_customer_id;

    if (!customerId && userData?.email) {
      customerId = await findStripeCustomer(stripeSecretKey, userData.email);
      
      if (customerId) {
        await supabase
          .from('users')
          .update({ stripe_customer_id: customerId })
          .eq('uid', userId);
      }
    }

    if (!customerId) {
      return NextResponse.json({ error: 'No active subscription found' }, { status: 400 });
    }

    const response = await fetch('https://api.stripe.com/v1/billing_portal/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${stripeSecretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        customer: customerId,
        return_url: appUrl,
      }),
    });

    const session = await response.json();

    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to create portal session' }, { status: 500 });
    }

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error('[PORTAL] Error:', error.message);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
