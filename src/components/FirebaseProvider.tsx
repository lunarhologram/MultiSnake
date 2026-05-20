import React, { createContext, useContext, useEffect, useState } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, GoogleAuthProvider, signInWithPopup, User } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc, updateDoc, increment, serverTimestamp } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import type { UserProfile } from '../types';

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signIn: () => Promise<void>;
  updateScore: (score: number) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        const profileRef = doc(db, 'profiles', u.uid);
        const snap = await getDoc(profileRef);
        if (snap.exists()) {
          setProfile(snap.data() as UserProfile);
        } else {
          const newProfile: UserProfile = {
            uid: u.uid,
            displayName: u.displayName || 'New Scholar',
            photoURL: u.photoURL || '',
            highestScore: 0,
            totalGames: 0
          };
          await setDoc(profileRef, {
            ...newProfile,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          });
          setProfile(newProfile);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
  }, []);

  const signIn = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  const updateScore = async (score: number) => {
    if (!user) return;
    const profileRef = doc(db, 'profiles', user.uid);
    const snap = await getDoc(profileRef);
    const currentData = snap.data() as UserProfile;
    
    await updateDoc(profileRef, {
      totalGames: increment(1),
      highestScore: Math.max(currentData.highestScore, score),
      updatedAt: serverTimestamp()
    });

    // Save session
    await setDoc(doc(db, 'sessions', `${user.uid}_${Date.now()}`), {
      uid: user.uid,
      score,
      timestamp: serverTimestamp()
    });

    setProfile(prev => prev ? ({
      ...prev,
      totalGames: prev.totalGames + 1,
      highestScore: Math.max(prev.highestScore, score)
    }) : null);
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signIn, updateScore }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
