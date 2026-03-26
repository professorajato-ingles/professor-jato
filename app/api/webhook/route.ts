import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { supabaseAdmin } from '@/lib/supabase';

function verifyStripeSignature(body: string, signature: string, webhookSecret: string) {
  const timestamp = signature.split(',').find(s => s.startsWith('t='))?.split('=')[1];
  const sig = signature.split(',').find(s => s.startsWith('v1='))?.split('=')[1];
  
  if (!timestamp || !sig) {
    throw new Error('Invalid signature format');
  }

  const payload = `${timestamp}.${body}`;
  const expectedSig = crypto
    .createHmac('sha256', webhookSecret)
    .update(payload)
    .digest('hex');

  if (sig !== expectedSig) {
    throw new Error('Invalid signature');
  }

  return true;
}

async function findUserByCustomerId(customerId: string): Promise<string | null> {
  if (!supabaseAdmin) return null;
  
  const { data, error } = await supabaseAdmin
    .from('users')
    .select('uid')
    .eq('stripe_customer_id', customerId)
    .single();

  if (error || !data) return null;
  return data.uid;
}

export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get('stripe-signature') as string;

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  
  if (!webhookSecret) {
    return NextResponse.json({ error: 'STRIPE_WEBHOOK_SECRET is not set' }, { status: 400 });
  }

  try {
    verifyStripeSignature(body, signature, webhookSecret);
  } catch (error: any) {
    console.error('Signature verification failed:', error.message);
    return NextResponse.json({ error: `Webhook Error: ${error.message}` }, { status: 400 });
  }

  let event: any;

  try {
    event = JSON.parse(body);
  } catch (error: any) {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  console.log('Webhook event type:', event.type);

  if (!supabaseAdmin) {
    console.error('Supabase admin not configured');
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
  }

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const userId = session.client_reference_id;
      const customerId = session.customer;
      const subscriptionId = session.subscription;

      console.log('Checkout completed - userId:', userId, 'customerId:', customerId);

      if (userId) {
        await supabaseAdmin
          .from('users')
          .update({
            plan: 'premium',
            stripe_customer_id: customerId,
            stripe_subscription_id: subscriptionId,
            updated_at: new Date().toISOString(),
          })
          .eq('uid', userId);
        
        console.log('User updated to premium:', userId);
      }
      return NextResponse.json({ received: true });
    }

    if (event.type === 'invoice.payment_succeeded' || event.type === 'invoice.paid') {
      const invoice = event.data.object;
      const customerId = invoice.customer;
      
      console.log('Payment succeeded - customerId:', customerId);

      if (customerId) {
        const userId = await findUserByCustomerId(customerId);
        if (userId) {
          await supabaseAdmin
            .from('users')
            .update({
              plan: 'premium',
              updated_at: new Date().toISOString(),
            })
            .eq('uid', userId);
          
          console.log('User updated to premium via invoice:', userId);
        }
      }
      return NextResponse.json({ received: true });
    }

    if (event.type === 'customer.subscription.updated' || event.type === 'customer.subscription.deleted') {
      const subscription = event.data.object;
      const customerId = subscription.customer;
      const status = subscription.status;
      
      console.log('Subscription updated - customerId:', customerId, 'status:', status);

      if (customerId) {
        const userId = await findUserByCustomerId(customerId);
        if (userId) {
          const newPlan = event.type === 'customer.subscription.deleted' || status !== 'active' ? 'free' : 'premium';
          await supabaseAdmin
            .from('users')
            .update({
              plan: newPlan,
              updated_at: new Date().toISOString(),
            })
            .eq('uid', userId);
          
          console.log('User plan updated to:', newPlan);
        }
      }
      return NextResponse.json({ received: true });
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Webhook handler failed:', error);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}