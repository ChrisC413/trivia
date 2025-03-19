import { Socket, io as Client } from 'socket.io-client';
import { sampleGames } from './constants/sampleGames';
import { server } from '../src';
import { RoomResponse } from '../src/types';

describe('Game Room', () => {
  let clientSocket: Socket;

  beforeAll((done) => {
    clientSocket = Client('http://localhost:5001');
    clientSocket.on('connect', done);
  });

  afterAll(() => {
    clientSocket.close();
    server.close();
  });

  test('creates a room with sample game', (done) => {
    clientSocket.emit('createRoom', { 
      gameId: sampleGames[0].id,
      playerName: 'Test Host' 
    });

    clientSocket.on('roomCreated', (data: { roomId: string; room: RoomResponse }) => {
      expect(data.room.host).toBe(clientSocket.id);
      expect(data.room.players.length).toBe(1);
      expect(data.room.players[0].name).toBe('Test Host');
      expect(data.room.gameState).toBe('waiting');
      done();
    });
  });
}); 