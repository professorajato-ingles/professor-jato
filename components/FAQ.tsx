import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Minus } from 'lucide-react';

const faqs = [
  {
    question: "Como funciona o método Ajato?",
    answer: "Nosso método foca na comunicação real. Em vez de decorar regras gramaticais, você aprende através de situações do dia a dia, diálogos práticos e repetição espaçada para fixação natural."
  },
  {
    question: "Preciso ter conhecimento prévio?",
    answer: "Não! Temos módulos que vão do zero absoluto até a fluência. O teste de nivelamento inicial ajuda a colocar você na trilha certa."
  },
  {
    question: "Quanto tempo por dia preciso estudar?",
    answer: "Recomendamos de 15 a 30 minutos diários. A consistência é mais importante que a intensidade. Nossas aulas são curtas e diretas ao ponto."
  },
  {
    question: "Terei suporte de professores?",
    answer: "Sim! Todos os alunos têm acesso à nossa comunidade e podem tirar dúvidas diretamente com nossos professores certificados."
  }
];

export const FAQ = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="py-24 bg-slate-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-slate-900 tracking-tight mb-4">Perguntas Frequentes</h2>
          <p className="text-slate-600">Tudo o que você precisa saber sobre a plataforma.</p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div 
              key={index}
              className="bg-white border border-slate-100 rounded-2xl overflow-hidden transition-all hover:border-slate-200 shadow-sm"
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full flex items-center justify-between p-6 text-left"
              >
                <span className="font-bold text-slate-900 text-lg">{faq.question}</span>
                <div className={`p-2 rounded-full transition-colors ${openIndex === index ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-50 text-slate-400'}`}>
                  {openIndex === index ? <Minus className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                </div>
              </button>
              <AnimatePresence>
                {openIndex === index && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="px-6 pb-6 text-slate-600 leading-relaxed">
                      {faq.answer}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
