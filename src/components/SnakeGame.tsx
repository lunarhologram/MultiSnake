import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Play, RotateCcw, Pause, Volume2, VolumeX, Brain, Heart } from 'lucide-react';
import confetti from 'canvas-confetti';
import { cn } from '../lib/utils';
import type { GameState, Metric } from '../types';

const GRID_SIZE = 20;
const INITIAL_SPEED = 280;
const MIN_SPEED = 120;
const SPEED_INCREMENT = 1.5;

export default function SnakeGame({ onAnswer, onGameOver }: { onAnswer: (correct: boolean, question: string, time: number) => void, onGameOver: (score: number) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [shake, setShake] = useState(false);
  const [state, setState] = useState<GameState & { streak: number }>({
    snake: [{ x: 10, y: 10 }, { x: 10, y: 11 }, { x: 10, y: 12 }],
    food: [],
    direction: { x: 0, y: -1 },
    score: 0,
    lives: 2,
    gameOver: false,
    question: null,
    speed: INITIAL_SPEED,
    isPlaying: false,
    streak: 0,
  });

  const [soundEnabled, setSoundEnabled] = useState(true);
  const lastUpdate = useRef<number>(0);
  const questionStartTime = useRef<number>(Date.now());
  const pendingDirection = useRef<{ x: number; y: number }>({ x: 0, y: -1 });

  const lastProcessedDirection = useRef<{ x: number; y: number }>({ x: 0, y: -1 });
  const hasReportedGameOver = useRef<boolean>(false);

  const generateQuestion = useCallback(() => {
    const a = Math.floor(Math.random() * 10) + 1;
    const b = Math.floor(Math.random() * 10) + 1;
    const answer = a * b;
    
    // Generate 3 random wrong answers
    const wrongAnswers = new Set<number>();
    while (wrongAnswers.size < 3) {
      const wrong = Math.max(1, answer + (Math.floor(Math.random() * 21) - 10));
      if (wrong !== answer) wrongAnswers.add(wrong);
    }

    const allOptions = [answer, ...Array.from(wrongAnswers)];
    const shuffled = allOptions.sort(() => Math.random() - 0.5);

    // Place options as "food"
    const newFood = shuffled.map((val) => {
      let pos;
      do {
        pos = {
          x: Math.floor(Math.random() * GRID_SIZE),
          y: Math.floor(Math.random() * GRID_SIZE),
        };
      } while (state.snake.some(s => s.x === pos.x && s.y === pos.y));
      return { ...pos, value: val };
    });

    questionStartTime.current = Date.now();
    return { a, b, answer, food: newFood };
  }, [state.snake]);

  const resetGame = () => {
    const q = generateQuestion();
    setState({
      snake: [{ x: 10, y: 10 }, { x: 10, y: 11 }, { x: 10, y: 12 }],
      food: q.food,
      direction: { x: 0, y: -1 },
      score: 0,
      lives: 2,
      gameOver: false,
      question: { a: q.a, b: q.b, answer: q.answer },
      speed: INITIAL_SPEED,
      isPlaying: true,
      streak: 0,
    });
    hasReportedGameOver.current = false;
    pendingDirection.current = { x: 0, y: -1 };
    lastProcessedDirection.current = { x: 0, y: -1 };
  };

  const endGame = () => {
    setState(s => ({ ...s, gameOver: true, isPlaying: false }));
    if (soundEnabled) {
      // Add sound effect logic if needed
    }
  };

  const gameStep = useCallback((timestamp: number) => {
    if (!state.isPlaying || state.gameOver) return;

    if (timestamp - lastUpdate.current < state.speed) {
      requestAnimationFrame(gameStep);
      return;
    }
    lastUpdate.current = timestamp;

    setState(prev => {
      const newHead = {
        x: prev.snake[0].x + pendingDirection.current.x,
        y: prev.snake[0].y + pendingDirection.current.y,
      };

      lastProcessedDirection.current = pendingDirection.current;

      // Wall collision
      if (newHead.x < 0 || newHead.x >= GRID_SIZE || newHead.y < 0 || newHead.y >= GRID_SIZE) {
        return { ...prev, gameOver: true, isPlaying: false };
      }

      // Self collision
      if (prev.snake.some(s => s.x === newHead.x && s.y === newHead.y)) {
        return { ...prev, gameOver: true, isPlaying: false };
      }

      const newSnake = [newHead, ...prev.snake];
      const eatenFoodIndex = prev.food.findIndex(f => f.x === newHead.x && f.y === newHead.y);

      if (eatenFoodIndex !== -1) {
        const eatenValue = prev.food[eatenFoodIndex].value;
        const isCorrect = eatenValue === prev.question?.answer;
        const timeTaken = (Date.now() - questionStartTime.current) / 1000;
        
        onAnswer(isCorrect, `${prev.question?.a} x ${prev.question?.b}`, timeTaken);

        if (isCorrect) {
          confetti({
            particleCount: 60,
            spread: 90,
            origin: { y: 0.7 },
            colors: ['#4ade80', '#22c55e', '#16a34a', '#FACC15']
          });
          const nextQ = generateQuestion();
          return {
            ...prev,
            snake: newSnake,
            food: nextQ.food,
            question: { a: nextQ.a, b: nextQ.b, answer: nextQ.answer },
            score: prev.score + 10,
            speed: Math.max(MIN_SPEED, prev.speed - SPEED_INCREMENT),
            direction: pendingDirection.current,
            streak: prev.streak + 1,
          };
        } else {
          setShake(true);
          setTimeout(() => setShake(false), 500);
          confetti({
            particleCount: 30,
            spread: 40,
            origin: { y: 0.7 },
            colors: ['#ef4444', '#f87171', '#991b1b']
          });
          if (prev.lives > 1) {
            const nextQ = generateQuestion();
            return {
              ...prev,
              lives: prev.lives - 1,
              score: Math.max(0, prev.score - 5),
              food: nextQ.food,
              question: { a: nextQ.a, b: nextQ.b, answer: nextQ.answer },
              direction: pendingDirection.current,
              snake: newSnake,
              streak: 0,
            };
          } else {
            return { ...prev, gameOver: true, isPlaying: false, lives: 0, score: Math.max(0, prev.score - 5), streak: 0 };
          }
        }
      }

      newSnake.pop();
      return { ...prev, snake: newSnake, direction: pendingDirection.current };
    });

    requestAnimationFrame(gameStep);
  }, [state.isPlaying, state.gameOver, state.speed, onAnswer, generateQuestion]);

  useEffect(() => {
    if (state.isPlaying && !state.gameOver) {
      requestAnimationFrame(gameStep);
    }
  }, [state.isPlaying, state.gameOver, gameStep]);

  useEffect(() => {
    if (state.gameOver && !hasReportedGameOver.current) {
      hasReportedGameOver.current = true;
      onGameOver(state.score);
    }
  }, [state.gameOver, state.score, onGameOver]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      const currentDir = lastProcessedDirection.current;

      if ((key === 'arrowup' || key === 'w') && currentDir.y === 0) {
        pendingDirection.current = { x: 0, y: -1 };
      } else if ((key === 'arrowdown' || key === 's') && currentDir.y === 0) {
        pendingDirection.current = { x: 0, y: 1 };
      } else if ((key === 'arrowleft' || key === 'a') && currentDir.x === 0) {
        pendingDirection.current = { x: -1, y: 0 };
      } else if ((key === 'arrowright' || key === 'd') && currentDir.x === 0) {
        pendingDirection.current = { x: 1, y: 0 };
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Canvas rendering
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = canvas.width / GRID_SIZE;

    // Clear
    ctx.fillStyle = '#0F172A';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Grid details (Geometric pattern)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    for (let i = 0; i < GRID_SIZE; i++) {
        ctx.beginPath();
        ctx.moveTo(i * size, 0);
        ctx.lineTo(i * size, canvas.height);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, i * size);
        ctx.lineTo(canvas.width, i * size);
        ctx.stroke();
    }

    // Snake
    state.snake.forEach((segment, i) => {
      // Body gradient simulation
      const isHead = i === 0;
      const streakBonus = Math.min(state.streak * 2, 25);
      const gradient = ctx.createLinearGradient(
        segment.x * size, segment.y * size,
        (segment.x + 1) * size, (segment.y + 1) * size
      );
      
      if (isHead) {
        gradient.addColorStop(0, '#818CF8');
        gradient.addColorStop(1, '#6366F1');
      } else {
        gradient.addColorStop(0, '#4ADE80');
        gradient.addColorStop(1, '#22C55E');
      }
      
      ctx.fillStyle = gradient;
      ctx.shadowBlur = isHead ? 20 + streakBonus : 5 + streakBonus / 2;
      ctx.shadowColor = isHead ? 'rgba(99, 102, 241, 0.6)' : 'rgba(74, 222, 128, 0.4)';
      
      ctx.beginPath();
      ctx.roundRect(segment.x * size + 2, segment.y * size + 2, size - 4, size - 4, 6);
      ctx.fill();
      
      // Eyes for head
      if (isHead) {
        ctx.shadowBlur = 0;
        ctx.fillStyle = 'white';
        const eyeSize = size / 6;
        ctx.beginPath();
        ctx.arc(segment.x * size + size/3, segment.y * size + size/3, eyeSize, 0, Math.PI * 2);
        ctx.arc(segment.x * size + 2*size/3, segment.y * size + size/3, eyeSize, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    // Food
    state.food.forEach((f) => {
      // Glow effect
      ctx.shadowBlur = 20;
      ctx.shadowColor = 'rgba(250, 204, 21, 0.5)';
      
      const foodGradient = ctx.createLinearGradient(
        f.x * size, f.y * size,
        (f.x + 1) * size, (f.y + 1) * size
      );
      foodGradient.addColorStop(0, '#FACC15');
      foodGradient.addColorStop(1, '#EAB308');

      ctx.fillStyle = foodGradient;
      ctx.beginPath();
      ctx.roundRect(f.x * size + 2, f.y * size + 2, size - 4, size - 4, 10);
      ctx.fill();
      
      // Text
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#0F172A';
      ctx.font = `bold ${size/1.8}px JetBrains Mono`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(f.value.toString(), f.x * size + size/2, f.y * size + size/2);
    });

  }, [state]);

  return (
    <div className="flex flex-col items-center gap-8 p-4">
      {/* Game Header */}
      <motion.div 
        animate={shake ? { x: [-10, 10, -10, 10, 0] } : {}}
        className="w-full max-w-[500px] flex items-center justify-between bg-slate-900/50 p-6 rounded-3xl backdrop-blur-md border border-slate-800/80 shadow-2xl"
      >
        <div className="flex items-center gap-4">
          <div className="p-3 bg-indigo-500/10 rounded-2xl border border-indigo-500/20">
            <Trophy className="w-6 h-6 text-indigo-400" />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Global Score</p>
            <p className="text-2xl font-black text-white">{state.score.toLocaleString()}</p>
          </div>
        </div>

        <div className="flex flex-col items-center gap-1">
          <div className="flex items-center gap-2 px-4 py-2 bg-slate-800/40 rounded-xl border border-slate-700/50">
            {[...Array(2)].map((_, i) => (
              <Heart 
                key={i} 
                size={16} 
                className={cn(
                  "transition-all duration-300",
                  i < state.lives ? "text-red-500 fill-red-500" : "text-slate-700"
                )} 
              />
            ))}
          </div>
          {state.isPlaying && !state.gameOver && (
            <motion.div 
               initial={{ y: 10, opacity: 0 }}
               animate={{ y: 0, opacity: 1 }}
               className="px-4 py-1.5 bg-indigo-500/10 border border-indigo-500/20 rounded-lg"
            >
              <span className="text-xl font-black text-indigo-300 tracking-tighter">
                {state.question?.a} × {state.question?.b}
              </span>
            </motion.div>
          )}
        </div>

        <button 
          onClick={() => setSoundEnabled(!soundEnabled)}
          className="p-3 text-slate-400 hover:text-white hover:bg-slate-800 rounded-2xl transition-colors"
        >
          {soundEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
        </button>
      </motion.div>

      {/* Main Canvas Area */}
      <div className="relative group">
        <motion.div 
          animate={shake ? { x: [-5, 5, -5, 5, 0], scale: [1, 1.02, 1] } : {}}
          className="absolute -inset-2 bg-indigo-500/10 rounded-[40px] blur-2xl group-hover:bg-indigo-500/20 transition-all" 
        />
        <motion.canvas
          animate={shake ? { x: [-2, 2, -2, 2, 0] } : {}}
          ref={canvasRef}
          width={500}
          height={500}
          className="relative rounded-[32px] shadow-2xl border-4 border-slate-800/80 bg-slate-950 w-full max-w-[500px] aspect-square"
          id="game-canvas"
        />

        <AnimatePresence>
          {!state.isPlaying && !state.gameOver && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center bg-[#0F172A]/60 backdrop-blur-[4px] rounded-[32px]"
            >
              <button 
                onClick={resetGame}
                className="flex items-center gap-4 px-10 py-5 bg-indigo-600 text-white rounded-2xl font-black text-xl shadow-xl shadow-indigo-600/30 hover:bg-indigo-500 hover:scale-105 transition-all uppercase tracking-tight"
              >
                <Play fill="white" size={24} /> Initialize Mission
              </button>
            </motion.div>
          )}

          {state.gameOver && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute inset-0 flex items-center justify-center bg-slate-950/90 backdrop-blur-xl rounded-[32px] p-8 text-center"
            >
              <div className="max-w-xs">
                <div className="w-20 h-20 bg-indigo-500/20 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-indigo-500/30">
                    <Brain className="w-10 h-10 text-indigo-400" />
                </div>
                <h2 className="text-4xl font-black text-white mb-2 tracking-tighter">ENGINE HALTED</h2>
                <p className="text-slate-400 mb-8 text-sm">Target reached: <span className="text-indigo-400 font-bold">{state.score}</span>. Re-initialize for optimal learning.</p>
                <button 
                  onClick={resetGame}
                  className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-white text-slate-900 rounded-2xl font-black text-lg hover:bg-indigo-50 transition-colors uppercase"
                >
                  <RotateCcw size={20} /> Restart Engine
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Instructions */}
      <div className="flex gap-6 text-[11px] font-black uppercase tracking-[0.1em] text-slate-500 bg-slate-900/40 px-6 py-3 rounded-2xl border border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="flex gap-1">
            <kbd className="px-2 py-1 bg-slate-800 border-b-2 border-slate-950 rounded text-slate-300">W</kbd>
            <kbd className="px-2 py-1 bg-slate-800 border-b-2 border-slate-950 rounded text-slate-300">A</kbd>
            <kbd className="px-2 py-1 bg-slate-800 border-b-2 border-slate-950 rounded text-slate-300">S</kbd>
            <kbd className="px-2 py-1 bg-slate-800 border-b-2 border-slate-950 rounded text-slate-300">D</kbd>
          </div>
          Navigation
        </div>
        <div className="w-px h-4 bg-slate-700/50 self-center" />
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-sm food-item-gradient" />
          Module Target
        </div>
      </div>
    </div>
  );
}
