'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, Bot, User, Mic, Headphones } from 'lucide-react';
import { useAuth } from './AuthProvider';
import { SYSTEM_PROMPT } from '@/lib/ai';
import Markdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import remarkGfm from 'remark-gfm';
import { Modal } from './Modal';
import { AudioPlayer } from './ChatAudioPlayer';
import { VideoPlayer } from './ChatVideoPlayer';

interface Message {
  id: string;
  text: string;
  sender: 'ai' | 'user';
  timestamp: number;
}

const parseMessage = (text: string) => {
  if (!text) {
    return { content: '', options: [], audioIds: [], videoIds: [], hasAudio: false };
  }
  
  const audioRegex = /\[AUDIO:([a-f0-9-]+)\]/g;
  const videoRegex = /\[VIDEO:([a-f0-9-]+)\]/g;
  const audioIds: string[] = [];
  const videoIds: string[] = [];
  
  let cleanText = text.replace(audioRegex, (_, audioId) => {
    audioIds.push(audioId);
    return '';
  });
  
  cleanText = cleanText.replace(videoRegex, (_, videoId) => {
    videoIds.push(videoId);
    return '';
  });

  const hasAudio = audioIds.length > 0;
  
  const lines = cleanText.split('\n');
  const options: string[] = [];
  const contentLines: string[] = [];
  
  lines.forEach(line => {
    const trimmed = line.trim();
    if (trimmed.startsWith('[OPÇÃO]')) {
      options.push(trimmed.replace('[OPÇÃO]', '').trim());
    } else {
      contentLines.push(line);
    }
  });
  
  return {
    content: contentLines.join('\n').trim(),
    options,
    audioIds,
    videoIds,
    hasAudio
  };
};

