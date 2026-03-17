import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getStripe } from '@/lib/stripe';

const PROJECT_ID = 'gen-lang-client-0176295507';
const FIRESTORE_DB_ID = 'ai-studio-69db3601-50a6-4446-a47f-06da05b2bf10';

async function updateFirestoreUser(userId: string, data: Record<string, unknown>) {
  const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/${FIRESTORE_DB_ID}/documents/users/${userId}?updateMask.fieldPaths=plan&updateMask.fieldPaths=stripeCustomerId&updateMask.fieldPaths=stripeSubscriptionId`;
  
  const response = await fetch(url, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      fields: {
        plan: { stringValue: data.plan },
        stripeCustomerId: { stringValue: data.stripeCustomerId || '' },
        stripeSubscriptionId: { stringValue: data.stripeSubscriptionId || '' },
      },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Firestore update failed: ${error}`);
  }
  
  return response.json();
}

async function findUserByCustomerId(customerId: string) {
  const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/${FIRESTORE_DB_ID}/documents/users:runQuery`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      structuredQuery: {
        where: {
          fieldFilter: {
            field: { fieldPath: 'stripeCustomerId' },
            op: 'EQUAL',
            value: { stringValue: customerId },
          },
        },
        limit: 1,
      },
    }),
  });

  if (!response.ok) {
    return null;
  }

  const results = await response.json();
  if (results && results.length > 0 && results[0].document) {
    const docId = results[0].document.name.split('/').pop();
    return docId;
  }
  
  return null;
}

export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get('stripe-signature') as string;

  let event: Stripe.Event;

  try {
    const stripe = getStripe();
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    
    if (!webhookSecret) {
      throw new Error('STRIPE_WEBHOOK_SECRET is not set');
    }

    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (error: any) {
    return NextResponse.json({ error: `Webhook Error: ${error.message}` }, { status: 400 });
  }

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.client_reference_id;
      const customerId = session.customer as string;
      const subscriptionId = session.subscription as string;

      if (userId) {
        await updateFirestoreUser(userId, {
          plan: 'premium',
          stripeCustomerId: customerId,
          stripeSubscriptionId: subscriptionId,
        });
      }
      return NextResponse.json({ received: true });
    }

    if (event.type === 'invoice.payment_succeeded' || event.type === 'invoice.paid') {
      const invoice = event.data.object as Stripe.Invoice;
      const customerId = invoice.customer as string;
      
      if (customerId) {
        const userId = await findUserByCustomerId(customerId);
        if (userId) {
          await updateFirestoreUser(userId, { plan: 'premium' });
        }
      }
      return NextResponse.json({ received: true });
    }

    if (event.type === 'customer.subscription.updated' || event.type === 'customer.subscription.deleted') {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = subscription.customer as string;
      
      if (customerId) {
        const userId = await findUserByCustomerId(customerId);
        if (userId) {
          const newPlan = event.type === 'customer.subscription.deleted' || subscription.status !== 'active' ? 'free' : 'premium';
          await updateFirestoreUser(userId, { plan: newPlan });
        }
      }
      return NextResponse.json({ received: true });
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}
