import { NextRequest, NextResponse } from 'next/server';
import { validateUser } from '@/lib/api-security';

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function isValidUserId(userId: string): boolean {
  return typeof userId === 'string' && userId.length > 0 && userId.length <= 128;
}

export async function POST(req: NextRequest) {
  try {
    const headerUserId = req.headers.get('x-user-id');
    const { userId: bodyUserId, email } = await req.json();

    const userId = headerUserId || bodyUserId;
    
    if (!userId || !isValidUserId(userId)) {
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });
    }

    const user = await validateUser(userId);
    
    if (!user) {
      return NextResponse.json({ error: 'Invalid or inactive user' }, { status: 401 });
    }

    if (user.plan === 'premium') {
      return NextResponse.json({ error: 'Already a Premium member' }, { status: 400 });
    }

    if (email && !isValidEmail(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }

    const stripeSecretKey = process.env.STRIPE_SECRET_KEY?.trim();
    const priceId = process.env.STRIPE_PRICE_ID?.trim();
    const appUrl = (process.env.APP_URL || 'https://professorjato.beend.tech').trim();

    if (!stripeSecretKey) {
      return NextResponse.json({ error: 'STRIPE_SECRET_KEY not configured' }, { status: 500 });
    }

    if (!priceId) {
      return NextResponse.json({ error: 'STRIPE_PRICE_ID not configured' }, { status: 500 });
    }

    const response = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${stripeSecretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        'payment_method_types[]': 'card',
        mode: 'subscription',
        'line_items[0][price]': priceId,
        'line_items[0][quantity]': '1',
        'success_url': `${appUrl}/?success=true`,
        'cancel_url': `${appUrl}/?canceled=true`,
        'client_reference_id': userId,
        ...(email && { 'customer_email': email }),
      }),
    });

    const session = await response.json();

    if (!response.ok) {
      return NextResponse.json({ error: 'Payment processing error' }, { status: 500 });
    }

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error('[CHECKOUT] Error:', error.message);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
