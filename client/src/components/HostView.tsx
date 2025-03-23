import {
  Box,
  Paper,
  Typography,
  Button,
  List,
  ListItem,
  ListItemText,
  Grid,
  Chip,
  LinearProgress,
  Container,
  Snackbar,
} from '@mui/material';
import { Room } from '@trivia-game/shared';
import React, { useState, useEffect } from 'react';
import ShareLink from './ShareLinks';
import { websocketService } from '../services/websocket';

interface HostViewProps {
  room: Room;
  onEndGame: () => void;
  onError: (error: string) => void;
}

export const HostView: React.FC<HostViewProps> = ({ room, onEndGame, onError }) => {

  const [gameUrl, setGameUrl] = useState<string>(window.location.href);
  const [showCopiedNotification, setShowCopiedNotification] = useState(false);


  const currentQuestion = room.currentQuestion;
  const timeElapsed = room.questionStartTime ? (Date.now() - room.questionStartTime) / 1000 : 0;
  const maxTime = 30; // 30 seconds per question
  const progress = Math.min(timeElapsed / maxTime, 1);
  const timeRemaining = Math.max(maxTime - timeElapsed, 0);


  function onNextQuestion(): void {
    throw new Error('Function not implemented.');
  }

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(gameUrl);
      setShowCopiedNotification(true);
    } catch (err) {
      console.error('Failed to copy link:', err);
      onError('Failed to copy link to clipboard');
    }
  };

  const handleBeginGame = () => {
    try {
      websocketService.beginGame(room.id);
      console.log('Game has started');
    } catch (error) {
      console.error('Error starting game:', error);
      onError('Failed to start the game');
    }
  };

  return (
    <Container maxWidth="lg">
    <Box sx={{ mt: 4 }}>
      <Grid container spacing={3}>
        {/* Share with Players */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Share with Players:
            </Typography>
            <ShareLink gameUrl={gameUrl} onCopy={handleCopyLink} />
          </Paper>
        </Grid>

        {/* Player List */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Players
            </Typography>
            <List>
              {room.players.map(player => (
                <ListItem key={player.id}>
                  <ListItemText
                    primary={player.name}
                    // secondary={
                    //   <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    //     <Chip label={`Score: ${player.score}`} color="primary" size="small" />
                    //     {player.lastAnswerTime && (
                    //       <Chip
                    //         label={player.lastAnswerCorrect ? 'Correct' : 'Incorrect'}
                    //         color={player.lastAnswerCorrect ? 'success' : 'error'}
                    //         size="small"
                    //       />
                    //     )}
                    //   </Box>
                    // }
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>

        {/* Theme Guesses */}
        {/* <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Theme Guesses
            </Typography>
            <List>
              {room.players
                // .filter(p => p.themeGuess)
                .map(player => (
                  <ListItem key={player.id}>
                    <ListItemText
                      primary={player.name}
                      // secondary={
                      //   <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      //     <Typography variant="body2">Guess: {player.themeGuess}</Typography>
                      //     {player.themeGuessCorrect !== undefined && (
                      //       <Chip
                      //         label={player.themeGuessCorrect ? 'Correct' : 'Incorrect'}
                      //         color={player.themeGuessCorrect ? 'success' : 'error'}
                      //         size="small"
                      //       />
                      //     )}
                      //   </Box>
                      // }
                    />
                  </ListItem>
                ))}
            </List>
          </Paper>
        </Grid> */}

        {/* Current Question */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Question {room.currentQuestion} of { "??"}
            </Typography>
            <Typography variant="h5" gutterBottom>
              {currentQuestion}
            </Typography>
            <Typography variant="body1" color="text.secondary" gutterBottom>
              Answer: {"not provided"}
            </Typography>
            <Box sx={{ mt: 2 }}>
              <LinearProgress
                variant="determinate"
                value={progress * 100}
                color={progress > 0.8 ? 'error' : 'primary'}
                sx={{ height: 8, borderRadius: 4 }}
              />
              <Typography variant="caption" color="text.secondary">
                Time Remaining: {timeRemaining.toFixed(1)}s
              </Typography>
            </Box>
            <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
              <Button
                variant="contained"
                color="primary"
                onClick={handleBeginGame}
              >
                Begin Game
              </Button>
              <Button
                variant="contained"
                color="primary"
                onClick={onNextQuestion}
                disabled={room.remainingQuestions === 0}
              >
                Next Question
              </Button>
              <Button variant="outlined" color="error" onClick={onEndGame}>
                End Game
              </Button>
            </Box>
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
