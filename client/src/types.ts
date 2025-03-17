export interface Player {
  id: string;
  name: string;
  score: number;
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

export interface Room {
  roomId: string;
  host: string;
  players: Player[];
  gameState: 'waiting' | 'playing' | 'finished';
  currentQuestion: number;
  game: Game | null;
  themeGuesses: Record<string, boolean>;
}

export type GameEvent = 
  | { type: 'roomCreated'; roomId: string }
  | { type: 'playerJoined'; players: Player[] }
  | { type: 'gameStarted'; question: Question; questionNumber: number }
  | { type: 'playerScored'; playerId: string; playerName: string; score: number }
  | { type: 'themeGuessed'; playerId: string; playerName: string; score: number }
  | { type: 'nextQuestion'; question: Question; questionNumber: number }
  | { type: 'gameFinished'; players: Player[]; theme: string }
  | { type: 'playerLeft'; players: Player[] }
  | { type: 'roomDeleted' }
  | { type: 'error'; message: string }; 