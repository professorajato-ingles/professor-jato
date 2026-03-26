'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { Hero } from '@/components/Hero';
import { Preloader } from '@/components/Preloader';
import { PlacementTest } from '@/components/PlacementTest';
import { FAQ } from '@/components/FAQ';
import { ChatSection } from '@/components/ChatSection';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { useAuth } from '@/components/AuthProvider';
import { motion } from 'motion/react';
import { BookOpen, CircleCheck, Star, Play, ChevronRight, Briefcase, Globe, Heart, GraduationCap, Type, Zap, CircleHelp, Mic, Link as LinkIcon, X, MessageCircle, Target, BarChart3, Bot, Instagram, Youtube, Linkedin } from 'lucide-react';

const LessonCard = ({ title, level, duration, description, icon: Icon, isRecommended, sessionId }: any) => (
  <motion.div 
    whileHover={{ y: -5 }}
    onClick={() => {
      if (sessionId) {
        localStorage.setItem('selectedSession', sessionId);
      }
      document.getElementById('chat')?.scrollIntoView({ behavior: 'smooth' });
    }}
    className={`p-6 rounded-3xl border shadow-sm hover:shadow-xl transition-all group cursor-pointer relative ${
      isRecommended ? 'bg-emerald-50/50 border-emerald-200' : 'bg-white border-slate-100'
    }`}
  >
    {isRecommended && (
      <div className="absolute -top-3 left-6 bg-emerald-600 text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-lg flex items-center gap-1">
        <Star className="w-3 h-3 fill-white" /> RECOMENDADO PARA VOCÊ
      </div>
    )}
    <div className="flex justify-between items-start mb-4">
      <div className="bg-emerald-50 p-3 rounded-2xl group-hover:bg-emerald-600 transition-colors">
        <Icon className="w-6 h-6 text-emerald-600 group-hover:text-white transition-colors" />
      </div>
      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full bg-slate-100 text-slate-500">
        {level}
      </span>
    </div>
    <h3 className="text-xl font-bold text-slate-900 mb-2">{title}</h3>
    <p className="text-sm text-slate-500 mb-4 line-clamp-2">{description}</p>
    <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-50">
      <div className="flex items-center gap-1 text-xs font-medium text-slate-400">
        <Play className="w-3 h-3" />
        {duration}
      </div>
      <ChevronRight className="w-4 h-4 text-emerald-600 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
    </div>
  </motion.div>
);

