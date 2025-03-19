import React, { useState, useEffect } from 'react';
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
  IconButton,
  Snackbar,
  Tooltip,
} from '@mui/material';
import QRCode from 'qrcode.react';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { websocketService } from '../services/websocket';
import { Room, GameEvent } from '../types';

interface HostViewProps {
  room: Room;
  onError: (error: string) => void;
}

export const HostView: React.FC<HostViewProps> = ({ room: initialRoom, onError }) => {
  const [room, setRoom] = useState<Room>(initialRoom);
  const [gameUrl, setGameUrl] = useState<string>('');
  const [showCopiedNotification, setShowCopiedNotification] = useState(false);

  useEffect(() => {
    if (!room.id) {
      onError('No room ID provided');
      return;
    }

    console.log('Initializing host view for room:', room.id);
    setGameUrl(`${window.location.origin}/trivia/game/${room.id}`);

    const handleEvent = (event: GameEvent) => {
      console.log('Host received event:', event.type, event);
      try {
        switch (event.type) {
          case 'playerJoined':
            setRoom(prevRoom => ({
              ...prevRoom,
              players: event.players,
            }));
            break;
          case 'gameStarted':
            setRoom(prevRoom => ({
              ...prevRoom,
              gameState: 'playing',
              currentQuestion: event.questionNumber,
              questionStartTime: event.startTime,
            }));
            break;
          case 'playerScored':
            setRoom(prevRoom => {
              const updatedPlayers = prevRoom.players.map(p =>
                p.id === event.playerId
                  ? { ...p, score: event.score, lastAnswerTime: event.answerTime }
                  : p
              );
              return { ...prevRoom, players: updatedPlayers };
            });
            break;
          case 'error':
            onError(event.message);
            break;
        }
      } catch (err) {
        console.error('Error handling event:', err);
        onError('An unexpected error occurred');
      }
    };

    const unsubscribe = websocketService.onEvent(handleEvent);
    return () => unsubscribe();
  }, [room.id, onError]);

  const handleStartGame = () => {
    websocketService.startGame(room.id, room.game.id);
  };

  const handleNextQuestion = () => {
    websocketService.nextQuestion(room.id);
  };

  const handleEndGame = () => {
    websocketService.endGame(room.id);
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(gameUrl);
      setShowCopiedNotification(true);
    } catch (err) {
      console.error('Failed to copy link:', err);
      onError('Failed to copy link to clipboard');
    }
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h4" gutterBottom>
                Game Room: {room.id}
              </Typography>

              <Box sx={{ mt: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Share with Players:
                </Typography>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    mb: 2,
                    p: 2,
                    bgcolor: 'grey.100',
                    borderRadius: 1,
                  }}
                >
                  <Typography
                    variant="body1"
                    sx={{
                      flexGrow: 1,
                      fontFamily: 'monospace',
                      wordBreak: 'break-all',
                    }}
                  >
                    {gameUrl}
                  </Typography>
                  <Tooltip title="Copy link">
                    <IconButton onClick={handleCopyLink} size="small">
                      <ContentCopyIcon />
                    </IconButton>
                  </Tooltip>
                </Box>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    mb: 2,
                    p: 2,
                    bgcolor: 'grey.100',
                    borderRadius: 1,
                  }}
                >
                  <QRCode
                    value={gameUrl}
                    size={200}
                    level="H"
                    includeMargin={true}
                    style={{ background: 'white', padding: '1rem' }}
                  />
                </Box>
              </Box>

              <Box sx={{ mt: 3 }}>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleStartGame}
                  disabled={room.gameState === 'playing'}
                  sx={{ mr: 2 }}
                >
                  Start Game
                </Button>
                <Button
                  variant="contained"
                  onClick={handleNextQuestion}
                  disabled={room.gameState !== 'playing'}
                  sx={{ mr: 2 }}
                >
                  Next Question
                </Button>
                <Button
                  variant="contained"
                  color="error"
                  onClick={handleEndGame}
                  disabled={room.gameState !== 'playing'}
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
              <List>
                {room.players.map(player => (
                  <ListItem key={player.id}>
                    <ListItemText primary={player.name} secondary={`Score: ${player.score}`} />
                  </ListItem>
                ))}
              </List>
            </Paper>
          </Grid>
        </Grid>
      </Box>

      <Snackbar
        open={showCopiedNotification}
        autoHideDuration={2000}
        onClose={() => setShowCopiedNotification(false)}
        message="Link copied to clipboard!"
      />
    </Container>
  );
};
