import { Question } from './shared-types';

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



export type GameEvent =
  | { type: 'connected' }
  | { type: 'disconnected' }
  | { type: 'roomCreated'; roomId: string }
  | { type: 'playerJoined'; players: Player[] }
  | { type: 'gameStarted'; question: Question; questionNumber: number; startTime: number }
  | {
      type: 'playerScored';
      playerId: string;
      playerName: string;
      score: number;
      answerTime: number;
    }
  | { type: 'themeGuessed'; playerId: string; playerName: string; score: number }
  | { type: 'nextQuestion'; question: Question; questionNumber: number; startTime: number }
  | { type: 'gameFinished'; winner: Player }
  | { type: 'playerLeft'; players: Player[] }
  | { type: 'roomDeleted' }
  | { type: 'error'; message: string };
