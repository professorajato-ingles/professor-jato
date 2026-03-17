import { NextResponse } from 'next/server';
import Stripe from 'stripe';

let stripeClient: Stripe | null = null;

export function getStripe(): Stripe {
  if (!stripeClient) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      throw new Error('STRIPE_SECRET_KEY environment variable is required');
    }
    stripeClient = new Stripe(key, {
      apiVersion: '2025-02-24.acacia',
    });
  }
  return stripeClient;
}

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

    if (!priceId) {
       return NextResponse.json({ error: 'Payment configuration error' }, { status: 500 });
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
      success_url: `${process.env.APP_URL}/?success=true`,
      cancel_url: `${process.env.APP_URL}/?canceled=true`,
      client_reference_id: userId,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Stripe checkout error:', error);
    return NextResponse.json({ error: 'Payment processing error' }, { status: 500 });
  }
}