export const ChatSection = () => {
  const { user, userData, signInWithGoogle } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [practiceMode, setPracticeMode] = useState(false);
  const [currentSession, setCurrentSession] = useState<string>('nivelamento');
  const [audioLessonSession, setAudioLessonSession] = useState<string | null>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  const SESSION_MESSAGES: Record<string, (name: string) => string> = {
    nivelamento: (name) => `Olá, ${name}! Vamos descobrir qual é o seu nível atual de inglês? Para isso, vou fazer algumas perguntasprogressivas. Não se preocupe, é só um teste inicial para entender melhor onde você está. Vamos começar?

[OPÇÃO] Estou pronto(a)!`,
    modulo_1: (name) => `Olá, ${name}! Vamos começar o **Módulo 1: Primeiros Passos**! Este módulo vai te ensinar o básico do inglês: o verbo To Be, cumprimentos, pronomes, números e vocabulário de sobrevivência.

[OPÇÃO] Vamos começar!`,
    modulo_2: (name) => `Olá, ${name}! Vamos para o **Módulo 2: Rotina e Ações**! Aqui você vai aprender o Present Simple, verbos de ação mais comuns e como descrever o seu dia a dia em inglês.

[OPÇÃO] Vamos começar!`,
    modulo_3: (name) => `Olá, ${name}! Vamos para o **Módulo 3: Descrevendo o Mundo**! Neste módulo você vai aprender adjetivos, preposições de lugar e tempo, e vocabulário de casa, família e cidade.

[OPÇÃO] Vamos começar!`,
    modulo_4: (name) => `Olá, ${name}! Vamos para o **Módulo 4: Passado e Histórias**! Aqui você vai aprender o Past Simple, verbos regulares e irregulares, e como contar o que aconteceu no passado.

[OPÇÃO] Vamos começar!`,
    modulo_5: (name) => `Olá, ${name}! Vamos para o **Módulo 5: Planos e Futuro**! Neste módulo você vai aprender Will e Going to, fazendo previsões e planejando o futuro em inglês.

[OPÇÃO] Vamos começar!`,
    modulo_6: (name) => `Olá, ${name}! Vamos para o **Módulo 6: Perguntas Poderosas**! Aqui você vai aprender a formular perguntas complexas (Wh- questions) e ter diálogos práticos.

[OPÇÃO] Vamos começar!`,
    modulo_7: (name) => `Olá, ${name}! Vamos para o **Módulo 7: Experiências de Vida**! Este módulo vai te ensinar o Present Perfect, comparando passado com o presente.

[OPÇÃO] Vamos começar!`,
    modulo_8: (name) => `Olá, ${name}! Vamos para o **Módulo 8: Conectivos e Frases**! Aqui você vai aprender a juntar ideias, argumentar e expressar opiniões em inglês.

[OPÇÃO] Vamos começar!`,
    modulo_9: (name) => `Olá, ${name}! Vamos para o **Módulo 9: Situações Reais**! Neste módulo você vai praticar viagens, imigração, emergências e conversas telefônicas.

[OPÇÃO] Vamos começar!`,
    modulo_10: (name) => `Olá, ${name}! Vamos para o **Módulo 10: Phrasal Verbs**! Aqui você vai aprender o inglês falado na rua, gírias e vocabulário nativo.

[OPÇÃO] Vamos começar!`,
    modulo_11: (name) => `Olá, ${name}! Vamos para o **Módulo 11: Inglês Profissional**! Neste módulo você vai aprender entrevistas de emprego, reuniões e e-mails corporativos.

[OPÇÃO] Vamos começar!`,
    modulo_12: (name) => `Olá, ${name}! Vamos para o **Módulo 12: Pronúncia Perfeita**! Este é o último módulo! Aqui você vai aprender connected speech, ritmo, entonação e compreensão de nativos.

[OPÇÃO] Vamos começar!`,
    audio: (name) => `Olá, ${name}! Que bom que você quer praticar com áudio! 🎧

Vou enviar áudios para você ouvir e praticar sua escuta. Você vai responder às perguntas em inglês.

Vamos começar? 

[OPÇÃO] Estou pronto(a)!`,
  };

  const getSessionStorageKey = (session: string, uid: string) => `chat_session_${session}_${uid}`;

  const loadSessionMessages = React.useCallback((session: string, uid: string) => {
    const storageKey = getSessionStorageKey(session, uid);
    const stored = localStorage.getItem(storageKey);
    return stored ? JSON.parse(stored) : [];
  }, []);

  const saveSessionMessages = React.useCallback((session: string, uid: string, msgs: Message[]) => {
    const storageKey = getSessionStorageKey(session, uid);
    localStorage.setItem(storageKey, JSON.stringify(msgs));
  }, []);

  const sendInitialMessage = React.useCallback((session: string, data: any) => {
    const messageText = SESSION_MESSAGES[session] 
      ? SESSION_MESSAGES[session](data.displayName)
      : SESSION_MESSAGES['nivelamento'](data.displayName);
    
    const newMessage: Message = {
      id: Date.now().toString(),
      text: messageText,
      sender: 'ai',
      timestamp: Date.now(),
    };
    return newMessage;
  }, []);

  useEffect(() => {
    if (!user) return;

    const selectedSession = localStorage.getItem('selectedSession');
    if (selectedSession) {
      setCurrentSession(selectedSession);
      if (selectedSession === 'audio') {
        setAudioLessonSession('audio');
      } else {
        setAudioLessonSession(null);
      }
      localStorage.removeItem('selectedSession');
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;

    const handleStorageChange = () => {
      const selectedSession = localStorage.getItem('selectedSession');
      if (selectedSession) {
        console.log('[SESSION] Trocando para:', selectedSession);
        setCurrentSession(selectedSession);
        if (selectedSession === 'audio') {
          setAudioLessonSession('audio');
        } else {
          setAudioLessonSession(null);
        }
        setPracticeMode(false);
        localStorage.removeItem('selectedSession');
      }
    };

    window.addEventListener('storage', handleStorageChange);

    const interval = setInterval(() => {
      const selectedSession = localStorage.getItem('selectedSession');
      if (selectedSession) {
        console.log('[SESSION] Trocando para:', selectedSession);
        setCurrentSession(selectedSession);
        if (selectedSession === 'audio') {
          setAudioLessonSession('audio');
        } else {
          setAudioLessonSession(null);
        }
        setPracticeMode(false);
        localStorage.removeItem('selectedSession');
      }
    }, 500);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, [user]);

  useEffect(() => {
    if (!user || !userData || !currentSession) return;

    const loadedMessages = loadSessionMessages(currentSession, user.uid);
    setMessages(loadedMessages);

    if (loadedMessages.length === 0) {
      const initialMsg = sendInitialMessage(currentSession, userData);
      const updatedMessages = [initialMsg];
      setMessages(updatedMessages);
      saveSessionMessages(currentSession, user.uid, updatedMessages);
    }
  }, [user, userData, currentSession, loadSessionMessages, saveSessionMessages, sendInitialMessage]);

  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  useEffect(() => {
    const allAudioIds: string[] = [];
    const allVideoIds: string[] = [];
    messages.forEach(msg => {
      const parsed = parseMessage(msg.text);
      if (parsed.audioIds.length > 0) {
        allAudioIds.push(...parsed.audioIds);
      }
      if (parsed.videoIds.length > 0) {
        allVideoIds.push(...parsed.videoIds);
      }
    });
  }, [messages]);

  // Setup Speech Recognition
  useEffect(() => {
    if (typeof window !== 'undefined' && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US'; // Default to English for practice

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputValue(prev => prev + (prev ? ' ' : '') + transcript);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        setIsRecording(false);
      };

      recognitionRef.current.onend = () => {
        setIsRecording(false);
      };
    }
  }, []);

  const today = new Date().toISOString().split('T')[0];
  let currentInteractions = userData?.interactionsToday || 0;
  if (userData?.lastInteractionDate !== today) {
    currentInteractions = 0;
  }
  const isLimitReached = (userData?.plan === 'free' || userData?.plan === undefined) && currentInteractions >= 20;

  const toggleRecording = () => {
    if (isLimitReached) {
      setShowLimitModal(true);
      return;
    }
    try {
      if (isRecording) {
        recognitionRef.current?.stop();
        setIsRecording(false);
      } else {
        recognitionRef.current?.start();
        setIsRecording(true);
      }
    } catch (err) {
      console.error("Speech recognition error:", err);
      setIsRecording(false);
    }
  };

  const handleSendMessage = async (e?: React.FormEvent, directText?: string) => {
    e?.preventDefault();
    if (isLimitReached) {
      setShowLimitModal(true);
      return;
    }
    const textToSend = directText || inputValue;
    if (!textToSend.trim() || !user || !userData) return;

    const userText = textToSend;
    setInputValue('');
    
    const storageKey = getSessionStorageKey(currentSession, user.uid);
    const stored = localStorage.getItem(storageKey);
    const currentMessages: Message[] = stored ? JSON.parse(stored) : [];
    
    const newUserMessage: Message = {
      id: Date.now().toString(),
      text: userText,
      sender: 'user',
      timestamp: Date.now(),
    };
    currentMessages.push(newUserMessage);
    localStorage.setItem(storageKey, JSON.stringify(currentMessages));
    setMessages([...currentMessages]);

    setIsTyping(true);

    try {
      // Buscar áudios disponíveis do banco
      let availableAudios: any[] = [];
      try {
        const audiosResponse = await fetch('/api/audios?limit=20');
        if (audiosResponse.ok) {
          const audiosData = await audiosResponse.json();
          availableAudios = audiosData.audios || [];
        }
      } catch (e) {
        console.log('Error fetching audios:', e);
      }

      // Buscar vídeos disponíveis do banco
      let availableVideos: any[] = [];
      try {
        const videosResponse = await fetch('/api/video?limit=10');
        if (videosResponse.ok) {
          const videosData = await videosResponse.json();
          availableVideos = videosData.videos || [];
        }
      } catch (e) {
        console.log('Error fetching videos:', e);
      }

      // Criar contexto com lista de áudios disponíveis
      let audiosContext = '';
      if (availableAudios.length > 0) {
        audiosContext = `\n\nÁUDIOS DISPONÍVEIS NO BANCO DE DADOS:\n`;
        audiosContext += `Estes são os áudios que você pode usar para treinar a escuta do aluno.\n`;
        audiosContext += `Cada áudio tem: title (título) e text (transcrição).\n`;
        audiosContext += `IMPORTANTE: Ao enviar um áudio, EXPLORE-O COMPLETAMENTE antes de enviar outro! Continue no mesmo áudio com novas perguntas antes de trocar.\n`;
        audiosContext += `Lista de áudios disponíveis:\n`;
        availableAudios.forEach((audio: any) => {
          audiosContext += `- ID: ${audio.id} | Título: "${audio.title}" | Transcrição: "${audio.text}"\n`;
        });
      }

      // Criar contexto com lista de vídeos disponíveis
      let videosContext = '';
      if (availableVideos.length > 0) {
        videosContext = `\n\nVÍDEOS DISPONÍVEIS NO BANCO DE DADOS:\n`;
        videosContext += `Estes são os vídeos que você pode usar para complementar as aulas.\n`;
        videosContext += `Cada vídeo tem: title (título) e context_text (contexto).\n`;
        videosContext += `Para enviar um vídeo, use a tag [VIDEO:id].\n`;
        videosContext += `Lista de vídeos disponíveis:\n`;
        availableVideos.forEach((video: any) => {
          videosContext += `- ID: ${video.id} | Título: "${video.title}" | Contexto: "${video.context_text}"\n`;
        });
      }

      const history = messages.map(m => ({
        role: m.sender === 'ai' ? 'model' : 'user',
        parts: [{ text: m.text }]
      }));
      
      const rawContents = [...history, { role: 'user', parts: [{ text: userText }] }];
      const contents: { role: string; parts: { text: string }[] }[] = [];
      
      if (rawContents.length > 0 && rawContents[0].role === 'model') {
        contents.push({ role: 'user', parts: [{ text: 'Olá' }] });
      }
      
      for (const msg of rawContents) {
        if (contents.length === 0) {
          contents.push({ role: msg.role, parts: [...msg.parts] });
        } else {
          const lastMsg = contents[contents.length - 1];
          if (lastMsg.role === msg.role) {
            lastMsg.parts.push({ text: '\n\n' });
            lastMsg.parts.push(...msg.parts);
          } else {
            contents.push({ role: msg.role, parts: [...msg.parts] });
          }
        }
      }

      const practiceModeContext = practiceMode ? "\nMODO PRÁTICA ATIVO: O aluno quer praticar inglês. Use 80% inglês e 20% português. Responda confirmando que o modo prática foi ativado de forma entusiasmada!" : "";
      const audioSessionContext = audioLessonSession ? "\nSESSÃO DE PRÁTICA DE ESCUTA: O aluno quer praticar listening. Envie áudios e faça perguntas sobre o conteúdo. USE OS ÁUDIOS DO BANCO DE DADOS!" : "";
      const sessionName = currentSession === 'nivelamento' ? 'Teste de Nivelamento' : currentSession === 'audio' ? 'Prática de Escuta' : currentSession.replace('modulo_', 'Módulo ');
      const systemInstructionWithContext = SYSTEM_PROMPT + audiosContext + videosContext + `\n\nNome do aluno: ${userData?.displayName || 'Aluno'}. Nível do aluno: ${userData?.level || 'untested'}. Sessão atual: ${sessionName}. IMPORTANTE: Continue o conteúdo da sessão "${sessionName}" sem voltar ao nivelamento ou outras sessões. O aluno já está neste módulo e quer continuar aprendendo.` + practiceModeContext + audioSessionContext;

      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-id': user?.uid || ''
        },
        body: JSON.stringify({
          contents,
          config: {
            systemInstruction: systemInstructionWithContext,
          },
          userId: user?.uid,
        }),
        cache: 'no-store'
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const data = await response.json();
      const aiText = data.text;

      const newAiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: aiText,
        sender: 'ai',
        timestamp: Date.now(),
      };
      const updatedMessages = [...currentMessages, newAiMessage];
      localStorage.setItem(storageKey, JSON.stringify(updatedMessages));
      setMessages(updatedMessages);

    } catch (error) {
      console.error("Error generating AI response:", error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "Desculpe, ocorreu um erro ao processar sua mensagem. Tente novamente.",
        sender: 'ai',
        timestamp: Date.now(),
      };
      const errorMessages = [...currentMessages, errorMessage];
      localStorage.setItem(storageKey, JSON.stringify(errorMessages));
      setMessages(errorMessages);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <section id="chat" className="py-24 bg-slate-950 text-white relative overflow-hidden">
      <Modal 
        isOpen={showLimitModal} 
        onClose={() => setShowLimitModal(false)}
        title="Limite Atingido"
      >
        <p className="text-slate-300 mb-6">
          {userData?.plan === 'premium' 
            ? 'Você é um assinante Premium! Aproveite todas as vantagens.'
            : 'Você atingiu o limite de 20 interações diárias do plano gratuito. Faça o upgrade para o plano Premium para continuar praticando sem limites!'}
        </p>
        <div className="flex justify-end gap-3">
          <button 
            onClick={() => setShowLimitModal(false)}
            className="px-4 py-2 rounded-lg font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            Fechar
          </button>
          {userData?.plan !== 'premium' && (
            <button 
              onClick={async () => {
                try {
                  const res = await fetch('/api/checkout', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId: user?.uid || 'guest', email: user?.email || '' })
                  });
                  const data = await res.json();
                  if (data.url) window.location.href = data.url;
                } catch (e) {
                  console.error(e);
                  alert('Erro ao iniciar checkout.');
                }
              }}
              className="px-4 py-2 rounded-lg font-medium bg-emerald-600 hover:bg-emerald-500 text-white transition-colors"
            >
              Assinar Premium
            </button>
          )}
          {userData?.plan === 'premium' && (
            <button 
              disabled
              className="px-4 py-2 rounded-lg font-medium bg-emerald-600/50 text-white/70 cursor-not-allowed"
            >
              EU JÁ SOU PREMIUM
            </button>
          )}
        </div>
      </Modal>

      {/* Background glows */}
      <div className="absolute top-1/4 left-0 w-96 h-96 bg-emerald-600/10 rounded-full blur-[128px] pointer-events-none"></div>
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[128px] pointer-events-none"></div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="flex flex-col items-center">
          
          {/* Top Content */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 text-emerald-400 text-sm font-medium mb-6 border border-emerald-500/20">
              <Sparkles className="w-4 h-4" />
              Inteligência Artificial
            </div>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-6 leading-tight">
              Aprenda Inglês com o <span className="text-emerald-400">Professor Jato</span>
            </h2>
            <p className="text-slate-400 text-lg leading-relaxed mb-8 max-w-2xl mx-auto">
              Pratique situações reais do dia a dia com uma IA que entende o seu nível, corrige seus erros e te ajuda a ganhar fluência sem julgamentos.
            </p>
          </div>

          {/* Chat Interface */}
          <div className="relative w-full max-w-3xl">
            <div className={`absolute -inset-1 ${practiceMode ? 'bg-gradient-to-r from-amber-500 to-yellow-400' : audioLessonSession ? 'bg-gradient-to-r from-violet-500 to-purple-500' : 'bg-gradient-to-r from-emerald-500 to-indigo-500'} rounded-[2.5rem] blur opacity-20`}></div>
            
            <div className={`relative ${practiceMode ? 'bg-slate-900/95 border border-amber-500/30' : audioLessonSession ? 'bg-slate-900/95 border border-violet-500/30' : 'bg-slate-900 border border-slate-800'} rounded-[2rem] shadow-2xl flex flex-col h-[600px] overflow-hidden`}>
              {/* Chat Header */}
              <div className={`${practiceMode ? 'bg-amber-900/30 border-amber-500/30' : audioLessonSession ? 'bg-violet-900/30 border-violet-500/30' : 'bg-slate-800/50 border-slate-700/50'} backdrop-blur-md px-6 py-4 border-b flex items-center justify-between z-10`}>
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center shadow-lg">
                      <Bot className="w-6 h-6 text-white" />
                    </div>
                    <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-slate-900 rounded-full"></div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-white text-lg">Professor Jato</h3>
                    <p className={`${practiceMode ? 'text-amber-400' : audioLessonSession ? 'text-violet-400' : 'text-emerald-400'} text-sm flex items-center gap-1`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${practiceMode ? 'bg-amber-400' : audioLessonSession ? 'bg-violet-400' : 'bg-emerald-400'} animate-pulse`}></span>
                      {practiceMode ? (
                        <span className="font-bold text-amber-400">Modo Prática - 80% English</span>
                      ) : audioLessonSession ? (
                        <span className="font-bold text-violet-400">Prática de Escuta</span>
                      ) : currentSession === 'nivelamento' ? (
                        <span className="font-bold text-emerald-400">Teste de Nivelamento</span>
                      ) : (
                        <span className="font-bold text-emerald-400">{currentSession.replace('modulo_', 'Módulo ').replace('_', ' ')}</span>
                      )}
                    </p>
                  </div>
                </div>
                {userData && (
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="flex flex-col items-end">
                        <div className="flex items-center gap-2">
                          {userData.plan === 'premium' ? (
                            <span className="px-2 py-0.5 text-xs font-medium bg-gradient-to-r from-amber-500 to-yellow-400 text-amber-950 rounded-full flex items-center gap-1">
                              <Sparkles className="w-3 h-3" />
                              Premium
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 text-xs font-medium bg-slate-700 text-slate-300 rounded-full">
                              Free
                            </span>
                          )}
                          {!practiceMode && (
                            <>
                              <span className="text-xs text-slate-400 uppercase tracking-wider">Nível: {userData.level}</span>
                            </>
                          )}
                        </div>
                        {userData.plan === 'free' && (
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-slate-500">
                              ({20 - (userData.interactionsToday || 0)}/20)
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        if (!isLimitReached) {
                          setPracticeMode(!practiceMode);
                          if (!practiceMode) {
                            setInputValue('Quero praticar o meu inglês');
                            setTimeout(() => handleSendMessage(undefined, 'Quero praticar o meu inglês'), 50);
                          }
                        } else {
                          setShowLimitModal(true);
                        }
                      }}
                      disabled={isLimitReached}
                      className={`px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2 transition-all ${
                        practiceMode 
                          ? 'bg-emerald-600 text-white hover:bg-emerald-500' 
                          : 'bg-slate-800 text-slate-300 hover:bg-emerald-600/20 hover:text-emerald-400 border border-slate-700 hover:border-emerald-500/50'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      <Sparkles className="w-4 h-4" />
                      {practiceMode ? 'Modo Prática Ativo' : 'Quero praticar o meu inglês'}
                    </button>
                  </div>
                )}
              </div>

              {/* Chat Messages */}
              <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-slate-900/50">
                {!userData || (!audioLessonSession && !messages.length) ? (
                  <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
                    <Bot className="w-16 h-16 text-slate-600 mb-2" />
                    <h3 className="text-xl font-medium text-slate-300">Faça login para começar</h3>
                    <p className="text-slate-500 max-w-sm">
                      Conecte-se com sua conta do Google para salvar seu progresso e conversar com o Professor Jato.
                    </p>
                    <button 
                      onClick={signInWithGoogle}
                      className="mt-4 px-6 py-3 bg-white text-slate-900 font-medium rounded-full hover:bg-slate-100 transition-colors"
                    >
                      Entrar com Google
                    </button>
                  </div>
                ) : (
                  <>
                    {messages.map((msg, index) => {
                      const parsed = parseMessage(msg.text);
                      const isLastAiMessage = index === messages.length - 1 && msg.sender === 'ai';
                      
                      return (
                        <div key={msg.id} className="flex flex-col gap-4">
                          <div className={`flex gap-4 ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1 ${
                              msg.sender === 'ai' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-indigo-500/20 text-indigo-400'
                            }`}>
                              {msg.sender === 'ai' ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                            </div>
                            <div className={`max-w-[80%] p-4 rounded-2xl text-[15px] leading-relaxed ${
                              msg.sender === 'ai' 
                                ? 'bg-slate-800 border border-slate-700 text-slate-200 rounded-tl-sm' 
                                : 'bg-emerald-600 text-white rounded-tr-sm shadow-md'
                            }`}>
                              <div className="space-y-2">
                                <Markdown
                                  remarkPlugins={[remarkGfm]}
                                  rehypePlugins={[rehypeRaw]}
                                  components={{
                                    strong: ({ children }) => <strong className="text-emerald-400 font-bold">{children}</strong>,
                                    em: ({ children }) => <em className="text-yellow-400">{children}</em>,
                                  }}
                                >{parsed.content}</Markdown>
                                {parsed.audioIds.map(audioId => (
                                  <AudioPlayer key={audioId} audioId={audioId} />
                                ))}
                                {parsed.videoIds.map(videoId => (
                                  <VideoPlayer key={videoId} videoId={videoId} />
                                ))}
                                {isLastAiMessage && parsed.audioIds.length > 0 && !isTyping && (
                                  <button
                                    onClick={() => {
                                      if (isLimitReached) {
                                        setShowLimitModal(true);
                                        return;
                                      }
                                      setInputValue('Quero uma aula com esse áudio');
                                      setTimeout(() => handleSendMessage(undefined, 'Quero uma aula com esse áudio'), 50);
                                    }}
                                    disabled={isLimitReached}
                                    className="mt-3 px-4 py-2 bg-violet-600/20 hover:bg-violet-600/40 border border-violet-500/50 text-violet-300 hover:text-violet-200 text-sm rounded-full transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                  >
                                    <Headphones className="w-4 h-4" />
                                    Quero uma aula com esse áudio
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          {/* Render options if it's the last AI message */}
                          {isLastAiMessage && parsed.options.length > 0 && !isTyping && (
                            <div className="flex flex-wrap gap-2 ml-12 mt-2">
                              {parsed.options.map((opt, i) => (
                                <button
                                  key={i}
                                  onClick={() => {
                                    if (isLimitReached) {
                                      setShowLimitModal(true);
                                      return;
                                    }
                                    if (opt === 'Quero praticar o meu inglês') {
                                      setPracticeMode(true);
                                    }
                                    setInputValue(opt);
                                    // Small timeout to allow state update before sending
                                    setTimeout(() => handleSendMessage(undefined, opt), 50);
                                  }}
                                  disabled={isLimitReached}
                                  className="px-4 py-2 bg-slate-800 hover:bg-yellow-600/20 border border-slate-700 hover:border-yellow-500/50 text-slate-300 hover:text-yellow-400 text-sm rounded-full transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  {opt}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                    {isTyping && (
                      <div className="flex gap-4">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1 bg-emerald-500/20 text-emerald-400">
                          <Bot className="w-4 h-4" />
                        </div>
                        <div className="bg-slate-800 border border-slate-700 text-slate-200 rounded-2xl rounded-tl-sm p-4 flex items-center gap-1">
                          <span className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                          <span className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                          <span className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Chat Input */}
              {user && (
                <div className="p-4 bg-slate-800/50 backdrop-blur-md border-t border-slate-700/50">
                  <form onSubmit={handleSendMessage} className="relative flex items-center gap-2">
                    <button
                      type="button"
                      onClick={toggleRecording}
                      disabled={isLimitReached}
                      className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                        isRecording ? 'bg-red-500 hover:bg-red-600 animate-pulse' : 'bg-slate-700 hover:bg-slate-600'
                      }`}
                      title="Falar (Inglês)"
                    >
                      <Mic className={`w-5 h-5 ${isRecording ? 'text-white' : 'text-slate-300'}`} />
                    </button>
                    <div className="relative flex-1">
                      <input 
                        type="text" 
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        placeholder={isLimitReached ? "Limite diário atingido..." : "Digite sua mensagem..."}
                        disabled={isLimitReached}
                        className="w-full bg-slate-900 border border-slate-700 rounded-full py-3.5 pl-6 pr-14 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                      <button 
                        type="submit"
                        disabled={!inputValue.trim() || isTyping || isLimitReached}
                        className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center hover:bg-emerald-400 transition-colors disabled:opacity-50 disabled:hover:bg-emerald-500"
                      >
                        <Send className="w-4 h-4 text-white ml-0.5" />
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
