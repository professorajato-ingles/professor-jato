import { NextRequest, NextResponse } from 'next/server';
import { generateContentWithFallback } from '@/lib/ai';
import { createClient } from '@supabase/supabase-js';
import { checkRateLimit } from '@/lib/rate-limit';

const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID;
const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ydhdfhlcznrnvmehmwnj.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

interface WhatsAppMessage {
  From: string;
  Body: string;
  MessageSid?: string;
}

async function sendQuickThinkingMessage(to: string) {
  if (!twilioAccountSid || !twilioAuthToken || !twilioPhoneNumber) {
    return null;
  }

  const fromNumber = twilioPhoneNumber.startsWith('whatsapp:') 
    ? twilioPhoneNumber 
    : `whatsapp:${twilioPhoneNumber}`;
  
  const toNumber = to.startsWith('whatsapp:') ? to : `whatsapp:${to.replace('whatsapp:', '')}`;

  const url = `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`;
  
  const formData = new URLSearchParams();
  formData.append('From', fromNumber);
  formData.append('To', toNumber);
  formData.append('Body', '🤔 Pensando...');

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + Buffer.from(`${twilioAccountSid}:${twilioAuthToken}`).toString('base64'),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    });
    return await response.json();
  } catch {
    return null;
  }
}

async function sendWhatsAppMessage(to: string, body: string) {
  if (!twilioAccountSid || !twilioAuthToken || !twilioPhoneNumber) {
    return null;
  }

  const fromNumber = twilioPhoneNumber.startsWith('whatsapp:') 
    ? twilioPhoneNumber 
    : `whatsapp:${twilioPhoneNumber}`;
  
  const toNumber = to.startsWith('whatsapp:') ? to : `whatsapp:${to.replace('whatsapp:', '')}`;

  const url = `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`;
  
  const formData = new URLSearchParams();
  formData.append('From', fromNumber);
  formData.append('To', toNumber);
  formData.append('Body', body);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + Buffer.from(`${twilioAccountSid}:${twilioAuthToken}`).toString('base64'),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    });
    return await response.json();
  } catch {
    return null;
  }
}

function buildWhatsAppSystemPrompt() {
  return `Você é o "Professor Jato", um tutor de inglês virtual.

REGRAS PRINCIPAIS:
1. Seja BREVE e OBJETIVO - respostas de no máximo 2-3 frases
2. Use 80% INGLÊS e 20% PORTUGUÊS para correções
3. Corrija apenas 1-2 erros por vez - não sobrecarregue o aluno
4. Después de cada resposta, faça UNA pregunta simple para continuar

NUNCA:
- Não escreva textos longos
- Não explique mais de 2 pontos por vez
- Não use parágrafos longos

SEMPRE:
- Use emojis moderadamente (1-2 por resposta)
- Termine com uma pergunta simples ou opção

Exemplo de resposta IDEAL:
"Perfect! ✅ 'I am happy' is correct! Now you try: 'I am ___' (tired/sad)"

Exemplo a EVITAR:
"Muito bem! Você acertou o uso do Present Continuous..." (texto longo)

IMPORTANTE: O aluno está praticando inglês. Responda CURTO e PRÁTICO!`;
}

async function getOrCreateSession(phoneNumber: string): Promise<{ sessionId: string; messages: any[] } | null> {
  if (!supabase) {
    console.error('[WHATSAPP] Supabase not configured');
    return null;
  }

  try {
    const { data: existing } = await supabase
      .from('whatsapp_sessions')
      .select('*')
      .eq('phone_number', phoneNumber)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (existing) {
      const { data: messages } = await supabase
        .from('whatsapp_messages')
        .select('*')
        .eq('session_id', existing.id)
        .order('created_at', { ascending: true });

      return {
        sessionId: existing.id,
        messages: messages || []
      };
    }

    const { data: newSession, error: sessionError } = await supabase
      .from('whatsapp_sessions')
      .insert({ phone_number: phoneNumber })
      .select()
      .single();

    if (sessionError) {
      console.error('[WHATSAPP] Error creating session:', sessionError);
      return null;
    }

    return {
      sessionId: newSession.id,
      messages: []
    };
  } catch (error) {
    console.error('[WHATSAPP] Error in getOrCreateSession:', error);
    return null;
  }
}

async function saveMessage(sessionId: string, role: 'user' | 'assistant', content: string) {
  if (!supabase || !sessionId) return;

  try {
    await supabase
      .from('whatsapp_messages')
      .insert({
        session_id: sessionId,
        role,
        content
      });
  } catch (error) {
    console.error('[WHATSAPP] Error saving message:', error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const params = new URLSearchParams(rawBody);
    const from = params.get('From');
    const body = params.get('Body');
    const messageSid = params.get('MessageSid');
    
    const message: WhatsAppMessage = {
      From: from || '',
      Body: body?.trim() || '',
      MessageSid: messageSid || undefined,
    };

    if (!message.From || !message.Body) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { success: rateLimited, resetIn } = await checkRateLimit(`whatsapp:${message.From}`);
    
    if (!rateLimited) {
      return NextResponse.json({ 
        error: 'Too many requests. Please wait before sending more messages.',
        retryAfter: Math.ceil(resetIn / 1000)
      }, { 
        status: 429,
        headers: {
          'Retry-After': Math.ceil(resetIn / 1000).toString()
        }
      });
    }

    const phoneNumber = message.From.replace('whatsapp:', '');
    const sessionData = await getOrCreateSession(phoneNumber);
    const sessionId = sessionData?.sessionId || 'temp';

    await saveMessage(sessionId, 'user', message.Body);

    const history = sessionData?.messages?.map((m: any) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }]
    })) || [];

    const contents = [
      ...history,
      { role: 'user' as const, parts: [{ text: message.Body }] }
    ];

    await sendQuickThinkingMessage(message.From);
    await new Promise(resolve => setTimeout(resolve, 2000));

    const aiResponse = await generateContentWithFallback({
      model: 'gemini-2.0-flash',
      contents,
      config: {
        systemInstruction: buildWhatsAppSystemPrompt(),
      },
    });

    await saveMessage(sessionId, 'assistant', aiResponse);

    await sendWhatsAppMessage(message.From, aiResponse);

    return new Response('', { status: 200 });
  } catch (error: any) {
    console.error('[WHATSAPP] Error:', error.message);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ 
    status: 'ok', 
    message: 'WhatsApp webhook is running',
    timestamp: new Date().toISOString()
  });
}
