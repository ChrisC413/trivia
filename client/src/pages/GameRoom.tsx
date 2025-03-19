import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Box, CircularProgress, Alert } from '@mui/material';
import { websocketService } from '../services/websocket';
import { Room, Player, Question } from '../types';
import { HostView } from './HostView';
import { PlayerView } from './PlayerView';
import { PlayerNamePrompt } from '../components/PlayerNamePrompt';

interface GameEvent {
  roomId: string;
  room: Room;
  playerId?: string;
  type?: string;
  message?: string;
}

export const GameRoom: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const [room, setRoom] = useState<Room | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [isHost, setIsHost] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showNamePrompt, setShowNamePrompt] = useState(false);
  const [playerName, setPlayerName] = useState<string | null>(null);

  const handleNameSubmit = (name: string) => {
    setPlayerName(name);
    setShowNamePrompt(false);
    setIsLoading(true);
    // Join the room with the provided name
    try {
      websocketService.joinRoom(roomId!, name);
    } catch (err) {
      console.error('Failed to join room:', err);
      setError('Failed to join room. Please try again.');
      setIsLoading(false);
      setShowNamePrompt(true);
    }
  };

  useEffect(() => {
    if (!roomId) return;

    const handleRoomCreated = (data: { roomId: string; room: Room }) => {
      setRoom(data.room);
      setPlayerId(data.room.host);
      setIsLoading(false);
      setIsHost(true);
    };

    const handlePlayerJoined = (data: { players: Player[] }) => {
      if (room) {
        setRoom({ ...room, players: data.players });
        // Only set playerId for non-host players when they first join
        if (!playerId && !isHost && playerName) {
          const currentPlayer = data.players.find(p => p.name === playerName);
          if (currentPlayer) {
            setPlayerId(currentPlayer.id);
            setIsLoading(false);
          }
        }
      }
    };

    const handleRoomData = (data: { room: Room }) => {
      console.log('Received room data:', data);
      setRoom(data.room);

      // Check if current user is the host
      const currentPlayerId = websocketService.getPlayerId();
      if (data.room.host === currentPlayerId) {
        setIsHost(true);
        setPlayerId(currentPlayerId);
        setIsLoading(false);
      } else if (!playerName) {
        // If not host and no player name, show name prompt
        setShowNamePrompt(true);
        setIsLoading(false);
      }
    };

    const handleGameStarted = (data: { question: Question; questionNumber: number }) => {
      if (room) {
        setRoom({
          ...room,
          gameState: 'playing',
          currentQuestion: data.questionNumber - 1,
        });
      }
    };

    const handleError = (error: { message: string }) => {
      console.error('Received error:', error);
      setError(error.message);
      setIsLoading(false);
      if (error.message.includes('not found')) {
        setShowNamePrompt(false);
      }
    };

    // Set up event listeners
    websocketService.on('roomCreated', handleRoomCreated);
    websocketService.on('playerJoined', handlePlayerJoined);
    websocketService.on('roomData', handleRoomData);
    websocketService.on('gameStarted', handleGameStarted);
    websocketService.on('error', handleError);

    // Get initial room state
    const initializeRoom = async () => {
      try {
        await websocketService.getRoom(roomId);
      } catch (err) {
        console.error('Failed to get room data:', err);
        setError('Failed to load room data. Please try again.');
        setIsLoading(false);
      }
    };

    initializeRoom();

    return () => {
      websocketService.off('roomCreated', handleRoomCreated);
      websocketService.off('playerJoined', handlePlayerJoined);
      websocketService.off('roomData', handleRoomData);
      websocketService.off('gameStarted', handleGameStarted);
      websocketService.off('error', handleError);
    };
  }, [roomId, playerId, isHost, playerName, room]);

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  if (!room) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <Alert severity="error">{error || 'Unable to join game room. Please try again.'}</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <PlayerNamePrompt open={showNamePrompt} onSubmit={handleNameSubmit} />

      {isHost ? (
        <HostView room={room} onError={setError} />
      ) : playerName && playerId ? (
        <PlayerView room={room} playerId={playerId} onError={setError} />
      ) : (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
          <CircularProgress />
        </Box>
      )}
    </Box>
  );
};
