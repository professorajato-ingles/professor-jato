import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Star } from 'lucide-react';

export const Preloader = () => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="fixed inset-0 z-[100] bg-white flex items-center justify-center"
        >
          <motion.div
            animate={{ 
              scale: [1, 1.2, 1],
              rotate: [0, 180, 360]
            }}
            transition={{ 
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="bg-emerald-500 p-4 rounded-2xl"
          >
            <Star className="w-8 h-8 text-white fill-white" />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
