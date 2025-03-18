export interface Player {
  id: string;
  name: string;
  score: number;
  isHost: boolean;
  lastAnswerTime?: number;
  lastAnswerCorrect?: boolean;
  themeGuess?: string;
  themeGuessCorrect?: boolean;
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
  id: string;
  host: string;
  players: Player[];
  gameState: 'waiting' | 'playing' | 'finished';
  currentQuestion: number;
  game: Game;
  themeGuesses: Record<string, string>;
  questionStartTime?: number;
  maxScore: number;
  timeLimit: number;
}

export type GameEvent =
  | { type: 'connected' }
  | { type: 'roomCreated'; roomId: string }
  | { type: 'playerJoined'; players: Player[] }
  | { type: 'gameStarted'; question: Question; questionNumber: number; startTime: number }
  | { type: 'playerScored'; playerId: string; playerName: string; score: number; answerTime: number }
  | { type: 'themeGuessed'; playerId: string; playerName: string; score: number }
  | { type: 'nextQuestion'; question: Question; questionNumber: number; startTime: number }
  | { type: 'gameFinished'; winner: Player }
  | { type: 'playerLeft'; players: Player[] }
  | { type: 'roomDeleted' }
  | { type: 'error'; message: string }; 