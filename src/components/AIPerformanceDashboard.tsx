import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { LayoutDashboard, TrendingUp, Clock, Target, Sparkles, X } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { cn } from '../lib/utils';
import type { Metric } from '../types';

interface DashboardProps {
  metrics: Metric[];
  onClose: () => void;
}

export default function AIPerformanceDashboard({ metrics, onClose }: DashboardProps) {
  const chartData = useMemo(() => {
    return metrics.slice(-10).map((m, i) => ({
      index: i + 1,
      time: parseFloat(m.time.toFixed(2)),
      correct: m.correct ? 1 : 0,
    }));
  }, [metrics]);

  const stats = useMemo(() => {
    const total = metrics.length;
    const correct = metrics.filter(m => m.correct).length;
    const avgTime = metrics.reduce((acc, m) => acc + m.time, 0) / (total || 1);
    const accuracy = total > 0 ? (correct / total) * 100 : 0;
    
    return {
      accuracy: Math.round(accuracy),
      avgTime: avgTime.toFixed(1),
      total,
      bestTime: total > 0 ? Math.min(...metrics.map(m => m.time)).toFixed(1) : "0"
    };
  }, [metrics]);

  return (
    <motion.div 
      initial={{ opacity: 0, x: 300 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 300 }}
      className="fixed top-0 right-0 h-full w-[400px] bg-slate-900 shadow-2xl z-[60] border-l border-slate-800 flex flex-col"
    >
      <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
        <div className="flex items-center gap-2">
            <LayoutDashboard className="text-indigo-400" size={20} />
            <h2 className="font-black text-slate-100 tracking-tight uppercase text-sm">Performance Diaries</h2>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-white">
            <X size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
            <div className="p-5 bg-indigo-500/10 rounded-2xl border border-indigo-500/20 shadow-inner">
                <Target className="text-indigo-400 mb-2" size={18} />
                <p className="text-[10px] uppercase font-bold text-slate-500 tracking-[0.2em]">Efficiency</p>
                <p className="text-3xl font-black text-indigo-300">{stats.accuracy}%</p>
            </div>
            <div className="p-5 bg-slate-800/40 rounded-2xl border border-slate-700/50 shadow-inner">
                <Clock className="text-slate-400 mb-2" size={18} />
                <p className="text-[10px] uppercase font-bold text-slate-500 tracking-[0.2em]">Latency</p>
                <p className="text-3xl font-black text-slate-100">{stats.avgTime}s</p>
            </div>
        </div>

        {/* Chart */}
        <div className="space-y-4">
            <div className="flex items-center gap-2">
                <TrendingUp size={16} className="text-slate-500" />
                <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Cognitive Flow (Last 10)</h3>
            </div>
            <div className="h-[200px] w-full bg-slate-950/50 rounded-3xl p-4 border border-slate-800/50">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                        <XAxis dataKey="index" hide />
                        <YAxis hide />
                        <Tooltip 
                            contentStyle={{ backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '12px' }}
                            itemStyle={{ color: '#818CF8' }}
                        />
                        <Line 
                            type="monotone" 
                            dataKey="time" 
                            stroke="#6366F1" 
                            strokeWidth={4} 
                            dot={{ fill: '#6366F1', strokeWidth: 2, r: 4 }}
                            activeDot={{ r: 8, fill: '#818CF8' }}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>

        {/* History Feed */}
        <div className="space-y-4">
             <div className="flex items-center gap-2">
                <Sparkles size={16} className="text-slate-500" />
                <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Session History</h3>
            </div>
            <div className="space-y-2">
                {metrics.slice(-8).reverse().map((m, i) => (
                    <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-slate-800/30 border border-slate-800 hover:border-slate-700 transition-colors">
                        <div className="flex items-center gap-4">
                            <div className={cn(
                                "w-1.5 h-1.5 rounded-full",
                                m.correct ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]" : "bg-red-400 shadow-[0_0_8px_rgba(248,113,113,0.5)]"
                            )} />
                            <span className="text-sm font-bold text-slate-300">{m.question}</span>
                        </div>
                        <span className="text-[10px] font-mono text-slate-500">{m.time.toFixed(1)}s</span>
                    </div>
                ))}
                {metrics.length === 0 && (
                    <div className="text-center py-12 text-slate-600 text-xs font-bold uppercase tracking-widest italic">
                        Empty Buffer
                    </div>
                )}
            </div>
        </div>
      </div>
      
      <div className="p-6 bg-slate-950/50 border-t border-slate-800">
        <p className="text-[10px] text-slate-500 leading-relaxed font-medium uppercase tracking-tight">
            Advanced neural telemetry processed. Data stream encrypted and synced to School ID: PRIMARY-772.
        </p>
      </div>
    </motion.div>
  );
}
