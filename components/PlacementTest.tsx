import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ArrowRight, Check } from 'lucide-react';

const questions = [
  {
    question: "Como você traduziria 'Eu estou estudando inglês agora'?",
    options: [
      "I study English now",
      "I am studying English now",
      "I studying English now",
      "I am study English now"
    ],
    correct: 1
  },
  {
    question: "Qual frase está correta?",
    options: [
      "She don't like coffee",
      "She doesn't likes coffee",
      "She doesn't like coffee",
      "She not like coffee"
    ],
    correct: 2
  },
  {
    question: "Complete: 'If I had more time, I ___ travel more.'",
    options: [
      "will",
      "would",
      "can",
      "am"
    ],
    correct: 1
  }
];

export const PlacementTest = ({ onComplete, onClose }: { onComplete: (level: string, reason: string) => void, onClose: () => void }) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isFinished, setIsFinished] = useState(false);

  const handleNext = () => {
    if (selectedOption === questions[currentQuestion].correct) {
      setScore(score + 1);
    }

    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setSelectedOption(null);
    } else {
      setIsFinished(true);
    }
  };

  const handleFinish = () => {
    let level = 'Iniciante';
    if (score === 2) level = 'Básico';
    if (score === 3) level = 'Intermediário';
    
    onComplete(level, `Você acertou ${score} de ${questions.length} questões.`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-white rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden relative"
      >
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-8">
          {!isFinished ? (
            <>
              <div className="mb-8">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-sm font-bold text-emerald-600 uppercase tracking-wider">
                    Questão {currentQuestion + 1} de {questions.length}
                  </span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-emerald-500 h-full transition-all duration-300"
                    style={{ width: `${((currentQuestion) / questions.length) * 100}%` }}
                  ></div>
                </div>
              </div>

              <h3 className="text-2xl font-bold text-slate-900 mb-6">
                {questions[currentQuestion].question}
              </h3>

              <div className="space-y-3 mb-8">
                {questions[currentQuestion].options.map((option, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedOption(index)}
                    className={`w-full text-left p-4 rounded-2xl border-2 transition-all flex justify-between items-center ${
                      selectedOption === index 
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-900 font-medium' 
                        : 'border-slate-100 hover:border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {option}
                    {selectedOption === index && <Check className="w-5 h-5 text-emerald-500" />}
                  </button>
                ))}
              </div>

              <button
                onClick={handleNext}
                disabled={selectedOption === null}
                className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold text-lg hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {currentQuestion < questions.length - 1 ? 'Próxima Questão' : 'Ver Resultado'}
                <ArrowRight className="w-5 h-5" />
              </button>
            </>
          ) : (
            <div className="text-center py-8">
              <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Check className="w-10 h-10 text-emerald-600" />
              </div>
              <h3 className="text-3xl font-bold text-slate-900 mb-4">Teste Concluído!</h3>
              <p className="text-slate-600 mb-8">
                Analisamos suas respostas e preparamos uma trilha de aprendizado ideal para você.
              </p>
              <button
                onClick={handleFinish}
                className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-bold text-lg hover:bg-emerald-700 transition-colors"
              >
                Ver Meu Nível
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
