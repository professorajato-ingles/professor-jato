'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, Bot, User, Mic } from 'lucide-react';
import { useAuth } from './AuthProvider';
import { collection, query, orderBy, onSnapshot, addDoc, getDocs, where, doc, updateDoc } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '@/lib/firestore-errors';
import { db } from '@/lib/firebase';
import { ai, SYSTEM_PROMPT } from '@/lib/ai';
import Markdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';

import { AudioPlayer } from './AudioPlayer';
import { VideoPlayer } from './VideoPlayer';
import { Modal } from './Modal';

interface Message {
  id: string;
  text: string;
  sender: 'ai' | 'user';
  timestamp: number;
}

interface AudioInfo {
  id: string;
  title: string;
  text: string;
}

interface VideoInfo {
  id: string;
  title: string;
  contextText: string;
}

const parseMessage = (text: string) => {
  if (!text) {
    return { content: '', options: [] };
  }
  const lines = text.split('\n');
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
    options
  };
};

const renderContentWithMedia = (content: string) => {
  // Split by both [AUDIO:id] and [VIDEO:id]
  const parts = content.split(/(\[AUDIO:[a-zA-Z0-9_-]+\]|\[VIDEO:[a-zA-Z0-9_-]+\])/g);
  return parts.map((part, index) => {
    if (part.startsWith('[AUDIO:') && part.endsWith(']')) {
      const audioId = part.replace('[AUDIO:', '').replace(']', '');
      return <AudioPlayer key={index} audioId={audioId} />;
    }
    if (part.startsWith('[VIDEO:') && part.endsWith(']')) {
      const videoId = part.replace('[VIDEO:', '').replace(']', '');
      return <VideoPlayer key={index} videoId={videoId} />;
    }
    return (
      <div key={index} className="markdown-body">
        <Markdown rehypePlugins={[rehypeRaw]}>{part}</Markdown>
      </div>
    );
  });
};

