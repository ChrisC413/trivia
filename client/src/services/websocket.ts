import { GameEvent } from '../types';
import { Room } from '@trivia-game/shared';
import { io, Socket } from 'socket.io-client';
import { getOrCreatePlayerId } from '../utils/playerUtils';

export class WebSocketService {
  private socket: Socket | null = null;
  private playerId: string;
  private eventHandlers: ((event: GameEvent) => void)[] = [];
  private isInitialized = false;
  private reconnectTimer: NodeJS.Timeout | null = null;

  constructor() {
    this.playerId = getOrCreatePlayerId();
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
      autoConnect: true,
      auth: {
        playerId: this.playerId
      }
    });
    
    this.setupSocketHandlers();
  }

  private setupSocketHandlers() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('Socket connected, playerId:', this.playerId);
      
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

    this.socket.on('disconnect', reason => {
      console.log('Socket disconnected, reason:', reason);

      // Notify handlers of disconnection
      this.eventHandlers.forEach(handler => handler({ type: 'disconnected' }));

      // Set up reconnection timer if not already set
      if (!this.reconnectTimer) {
        this.reconnectTimer = setTimeout(() => {
          console.log('Attempting to reconnect...');
          this.initializeConnection();
        }, 2000);
      }
    });

    this.socket.on('connect_error', error => {
      console.error('Socket connection error:', error);
      this.eventHandlers.forEach(handler =>
        handler({
          type: 'error',
          message: 'Failed to connect to server',
        })
      );
    });

    // Set up game event handlers
    [
      'roomCreated',
      'playerJoined',
      'gameStarted',
      'playerScored',
      'themeGuessed',
      'nextQuestion',
      'gameFinished',
      'playerLeft',
      'roomDeleted',
      'error',
    ].forEach(eventType => {
      this.socket?.on(eventType, data => {
        this.eventHandlers.forEach(handler =>
          handler({ type: eventType as GameEvent['type'], ...data })
        );
      });
    });
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
    if (!this.socket?.connected) {
      console.log('Socket not connected, initializing connection...');
      this.initializeConnection();
    }
    if (!this.socket) {
      throw new Error('Socket not connected');
    }
    this.socket.on(event, callback);
  }

  public off(event: string, callback: (...args: any[]) => void) {
    if (!this.socket) {
      console.warn('Socket not connected, cannot remove listener');
      return;
    }
    this.socket.off(event, callback);
  }

  public getPlayerId(): string {
    return this.playerId;
  }

  public getRoom(roomId: string): Promise<Room> {
    return new Promise((resolve, reject) => {
      if (!this.socket?.connected) {
        console.log('Socket not connected, initializing connection...');
        this.initializeConnection();
      }

      if (!this.socket) {
        reject(new Error('Socket not connected'));
        return;
      }

      const handleRoomData = (data: { room: Room }) => {
        console.log('Received room data:', data);
        if (!data.room) {
          console.error('Invalid room data received:', data);
          reject(new Error('Invalid room data received'));
          return;
        }
        // Remove listeners before resolving
        this.socket?.off('roomData', handleRoomData);
        this.socket?.off('error', handleError);
        // Resolve immediately after receiving valid data
        resolve(data.room);
      };

      const handleError = (error: { message: string }) => {
        console.error('Received error in getRoom:', error);
        // Remove listeners before rejecting
        this.socket?.off('roomData', handleRoomData);
        this.socket?.off('error', handleError);
        reject(new Error(error.message));
      };

      // Set up listeners
      this.socket.on('roomData', handleRoomData);
      this.socket.on('error', handleError);

      console.log('Emitting getRoom event for roomId:', roomId);
      this.socket.emit('getRoom', { roomId });

      // Set a timeout to prevent hanging
      const timeoutId = setTimeout(() => {
        console.log('getRoom request timed out');
        // Remove listeners before rejecting
        this.socket?.off('roomData', handleRoomData);
        this.socket?.off('error', handleError);
        reject(new Error('Request timed out'));
      }, 10000);

      // Clean up timeout if promise resolves or rejects
      return () => clearTimeout(timeoutId);
    });
  }

  public createRoom(playerName: string, triviaSetId: string): void {
    if (!this.socket?.connected) {
      throw new Error('Socket not connected');
    }
    this.socket.emit('createRoom', { 
      playerName,
      playerId: this.playerId,
      triviaSetId
    });
  }

  public joinRoom(roomId: string, playerName: string): void {
    if (!this.socket?.connected) {
      throw new Error('Socket not connected');
    }
    this.socket.emit('joinRoom', { 
      roomId, 
      playerName,
      playerId: this.playerId 
    });
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
    this.eventHandlers = [];
  }
}

export const websocketService = new WebSocketService();
