import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Box, CircularProgress, Alert, Typography } from '@mui/material';
import { websocketService } from '../services/websocket';
import { Room } from '@trivia-game/shared';
import { GameEvent } from '../types';
import { Player } from '../types';
import { HostView } from '../components/HostView';
import { PlayerView } from '../components/PlayerView';
import { PlayerNamePrompt } from '../components/PlayerNamePrompt';


export const GameRoom: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [room, setRoom] = useState<Room | null>(null);
  const { roomId } = useParams();
  const [isConnecting, setIsConnecting] = useState(true);
  const [error, setError] = useState('');
  const [isJoiningRoom, setIsJoiningRoom] = useState(false);
  const [showNamePrompt, setShowNamePrompt] = useState(false);
  const [isHost, setIsHost] = useState(false);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [playerName, setPlayerName] = useState<string | null>(null);

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

    const handleEvent = (event: GameEvent) => {
      try {
        console.log('Received event:', event.type, event);
        switch (event.type) {
          case 'connected':
            console.log('WebSocket connection established, enabling buttons');
            setIsConnecting(false);
            setError('');
            break;
          case 'disconnected':
            console.log('WebSocket disconnected, disabling buttons');
            setIsConnecting(true);
            setError('Connection lost. Attempting to reconnect...');
            break;
          case 'roomCreated':
            console.log('Room created event received:', event);
            // Navigate to game room
            break;
          case 'playerJoined':
            console.log('Player joined event received:', event);
            setIsJoiningRoom(false);
            break;
          // case 'getRoom':
          //   console.log('getRoom event received:', event);
          //   handleRoomData(event);
          //   break;
          case 'error':
            console.error('Error event received:', event.message);
            setError(event.message);
            setIsJoiningRoom(false);
            if (event.message.includes('connect')) {
              setIsConnecting(true);
            }
            break;
        }
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        console.error('Error in event handler:', error);
        setError('An unexpected error occurred. Please try again.');
        setIsJoiningRoom(false);
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

    const unsubscribe = websocketService.onEvent(handleEvent);

    async function loadRoom() {
      if (!roomId) {
        console.error("Room ID is not provided");
        return;
      }
      if (!websocketService.isConnected()) {
        console.error("WebSocket is not connected");
        return;
      }
      websocketService.joinRoom(roomId, "somePlayer");
      const room = await websocketService.getRoom(roomId);
      handleRoomData({ room });
      
    }
    if (isLoading) {
      loadRoom();
    }

  }, [room, isLoading, roomId, isConnecting, isHost]);

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
      {/* {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )} */}

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