export const ChatSection = () => {
  const { user, userData, signInWithGoogle } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [moduleAudios, setModuleAudios] = useState<AudioInfo[]>([]);
  const [moduleVideos, setModuleVideos] = useState<VideoInfo[]>([]);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (!user || userData?.plan !== 'premium') {
      setModuleAudios([]);
      setModuleVideos([]);
      return;
    }

    const qAudios = query(collection(db, 'audios'));
    const unsubscribeAudios = onSnapshot(qAudios, (snapshot) => {
      const audios: AudioInfo[] = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        audios.push({
          id: doc.id,
          text: data.text,
          title: data.title
        });
      });
      setModuleAudios(audios);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'audios');
    });

    const qVideos = query(collection(db, 'videos'));
    const unsubscribeVideos = onSnapshot(qVideos, (snapshot) => {
      const videos: VideoInfo[] = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        videos.push({
          id: doc.id,
          contextText: data.contextText,
          title: data.title
        });
      });
      setModuleVideos(videos);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'videos');
    });

    return () => {
      unsubscribeAudios();
      unsubscribeVideos();
    };
  }, [user, userData?.plan]);

  const sendInitialMessage = React.useCallback(async (data: any) => {
    const welcomeText = `Olá, ${data.displayName}! Eu sou o Professor Jato. Vamos começar nossa jornada no inglês? Qual o seu nível atual?
[OPÇÃO] Sou Iniciante (Quero aprender do zero)
[OPÇÃO] Sou Intermediário (Já sei um pouco)
[OPÇÃO] Sou Avançado (Quero focar em fluência)
[OPÇÃO] Quero fazer um teste de nivelamento`;
    try {
      await addDoc(collection(db, 'users', user!.uid, 'chats'), {
        role: 'model',
        content: welcomeText,
        timestamp: Date.now(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `users/${user!.uid}/chats`);
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;

    const q = query(collection(db, 'users', user.uid, 'chats'), orderBy('timestamp', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const loadedMessages: Message[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        loadedMessages.push({
          id: doc.id,
          text: data.content,
          sender: data.role === 'model' ? 'ai' : 'user',
          timestamp: data.timestamp || Date.now(),
        });
      });
      setMessages(loadedMessages);
      
      // If no messages, send welcome message
      if (loadedMessages.length === 0 && userData) {
        sendInitialMessage(userData);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `users/${user.uid}/chats`);
    });

    return () => unsubscribe();
  }, [user, userData, sendInitialMessage]);

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
    
    // Save user message
    try {
      await addDoc(collection(db, 'users', user.uid, 'chats'), {
        role: 'user',
        content: userText,
        timestamp: Date.now(),
      });
      
      // Update interaction count
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        interactionsToday: currentInteractions + 1,
        lastInteractionDate: today
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `users/${user.uid}/chats`);
    }

    setIsTyping(true);

    try {
      // Build history for Gemini
      const history = messages.map(m => ({
        role: m.sender === 'ai' ? 'model' : 'user',
        parts: [{ text: m.text }]
      }));

      // Send history manually if needed, or just send the full context. 
      // Since ai.chats.create doesn't take history directly in the new SDK easily without multiple calls,
      // we can just use generateContent with the full history.
      
      const rawContents = [...history, { role: 'user', parts: [{ text: userText }] }];
      const contents: { role: string; parts: { text: string }[] }[] = [];
      
      // Ensure it starts with user
      if (rawContents.length > 0 && rawContents[0].role === 'model') {
        contents.push({ role: 'user', parts: [{ text: 'Olá' }] });
      }
      
      // Ensure alternating roles
      for (const msg of rawContents) {
        if (contents.length === 0) {
          contents.push({ role: msg.role, parts: [...msg.parts] });
        } else {
          const lastMsg = contents[contents.length - 1];
          if (lastMsg.role === msg.role) {
            // Combine parts if same role
            lastMsg.parts.push({ text: '\n\n' });
            lastMsg.parts.push(...msg.parts);
          } else {
            contents.push({ role: msg.role, parts: [...msg.parts] });
          }
        }
      }

      let systemInstructionWithContext = SYSTEM_PROMPT + `\n\nNome do aluno: ${userData?.displayName || 'Aluno'}. Nível do aluno: ${userData?.level || 'untested'}. Módulo atual: ${userData?.currentModule || '1.1'}.`;
      
      if (moduleAudios.length > 0) {
        systemInstructionWithContext += `\n\nÁUDIOS DISPONÍVEIS NO BANCO DE DADOS:\nVocê DEVE enviar áudios para o aluno ouvir sempre que for relevante para o aprendizado ou quando o aluno pedir. Para enviar um áudio, use EXATAMENTE a tag [AUDIO:id]. Exemplo: "Ouça esta frase: [AUDIO:123]".\nLista de áudios disponíveis:\n`;
        moduleAudios.forEach(audio => {
          systemInstructionWithContext += `- ID: ${audio.id} | Título: ${audio.title} | Transcrição: "${audio.text}"\n`;
        });
      }

      if (moduleVideos.length > 0) {
        systemInstructionWithContext += `\n\nVÍDEOS DO YOUTUBE DISPONÍVEIS:\nVocê DEVE recomendar trechos de vídeos do YouTube para complementar suas explicações sempre que o assunto do vídeo for relevante para a dúvida do aluno. Para enviar um vídeo, use EXATAMENTE a tag [VIDEO:id]. Exemplo: "Veja este trecho de vídeo para entender melhor: [VIDEO:123]".\nLista de vídeos disponíveis:\n`;
        moduleVideos.forEach(video => {
          systemInstructionWithContext += `- ID: ${video.id} | Título: ${video.title} | Contexto/Assunto: "${video.contextText}"\n`;
        });
      }

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: contents,
        config: {
          systemInstruction: systemInstructionWithContext,
        }
      });

      const aiText = response.text || "Desculpe, não entendi.";

      // Save AI message
      try {
        await addDoc(collection(db, 'users', user.uid, 'chats'), {
          role: 'model',
          content: aiText,
          timestamp: Date.now(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `users/${user.uid}/chats`);
      }

    } catch (error) {
      console.error("Error generating AI response:", error);
      await addDoc(collection(db, 'users', user.uid, 'chats'), {
        role: 'model',
        content: "Desculpe, ocorreu um erro ao processar sua mensagem. Tente novamente.",
        timestamp: Date.now(),
      });
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
        <p className="text-slate-300 mb-6">Você atingiu o limite de 20 interações diárias do plano gratuito. Faça o upgrade para o plano Premium para continuar praticando sem limites!</p>
        <div className="flex justify-end gap-3">
          <button 
            onClick={() => setShowLimitModal(false)}
            className="px-4 py-2 rounded-lg font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            Fechar
          </button>
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
            <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 to-indigo-500 rounded-[2.5rem] blur opacity-20"></div>
            
            <div className="relative bg-slate-900 border border-slate-800 rounded-[2rem] shadow-2xl flex flex-col h-[600px] overflow-hidden">
              {/* Chat Header */}
              <div className="bg-slate-800/50 backdrop-blur-md px-6 py-4 border-b border-slate-700/50 flex items-center justify-between z-10">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center shadow-lg">
                      <Bot className="w-6 h-6 text-white" />
                    </div>
                    <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-slate-900 rounded-full"></div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-white text-lg">Professor Jato</h3>
                    <p className="text-emerald-400 text-sm flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                      Tutor IA
                    </p>
                  </div>
                </div>
                {userData && (
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
                        <span className="text-xs text-slate-400 uppercase tracking-wider">Nível: {userData.level}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-sm font-medium text-emerald-400">XP: {userData.xp}</span>
                        {userData.plan === 'free' && (
                          <span className="text-xs text-slate-500">
                            ({20 - (userData.interactionsToday || 0)}/20)
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Chat Messages */}
              <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-slate-900/50">
                {!user ? (
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
                              <div className="markdown-body prose prose-invert max-w-none prose-p:leading-relaxed prose-pre:bg-slate-900 prose-pre:border prose-pre:border-slate-700 prose-strong:text-emerald-400">
                                {renderContentWithMedia(parsed.content)}
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
                                    setInputValue(opt);
                                    // Small timeout to allow state update before sending
                                    setTimeout(() => handleSendMessage(undefined, opt), 50);
                                  }}
                                  disabled={isLimitReached}
                                  className="px-4 py-2 bg-slate-800 hover:bg-emerald-600/20 border border-slate-700 hover:border-emerald-500/50 text-slate-300 hover:text-emerald-400 text-sm rounded-full transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed"
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
