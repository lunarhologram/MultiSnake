import type { ReactNode } from "react";

export interface GameState {
  snake: { x: number; y: number }[];
  food: { x: number; y: number; value: number }[];
  direction: { x: number; y: number };
  score: number;
  lives: number;
  gameOver: boolean;
  question: { a: number; b: number; answer: number } | null;
  speed: number;
  isPlaying: boolean;
}

export interface Metric {
  time: number;
  correct: boolean;
  question: string;
}

export interface UserProfile {
  uid: string;
  displayName: string;
  photoURL?: string;
  highestScore: number;
  totalGames: number;
}
