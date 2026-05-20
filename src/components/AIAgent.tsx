import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageCircle, Sparkles } from 'lucide-react';

interface AIAgentProps {
  metrics: {
    correctAnswers: number;
    wrongAnswers: number;
    averageTime: number;
    recentHistory: any[];
  };
  trigger: boolean;
}

export default function AIAgent({ metrics, trigger }: AIAgentProps) {
  const [feedback, setFeedback] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [visible, setVisible] = useState(false);

  const lastRequestTime = useRef<number>(0);
  const COOLDOWN_MS = 60000; // 1 minute cooldown

  useEffect(() => {
    // Only auto-trigger if enough answers are correct AND we aren't in cooldown
    if (metrics.correctAnswers > 0 && metrics.correctAnswers % 10 === 0) {
      if (Date.now() - lastRequestTime.current > COOLDOWN_MS) {
        fetchFeedback();
      }
    }
  }, [trigger]);

  const fetchFeedback = async () => {
    if (loading) return;
    
    setLoading(true);
    setVisible(true);
    lastRequestTime.current = Date.now();
    
    try {
      const response = await fetch("/api/ai/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(metrics),
      });
      const data = await response.json();
      setFeedback(data.feedback);
    } catch (error) {
      setFeedback("Keep going! You're doing great! 🐹✨");
    } finally {
      setLoading(false);
      // Hide after 6 seconds
      setTimeout(() => setVisible(false), 8000);
    }
  };

  return (
    <div className="fixed bottom-8 right-8 z-50 pointer-events-none">
      <AnimatePresence>
        {visible && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="flex items-end gap-4 pointer-events-auto"
          >
            <div className="relative mb-8">
               <div className="bg-slate-800/90 backdrop-blur-md p-5 rounded-2xl shadow-2xl border border-slate-700 max-w-[240px] relative agent-glow">
                  <div className="absolute -bottom-2 right-6 w-4 h-4 bg-slate-800/90 border-b border-r border-slate-700 rotate-45" />
                  {loading ? (
                    <div className="flex gap-1 justify-center py-2">
                      <motion.div animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1, 0.8] }} transition={{ repeat: Infinity, duration: 1 }} className="w-1.5 h-1.5 bg-sky-400 rounded-full" />
                      <motion.div animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1, 0.8] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-1.5 h-1.5 bg-sky-400 rounded-full" />
                      <motion.div animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1, 0.8] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-1.5 h-1.5 bg-sky-400 rounded-full" />
                    </div>
                  ) : (
                    <p className="text-sm font-bold text-slate-200 leading-relaxed italic">
                      "{feedback}"
                    </p>
                  )}
               </div>
            </div>

            <motion.div 
              animate={{ 
                y: [0, -10, 0],
                rotate: [0, 5, -5, 0]
              }}
              transition={{ repeat: Infinity, duration: 4 }}
              className="relative"
            >
              <div className="absolute -top-3 -right-3 bg-sky-500 p-2 rounded-lg shadow-lg z-10 border-2 border-slate-900">
                <Sparkles size={14} className="text-white" />
              </div>
              <div className="w-20 h-20 bg-slate-900 rounded-2xl shadow-2xl flex items-center justify-center border-2 border-slate-700 overflow-hidden relative">
                 <div className="absolute inset-0 bg-sky-500/10 animate-pulse" />
                 {/* Visual Bot Mascot */}
                 <div className="relative z-10 flex flex-col items-center">
                    <span className="text-3xl filter drop-shadow-md">🤖</span>
                    <span className="text-[9px] font-black text-sky-400 mt-1 uppercase tracking-widest">Alpha</span>
                 </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Subtle floating mascot trigger if hidden */}
      {!visible && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={() => {
            if (Date.now() - lastRequestTime.current < COOLDOWN_MS) {
              setFeedback("Professor Pip is thinking... Give me a moment! 🐹");
              setVisible(true);
              setTimeout(() => setVisible(false), 3000);
              return;
            }
            fetchFeedback();
          }}
          className="pointer-events-auto w-12 h-12 bg-white rounded-2xl shadow-lg border border-slate-100 flex items-center justify-center text-blue-500 hover:scale-110 transition-transform"
        >
          <MessageCircle size={20} />
        </motion.button>
      )}
    </div>
  );
}
