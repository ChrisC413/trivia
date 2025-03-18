import { GameEvent } from '../types';
import { io, Socket } from 'socket.io-client';

class WebSocketService {
  private socket: Socket | null = null;
  private eventHandlers: ((event: GameEvent) => void)[] = [];

  constructor() {
    // Remove automatic simulation
  }

  private simulateEvents(type: 'create' | 'join', playerName?: string) {
    if (type === 'create') {
      setTimeout(() => {
        this.eventHandlers.forEach(handler => 
          handler({ 
            type: 'roomCreated', 
            roomId: 'test-room'
          })
        );
      }, 100);
    } else if (type === 'join') {
      setTimeout(() => {
        this.eventHandlers.forEach(handler => 
          handler({ 
            type: 'playerJoined', 
            players: [
              { id: 'player1', name: playerName || 'Test Player', score: 0 },
              { id: 'player2', name: 'Another Player', score: 0 }
            ]
          })
        );
      }, 200);
    }
  }

  private simulateGameEvents() {
    // Simulate game start
    setTimeout(() => {
      this.eventHandlers.forEach(handler => 
        handler({ 
          type: 'gameStarted', 
          question: {
            question: 'What is the first thing Neo says to Morpheus?',
            answer: 'Are you Morpheus?'
          },
          questionNumber: 1,
          startTime: Date.now()
        })
      );
    }, 500);

    // Simulate player scoring
    setTimeout(() => {
      this.eventHandlers.forEach(handler => 
        handler({ 
          type: 'playerScored', 
          playerId: 'player1',
          playerName: 'Test Player',
          score: 100,
          answerTime: Date.now()
        })
      );
    }, 500);

    // Simulate theme guessing
    setTimeout(() => {
      this.eventHandlers.forEach(handler => 
        handler({ 
          type: 'themeGuessed', 
          playerId: 'player2',
          playerName: 'Another Player',
          score: 50
        })
      );
    }, 1000);

    // Simulate next question
    setTimeout(() => {
      this.eventHandlers.forEach(handler => 
        handler({ 
          type: 'nextQuestion', 
          question: {
            question: 'What does the Oracle tell Neo about the vase?',
            answer: 'Don\'t worry about the vase'
          },
          questionNumber: 2,
          startTime: Date.now()
        })
      );
    }, 1500);

    // Simulate game finish
    setTimeout(() => {
      this.eventHandlers.forEach(handler => 
        handler({ 
          type: 'gameFinished', 
          winner: {
            id: 'player1',
            name: 'Test Player',
            score: 100
          }
        })
      );
    }, 2000);
  }

  connect(url: string) {
    try {
      // Convert ws:// to http:// for Socket.IO
      const socketUrl = url.replace('ws://', 'http://');
      this.socket = io(socketUrl, {
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        transports: ['websocket', 'polling'],
        withCredentials: true,
        extraHeaders: {
          "Access-Control-Allow-Origin": "*"
        }
      });

      this.setupSocketHandlers();
    } catch (error) {
      console.error('Failed to connect to Socket.IO:', error);
      this.eventHandlers.forEach(handler => 
        handler({ 
          type: 'error', 
          message: 'Failed to connect to server' 
        })
      );
    }
  }

  private setupSocketHandlers() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('Socket.IO connected');
      this.eventHandlers.forEach(handler => 
        handler({ 
          type: 'connected'
        })
      );
    });

    this.socket.on('disconnect', () => {
      console.log('Socket.IO disconnected');
    });

    this.socket.on('error', (error) => {
      console.error('Socket.IO error:', error);
      this.eventHandlers.forEach(handler => 
        handler({ 
          type: 'error', 
          message: 'Connection error' 
        })
      );
    });

    // Set up event handlers for game events
    ['roomCreated', 'playerJoined', 'gameStarted', 'playerScored', 
     'themeGuessed', 'nextQuestion', 'gameFinished', 'error'].forEach(eventType => {
      this.socket?.on(eventType, (data) => {
        this.eventHandlers.forEach(handler => handler({ type: eventType, ...data }));
      });
    });
  }

  onEvent(handler: (event: GameEvent) => void) {
    this.eventHandlers.push(handler);
    return () => {
      this.eventHandlers = this.eventHandlers.filter(h => h !== handler);
    };
  }

  createRoom(gameId: string) {
    if (!this.socket?.connected) {
      console.error('Socket not connected. Cannot create room.');
      this.eventHandlers.forEach(handler => 
        handler({ 
          type: 'error', 
          message: 'Not connected to server. Please try again.' 
        })
      );
      return;
    }
    console.log('Creating room with game ID:', gameId);
    this.socket.emit('createRoom', { gameId });
  }

  joinRoom(roomId: string, playerName: string) {
    if (!this.socket?.connected) {
      console.error('Socket not connected. Cannot join room.');
      this.eventHandlers.forEach(handler => 
        handler({ 
          type: 'error', 
          message: 'Not connected to server. Please try again.' 
        })
      );
      return;
    }
    console.log('Joining room:', roomId, 'as player:', playerName);
    this.socket.emit('joinRoom', { roomId, playerName });
  }

  startGame(roomId: string, gameId: string) {
    console.log('Starting game in room:', roomId, 'with game:', gameId);
    this.socket?.emit('startGame', { roomId, gameId });
  }

  submitAnswer(roomId: string, answer: string) {
    console.log('Submitting answer for room:', roomId, 'answer:', answer);
    this.socket?.emit('submitAnswer', { roomId, answer });
  }

  submitThemeGuess(roomId: string, theme: string) {
    console.log('Submitting theme guess for room:', roomId, 'theme:', theme);
    this.socket?.emit('submitThemeGuess', { roomId, theme });
  }

  nextQuestion(roomId: string) {
    console.log('Moving to next question in room:', roomId);
    this.socket?.emit('nextQuestion', { roomId });
  }

  endGame(roomId: string) {
    console.log('Ending game in room:', roomId);
    this.socket?.emit('endGame', { roomId });
  }

  disconnect() {
    this.socket?.disconnect();
    this.socket = null;
  }
}

export const websocketService = new WebSocketService(); 