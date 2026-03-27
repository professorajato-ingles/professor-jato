import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ydhdfhlcznrnvmehmwnj.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

async function getStripeData(stripeSecretKey: string) {
  let allSubscriptions: any[] = [];
  let hasMore = true;
  let startingAfter: string | undefined;

  while (hasMore) {
    const params = new URLSearchParams({
      limit: '100',
      status: 'all',
      'expand[]': 'data.customer',
    });

    if (startingAfter) {
      params.append('starting_after', startingAfter);
    }

    const response = await fetch(`https://api.stripe.com/v1/subscriptions?${params}`, {
      headers: {
        'Authorization': `Bearer ${stripeSecretKey}`,
      },
    });

    const data = await response.json();
    
    if (data.data && data.data.length > 0) {
      allSubscriptions = [...allSubscriptions, ...data.data];
      startingAfter = data.data[data.data.length - 1].id;
      hasMore = data.has_more;
    } else {
      hasMore = false;
    }
  }

  const activeSubscriptions = allSubscriptions.filter((s: any) => s.status === 'active');
  const canceledSubscriptions = allSubscriptions.filter((s: any) => s.status === 'canceled' || s.cancel_at_period_end);

  const mrr = activeSubscriptions.reduce((total: number, sub: any) => {
    const price = sub.items?.data[0]?.price;
    if (price?.unit_amount) {
      return total + (price.unit_amount / 100);
    }
    return total;
  }, 0);

  const canceledThisMonth = canceledSubscriptions.filter((s: any) => {
    const canceledAt = s.canceled_at;
    if (!canceledAt) return false;
    const cancelDate = new Date(canceledAt * 1000);
    const now = new Date();
    return cancelDate.getMonth() === now.getMonth() && cancelDate.getFullYear() === now.getFullYear();
  });

  return {
    activeCount: activeSubscriptions.length,
    canceledCount: canceledSubscriptions.length,
    canceledThisMonth: canceledThisMonth.length,
    mrr: Math.round(mrr * 100) / 100,
    currency: 'BRL',
  };
}

async function getUserStats() {
  if (!supabase) return null;

  const { count: totalUsers } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true });

  const { count: premiumUsers } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true })
    .eq('plan', 'premium');

  const { data: recentUsers } = await supabase
    .from('users')
    .select('uid, email, display_name, plan, created_at')
    .order('created_at', { ascending: false })
    .limit(10);

  return {
    totalUsers: totalUsers || 0,
    premiumUsers: premiumUsers || 0,
    freeUsers: (totalUsers || 0) - (premiumUsers || 0),
    recentUsers: recentUsers || [],
  };
}

export async function GET(req: NextRequest) {
  try {
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY?.trim();

    if (!stripeSecretKey) {
      return NextResponse.json({ error: 'STRIPE_SECRET_KEY not configured' }, { status: 500 });
    }

    const [stripeData, userStats] = await Promise.all([
      getStripeData(stripeSecretKey),
      getUserStats(),
    ]);

    return NextResponse.json({
      stripe: stripeData,
      users: userStats,
    });
  } catch (error: any) {
    console.error('[REVENUE] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
