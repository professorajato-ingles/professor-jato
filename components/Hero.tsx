import React from 'react';
import { motion } from 'motion/react';
import { Play, ArrowRight, CircleCheck, Star } from 'lucide-react';
import Image from 'next/image';

export const Hero = ({ onStartAssessment }: { onStartAssessment: () => void }) => {
  return (
    <section className="pt-32 pb-20 md:pt-40 md:pb-28 overflow-hidden relative">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-emerald-100/40 via-white to-white"></div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-2xl"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-sm font-medium mb-6 border border-emerald-100">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              Novo método focado em brasileiros
            </div>
            <h1 className="text-5xl md:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.1] mb-6">
              Aprenda inglês <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-500">sem enrolação</span> e chegue à fluência.
            </h1>
            <p className="text-lg md:text-xl text-slate-600 mb-8 leading-relaxed">
              Esqueça o verbo to be por 5 anos. Nossa metodologia foca no que você realmente precisa para viajar, trabalhar e se comunicar no mundo real.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 mb-10">
              <button 
                onClick={onStartAssessment}
                className="bg-emerald-600 text-white px-8 py-4 rounded-full text-lg font-bold hover:bg-emerald-700 transition-all shadow-lg hover:shadow-emerald-600/25 flex items-center justify-center gap-2 group"
              >
                Fazer Teste de Nível
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              <button className="bg-white text-slate-700 border border-slate-200 px-8 py-4 rounded-full text-lg font-bold hover:bg-slate-50 transition-all flex items-center justify-center gap-2">
                <Play className="w-5 h-5 text-emerald-600" />
                Ver como funciona
              </button>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 sm:gap-8 text-sm text-slate-500 font-medium">
              <div className="flex items-center gap-2">
                <CircleCheck className="w-4 h-4 text-emerald-500" />
                Acesso 24h por dia
              </div>
              <div className="flex items-center gap-2">
                <CircleCheck className="w-4 h-4 text-emerald-500" />
                Suporte de professores
              </div>
              <div className="flex items-center gap-2">
                <CircleCheck className="w-4 h-4 text-emerald-500" />
                Garantia de 7 dias
              </div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="relative lg:h-[600px] flex items-center justify-center lg:justify-end"
          >
            <div className="absolute inset-0 bg-gradient-to-tr from-emerald-100 to-teal-50 rounded-[3rem] transform rotate-3 scale-105 -z-10"></div>
            <div className="bg-white p-2 rounded-[2.5rem] shadow-2xl border border-slate-100 w-full max-w-md relative overflow-hidden">
              <div className="aspect-[4/5] bg-slate-100 rounded-[2rem] overflow-hidden relative">
                <Image 
                  src="https://picsum.photos/seed/learning/800/1000" 
                  alt="Estudante aprendendo inglês" 
                  fill
                  className="object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex flex-col justify-end p-8">
                  <div className="bg-white/20 backdrop-blur-md border border-white/30 p-4 rounded-2xl text-white">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center">
                        <Play className="w-5 h-5 fill-white" />
                      </div>
                      <div>
                        <p className="font-bold text-sm">Aula 1: Apresentações</p>
                        <p className="text-xs text-white/80">Módulo Iniciante</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Floating elements */}
              <div className="absolute top-12 -left-6 bg-white p-3 rounded-2xl shadow-xl border border-slate-100 flex items-center gap-3 animate-bounce" style={{ animationDuration: '3s' }}>
                <div className="bg-amber-100 p-2 rounded-xl">
                  <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-medium">Sua pontuação</p>
                  <p className="text-sm font-bold text-slate-900">+50 XP hoje</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
