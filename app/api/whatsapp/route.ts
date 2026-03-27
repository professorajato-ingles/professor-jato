import { NextRequest, NextResponse } from 'next/server';
import { generateContentWithFallback } from '@/lib/ai';
import { createClient } from '@supabase/supabase-js';

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
  console.log('[THINKING] Starting sendQuickThinkingMessage to:', to);
  
  if (!twilioAccountSid || !twilioAuthToken || !twilioPhoneNumber) {
    console.error('[THINKING] Missing credentials');
    return null;
  }

  const fromNumber = twilioPhoneNumber.startsWith('whatsapp:') 
    ? twilioPhoneNumber 
    : `whatsapp:${twilioPhoneNumber}`;
  
  const toNumber = to.startsWith('whatsapp:') ? to : `whatsapp:${to.replace('whatsapp:', '')}`;

  console.log('[THINKING] fromNumber:', fromNumber, 'toNumber:', toNumber);

  const url = `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`;
  
  const formData = new URLSearchParams();
  formData.append('From', fromNumber);
  formData.append('To', toNumber);
  formData.append('Body', '🤔 Pensando...');

  try {
    console.log('[THINKING] Sending request to Twilio...');
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + Buffer.from(`${twilioAccountSid}:${twilioAuthToken}`).toString('base64'),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    });
    const result = await response.json();
    console.log('[THINKING] Response:', result);
    return result;
  } catch (error) {
    console.error('[THINKING] Error:', error);
    return null;
  }
}

async function sendWhatsAppMessage(to: string, body: string) {
  console.log('[WHATSAPP] ========== SEND MESSAGE ==========');
  console.log('[WHATSAPP] To (raw):', to);
  console.log('[WHATSAPP] Body:', body.substring(0, 50) + '...');
  
  if (!twilioAccountSid || !twilioAuthToken || !twilioPhoneNumber) {
    console.error('[WHATSAPP] Missing Twilio credentials - CANNOT SEND');
    return null;
  }

  // Para WhatsApp Sandbox, o formato deve ser: whatsapp:+NUMERO
  const fromNumber = twilioPhoneNumber.startsWith('whatsapp:') 
    ? twilioPhoneNumber 
    : `whatsapp:${twilioPhoneNumber}`;
  
  const toNumber = to.startsWith('whatsapp:') ? to : `whatsapp:${to.replace('whatsapp:', '')}`;
  
  console.log('[WHATSAPP] From:', fromNumber);
  console.log('[WHATSAPP] To:', toNumber);

  const url = `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`;
  
  const formData = new URLSearchParams();
  formData.append('From', fromNumber);
  formData.append('To', toNumber);
  formData.append('Body', body);

  console.log('[WHATSAPP] Sending to Twilio API...');
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': 'Basic ' + Buffer.from(`${twilioAccountSid}:${twilioAuthToken}`).toString('base64'),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: formData.toString(),
  });

  const result = await response.json();
  console.log('[WHATSAPP] Twilio Response:', result);
  
  return result;
}

function buildWhatsAppSystemPrompt() {
  return `Você é o "Professor Jato", um tutor de inglês virtual extremamente paciente, encorajador e entusiasmado. Sua missão é ajudar alunos a aprender inglês.

REGRAS DE PERSONALIDADE E ENSINO:
- Sempre seja caloroso e acolhedor.
- Use 80% INGLÊS e 20% PORTUGUÊS para corrections.
- Quando o aluno errar, corrija gentilmente em português.
- Quando o aluno acertar, elogie em inglês!
- Misture inglês e português conforme o nível do aluno.
- Use emojis para tornar a conversa mais divertida e amigável.
- Seja paciente e encorajador sempre.

CONVERSA PRÁTICA:
- Pratique inglês conversacional com o aluno.
- Faça perguntas em inglês e peça que o aluno responda em inglês.
- Corrija erros de gramática, vocabulário e pronúncia.
- Ensine novas palavras e expressões.

FLUXO DA CONVERSA:
1. Cumprimente o aluno calorosamente
2. Faça perguntas para iniciar a conversa
3. Quando o aluno responder, corrija se necessário
4. Continue a conversa de forma natural
5. Ensine novas expressões regularmente

IMPORTANTE: O aluno está praticando inglês. Responda de forma natural e conversacional!`;
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
  console.log('[WHATSAPP] ========== NEW REQUEST ==========');
  
  // Verificar Content-Type
  const contentType = req.headers.get('content-type') || '';
  console.log('[WHATSAPP] Content-Type:', contentType);
  
  console.log('[WHATSAPP] ENV Check:');
  console.log('[WHATSAPP] - TWILIO_ACCOUNT_SID:', twilioAccountSid ? 'SET' : 'MISSING');
  console.log('[WHATSAPP] - TWILIO_AUTH_TOKEN:', twilioAuthToken ? 'SET' : 'MISSING');
  console.log('[WHATSAPP] - TWILIO_PHONE_NUMBER:', twilioPhoneNumber ? 'SET' : 'MISSING');
  console.log('[WHATSAPP] - SUPABASE_KEY:', supabaseKey ? 'SET' : 'MISSING');
  
  try {
    // Ler o body como texto primeiro
    const rawBody = await req.text();
    console.log('[WHATSAPP] Raw body:', rawBody);
    
    // Parsear manualmente os parâmetros
    const params = new URLSearchParams(rawBody);
    const from = params.get('From');
    const body = params.get('Body');
    const messageSid = params.get('MessageSid');
    
    const message: WhatsAppMessage = {
      From: from || '',
      Body: body?.trim() || '',
      MessageSid: messageSid || undefined,
    };

    console.log('[WHATSAPP] Parsed message:', message);

    if (!message.From || !message.Body) {
      console.log('[WHATSAPP] Missing From or Body - returning 400');
      return NextResponse.json({ error: 'Missing required fields', received: message }, { status: 400 });
    }

    const phoneNumber = message.From.replace('whatsapp:', '');
    console.log('[WHATSAPP] Phone number:', phoneNumber);
    
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

    console.log('[WHATSAPP] Sending to AI with history length:', contents.length);

    // Enviar "Pensando..." antes de chamar IA
    await sendQuickThinkingMessage(message.From);
    await new Promise(resolve => setTimeout(resolve, 2000));

    const aiResponse = await generateContentWithFallback({
      model: 'gemini-2.0-flash',
      contents,
      config: {
        systemInstruction: buildWhatsAppSystemPrompt(),
      },
    });

    console.log('[WHATSAPP] AI Response:', aiResponse.substring(0, 100) + '...');

    await saveMessage(sessionId, 'assistant', aiResponse);

    await sendWhatsAppMessage(message.From, aiResponse);

    return new Response('', { status: 200 });
  } catch (error: any) {
    console.error('[WHATSAPP] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ 
    status: 'ok', 
    message: 'WhatsApp webhook is running',
    timestamp: new Date().toISOString()
  });
}
