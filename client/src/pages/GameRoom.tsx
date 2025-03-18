import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Box, CircularProgress, Alert } from '@mui/material';
import { websocketService } from '../services/websocket';
import { Room, Player, Question } from '../types';
import { HostView } from './HostView';
import { PlayerView } from './PlayerView';

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
        if (!playerId && !isHost) {
          const currentPlayer = data.players.find(p => !p.isHost);
          if (currentPlayer) {
            setPlayerId(currentPlayer.id);
          }
        }
      }
    };

    const handleGameStarted = (data: { question: Question; questionNumber: number }) => {
      if (room) {
        setRoom({
          ...room,
          gameState: 'playing',
          currentQuestion: data.questionNumber - 1
        });
      }
    };

    const handleGameUpdated = (event: GameEvent) => {
      if (event.roomId === roomId) {
        setRoom(event.room);
      }
    };

    const handleGameEnded = (event: GameEvent) => {
      if (event.roomId === roomId) {
        setRoom(event.room);
      }
    };

    const handleError = (error: { message: string }) => {
      setError(error.message);
      setIsLoading(false);
    };

    // Set up event listeners
    websocketService.on('roomCreated', handleRoomCreated);
    websocketService.on('playerJoined', handlePlayerJoined);
    websocketService.on('gameStarted', handleGameStarted);
    websocketService.on('gameUpdated', handleGameUpdated);
    websocketService.on('gameEnded', handleGameEnded);
    websocketService.on('error', handleError);

    // Get initial room state
    const initializeRoom = async () => {
      try {
        const roomData = await websocketService.getRoom(roomId);
        setRoom(roomData);
        
        // Check if current user is the host
        const currentPlayerId = websocketService.getPlayerId();
        if (roomData.host === currentPlayerId) {
          setIsHost(true);
          setPlayerId(currentPlayerId);
        } else {
          // If not host, must be a player
          const player = roomData.players.find(p => p.id === currentPlayerId);
          if (player) {
            setPlayerId(player.id);
          }
        }
        setIsLoading(false);
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
      websocketService.off('gameStarted', handleGameStarted);
      websocketService.off('gameUpdated', handleGameUpdated);
      websocketService.off('gameEnded', handleGameEnded);
      websocketService.off('error', handleError);
    };
  }, [roomId]);

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  if (!room || !playerId) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <Alert severity="error">
          {error || 'Unable to join game room. Please try again.'}
        </Alert>
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
      
      {isHost ? (
        <HostView room={room} onError={setError} />
      ) : (
        <PlayerView room={room} playerId={playerId} onError={setError} />
      )}
    </Box>
  );
}; 