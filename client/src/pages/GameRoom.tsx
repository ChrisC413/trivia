import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Box, CircularProgress, Alert, Typography } from '@mui/material';
import { WebSocketService } from '../services/websocket';
import { Player } from '../types';
import { HostView } from '../components/HostView';
import { PlayerView } from '../components/PlayerView';
import { PlayerNamePrompt } from '../components/PlayerNamePrompt';
import { Room } from '@trivia-game/shared';

export const GameRoom: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const [room, setRoom] = useState<Room | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [isHost, setIsHost] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showNamePrompt, setShowNamePrompt] = useState(false);
  const [playerName, setPlayerName] = useState<string | null>(null);
  
  // Create a new instance of WebSocketService
  const websocketService = new WebSocketService();

  const handleNameSubmit = (name: string) => {
    setPlayerName(name);
    setShowNamePrompt(false);
    setIsLoading(true);
    // Join the room with the provided name
    try {
      // websocketService.joinRoom(roomId!, name);
      setIsLoading(false);
      setShowNamePrompt(true);
    } catch (err) {
      console.error('Failed to join room:', err);
      setError('Failed to join room. Please try again.');
    }
  };

  useEffect(() => {
    if (!roomId) return;

    const initializeRoom = async () => {
      console.log('Initializing room:', roomId);
      try {
        console.log('Calling websocketService.getRoom with roomId:', roomId);
        setRoom(await websocketService.getRoom(roomId));
        console.log('Successfully fetched room data');
        setIsLoading(false);
        if (room) {
          handleRoomData({ room: room });
          setIsLoading(false);
        }
      } catch (err) {
        console.error('Failed to get room data:', err);
        setError('Failed to load room data. Please try again.');
      }
    };

    if (isLoading) {
      initializeRoom();
    }

    const handlePlayerJoined = (data: { players: Player[] }) => {
      console.log('Player joined event received:', data);
      setRoom(prevRoom => {
        if (!prevRoom) return null;
        return { ...prevRoom, players: data.players };
      });
      // Only set playerId for non-host players when they first join
      if (!playerId && !isHost && playerName) {
        const currentPlayer = data.players.find(p => p.name === playerName);
        if (currentPlayer) {
          setPlayerId(currentPlayer.id);
          setIsLoading(false);
        }
      }
    };

    const handleRoomData = (data: { room: Room }) => {
      console.log('Handling Room Data:', data);
      setRoom(data.room);

      // Check if current user is the host
      const currentPlayerId = websocketService.getPlayerId();
      if (data.room.host === currentPlayerId) {
        console.log('Current player is the host');
        setIsHost(true);
        setIsLoading(false);
      } else {
        console.log('Current player is a guest');
        setShowNamePrompt(true);
        setIsLoading(false);
      }
    };

    const handlePlayerNameSubmitted = (event: { name: string }) => {
      console.log(`Player name came back: ${event.name}`);
      setShowNamePrompt(false);
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
    console.log('Setting up websocket event listeners');
    websocketService.on('playerNameSubmitted', handlePlayerNameSubmitted);
    websocketService.on('roomData', handleRoomData);
    websocketService.on('playerJoined', handlePlayerJoined);
    websocketService.on('error', handleError);

    return () => {
      console.log('Cleaning up websocket event listeners');
      websocketService.off('playerNameSubmitted', handlePlayerNameSubmitted);
      websocketService.off('roomData', handleRoomData);
      websocketService.off('playerJoined', handlePlayerJoined);
      websocketService.off('error', handleError);
    };
  }, [roomId, playerId, isHost, playerName, room,isLoading, websocketService]);

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

  function handleEndGame(): void {
    throw new Error('Function not implemented.');
  }

  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
      <Typography variant="h6" align="center" gutterBottom>
        Game Room
      </Typography>

      <PlayerNamePrompt open={showNamePrompt} onSubmit={handleNameSubmit} />

      {!isLoading && room && (
        <>
          {isHost ? (
            <HostView room={room} onEndGame={handleEndGame} onError={setError} />
          ) : (
            playerId && <PlayerView room={room} playerId={playerId} onError={setError} />
          )}
        </>
      )}
    </Box>
  );
};
