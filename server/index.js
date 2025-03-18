const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const { generateRoomId } = require('./constants/words');
const QRCode = require('qrcode');

const app = express();
const server = http.createServer(app);

// More permissive CORS configuration for Socket.IO
const io = socketIo(server, {
  cors: {
    origin: "*",  // Allow all origins in development
    methods: ["GET", "POST"],
    allowedHeaders: ["*"],
    credentials: true
  }
});

// More permissive CORS for Express
app.use(cors({
  origin: "*",
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  credentials: true,
  optionsSuccessStatus: 204
}));

app.use(express.json());

// Store active game rooms
const gameRooms = new Map();

// Sample trivia games (in a real app, this would come from a database)
const sampleGames = [
  {
    id: '1',
    name: 'Movie Quotes',
    theme: 'The Matrix',
    questions: [
      { question: 'What is the first thing Neo says to Morpheus?', answer: 'Are you Morpheus?' },
      { question: 'What does the Oracle tell Neo about the vase?', answer: 'Don\'t worry about the vase' },
      { question: 'What does Trinity say about the name Neo?', answer: 'The One' },
      { question: 'What does Morpheus say about the Matrix?', answer: 'Welcome to the real world' },
      { question: 'What does Neo say about the Matrix?', answer: 'I know kung fu' }
    ]
  }
];

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('New client connected');

  socket.on('createRoom', ({ gameId }) => {
    let roomId;
    // Keep generating room IDs until we find a unique one
    do {
      roomId = generateRoomId();
    } while (gameRooms.has(roomId));

    console.log('Creating room with ID:', roomId);
    
    gameRooms.set(roomId, {
      id: roomId,
      host: socket.id,
      players: new Map(),
      gameState: 'waiting',
      currentQuestion: 0,
      game: sampleGames.find(g => g.id === gameId) || sampleGames[0],
      themeGuesses: new Map()
    });
    socket.join(roomId);
    socket.emit('roomCreated', { roomId });
  });

  socket.on('joinRoom', ({ roomId, playerName }) => {
    const room = gameRooms.get(roomId);
    if (!room) {
      socket.emit('error', { message: 'Room not found' });
      return;
    }

    socket.join(roomId);
    room.players.set(socket.id, {
      id: socket.id,
      name: playerName,
      score: 0
    });

    io.to(roomId).emit('playerJoined', {
      players: Array.from(room.players.values())
    });
  });

  socket.on('startGame', ({ roomId, gameId }) => {
    const room = gameRooms.get(roomId);
    if (!room || room.host !== socket.id) {
      socket.emit('error', { message: 'Unauthorized' });
      return;
    }

    const game = sampleGames.find(g => g.id === gameId) || sampleGames[0];
    room.game = game;
    room.gameState = 'playing';
    room.currentQuestion = 0;

    io.to(roomId).emit('gameStarted', {
      question: game.questions[0],
      questionNumber: 1
    });
  });

  socket.on('submitAnswer', ({ roomId, answer }) => {
    const room = gameRooms.get(roomId);
    if (!room || room.gameState !== 'playing') return;

    const player = room.players.get(socket.id);
    if (!player) return;

    const currentQuestion = room.game.questions[room.currentQuestion];
    if (answer.toLowerCase() === currentQuestion.answer.toLowerCase()) {
      // Calculate score based on time (simplified for now)
      player.score += 100;
      io.to(roomId).emit('playerScored', {
        playerId: socket.id,
        playerName: player.name,
        score: player.score
      });
    }
  });

  socket.on('submitThemeGuess', ({ roomId, guess }) => {
    const room = gameRooms.get(roomId);
    if (!room || room.gameState !== 'playing') return;

    const player = room.players.get(socket.id);
    if (!player) return;

    if (guess.toLowerCase() === room.game.theme.toLowerCase()) {
      // Calculate bonus points based on current question number
      const bonusPoints = (5 - room.currentQuestion) * 200;
      player.score += bonusPoints;
      room.themeGuesses.set(socket.id, true);
      
      io.to(roomId).emit('themeGuessed', {
        playerId: socket.id,
        playerName: player.name,
        score: player.score
      });
    }
  });

  socket.on('nextQuestion', ({ roomId }) => {
    const room = gameRooms.get(roomId);
    if (!room || room.host !== socket.id) return;

    room.currentQuestion++;
    if (room.currentQuestion >= room.game.questions.length) {
      room.gameState = 'finished';
      io.to(roomId).emit('gameFinished', {
        players: Array.from(room.players.values()),
        theme: room.game.theme
      });
    } else {
      io.to(roomId).emit('nextQuestion', {
        question: room.game.questions[room.currentQuestion],
        questionNumber: room.currentQuestion + 1
      });
    }
  });

  socket.on('disconnect', () => {
    // Clean up rooms and players
    gameRooms.forEach((room, roomId) => {
      if (room.host === socket.id) {
        gameRooms.delete(roomId);
      } else {
        room.players.delete(socket.id);
        if (room.players.size === 0) {
          gameRooms.delete(roomId);
        } else {
          io.to(roomId).emit('playerLeft', {
            players: Array.from(room.players.values())
          });
        }
      }
    });
  });
});

const PORT = process.env.PORT || 5001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 