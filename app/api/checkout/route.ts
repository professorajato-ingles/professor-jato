import { NextResponse } from 'next/server';

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function isValidUserId(userId: string): boolean {
  return typeof userId === 'string' && userId.length > 0 && userId.length <= 128;
}

export async function POST(req: Request) {
  try {
    const { userId, email } = await req.json();
    
    if (!userId || !isValidUserId(userId)) {
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });
    }

    if (email && !isValidEmail(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }

    const stripeSecretKey = process.env.STRIPE_SECRET_KEY?.trim();
    const priceId = process.env.STRIPE_PRICE_ID?.trim();
    const appUrl = (process.env.APP_URL || 'https://professor-ajato-3-170326.vercel.app').trim();

    if (!stripeSecretKey) {
      return NextResponse.json({ error: 'STRIPE_SECRET_KEY not configured' }, { status: 500 });
    }

    if (!priceId) {
      return NextResponse.json({ error: 'STRIPE_PRICE_ID not configured' }, { status: 500 });
    }

    // Create checkout session using Stripe API directly
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
      console.error('Stripe API error:', session);
      return NextResponse.json({ error: session.error?.message || 'Stripe error', details: session }, { status: 500 });
    }

    return NextResponse.json({ 
      url: session.url
    });
  } catch (error: any) {
    console.error('Checkout error:', error);
    return NextResponse.json({ error: error.message || 'Payment processing error' }, { status: 500 });
  }
}
