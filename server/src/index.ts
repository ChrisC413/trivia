import express from 'express';
import { createServer } from 'http';
import { Server, Socket } from 'socket.io';
import cors from 'cors';
import { generateRoomId } from './constants/words';
import triviaRoutes from './routes/trivia';
import { RoomService } from './services/RoomService';
import { playerNameService } from './services/PlayerNameService';

const app = express();
const server = createServer(app);

// Store active game rooms
const roomService = new RoomService();

// Store socket to player ID mapping
const socketToPlayer = new Map<string, string>();

// Socket.IO server setup
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    allowedHeaders: ["*"],
    credentials: false
  }
});

// Express middleware
app.use(cors({
  origin: "*",
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  credentials: false,
  optionsSuccessStatus: 204
}));

app.use(express.json());

// Routes
app.use('/api/trivia', triviaRoutes);

// Socket.IO connection handling
io.on('connection', (socket: Socket) => {
  console.log('New client connected');

  // Store player ID mapping when socket connects
  const playerId = socket.handshake.auth.playerId;
  if (playerId) {
    socketToPlayer.set(socket.id, playerId);
    console.log('Mapped socket', socket.id, 'to player', playerId);
  }

  socket.on('disconnect', () => {
    const playerId = socketToPlayer.get(socket.id);
    if (playerId) {
      // Find room that player was in and remove them
      for (const room of roomService.getAllRooms()) {
        if (room.players.some(p => p.id === playerId)) {
          // const updatedRoom = roomService.removePlayer(room.id, playerId); //TODO:remove players who disconnect, notify the other players using socket.emit

        }
      }
      socketToPlayer.delete(socket.id);
    }
  });

  socket.on('getRoom', ({ roomId }: { roomId: string }) => {
    console.log('Received getRoom request for roomId:', roomId);
    const room = roomService.getRoom(roomId);
    
    if (!room) {
      console.log('Room not found:', roomId);
      socket.emit('error', { message: 'Room not found' });
      return;
    }

    console.log('Found room:', roomId, 'with state:', room.gameState);
    socket.join(roomId);
    
    socket.emit('roomData', { room });
  });

  socket.on('createRoom', async ({ playerName, playerId, triviaSetId }) => {
    const gameId = generateRoomId();
    console.log('Creating room with ID:', gameId);
    const room = await roomService.createRoom(gameId, playerId, playerName, triviaSetId);
    const roomId = room.id;
    socket.join(roomId);
    io.to(roomId).emit('roomCreated', { roomId, room });
  });

  socket.on('joinRoom', ({ roomId, playerName, playerId }) => {
    const room = roomService.addPlayer(roomId, {
      id: playerId,
      name: playerName,
      score: 0
    });
    
    if (room) {
      socket.join(roomId);
      io.to(roomId).emit('playerJoined', { players: room.players });
    } else {
      socket.emit('error', { message: 'Room not found' });
    }
  });

  // ... rest of the socket handlers with proper type annotations

  socket.on('beginGame', ({ roomId }) => {
    const room = roomService.getRoom(roomId);
    if (room) {
      roomService.startGame(roomId);
      io.to(roomId).emit('gameStarted', { room });
    } else {
      socket.emit('error', { message: 'Room not found' });
    }
  });

  socket.on('submitPlayerName', ({ playerId, playerName }, socketid) => {
    const token =  playerNameService.registerPlayer(playerId, playerName);
    // Emit the response only to the client who submitted the event
    socket.emit('playerNameSubmitted', { playerId, playerName, token });
  });
  
});



const PORT = process.env.PORT || 5001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export { app, server, io }; 