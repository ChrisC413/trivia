import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Button,
  TextField,
  Paper,
  Grid,
  Fab,
  Snackbar,
  Alert,
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { websocketService } from '../services/websocket';
import { CreateTriviaSet } from '../components/CreateTriviaSet';
import { TriviaSetSelector } from '../components/TriviaSetSelector';
import { triviaService, TriviaSet } from '../services/triviaService';

export const Home: React.FC = () => {
  const navigate = useNavigate();
  const [roomId, setRoomId] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [error, setError] = useState('');
  const [createTriviaSetOpen, setCreateTriviaSetOpen] = useState(false);
  const [selectTriviaSetOpen, setSelectTriviaSetOpen] = useState(false);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({
    open: false,
    message: '',
    severity: 'success',
  });

  const handleCreateRoom = () => {
    if (!playerName) {
      setError('Please enter your name');
      return;
    }
    setSelectTriviaSetOpen(true);
  };

  const handleJoinRoom = () => {
    if (!roomId || !playerName) {
      setError('Please enter both room ID and your name');
      return;
    }
    websocketService.joinRoom(roomId, playerName);
    navigate(`/game/${roomId}`);
  };

  const handleCreateTriviaSet = (triviaSet: Omit<TriviaSet, 'id' | 'createdAt' | 'rating'>) => {
    try {
      triviaService.saveTriviaSet(triviaSet);
      setSnackbar({
        open: true,
        message: 'Trivia set created successfully!',
        severity: 'success',
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Failed to create trivia set',
        severity: 'error',
      });
    }
  };

  const handleSelectTriviaSet = (triviaSet: TriviaSet) => {
    setSelectTriviaSetOpen(false);
    websocketService.createRoom();
    // TODO: Pass the selected trivia set to the game room
    navigate(`/game/${roomId}`);
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 8, mb: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom align="center">
          Trivia Game
        </Typography>
        <Typography variant="h6" align="center" color="text.secondary" paragraph>
          Create a new game room or join an existing one
        </Typography>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <TextField
              fullWidth
              label="Your Name"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              margin="normal"
              required
            />
            {error && (
              <Typography color="error" sx={{ mt: 1 }}>
                {error}
              </Typography>
            )}
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Create New Game
            </Typography>
            <Button
              fullWidth
              variant="contained"
              color="primary"
              onClick={handleCreateRoom}
            >
              Create Room
            </Button>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Join Existing Game
            </Typography>
            <TextField
              fullWidth
              label="Room ID"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              margin="normal"
              required
            />
            <Button
              fullWidth
              variant="contained"
              color="secondary"
              onClick={handleJoinRoom}
              sx={{ mt: 2 }}
            >
              Join Room
            </Button>
          </Paper>
        </Grid>
      </Grid>

      <Fab
        color="primary"
        variant="extended"
        sx={{ position: 'fixed', bottom: 16, right: 16 }}
        onClick={() => setCreateTriviaSetOpen(true)}
      >
        <AddIcon sx={{ mr: 1 }} />
        Create Trivia Set
      </Fab>

      <CreateTriviaSet
        open={createTriviaSetOpen}
        onClose={() => setCreateTriviaSetOpen(false)}
        onSubmit={handleCreateTriviaSet}
      />

      <TriviaSetSelector
        open={selectTriviaSetOpen}
        onClose={() => setSelectTriviaSetOpen(false)}
        onSelect={handleSelectTriviaSet}
      />

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}; 