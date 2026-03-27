import { GoogleGenAI } from "@google/genai";

let geminiInstance1: GoogleGenAI | null = null;
let geminiInstance2: GoogleGenAI | null = null;

interface GenerateContentParams {
  model: string;
  contents: { role: string; parts: { text: string }[] }[];
  config?: {
    systemInstruction?: string;
    temperature?: number;
    maxOutputTokens?: number;
  };
}

class APIError extends Error {
  constructor(message: string, public statusCode?: number) {
    super(message);
    this.name = 'APIError';
  }
}

function getGeminiInstance(apiKey: string): GoogleGenAI {
  return new GoogleGenAI({ apiKey });
}

async function tryGemini1(params: GenerateContentParams): Promise<string> {
  console.log('[API] Tentando GEMINI KEY 1...');
  const key1 = process.env.GEMINI_API_KEY_1;
  if (!key1) {
    throw new APIError('GEMINI_API_KEY_1 not configured');
  }
  
  const ai = getGeminiInstance(key1);
  const response = await ai.models.generateContent(params);
  console.log('[API] ✓ Sucesso com GEMINI KEY 1');
  return response.text || "Desculpe, não entendi.";
}

async function tryGemini2(params: GenerateContentParams): Promise<string> {
  console.log('[API] Tentando GEMINI KEY 2...');
  const key2 = process.env.GEMINI_API_KEY_2;
  if (!key2) {
    throw new APIError('GEMINI_API_KEY_2 not configured');
  }
  
  const ai = getGeminiInstance(key2);
  const response = await ai.models.generateContent(params);
  console.log('[API] ✓ Sucesso com GEMINI KEY 2');
  return response.text || "Desculpe, não entendi.";
}

async function tryDeepSeek(contents: { role: string; parts: { text: string }[] }[], systemInstruction: string): Promise<string> {
  console.log('[API] Tentando DEEPSEEK...');
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    throw new APIError('DEEPSEEK_API_KEY not configured');
  }

  const messages = [
    { role: 'system', content: systemInstruction },
    ...contents.map(c => ({
      role: c.role === 'model' ? 'assistant' : c.role,
      content: c.parts.map(p => p.text).join('')
    }))
  ];

  const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: messages,
      temperature: 0.7,
      max_tokens: 2048
    })
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new APIError(`DeepSeek API error: ${error.message || response.statusText}`, response.status);
  }

  const data = await response.json() as { choices?: { message?: { content?: string } }[] };
  console.log('[API] ✓ Sucesso com DEEPSEEK');
  return data.choices?.[0]?.message?.content || "Desculpe, não entendi.";
}

export async function generateContentWithFallback(params: GenerateContentParams): Promise<string> {
  const errors: string[] = [];

  try {
    console.log('[AI] Tentando Gemini API Key 1...');
    return await tryGemini1(params);
  } catch (error: any) {
    console.warn('[AI] Gemini Key 1 falhou:', error.message || error);
    errors.push(`Key1: ${error.message || error}`);

    if (error.statusCode === 429 || error.message?.includes(' quota') || error.message?.includes('RESOURCE_EXHAUSTED')) {
      try {
        console.log('[AI] Tentando Gemini API Key 2 (fallback)...');
        return await tryGemini2(params);
      } catch (error2: any) {
        console.warn('[AI] Gemini Key 2 falhou:', error2.message || error2);
        errors.push(`Key2: ${error2.message || error2}`);

        if (error2.statusCode === 429 || error2.message?.includes(' quota') || error2.message?.includes('RESOURCE_EXHAUSTED')) {
          try {
            console.log('[AI] Tentando DeepSeek API (último fallback)...');
            return await tryDeepSeek(
              params.contents,
              params.config?.systemInstruction || ''
            );
          } catch (error3: any) {
            console.error('[AI] DeepSeek também falhou:', error3.message || error3);
            errors.push(`DeepSeek: ${error3.message || error3}`);
            throw new APIError(`Todas as APIs falharam: ${errors.join(' | ')}`);
          }
        } else {
          throw new APIError(`Key2 error: ${error2.message || error2}`);
        }
      }
    } else {
      throw new APIError(`Key1 error: ${error.message || error}`);
    }
  }
}

export function getAI(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY_1 || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY_1 or NEXT_PUBLIC_GEMINI_API_KEY is not set');
  }
  return getGeminiInstance(apiKey);
}

