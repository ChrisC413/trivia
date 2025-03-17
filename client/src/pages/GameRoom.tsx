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
} from '@mui/material';
import { QRCodeSVG } from 'qrcode.react';
import { websocketService } from '../services/websocket';
import { GameEvent, Player, Question } from '../types';

export const GameRoom: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const [players, setPlayers] = useState<Player[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [questionNumber, setQuestionNumber] = useState(0);
  const [answer, setAnswer] = useState('');
  const [gameState, setGameState] = useState<'waiting' | 'playing' | 'finished'>('waiting');
  const [isHost, setIsHost] = useState(false);
  const [error, setError] = useState('');
  const [gameUrl, setGameUrl] = useState('');

  useEffect(() => {
    if (!roomId) {
      navigate('/');
      return;
    }

    // Set up WebSocket event handlers
    const unsubscribe = websocketService.onEvent((event: GameEvent) => {
      switch (event.type) {
        case 'roomCreated':
          setIsHost(true);
          setGameUrl(`${window.location.origin}/game/${event.roomId}`);
          break;
        case 'playerJoined':
          setPlayers(event.players);
          break;
        case 'gameStarted':
          setCurrentQuestion(event.question);
          setQuestionNumber(event.questionNumber);
          setGameState('playing');
          break;
        case 'playerScored':
          setPlayers(prev => prev.map(p => 
            p.id === event.playerId ? { ...p, score: event.score } : p
          ));
          break;
        case 'themeGuessed':
          setPlayers(prev => prev.map(p => 
            p.id === event.playerId ? { ...p, score: event.score } : p
          ));
          break;
        case 'nextQuestion':
          setCurrentQuestion(event.question);
          setQuestionNumber(event.questionNumber);
          setAnswer('');
          break;
        case 'gameFinished':
          setGameState('finished');
          setPlayers(event.players);
          break;
        case 'playerLeft':
          setPlayers(event.players);
          break;
        case 'roomDeleted':
          navigate('/');
          break;
        case 'error':
          setError(event.message);
          break;
      }
    });

    return () => {
      unsubscribe();
    };
  }, [roomId, navigate]);

  const handleSubmitAnswer = () => {
    if (!roomId || !answer.trim()) return;
    websocketService.submitAnswer(roomId, answer.trim());
    setAnswer('');
  };

  const handleSubmitThemeGuess = () => {
    if (!roomId || !answer.trim()) return;
    websocketService.submitThemeGuess(roomId, answer.trim());
    setAnswer('');
  };

  const handleStartGame = () => {
    if (!roomId) return;
    websocketService.startGame(roomId, '1'); // Using sample game ID for now
  };

  const handleNextQuestion = () => {
    if (!roomId) return;
    websocketService.nextQuestion(roomId);
  };

  return (
    <Container maxWidth="md">
      <Box sx={{ mt: 4 }}>
        <Grid container spacing={3}>
          {/* Game URL and QR Code */}
          <Grid item xs={12}>
            <Paper sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography variant="body1" sx={{ flex: 1 }}>
                Game URL: {gameUrl}
              </Typography>
              {gameUrl && (
                <QRCodeSVG value={gameUrl} size={100} />
              )}
            </Paper>
          </Grid>

          {/* Players List */}
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Players
              </Typography>
              <List>
                {players.map((player) => (
                  <ListItem key={player.id}>
                    <ListItemText
                      primary={player.name}
                      secondary={`Score: ${player.score}`}
                    />
                  </ListItem>
                ))}
              </List>
            </Paper>
          </Grid>

          {/* Game Area */}
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 3 }}>
              {gameState === 'waiting' && isHost && (
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h6" gutterBottom>
                    Waiting for players...
                  </Typography>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handleStartGame}
                  >
                    Start Game
                  </Button>
                </Box>
              )}

              {gameState === 'playing' && currentQuestion && (
                <Box>
                  <Typography variant="h6" gutterBottom>
                    Question {questionNumber} of 5
                  </Typography>
                  <Typography variant="h5" gutterBottom>
                    {currentQuestion.question}
                  </Typography>
                  <Box sx={{ mt: 2 }}>
                    <TextField
                      fullWidth
                      label="Your Answer"
                      value={answer}
                      onChange={(e) => setAnswer(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSubmitAnswer()}
                    />
                    <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
                      <Button
                        variant="contained"
                        color="primary"
                        onClick={handleSubmitAnswer}
                      >
                        Submit Answer
                      </Button>
                      <Button
                        variant="outlined"
                        color="secondary"
                        onClick={handleSubmitThemeGuess}
                      >
                        Guess Theme
                      </Button>
                    </Box>
                  </Box>
                  {isHost && (
                    <Button
                      variant="contained"
                      color="secondary"
                      onClick={handleNextQuestion}
                      sx={{ mt: 2 }}
                    >
                      Next Question
                    </Button>
                  )}
                </Box>
              )}

              {gameState === 'finished' && (
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h5" gutterBottom>
                    Game Over!
                  </Typography>
                  <Typography variant="h6" gutterBottom>
                    Final Scores:
                  </Typography>
                  <List>
                    {players
                      .sort((a, b) => b.score - a.score)
                      .map((player) => (
                        <ListItem key={player.id}>
                          <ListItemText
                            primary={player.name}
                            secondary={`Score: ${player.score}`}
                          />
                        </ListItem>
                      ))}
                  </List>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={() => navigate('/')}
                    sx={{ mt: 2 }}
                  >
                    Play Again
                  </Button>
                </Box>
              )}
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
}; 