const { v4: uuidv4 } = require('uuid');
const { sendToClient, sendToRoom, saveRoom, getRoom, deleteRoom } = require('./utils');

const createRoom = async (event) => {
  const connectionId = event.requestContext.connectionId;
  const roomId = uuidv4();
  
  const room = {
    roomId,
    host: connectionId,
    players: [{
      id: connectionId,
      name: 'Host',
      score: 0
    }],
    gameState: 'waiting',
    currentQuestion: 0,
    game: null,
    themeGuesses: {}
  };
  
  await saveRoom(room);
  await sendToClient(connectionId, { type: 'roomCreated', roomId });
  
  return { statusCode: 200 };
};

const joinRoom = async (event) => {
  const connectionId = event.requestContext.connectionId;
  const { roomId, playerName } = JSON.parse(event.body);
  
  const room = await getRoom(roomId);
  if (!room) {
    await sendToClient(connectionId, { type: 'error', message: 'Room not found' });
    return { statusCode: 404 };
  }
  
  const player = {
    id: connectionId,
    name: playerName,
    score: 0
  };
  
  room.players.push(player);
  
  await saveRoom(room);
  await sendToRoom(roomId, {
    type: 'playerJoined',
    players: room.players
  });
  
  return { statusCode: 200 };
};

const disconnect = async (event) => {
  const connectionId = event.requestContext.connectionId;
  
  // Find all rooms where this connection is either host or player
  const rooms = await getAllRooms();
  for (const room of rooms) {
    if (room.host === connectionId) {
      // If host disconnects, delete the room
      await deleteRoom(room.roomId);
      await sendToRoom(room.roomId, { type: 'roomDeleted' });
    } else {
      // If player disconnects, remove them from the room
      room.players = room.players.filter(p => p.id !== connectionId);
      if (room.players.length === 0) {
        await deleteRoom(room.roomId);
      } else {
        await saveRoom(room);
        await sendToRoom(room.roomId, {
          type: 'playerLeft',
          players: room.players
        });
      }
    }
  }
  
  return { statusCode: 200 };
};

module.exports = {
  createRoom,
  joinRoom,
  disconnect
}; 