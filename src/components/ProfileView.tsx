import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { LogIn, User as UserIcon, Trophy, Gamepad2, Loader2 } from 'lucide-react';
import { useAuth } from './FirebaseProvider';

export default function ProfileView() {
  const { user, profile, loading, signIn } = useAuth();

  if (loading) return <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase"><Loader2 className="animate-spin" size={14}/> Loading Profiles...</div>;

  return (
    <div className="flex items-center gap-4">
      <AnimatePresence mode="wait">
        {user && profile ? (
          <motion.div 
            key="profile"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-4 px-4 py-2 bg-slate-800/80 rounded-2xl border border-slate-700 shadow-xl"
          >
            <div className="relative">
                {profile.photoURL ? (
                  <img src={profile.photoURL} alt="Avatar" className="w-8 h-8 rounded-full border border-indigo-500/50" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center">
                    <UserIcon size={16} className="text-white" />
                  </div>
                )}
                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-slate-800" />
            </div>
            <div className="hidden md:block">
              <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">{profile.displayName}</p>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                    <Trophy size={10} className="text-yellow-400" />
                    <span className="text-xs font-mono font-bold">{profile.highestScore}</span>
                </div>
                <div className="flex items-center gap-1">
                    <Gamepad2 size={10} className="text-slate-500" />
                    <span className="text-xs font-mono font-bold text-slate-400">{profile.totalGames}</span>
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.button
            key="login"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={signIn}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black text-xs transition-all shadow-lg shadow-indigo-600/20 uppercase tracking-widest"
          >
            <LogIn size={16} />
            Initialize Profile
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
