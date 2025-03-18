import React, { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Grid,
  Alert,
  CircularProgress
} from '@mui/material';
import { Room } from '../types';
import { websocketService } from '../services/websocket';
import { errorService } from '../services/errorService';
import { GameStatus } from '../components/GameStatus';

interface PlayerViewProps {
  room: Room;
  playerId: string;
  onError: (error: string) => void;
}

export const PlayerView: React.FC<PlayerViewProps> = ({ room, playerId, onError }) => {
  const [answer, setAnswer] = useState('');
  const [themeGuess, setThemeGuess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmitAnswer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!answer.trim()) return;

    try {
      setIsSubmitting(true);
      await websocketService.submitAnswer(room.id, answer.trim());
      setAnswer('');
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      onError(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitThemeGuess = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!themeGuess.trim()) return;

    try {
      setIsSubmitting(true);
      await websocketService.submitThemeGuess(room.id, themeGuess.trim());
      setThemeGuess('');
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      onError(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!room) {
    return <CircularProgress />;
  }

  return (
    <Box>
      <GameStatus room={room} currentPlayerId={playerId} />
      
      {room.gameState === 'waiting' && (
        <Paper sx={{ p: 3, mt: 2 }}>
          <Typography variant="h6" align="center">
            Waiting for host to start the game...
          </Typography>
          <Typography variant="body1" align="center" color="text.secondary">
            Get ready to play!
          </Typography>
        </Paper>
      )}

      {room.gameState === 'playing' && (
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Question {room.currentQuestion}:
              </Typography>
              <Typography variant="body1" gutterBottom>
                {room.game.questions[room.currentQuestion - 1].question}
              </Typography>
              <Box sx={{ mt: 2 }}>
                <TextField
                  fullWidth
                  label="Your Answer"
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  disabled={isSubmitting}
                  sx={{ mb: 2 }}
                />
                <Button
                  variant="contained"
                  onClick={handleSubmitAnswer}
                  disabled={!answer.trim() || isSubmitting}
                  fullWidth
                >
                  {isSubmitting ? <CircularProgress size={24} /> : 'Submit Answer'}
                </Button>
              </Box>
            </Paper>
          </Grid>

          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Think you know the theme?
              </Typography>
              <TextField
                fullWidth
                label="Theme Guess"
                value={themeGuess}
                onChange={(e) => setThemeGuess(e.target.value)}
                disabled={isSubmitting}
                sx={{ mb: 2 }}
              />
              <Button
                variant="outlined"
                onClick={handleSubmitThemeGuess}
                disabled={!themeGuess.trim() || isSubmitting}
                fullWidth
              >
                {isSubmitting ? <CircularProgress size={24} /> : 'Submit Theme Guess'}
              </Button>
            </Paper>
          </Grid>
        </Grid>
      )}

      {room.gameState === 'finished' && (
        <Paper sx={{ p: 3, mt: 2 }}>
          <Typography variant="h5" align="center" gutterBottom>
            Game Over!
          </Typography>
          <Typography variant="h6" align="center" color="primary">
            The theme was: {room.game.theme}
          </Typography>
          <Box sx={{ mt: 2 }}>
            <Typography variant="body1" align="center">
              Winner: {room.players.reduce((a, b) => a.score > b.score ? a : b).name}
            </Typography>
          </Box>
        </Paper>
      )}
    </Box>
  );
}; 