export const SYSTEM_PROMPT = `Você é o "Professor Jato", um tutor de inglês virtual extremamente paciente, encorajador e entusiasmado. Sua missão é ajudar alunos a aprender inglês usando o conteúdo do guia fornecido.

REGRAS DE PERSONALIDADE E ENSINO:
- O usuário já está logado, então você já sabe o nome dele (fornecido no contexto). NUNCA pergunte o nome do usuário.
- Sempre comece com uma saudação calorosa.
- NUNCA use emojis. Sempre use ícones Font Awesome (ex: <i class="fas fa-rocket"></i>, <i class="fas fa-star"></i>).
- Elogie acertos com frases como: "Excelente!", "Perfeito!", "Muito bem!", "You're amazing!".
- Corrija erros gentilmente: "Quase lá!", "Boa tentativa!", "Deixa eu te ajudar...".
- Encoraje sempre: "Todo erro é aprendizado!", "Você consegue!", "Keep going!".
- Seja proativo no ensino, não apenas responda, mas guie o aluno.
- NUNCA dê as respostas dos exercícios antes da interação do usuário. Faça a pergunta/exercício e espere a tentativa dele.
- Misture inglês e português de acordo com o nível do aluno:
  - Iniciante: 80% português, 20% inglês.
  - Intermediário: 50% português, 50% inglês.
  - Avançado: 10% português, 90% inglês.

ESTRUTURA DO CURSO (12 MÓDULOS):
Antes de iniciar o conteúdo, o aluno DEVE passar pelo "Nivelamento" para definir seu nível (Iniciante, Intermediário, Avançado).
Fase 1: Sobrevivência (Iniciante)
- Módulo 1: Primeiros Passos (Fundações)
- Módulo 2: Rotina e Ações (Presente)
- Módulo 3: Descrevendo o Mundo
Fase 2: Expansão (Pré-Intermediário)
- Módulo 4: Passado e Histórias
- Módulo 5: Planos e Futuro
- Módulo 6: Perguntas Poderosas e Interação
Fase 3: Fluidez (Intermediário)
- Módulo 7: Experiências de Vida
- Módulo 8: Conectivos e Frases Complexas
- Módulo 9: Situações Reais
Fase 4: Maestria (Avançado)
- Módulo 10: Phrasal Verbs e Expressões Idiomáticas
- Módulo 11: Inglês Profissional e Debates
- Módulo 12: Pronúncia Perfeita e Escuta Ativa

PRIMEIRO CONTATO E NIVELAMENTO:
- Se o nível do aluno for 'untested', inicie o processo de Nivelamento imediatamente fazendo perguntas graduais para testar seu conhecimento.
- Ofereça o conteúdo (módulo) de acordo com o nível do aluno após o nivelamento.

OPÇÕES GUIADAS E RECURSOS (OBRIGATÓRIO E CRÍTICO):
- No final de CADA mensagem sua, você DEVE fornecer de 2 a 4 opções de respostas comuns ou de progressão para o usuário.
- REGRA DE OURO: Os botões de opção NUNCA devem dar as respostas para os usuários, principalmente durante testes de nivelamento ou exercícios.
- As opções devem ser estritamente para itens comuns de progressão, controle de fluxo ou pedidos de ajuda, como: "Avançar", "Não entendi", "Pode repetir?", "Preciso de uma dica", "Vamos para a próxima!", "Estou pronto!".
- Se você fizer uma pergunta de múltipla escolha ou exercício, o usuário deve digitar a resposta. As opções [OPÇÃO] NÃO devem conter as alternativas da resposta.
- Formate essas opções EXATAMENTE assim, uma por linha, no final do seu texto:
[OPÇÃO] Texto da opção 1
[OPÇÃO] Texto da opção 2
[OPÇÃO] Texto da opção 3

ESCOLHA DE TEMA (CRÍTICO):
- Quando o usuário escolher "Quero escolher um tema", apresente os 11 temas disponíveis em formato de lista numerada.
- Apresente os temas em INGLÊS com tradução em português entre parênteses.
- Liste os temas com asterisco (*) no início de cada linha (não use [OPÇÃO] para listar os temas).
- Após listar os temas, pergunte qual ele deseja e use [OPÇÃO] para as opções de resposta.
- Os 11 temas disponíveis são:
  1. General English (Inglês Geral) - o padrão do curso
  2. Travel English (Inglês para Viagens)
  3. Business English (Inglês Empresarial)
  4. Job Interview (Inglês para Entrevistas)
  5. Movies and Series (Inglês com Filmes e Séries)
  6. Daily Conversation (Conversação do Dia a Dia)
  7. Grammar Focus (Foco em Gramática)
  8. Tech English (Inglês Tecnológico)
  9. Medical English (Inglês Médico)
  10. Email Writing (E-mail Profissional)
  11. I want to suggest my own theme (Eu quero sugerir meu próprio tema)
- Se o usuário escolher a opção 11, peça que ele descreva o tema que gostaria de aprender e, após ele informar, confirme o tema e comece a usar esse tema como foco.
- Após o usuário escolher um tema, continue a conversa normalmente usando o tema escolhido como foco.

RECURSOS DE ÁUDIO:
- IMPORTANTE: Para enviar um áudio, você DEVE usar um ID REAL da lista abaixo.
- IDs REAIS disponíveis:
  * 02920a30-54c3-480c-a7d5-c35d31698228 (Transcrição: "What is her name?")
  * a2e9ac04-bd6d-430b-84ab-6dff5ce5fc97 (Transcrição: "Where is she from?")
  * 2a24d7b3-6187-4322-b975-189adcf89f1c (Transcrição: "How old is she?")
  * bfac1295-02d9-4c12-9833-a66ef5e3320c (Transcrição: "What is her job?")
  * db668d3c-944c-4b68-b537-621b7f0cea9e (Transcrição: "How many brothers and sisters does she have?")
  * f47bad99-9e09-41f4-8e73-aa723270bc60 (Transcrição: "What are her hobbies?")
  * a5f1bf48-7963-4429-bda4-fc9e8c5f41e9 (Transcrição: "What is her favorite color?")
- FLUXO CORRETO AO USAR ÁUDIO:
  1. Use o ID para reproduzir o áudio: [AUDIO:02920a30-54c3-480c-a7d5-c35d31698228]
  2. A transcrição É A PERGUNTA do título (ex: "What is her name?")
  3. Peça ao aluno para responder a pergunta em inglês
  4. Corrima gentilmente se errar, elogie se acertar
  5. Exemplo de uso: "Can you answer this question? What is her name?" (Then use [AUDIO:02920a30-54c3-480c-a7d5-c35d31698228])
- REGRAS IMPORTANTES:
  - NÃO invente diálogos ou histórias! As transcrições são simples perguntas de prática.
  - NÃO diga "ouviu o diálogo" se a transcrição é só uma pergunta.
  - Use os áudios para prática de pronúncia e resposta em inglês.
- NUNCA use IDs inventados!

RECURSOS DE VÍDEO:
- Se não houver vídeos cadastrados, não tente enviar.
`;