export default function Home() {
  const { user, userData } = useAuth();
  const [showAssessment, setShowAssessment] = useState(false);
  const [userLevel, setUserLevel] = useState<string | null>(null);

  const handleStartPlacement = () => {
    localStorage.setItem('selectedSession', 'nivelamento');
    const chatElement = document.getElementById('chat');
    if (chatElement) {
      chatElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleAssessmentComplete = (level: string, reason: string) => {
    setUserLevel(level);
    setShowAssessment(false);
    // Aqui poderíamos salvar no localStorage ou banco de dados
    const element = document.getElementById('licoes');
    if (element) element.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <main id="top" className="min-h-screen bg-white">
      <Preloader />
      <Navbar />
      <Hero onStartAssessment={handleStartPlacement} />

      {showAssessment && (
        <PlacementTest 
          onComplete={handleAssessmentComplete} 
          onClose={() => setShowAssessment(false)} 
        />
      )}

      {/* Social Proof / Stats */}
      <section className="py-12 border-y border-slate-100 bg-slate-50/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap justify-center gap-12 md:gap-24 items-center opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
            <div className="flex items-center gap-2 font-bold text-xl tracking-tighter">
              <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
              <span>4.9/5 Avaliação</span>
            </div>
            <div className="flex items-center gap-2 font-bold text-xl tracking-tighter">
              <CircleCheck className="w-5 h-5 text-emerald-500" />
              <span>+10k Alunos</span>
            </div>
            <div className="flex items-center gap-2 font-bold text-xl tracking-tighter">
              <BookOpen className="w-5 h-5 text-indigo-500" />
              <span>50+ Módulos</span>
            </div>
          </div>
        </div>
      </section>

      {/* Lessons Section */}
      <section id="licoes" className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-16">
            <div className="max-w-xl">
              <h2 className="text-4xl font-bold text-slate-900 tracking-tight mb-4">Módulos de Aprendizado</h2>
              <p className="text-slate-600">Caminhos estruturados para você sair do zero e chegar à fluência com foco em situações reais.</p>
            </div>
            <Link href="#modulos" className="text-emerald-600 font-bold text-sm flex items-center gap-2 hover:gap-3 transition-all">
              Ver todos os módulos <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <LessonCard 
              title="Módulo 1: Primeiros Passos" 
              level="Iniciante" 
              duration="2h" 
              description="Verbo To Be, cumprimentos, pronomes, números e vocabulário de sobrevivência."
              icon={Play}
              isRecommended={userLevel === 'Iniciante'}
              sessionId="modulo_1"
            />
            <LessonCard 
              title="Módulo 2: Rotina e Ações" 
              level="Iniciante" 
              duration="3h" 
              description="Present Simple, verbos de ação mais comuns, descrevendo o dia a dia e horas."
              icon={Zap}
              isRecommended={userLevel === 'Iniciante'}
              sessionId="modulo_2"
            />
            <LessonCard 
              title="Módulo 3: Descrevendo o Mundo" 
              level="Iniciante" 
              duration="3h" 
              description="Adjetivos, preposições de lugar e tempo, vocabulário de casa, família e cidade."
              icon={Globe}
              isRecommended={userLevel === 'Iniciante'}
              sessionId="modulo_3"
            />
            <LessonCard 
              title="Módulo 4: Passado e Histórias" 
              level="Pré-Intermediário" 
              duration="4h" 
              description="Past Simple, verbos regulares e irregulares, como contar o que aconteceu ontem."
              icon={BookOpen}
              isRecommended={userLevel === 'Básico'}
              sessionId="modulo_4"
            />
            <LessonCard 
              title="Módulo 5: Planos e Futuro" 
              level="Pré-Intermediário" 
              duration="3h" 
              description="Will, Going to, fazendo previsões e planejando viagens."
              icon={CircleHelp}
              isRecommended={userLevel === 'Básico'}
              sessionId="modulo_5"
            />
            <LessonCard 
              title="Módulo 6: Perguntas Poderosas" 
              level="Pré-Intermediário" 
              duration="3h" 
              description="Como formular perguntas complexas (Wh- questions), diálogos práticos."
              icon={Type}
              isRecommended={userLevel === 'Básico'}
              sessionId="modulo_6"
            />
            <LessonCard 
              title="Módulo 7: Experiências de Vida" 
              level="Intermediário" 
              duration="4h" 
              description="Present Perfect (o grande divisor de águas), comparando passado com o presente."
              icon={LinkIcon}
              isRecommended={userLevel === 'Intermediário'}
              sessionId="modulo_7"
            />
            <LessonCard 
              title="Módulo 8: Conectivos e Frases" 
              level="Intermediário" 
              duration="3h" 
              description="Juntando ideias, argumentação básica, expressando opiniões e concordância."
              icon={LinkIcon}
              isRecommended={userLevel === 'Intermediário'}
              sessionId="modulo_8"
            />
            <LessonCard 
              title="Módulo 9: Situações Reais" 
              level="Intermediário" 
              duration="4h" 
              description="Viagens, imigração, emergências, resolução de problemas e conversas telefônicas."
              icon={Globe}
              isRecommended={userLevel === 'Intermediário'}
              sessionId="modulo_9"
            />
            <LessonCard 
              title="Módulo 10: Phrasal Verbs" 
              level="Avançado" 
              duration="5h" 
              description="O inglês falado na rua, gírias e vocabulário nativo."
              icon={Zap}
              isRecommended={userLevel === 'Avançado'}
              sessionId="modulo_10"
            />
            <LessonCard 
              title="Módulo 11: Inglês Profissional" 
              level="Avançado" 
              duration="4h" 
              description="Entrevistas de emprego, reuniões, e-mails corporativos e argumentação avançada."
              icon={BookOpen}
              isRecommended={userLevel === 'Avançado'}
              sessionId="modulo_11"
            />
            <LessonCard 
              title="Módulo 12: Pronúncia Perfeita" 
              level="Avançado" 
              duration="5h" 
              description="Connected speech, ritmo, entonação e compreensão de nativos falando rápido."
              icon={GraduationCap}
              isRecommended={userLevel === 'Avançado'}
              sessionId="modulo_12"
            />
          </div>
        </div>
      </section>

      {/* Method Section */}
      <section id="metodo" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-100 text-emerald-700 text-sm font-medium mb-6">
              <Zap className="w-4 h-4" />
              Nossa Metodologia
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 tracking-tight mb-4">
              Aprenda inglês <span className="text-emerald-600">falando</span>, não decorando
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              O Professor Jato usa inteligência artificial para criar conversas personalizadas que simulam a vida real. Sem gramática chata, sem decoreba.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <motion.div 
              whileHover={{ y: -5 }}
              className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-3xl p-8 border border-emerald-100"
            >
              <div className="w-14 h-14 bg-emerald-600 rounded-2xl flex items-center justify-center mb-6">
                <MessageCircle className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Conversa Real</h3>
              <p className="text-slate-600">
                Pratique diálogos do dia a dia com uma IA que entende seu nível. Viajando, pedindo comida, fazendo entrevista - tudo como na vida real.
              </p>
            </motion.div>

            <motion.div 
              whileHover={{ y: -5 }}
              className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-3xl p-8 border border-amber-100"
            >
              <div className="w-14 h-14 bg-amber-500 rounded-2xl flex items-center justify-center mb-6">
                <Target className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Adaptado ao Seu Nível</h3>
              <p className="text-slate-600">
                Começa do básico se você é iniciante. Avança quando estiver pronto. O ritmo é seu, sem pressão, sem vergonha de errar.
              </p>
            </motion.div>

            <motion.div 
              whileHover={{ y: -5 }}
              className="bg-gradient-to-br from-violet-50 to-purple-50 rounded-3xl p-8 border border-violet-100"
            >
              <div className="w-14 h-14 bg-violet-600 rounded-2xl flex items-center justify-center mb-6">
                <BarChart3 className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Gamificação</h3>
              <p className="text-slate-600">
                Ganhe XP, suba de nível, desbloqueie novas lições. Aprenda se divertindo, não estudando como se fosse prova.
              </p>
            </motion.div>
          </div>

          <div className="mt-16 bg-slate-900 rounded-3xl p-8 md:p-12">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h3 className="text-2xl md:text-3xl font-bold text-white mb-4">
                  Por que funciona melhor que curso tradicional?
                </h3>
                <ul className="space-y-4">
                  <li className="flex items-start gap-3 text-slate-300">
                    <CircleCheck className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <span>Você fala desde o primeiro dia, não só ouve</span>
                  </li>
                  <li className="flex items-start gap-3 text-slate-300">
                    <CircleCheck className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <span>IA corrige seus erros em tempo real</span>
                  </li>
                  <li className="flex items-start gap-3 text-slate-300">
                    <CircleCheck className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <span>Acesso 24/7, estude quando e onde quiser</span>
                  </li>
                  <li className="flex items-start gap-3 text-slate-300">
                    <CircleCheck className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <span>100x mais prática que sala de aula</span>
                  </li>
                </ul>
              </div>
              <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center">
                    <Bot className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-white font-medium">Professor Jato</p>
                    <p className="text-slate-400 text-sm">Tutor IA</p>
                  </div>
                </div>
                <div className="bg-slate-800 rounded-xl p-4 text-slate-300 text-sm mb-4">
                  "Vamos practicar? Me conta sobre sua última viagem. Use o passado!"
                </div>
                <div className="flex justify-end">
                  <div className="bg-emerald-600 rounded-xl p-4 text-white text-sm max-w-[80%]">
                    Hi! Last summer I went to Orlando. It was amazing! I visited Disney World and...
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <ErrorBoundary>
        <Suspense fallback={<div className="p-8 text-center text-slate-400">Carregando...</div>}>
          <ChatSection />
        </Suspense>
      </ErrorBoundary>

      {/* Pricing Section */}
      <section id="precos" className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-900 tracking-tight mb-4">Planos Simples e Transparentes</h2>
            <p className="text-slate-600 max-w-2xl mx-auto">Comece de graça e faça o upgrade quando estiver pronto para acelerar seu aprendizado.</p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto items-stretch">
            {/* Free Plan */}
            <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm flex flex-col h-full">
              <h3 className="text-2xl font-bold text-slate-900 mb-2">Plano Gratuito</h3>
              <div className="text-4xl font-bold text-slate-900 mb-6">R$ 0<span className="text-lg text-slate-500 font-normal">/mês</span></div>
              <ul className="space-y-4 mb-8 flex-1">
                <li className="flex items-center gap-3 text-slate-600">
                  <CircleCheck className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                  <span>Acesso ao chat com a IA</span>
                </li>
                <li className="flex items-center gap-3 text-slate-600">
                  <CircleCheck className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                  <span>Limite de 20 interações por dia</span>
                </li>
                <li className="flex items-center gap-3 text-slate-400">
                  <X className="w-5 h-5 text-slate-300 flex-shrink-0" />
                  <span>Sem acesso a lições em áudio</span>
                </li>
                <li className="flex items-center gap-3 text-slate-400">
                  <X className="w-5 h-5 text-slate-300 flex-shrink-0" />
                  <span>Sem acesso a vídeos explicativos</span>
                </li>
              </ul>
              <button 
                onClick={() => document.getElementById('chat')?.scrollIntoView({ behavior: 'smooth' })}
                className="w-full py-3 px-6 rounded-xl font-bold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 transition-colors"
              >
                Começar Grátis
              </button>
            </div>

            {/* Premium Plan */}
            <div className="bg-slate-900 rounded-3xl p-8 border border-slate-800 shadow-xl relative flex flex-col h-full pt-8">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-500 text-white text-xs font-bold uppercase tracking-wider py-1 px-3 rounded-full">
                Mais Popular
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Plano Premium</h3>
              <div className="text-4xl font-bold text-white mb-6">R$ 9,90<span className="text-lg text-slate-400 font-normal">/mês</span></div>
              <ul className="space-y-4 mb-8 flex-1">
                <li className="flex items-center gap-3 text-slate-300">
                  <CircleCheck className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                  <span>Interações ilimitadas com a IA</span>
                </li>
                <li className="flex items-center gap-3 text-slate-300">
                  <CircleCheck className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                  <span>Acesso total a todas as lições em áudio</span>
                </li>
                <li className="flex items-center gap-3 text-slate-300">
                  <CircleCheck className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                  <span>Acesso total a vídeos explicativos</span>
                </li>
                <li className="flex items-center gap-3 text-slate-300">
                  <CircleCheck className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                  <span>Suporte prioritário</span>
                </li>
              </ul>
              {userData?.plan !== 'premium' ? (
                <button 
                  onClick={async () => {
                    if (!user) {
                      alert('Faça login primeiro para assinar o plano Premium.');
                      return;
                    }
                    try {
                      const res = await fetch('/api/checkout', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ userId: user.uid, email: user.email })
                      });
                      const data = await res.json();
                      console.log('Checkout response:', data);
                      if (data.url) {
                        window.location.href = data.url;
                      } else if (data.error) {
                        alert('Erro: ' + data.error);
                      }
                    } catch (e) {
                      console.error(e);
                      alert('Erro ao iniciar checkout.');
                    }
                  }}
                  className="w-full py-3 px-6 rounded-xl font-bold text-slate-900 bg-emerald-400 hover:bg-emerald-300 transition-colors shadow-[0_0_20px_rgba(52,211,153,0.3)]"
                >
                  Assinar Premium
                </button>
              ) : (
                <button 
                  disabled
                  className="w-full py-3 px-6 rounded-xl font-bold text-white/70 bg-emerald-400/50 cursor-not-allowed"
                >
                  EU JÁ SOU PREMIUM
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      <FAQ />

      {/* Footer */}
      <footer id="precos" className="bg-slate-900 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center gap-2 mb-6">
                <div className="bg-emerald-500 p-2 rounded-xl">
                  <Star className="w-5 h-5 text-white" />
                </div>
                <span className="text-2xl font-bold tracking-tight">
                  Professor <span className="text-emerald-400">Jato</span>
                </span>
              </div>
              <p className="text-slate-400 max-w-sm leading-relaxed">
                Nossa missão é democratizar o ensino de inglês de alta qualidade para brasileiros, usando tecnologia de ponta para acelerar o aprendizado.
              </p>
            </div>
            <div>
              <h4 className="font-bold mb-6">Plataforma</h4>
              <ul className="space-y-4 text-slate-400 text-sm">
                <li><Link href="#metodo" className="hover:text-emerald-400 transition-colors">Como Funciona (Método)</Link></li>
                <li><Link href="#modulos" className="hover:text-emerald-400 transition-colors">Módulos</Link></li>
                <li><Link href="#precos" className="hover:text-emerald-400 transition-colors">Planos e Preços</Link></li>
                <li><a href="#faq" className="hover:text-emerald-400 transition-colors">FAQ</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-6">Legal</h4>
              <ul className="space-y-4 text-slate-400 text-sm">
                <li><Link href="/privacidade" className="hover:text-emerald-400 transition-colors">Privacidade</Link></li>
                <li><Link href="/termos" className="hover:text-emerald-400 transition-colors">Termos de Uso</Link></li>
                <li><a href="#" className="hover:text-emerald-400 transition-colors">Cookies</a></li>
              </ul>
            </div>
          </div>
            <div className="pt-8 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4 text-slate-500 text-xs">
            <p>© 2026 Professor Jato. Todos os direitos reservados.</p>
            <div className="flex gap-6">
              <a href="#" className="hover:text-white transition-colors"><Instagram className="w-5 h-5" /></a>
              <a href="#" className="hover:text-white transition-colors"><Youtube className="w-5 h-5" /></a>
              <a href="#" className="hover:text-white transition-colors"><Linkedin className="w-5 h-5" /></a>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
