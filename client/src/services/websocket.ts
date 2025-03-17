import { io, Socket } from 'socket.io-client';
import { GameEvent } from '../types';

class WebSocketService {
  private socket: Socket | null = null;
  private eventHandlers: ((event: GameEvent) => void)[] = [];
  private isTestMode = true;

  connect(url: string) {
    if (this.isTestMode) {
      console.log('Running in test mode - simulating WebSocket connection');
      // Simulate connection success
      setTimeout(() => {
        this.eventHandlers.forEach(handler => 
          handler({ type: 'roomCreated', roomId: 'test-room-123' })
        );
      }, 1000);
      return;
    }

    this.socket = io(url);

    this.socket.on('connect', () => {
      console.log('Connected to WebSocket server');
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from WebSocket server');
    });

    this.socket.on('gameEvent', (event: GameEvent) => {
      this.eventHandlers.forEach(handler => handler(event));
    });
  }

  disconnect() {
    if (this.isTestMode) return;
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  onEvent(handler: (event: GameEvent) => void) {
    this.eventHandlers.push(handler);
    return () => {
      this.eventHandlers = this.eventHandlers.filter(h => h !== handler);
    };
  }

  createRoom() {
    if (this.isTestMode) {
      // Simulate room creation
      setTimeout(() => {
        this.eventHandlers.forEach(handler => 
          handler({ type: 'roomCreated', roomId: 'test-room-' + Math.random().toString(36).substr(2, 9) })
        );
      }, 500);
      return;
    }
    if (!this.socket) throw new Error('Not connected');
    this.socket.emit('createRoom');
  }

  joinRoom(roomId: string, playerName: string) {
    if (this.isTestMode) {
      // Simulate player joining
      setTimeout(() => {
        this.eventHandlers.forEach(handler => 
          handler({ 
            type: 'playerJoined', 
            players: [
              { id: 'host', name: 'Host', score: 0 },
              { id: 'player1', name: playerName, score: 0 }
            ]
          })
        );
      }, 500);
      return;
    }
    if (!this.socket) throw new Error('Not connected');
    this.socket.emit('joinRoom', { roomId, playerName });
  }

  startGame(roomId: string, gameId: string) {
    if (this.isTestMode) {
      // Simulate game start
      setTimeout(() => {
        this.eventHandlers.forEach(handler => 
          handler({ 
            type: 'gameStarted', 
            question: {
              question: 'What is the first thing Neo says to Morpheus?',
              answer: 'Are you Morpheus?'
            },
            questionNumber: 1
          })
        );
      }, 500);
      return;
    }
    if (!this.socket) throw new Error('Not connected');
    this.socket.emit('startGame', { roomId, gameId });
  }

  submitAnswer(roomId: string, answer: string) {
    if (this.isTestMode) {
      // Simulate answer submission
      setTimeout(() => {
        this.eventHandlers.forEach(handler => 
          handler({ 
            type: 'playerScored', 
            playerId: 'player1',
            playerName: 'Test Player',
            score: 100
          })
        );
      }, 500);
      return;
    }
    if (!this.socket) throw new Error('Not connected');
    this.socket.emit('submitAnswer', { roomId, answer });
  }

  submitThemeGuess(roomId: string, guess: string) {
    if (this.isTestMode) {
      // Simulate theme guess
      setTimeout(() => {
        this.eventHandlers.forEach(handler => 
          handler({ 
            type: 'themeGuessed', 
            playerId: 'player1',
            playerName: 'Test Player',
            score: 200
          })
        );
      }, 500);
      return;
    }
    if (!this.socket) throw new Error('Not connected');
    this.socket.emit('submitThemeGuess', { roomId, guess });
  }

  nextQuestion(roomId: string) {
    if (this.isTestMode) {
      // Simulate next question
      setTimeout(() => {
        this.eventHandlers.forEach(handler => 
          handler({ 
            type: 'nextQuestion', 
            question: {
              question: 'What does the Oracle tell Neo about the vase?',
              answer: 'Don\'t worry about the vase'
            },
            questionNumber: 2
          })
        );
      }, 500);
      return;
    }
    if (!this.socket) throw new Error('Not connected');
    this.socket.emit('nextQuestion', { roomId });
  }
}

export const websocketService = new WebSocketService(); 