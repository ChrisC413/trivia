export interface Player {
  id: string;
  name: string;
  score: number;
  isHost?: boolean;
}

export interface Question {
  question: string;
  answer: string;
}

export interface Game {
  id: string;
  name: string;
  theme: string;
  questions: Question[];
}

export interface GameRoom {
  id: string;
  host: string;
  players: Map<string, Player>;
  gameState: 'waiting' | 'playing' | 'finished';
  currentQuestion: number;
  game: Game | null;
  themeGuesses: Map<string, boolean>;
}

export interface RoomResponse {
  id: string;
  host: string;
  players: Player[];
  gameState: 'waiting' | 'playing' | 'finished';
  currentQuestion: number;
  game: Game | null;
} 