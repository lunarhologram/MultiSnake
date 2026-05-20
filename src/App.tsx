/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { LayoutDashboard, GraduationCap, Github } from 'lucide-react';
import SnakeGame from './components/SnakeGame';
import AIAgent from './components/AIAgent';
import AIPerformanceDashboard from './components/AIPerformanceDashboard';
import ProfileView from './components/ProfileView';
import { AuthProvider, useAuth } from './components/FirebaseProvider';
import type { Metric } from './types';

function GameContainer() {
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [showDashboard, setShowDashboard] = useState(false);
  const [agentTrigger, setAgentTrigger] = useState(false);
  const { user, profile, updateScore } = useAuth();

  const handleAnswer = useCallback((correct: boolean, question: string, time: number) => {
    setMetrics(prev => [...prev, { correct, question, time }]);
    setAgentTrigger(t => !t);
  }, []);

  const handleGameOver = useCallback(async (finalScore: number) => {
    if (user) {
      await updateScore(finalScore);
    }
  }, [user, updateScore]);

  const aiMetrics = {
    correctAnswers: metrics.filter(m => m.correct).length,
    wrongAnswers: metrics.filter(m => !m.correct).length,
    averageTime: metrics.length > 0 
      ? metrics.reduce((acc, m) => acc + m.time, 0) / metrics.length 
      : 0,
    recentHistory: metrics.slice(-5),
    studentName: profile?.displayName || 'Student'
  };

  return (
    <div className="min-h-screen bg-[#0F172A] text-slate-100 font-sans selection:bg-indigo-500/30">
      {/* Subtle Grid Background */}
      <div className="fixed inset-0 pointer-events-none opacity-20 game-grid" />

      <nav className="relative z-10 flex items-center justify-between px-8 py-6 max-w-7xl mx-auto border-b border-slate-800/50 bg-slate-900/20 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-500 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <GraduationCap className="text-white" size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              MultiSnake <span className="text-slate-500 font-normal">v2.0</span>
            </h1>
            <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em]">Primary Math Engine</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <ProfileView />
          <button 
            onClick={() => setShowDashboard(true)}
            className="flex items-center gap-2 px-6 py-2.5 bg-slate-800/80 rounded-xl border border-slate-700 hover:border-indigo-500 hover:bg-slate-800 transition-all font-bold text-xs text-slate-300 group"
          >
            <LayoutDashboard size={16} className="text-indigo-400 group-hover:rotate-12 transition-transform" />
            VITAL LOGS
          </button>
        </div>
      </nav>

      <main className="relative z-10 max-w-7xl mx-auto px-4 pb-20">
        <div className="flex flex-col items-center justify-center min-h-[70vh]">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full"
          >
            <SnakeGame onAnswer={handleAnswer} onGameOver={handleGameOver} />
          </motion.div>
        </div>
      </main>

      {/* Floating UI Elements */}
      <AIAgent metrics={aiMetrics} trigger={agentTrigger} />
      
      <AnimatePresence>
        {showDashboard && (
          <AIPerformanceDashboard 
            metrics={metrics} 
            onClose={() => setShowDashboard(false)} 
          />
        )}
      </AnimatePresence>

      <footer className="relative z-10 bottom-0 w-full text-center py-6 border-t border-slate-800/50 bg-slate-900/40">
        <div className="flex items-center justify-center gap-8 text-slate-500">
           <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
              <span className="text-[10px] font-bold uppercase tracking-widest">Neural Link Active</span>
           </div>
           <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-600">{user ? `Scholar: ${profile?.displayName}` : 'Guest Session'}</span>
           </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <GameContainer />
    </AuthProvider>
  );
}
