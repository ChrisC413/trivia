import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Button,
  Paper,
  Grid,
  CircularProgress,
  Alert,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';
import QRCode from 'qrcode.react';
import { websocketService } from '../services/websocket';
import { Room, GameEvent } from '../types';

export const HostView: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const [room, setRoom] = useState<Room | null>(null);
  const [error, setError] = useState<string>('');
  const [gameUrl, setGameUrl] = useState<string>('');

  useEffect(() => {
    if (!roomId) {
      setError('No room ID provided');
      return;
    }

    console.log('Initializing host view for room:', roomId);
    setGameUrl(`${window.location.origin}/trivia/game/${roomId}`);

    const handleEvent = (event: GameEvent) => {
      console.log('Host received event:', event.type, event);
      try {
        switch (event.type) {
          case 'playerJoined':
            setRoom(prevRoom => ({
              ...prevRoom!,
              players: event.players
            }));
            break;
          case 'gameStarted':
            setRoom(prevRoom => ({
              ...prevRoom!,
              gameState: 'playing',
              currentQuestion: event.questionNumber,
              questionStartTime: event.startTime
            }));
            break;
          case 'playerScored':
            setRoom(prevRoom => {
              if (!prevRoom) return null;
              const updatedPlayers = prevRoom.players.map(p =>
                p.id === event.playerId
                  ? { ...p, score: event.score, lastAnswerTime: event.answerTime }
                  : p
              );
              return { ...prevRoom, players: updatedPlayers };
            });
            break;
          case 'error':
            setError(event.message);
            break;
        }
      } catch (err) {
        console.error('Error handling event:', err);
        setError('An unexpected error occurred');
      }
    };

    const unsubscribe = websocketService.onEvent(handleEvent);
    return () => unsubscribe();
  }, [roomId]);

  const handleStartGame = () => {
    if (!room) return;
    websocketService.startGame(roomId!, room.game.id);
  };

  const handleNextQuestion = () => {
    websocketService.nextQuestion(roomId!);
  };

  const handleEndGame = () => {
    websocketService.endGame(roomId!);
  };

  if (!roomId) {
    return (
      <Container>
        <Alert severity="error">No room ID provided</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h4" gutterBottom>
                Game Room: {roomId}
              </Typography>
              
              <Box sx={{ mt: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Join URL:
                </Typography>
                <Typography variant="body1" sx={{ wordBreak: 'break-all', mb: 2 }}>
                  {gameUrl}
                </Typography>
                {room && room.gameState === 'playing' && (
                  <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                    <QRCode value={gameUrl} size={200} level="H" />
                  </Box>
                )}
              </Box>

              <Box sx={{ mt: 3 }}>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleStartGame}
                  disabled={!room || room.gameState === 'playing'}
                  sx={{ mr: 2 }}
                >
                  Start Game
                </Button>
                <Button
                  variant="contained"
                  onClick={handleNextQuestion}
                  disabled={!room || room.gameState !== 'playing'}
                  sx={{ mr: 2 }}
                >
                  Next Question
                </Button>
                <Button
                  variant="contained"
                  color="error"
                  onClick={handleEndGame}
                  disabled={!room || room.gameState !== 'playing'}
                >
                  End Game
                </Button>
              </Box>
            </Paper>
          </Grid>

          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Players
              </Typography>
              {room ? (
                <List>
                  {room.players.map((player) => (
                    <ListItem key={player.id}>
                      <ListItemText
                        primary={player.name}
                        secondary={`Score: ${player.score}`}
                      />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <CircularProgress />
              )}
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
}; 