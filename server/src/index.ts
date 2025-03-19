import express from 'express';
import { createServer } from 'http';
import { Server, Socket } from 'socket.io';
import cors from 'cors';
import { generateRoomId } from './constants/words';
import { GameRoom, Player, RoomResponse, Game } from './types';

const app = express();
const server = createServer(app);

// Store active game rooms
const gameRooms = new Map<string, GameRoom>();

// Socket.IO server setup
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    allowedHeaders: ["*"],
    credentials: true
  }
});

// Express middleware
app.use(cors({
  origin: "*",
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  credentials: true,
  optionsSuccessStatus: 204
}));

app.use(express.json());

// Convert GameRoom to RoomResponse
const getRoomResponse = (room: GameRoom): RoomResponse => ({
  id: room.id,
  host: room.host,
  players: Array.from(room.players.values()),
  gameState: room.gameState,
  currentQuestion: room.currentQuestion,
  game: room.game
});

// Socket.IO connection handling
io.on('connection', (socket: Socket) => {
  console.log('New client connected');

  socket.on('getRoom', ({ roomId }: { roomId: string }) => {
    console.log('Received getRoom request for roomId:', roomId);
    const room = gameRooms.get(roomId);
    
    if (!room) {
      console.log('Room not found:', roomId);
      socket.emit('error', { message: 'Room not found' });
      return;
    }

    console.log('Found room:', roomId, 'with state:', room.gameState);
    socket.join(roomId);
    
    // Ensure we're sending a valid room response
    const roomResponse = getRoomResponse(room);
    console.log('Sending room data:', JSON.stringify(roomResponse, null, 2));
    
    // Use callback to ensure message is sent
    socket.emit('roomData', { room: roomResponse }, (acknowledgement: any) => {
      console.log('Room data sent, acknowledgement:', acknowledgement);
    });
  });

  socket.on('createRoom', ({ gameId, playerName }: { gameId: string; playerName: string }) => {
    let roomId: string;
    do {
      roomId = generateRoomId();
    } while (gameRooms.has(roomId));

    console.log('Creating room with ID:', roomId);
    
    const newRoom: GameRoom = {
      id: roomId,
      host: socket.id,
      players: new Map([[socket.id, {
        id: socket.id,
        name: playerName,
        score: 0,
        isHost: true
      }]]),
      gameState: 'waiting',
      currentQuestion: 0,
      game: null,
      themeGuesses: new Map()
    };

    gameRooms.set(roomId, newRoom);
    socket.join(roomId);
    socket.emit('roomCreated', { 
      roomId,
      room: getRoomResponse(newRoom)
    });
  });

  socket.on('joinRoom', ({ roomId, playerName }: { roomId: string; playerName: string }) => {
    const room = gameRooms.get(roomId);
    if (!room) {
      socket.emit('error', { message: 'Room not found' });
      return;
    }

    const newPlayer: Player = {
      id: socket.id,
      name: playerName,
      score: 0,
      isHost: false
    };

    socket.join(roomId);
    room.players.set(socket.id, newPlayer);

    io.to(roomId).emit('playerJoined', {
      players: Array.from(room.players.values())
    });
  });

  // ... rest of the socket handlers with proper type annotations
});

const PORT = process.env.PORT || 5001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export { app, server, io }; 