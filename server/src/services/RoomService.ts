import { Room, PublicPlayer } from '@trivia-game/shared';
import { triviaService } from './triviaService';

//TODO" Add room TTL

export interface BackendRoom extends Room {
    triviaSetId: string;
}

export class RoomService {
  private rooms: Map<string, BackendRoom> = new Map();

  // Get a room by ID
  getRoom(roomId: string): Room | undefined {
    return this.rooms.get(roomId);
  }

  // Create a new room
  async createRoom(roomId: string, hostId: string, hostName: string, triviaSetId: string): Promise<Room> {
    const triviaSet = await triviaService.getTriviaSet(triviaSetId);
    if (!triviaSet || !triviaSet.questions || triviaSet.questions.length === 0) {
      throw new Error('No trivia questions found for this set');
    }
    const room: BackendRoom = {
      id: roomId,
      host: hostId,
      players: [{
        id: hostId,
        name: hostName,
        score: 0
      }],
      gameState: 'waiting',
      currentQuestion: "",
      triviaSetId: triviaSetId,
      remainingQuestions: triviaSet.questions.length-1,
      scoreboard: [],
    };

    this.rooms.set(roomId, room);
    return room;
  }

  // Add a player to a room
  addPlayer(roomId: string, player: PublicPlayer): Room | undefined {
    const room = this.rooms.get(roomId);
    if (!room) return undefined;

    // Check if player already exists
    const existingPlayerIndex = room.players.findIndex(p => p.id === player.id);
    if (existingPlayerIndex >= 0) {
      room.players[existingPlayerIndex] = player;
    } else {
      room.players.push(player);
    }

    return room;
  }

//   // Remove a player from a room
//   removePlayer(roomId: string, playerId: string): Room | undefined {
//     const room = this.rooms.get(roomId);
//     if (!room) return undefined;

//     room.players = room.players.filter(p => p.id !== playerId);

//     // If room is empty, delete it
//     if (room.players.length === 0) {
//       this.rooms.delete(roomId);
//       return undefined;
//     }

//     // If host left, assign new host
//     if (room.host === playerId && room.players.length > 0) {
//       room.host = room.players[0].id;
//     }

//     return room;
//   }

  // Start a game in a room

  async startGame(roomId: string,): Promise<Room> {
    const room = this.rooms.get(roomId);
    if (!room) throw new Error('Room not found');
    const triviaSet = await triviaService.getTriviaSet(room.triviaSetId);
    if (!triviaSet || !triviaSet.questions || triviaSet.questions.length === 0) {
      throw new Error('No trivia questions found for this set');
    }

    room.gameState = 'playing';
    room.remainingQuestions = triviaSet.questions.length-1;
    room.currentQuestion = triviaSet?.questions[room.remainingQuestions].question
    //TODO: copy game back to set?
    return room;
  }

  // Update game state for next question
  async nextQuestion(roomId: string): Promise<Room> {
    
    const room = this.rooms.get(roomId);
    if (!room) throw new Error('Room not found');

    const triviaSet = await triviaService.getTriviaSet(room.triviaSetId);
    if (!triviaSet || !triviaSet.questions || triviaSet.questions.length === 0){
        throw new Error('No valid trivia questions found for this set');
    }

    if (room.remainingQuestions > 0) {
      room.remainingQuestions--;
      room.currentQuestion = triviaSet.questions[room.remainingQuestions].question;
      return room;
    }   
    else{   
        // If we've reached the end of questions, finish the game
        room.gameState = 'finished';
        return room;
    }   
  }

  // Submit a player's answer and update score
//   submitAnswer(roomId: string, playerId: string, isCorrect: boolean, answerTime: number): Room | undefined {
//     const room = this.rooms.get(roomId);
//     if (!room) return undefined;

//     const player = room.players.find(p => p.id === playerId);
//     if (!player) return undefined;

//     // Calculate score based on answer time (faster = more points)
//     const timeBonus = Math.max(0, room.timeLimit - answerTime);
//     const points = isCorrect ? 10 + timeBonus : 0;
//     player.score += points;

//     // Update max score if needed
//     room.maxScore = Math.max(room.maxScore, player.score);

//     return room;
//   }

//   // Submit a theme guess
//   submitThemeGuess(roomId: string, playerId: string, guess: string): Room | undefined {
//     const room = this.rooms.get(roomId);
//     if (!room) return undefined;

//     room.themeGuesses[playerId] = guess;
//     return room;
//   }

  // Delete a room
  deleteRoom(roomId: string): boolean {
    return this.rooms.delete(roomId);
  }

  // Get all rooms (for admin purposes)
  getAllRooms(): Room[] {
    return Array.from(this.rooms.values());
  }
}

// Export a singleton instance
export const roomService = new RoomService(); 