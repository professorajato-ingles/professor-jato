import { NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe';

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

    const stripe = getStripe();

    const priceId = process.env.STRIPE_PRICE_ID;
    const appUrl = process.env.APP_URL;

    console.log('Checkout - priceId:', priceId);
    console.log('Checkout - appUrl:', appUrl);

    if (!priceId) {
       return NextResponse.json({ error: 'STRIPE_PRICE_ID not configured' }, { status: 500 });
    }
    
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      customer_email: email || undefined,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${appUrl}/?success=true`,
      cancel_url: `${appUrl}/?canceled=true`,
      client_reference_id: userId,
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error('Stripe checkout error:', error);
    return NextResponse.json({ error: error.message || 'Payment processing error' }, { status: 500 });
  }
}
