import { GameEvent, Room } from '../types';
import { io, Socket } from 'socket.io-client';

export class WebSocketService {
  private socket: Socket | null = null;
  private playerId: string | null = null;
  private eventHandlers: ((event: GameEvent) => void)[] = [];
  private isInitialized = false;
  private reconnectTimer: NodeJS.Timeout | null = null;

  constructor() {
    this.initializeConnection();
  }

  private initializeConnection() {
    if (this.socket?.connected) {
      console.log('Socket already connected, no need to initialize');
      return;
    }

    console.log('Initializing WebSocket connection...');

    // Clear any existing socket
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }

    // Create new socket with configuration
    this.socket = io('http://localhost:5001', {
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      timeout: 10000,
      autoConnect: true
    });
    
    this.setupSocketHandlers();
  }

  private setupSocketHandlers() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('Socket connected, socket.id:', this.socket?.id);
      this.playerId = this.socket?.id || null;
      
      // Clear any reconnect timer
      if (this.reconnectTimer) {
        clearTimeout(this.reconnectTimer);
        this.reconnectTimer = null;
      }

      // Emit connected event to handlers
      this.eventHandlers.forEach(handler => 
        handler({ type: 'connected' })
      );
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Socket disconnected, reason:', reason);
      this.playerId = null;

      // Notify handlers of disconnection
      this.eventHandlers.forEach(handler => 
        handler({ type: 'disconnected' })
      );

      // Set up reconnection timer if not already set
      if (!this.reconnectTimer) {
        this.reconnectTimer = setTimeout(() => {
          console.log('Attempting to reconnect...');
          this.initializeConnection();
        }, 2000);
      }
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      this.eventHandlers.forEach(handler => 
        handler({ 
          type: 'error', 
          message: 'Failed to connect to server' 
        })
      );
    });

    // Set up game event handlers
    ['roomCreated', 'playerJoined', 'gameStarted', 'playerScored', 
     'themeGuessed', 'nextQuestion', 'gameFinished', 'playerLeft',
     'roomDeleted', 'error'].forEach(eventType => {
      this.socket?.on(eventType, (data) => {
        this.eventHandlers.forEach(handler => 
          handler({ type: eventType as GameEvent['type'], ...data })
        );
      });
    });
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
              { id: 'player1', name: playerName || 'Test Player', score: 0, isHost: false },
              { id: 'player2', name: 'Another Player', score: 0, isHost: false }
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
            score: 100,
            isHost: false
          }
        })
      );
    }, 2000);
  }

  public onEvent(handler: (event: GameEvent) => void): () => void {
    this.eventHandlers.push(handler);
    
    // If already connected, emit the connected event immediately
    if (this.socket?.connected) {
      console.log('Emitting connected event to new handler - socket is already connected');
      handler({ type: 'connected' });
    } else {
      console.log('Socket not connected, ensuring connection is initialized...');
      this.initializeConnection();
    }

    return () => {
      const index = this.eventHandlers.indexOf(handler);
      if (index > -1) {
        this.eventHandlers.splice(index, 1);
      }
    };
  }

  public on(event: string, callback: (...args: any[]) => void) {
    if (!this.socket) {
      throw new Error('Socket not connected');
    }
    this.socket.on(event, callback);
  }

  public off(event: string, callback: (...args: any[]) => void) {
    if (!this.socket) {
      throw new Error('Socket not connected');
    }
    this.socket.off(event, callback);
  }

  public getPlayerId(): string | null {
    return this.playerId;
  }

  public getRoom(roomId: string): Promise<Room> {
    return new Promise((resolve, reject) => {
      if (!this.socket) {
        reject(new Error('Socket not connected'));
        return;
      }

      this.socket.emit('getRoom', { roomId });
      
      const handleRoomData = (data: { room: Room }) => {
        this.socket?.off('roomData', handleRoomData);
        this.socket?.off('error', handleError);
        resolve(data.room);
      };

      const handleError = (error: { message: string }) => {
        this.socket?.off('roomData', handleRoomData);
        this.socket?.off('error', handleError);
        reject(new Error(error.message));
      };

      this.socket.on('roomData', handleRoomData);
      this.socket.on('error', handleError);

      // Set a timeout to prevent hanging
      setTimeout(() => {
        this.socket?.off('roomData', handleRoomData);
        this.socket?.off('error', handleError);
        reject(new Error('Request timed out'));
      }, 5000);
    });
  }

  public createRoom(gameId: string, playerName: string): void {
    if (!this.socket?.connected) {
      throw new Error('Socket not connected');
    }
    this.socket.emit('createRoom', { gameId, playerName });
  }

  public joinRoom(roomId: string, playerName: string): void {
    if (!this.socket?.connected) {
      throw new Error('Socket not connected');
    }
    this.socket.emit('joinRoom', { roomId, playerName });
  }

  public startGame(roomId: string, gameId: string): void {
    if (!this.socket) throw new Error('Not connected to server');
    this.socket.emit('startGame', { roomId, gameId });
  }

  public submitAnswer(roomId: string, answer: string): void {
    if (!this.socket) throw new Error('Not connected to server');
    this.socket.emit('submitAnswer', { roomId, answer });
  }

  public submitThemeGuess(roomId: string, themeGuess: string): void {
    if (!this.socket) throw new Error('Not connected to server');
    this.socket.emit('submitThemeGuess', { roomId, themeGuess });
  }

  public nextQuestion(roomId: string): void {
    if (!this.socket) throw new Error('Not connected to server');
    this.socket.emit('nextQuestion', { roomId });
  }

  public endGame(roomId: string): void {
    if (!this.socket) throw new Error('Not connected to server');
    this.socket.emit('endGame', { roomId });
  }

  public disconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }
    this.playerId = null;
    this.isInitialized = false;
    this.eventHandlers = [];
  }
}

export const websocketService = new WebSocketService(); 