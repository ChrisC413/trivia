import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Grid,
  List,
  ListItem,
  ListItemText,
  Chip,
  CircularProgress,
  Alert,
} from '@mui/material';
import { QRCodeSVG } from 'qrcode.react';
import { websocketService } from '../services/websocket';
import { errorService } from '../services/errorService';
import { GameStatus } from '../components/GameStatus';
import { HostView } from '../components/HostView';
import { GameEvent, Player, Question, Room } from '../types';

export const GameRoom: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const [room, setRoom] = useState<Room | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [questionNumber, setQuestionNumber] = useState(0);
  const [answer, setAnswer] = useState('');
  const [themeGuess, setThemeGuess] = useState('');
  const [gameState, setGameState] = useState<'waiting' | 'playing' | 'finished'>('waiting');
  const [isHost, setIsHost] = useState(false);
  const [error, setError] = useState('');
  const [gameUrl, setGameUrl] = useState('');
  const [currentPlayerId, setCurrentPlayerId] = useState('');
  const [roomIdState, setRoomId] = useState<string>('');

  useEffect(() => {
    // Get room ID from URL path
    const pathSegments = window.location.pathname.split('/');
    const urlRoomId = pathSegments[pathSegments.length - 1];
    
    console.log('Initializing game room with URL room ID:', urlRoomId);
    
    if (!urlRoomId) {
      console.error('No room ID found in URL, redirecting to home');
      window.location.href = '/trivia';
      return;
    }

    setRoomId(urlRoomId);
    setGameUrl(`${window.location.origin}/trivia/game/${urlRoomId}`);

    const handleEvent = (event: GameEvent) => {
      try {
        console.log('Game room received event:', event.type, event);
        switch (event.type) {
          case 'roomCreated':
            console.log('Setting game URL:', `${window.location.origin}/trivia/game/${event.roomId}`);
            setGameUrl(`${window.location.origin}/trivia/game/${event.roomId}`);
            break;
          case 'playerJoined':
            console.log('Updating room with new players:', event.players);
            if (room) {
              setRoom({
                ...room,
                players: event.players
              });
            }
            break;
          case 'gameStarted':
            console.log('Game started:', event);
            setRoom(prev => {
              if (!prev) return null;
              return {
                ...prev,
                gameState: 'playing',
                currentQuestion: event.questionNumber,
                questionStartTime: event.startTime
              };
            });
            break;
          case 'playerScored':
            console.log('Player scored:', event);
            setRoom(prev => {
              if (!prev) return null;
              const updatedPlayers = prev.players.map(p =>
                p.id === event.playerId
                  ? { ...p, score: event.score, lastAnswerTime: event.answerTime }
                  : p
              );
              return { ...prev, players: updatedPlayers };
            });
            break;
          case 'nextQuestion':
            console.log('Next question:', event);
            setRoom(prev => {
              if (!prev) return null;
              return {
                ...prev,
                currentQuestion: event.questionNumber,
                questionStartTime: event.startTime
              };
            });
            break;
          case 'gameFinished':
            console.log('Game finished:', event);
            setRoom(prev => {
              if (!prev) return null;
              return {
                ...prev,
                gameState: 'finished',
                players: prev.players.map(p =>
                  p.id === event.winner.id ? { ...p, score: event.winner.score } : p
                )
              };
            });
            break;
          case 'error':
            console.error('Game room error:', event.message);
            setError(event.message);
            if (event.message.includes('Room not found') || event.message.includes('Invalid room')) {
              console.log('Critical error, redirecting to home');
              window.location.href = '/trivia';
            }
            break;
        }
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        console.error('Error handling game event:', error);
        errorService.logError(error);
        setError('An unexpected error occurred');
      }
    };

    console.log('Setting up WebSocket event listener');
    const unsubscribe = websocketService.onEvent(handleEvent);
    return () => {
      console.log('Cleaning up WebSocket event listener');
      unsubscribe();
    };
  }, [room]);

  const handleSubmitAnswer = () => {
    if (!roomId || !answer.trim()) return;
    try {
      websocketService.submitAnswer(roomId, answer.trim());
      setAnswer('');
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      errorService.logError(error);
      setError('Failed to submit answer. Please try again.');
    }
  };

  const handleSubmitThemeGuess = () => {
    if (!roomId || !themeGuess.trim()) return;
    try {
      websocketService.submitThemeGuess(roomId, themeGuess);
      setThemeGuess('');
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      errorService.logError(error);
      setError('Failed to submit theme guess. Please try again.');
    }
  };

  const handleStartGame = () => {
    if (!roomId) return;
    try {
      websocketService.startGame(roomId, room?.game.id || '');
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      errorService.logError(error);
      setError('Failed to start game. Please try again.');
    }
  };

  const handleNextQuestion = () => {
    if (!roomId) return;
    try {
      websocketService.nextQuestion(roomId);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      errorService.logError(error);
      setError('Failed to advance to next question. Please try again.');
    }
  };

  const handleEndGame = () => {
    if (!roomId) return;
    try {
      websocketService.endGame(roomId);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      errorService.logError(error);
      setError('Failed to end game. Please try again.');
    }
  };

  const handleClearCache = () => {
    errorService.clearLocalCache();
    window.location.reload();
  };

  if (!room) {
    return (
      <Container>
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="md">
      <Box sx={{ mt: 4 }}>
        {error && (
          <Alert 
            severity="error" 
            sx={{ mb: 2 }}
            action={
              <Button color="inherit" size="small" onClick={handleClearCache}>
                Clear Cache
              </Button>
            }
          >
            {error}
          </Alert>
        )}

        <Grid container spacing={3}>
          <Grid item xs={12}>
            <GameStatus room={room} currentPlayerId={currentPlayerId} />
          </Grid>

          {room.gameState === 'waiting' && (
            <Grid item xs={12}>
              <Paper sx={{ p: 3, textAlign: 'center' }}>
                <Typography variant="h6" gutterBottom>
                  Game URL
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2, mb: 2 }}>
                  <Typography>{gameUrl}</Typography>
                  <QRCodeSVG value={gameUrl} size={100} />
                </Box>
                {isHost && (
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handleStartGame}
                    disabled={room.players.length < 2}
                  >
                    Start Game
                  </Button>
                )}
              </Paper>
            </Grid>
          )}

          {room.gameState === 'playing' && isHost && (
            <Grid item xs={12}>
              <HostView
                room={room}
                onNextQuestion={handleNextQuestion}
                onEndGame={handleEndGame}
              />
            </Grid>
          )}

          {room.gameState === 'playing' && !isHost && (
            <Grid item xs={12}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Question {room.currentQuestion} of {room.game.questions.length}
                </Typography>
                <Typography variant="h5" gutterBottom>
                  {room.game.questions[room.currentQuestion - 1].question}
                </Typography>
                <Box sx={{ mt: 2 }}>
                  <TextField
                    fullWidth
                    label="Your Answer"
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSubmitAnswer()}
                  />
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handleSubmitAnswer}
                    sx={{ mt: 2 }}
                  >
                    Submit Answer
                  </Button>
                </Box>
              </Paper>
            </Grid>
          )}

          {room.gameState === 'playing' && !isHost && (
            <Grid item xs={12}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Guess the Theme
                </Typography>
                <Box sx={{ mt: 2 }}>
                  <TextField
                    fullWidth
                    label="Theme Guess"
                    value={themeGuess}
                    onChange={(e) => setThemeGuess(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSubmitThemeGuess()}
                  />
                  <Button
                    variant="contained"
                    color="secondary"
                    onClick={handleSubmitThemeGuess}
                    sx={{ mt: 2 }}
                  >
                    Submit Theme Guess
                  </Button>
                </Box>
              </Paper>
            </Grid>
          )}

          {room.gameState === 'finished' && (
            <Grid item xs={12}>
              <Paper sx={{ p: 3, textAlign: 'center' }}>
                <Typography variant="h5" gutterBottom>
                  Game Over!
                </Typography>
                <Typography variant="h6" gutterBottom>
                  Winner: {room.players.sort((a, b) => b.score - a.score)[0].name}
                </Typography>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => navigate('/')}
                  sx={{ mt: 2 }}
                >
                  Back to Home
                </Button>
              </Paper>
            </Grid>
          )}
        </Grid>
      </Box>
    </Container>
  );
}; 