import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Alert,
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { websocketService } from '../services/websocket';
import { errorService } from '../services/errorService';
import { CreateTriviaSet } from '../components/CreateTriviaSet';
import { TriviaSetSelector } from '../components/TriviaSetSelector';
import { Game, GameEvent } from '../types';
import { triviaService } from '../services/triviaService';

export const Home: React.FC = () => {
  const navigate = useNavigate();
  const [playerName, setPlayerName] = useState('');
  const [roomId, setRoomId] = useState('');
  const [error, setError] = useState('');
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const [isJoiningRoom, setIsJoiningRoom] = useState(false);
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showJoinDialog, setShowJoinDialog] = useState(false);
  const [showCreateTriviaSet, setShowCreateTriviaSet] = useState(false);
  const [isConnecting, setIsConnecting] = useState(true);

  useEffect(() => {
    // Connect to WebSocket server when component mounts
    console.log('Setting up WebSocket event handlers...');
    setIsConnecting(true); // Ensure buttons are disabled while connecting

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
            setIsCreatingRoom(false);
            setRoomId(event.roomId);
            // Navigate to game room
            navigate(`/game/${event.roomId}`);
            break;
          case 'playerJoined':
            console.log('Player joined event received:', event);
            if (event.players.some(p => p.name === playerName)) {
              console.log('Current player joined successfully, redirecting to game room');
              navigate(`/game/${roomId}`);
            }
            setIsJoiningRoom(false);
            break;
          case 'error':
            console.error('Error event received:', event.message);
            setError(event.message);
            setIsCreatingRoom(false);
            setIsJoiningRoom(false);
            if (event.message.includes('connect')) {
              setIsConnecting(true);
            }
            break;
        }
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        console.error('Error in event handler:', error);
        errorService.logError(error);
        setError('An unexpected error occurred. Please try again.');
        setIsCreatingRoom(false);
        setIsJoiningRoom(false);
      }
    };

    const unsubscribe = websocketService.onEvent(handleEvent);

    // Cleanup function
    return () => {
      console.log('Cleaning up event handlers...');
      unsubscribe();
    };
  }, []); // Empty dependency array since we want this effect to run only once on mount

  const handleCreateRoom = () => {
    if (!playerName.trim()) {
      setError('Please enter your name');
      return;
    }
    if (!selectedGame) {
      setError('Please select a trivia set');
      return;
    }
    try {
      console.log('Creating room with game:', selectedGame.id);
      setIsCreatingRoom(true);
      setError('');
      websocketService.createRoom(selectedGame.id, playerName.trim());
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      console.error('Error creating room:', error);
      errorService.logError(error);
      setError('Failed to create room. Please try again.');
      setIsCreatingRoom(false);
    }
  };

  const handleJoinRoom = () => {
    if (!playerName.trim()) {
      setError('Please enter your name');
      return;
    }
    if (!roomId.trim()) {
      setError('Please enter a room ID');
      return;
    }
    try {
      setIsJoiningRoom(true);
      setError('');
      websocketService.joinRoom(roomId, playerName);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      errorService.logError(error);
      setError('Failed to join room. Please try again.');
      setIsJoiningRoom(false);
    }
  };

  const handleGameSelected = (game: Game) => {
    console.log('Game selected:', game);
    setSelectedGame(game);
    setShowCreateDialog(false);
    // Create room immediately after game selection
    if (game) {
      try {
        console.log('Creating room with game:', game.id);
        setIsCreatingRoom(true);
        setError('');
        websocketService.createRoom(game.id, playerName.trim());
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        console.error('Error creating room:', error);
        errorService.logError(error);
        setError('Failed to create room. Please try again.');
        setIsCreatingRoom(false);
      }
    }
  };

  const handleCreateTriviaSet = async (data: {
    name: string;
    theme: string;
    questions: { question: string; answer: string }[];
  }) => {
    try {
      await triviaService.saveTriviaSet(data);
      setShowCreateTriviaSet(false);
      setError('Trivia set created successfully!');
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      errorService.logError(error);
      setError('Failed to create trivia set. Please try again.');
    }
  };

  return (
    <Container maxWidth="md">
      <Box sx={{ mt: 4 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h5" gutterBottom>
                Welcome to Trivia Game!
              </Typography>
              <Box sx={{ mt: 2 }}>
                <TextField
                  fullWidth
                  label="Your Name"
                  value={playerName}
                  onChange={e => setPlayerName(e.target.value)}
                  sx={{ mb: 2 }}
                />
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={() => setShowCreateDialog(true)}
                    disabled={!playerName.trim() || isCreatingRoom || isConnecting}
                  >
                    {isCreatingRoom ? <CircularProgress size={24} /> : 'Create Room'}
                  </Button>
                  <Button
                    variant="outlined"
                    color="primary"
                    onClick={() => setShowJoinDialog(true)}
                    disabled={!playerName.trim() || isJoiningRoom || isConnecting}
                  >
                    {isJoiningRoom ? <CircularProgress size={24} /> : 'Join Room'}
                  </Button>
                </Box>
              </Box>
            </Paper>
          </Grid>
        </Grid>

        <Dialog
          open={showCreateDialog}
          onClose={() => {
            setShowCreateDialog(false);
            setSelectedGame(null);
            setIsCreatingRoom(false);
          }}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>Select Trivia Set</DialogTitle>
          <DialogContent>
            <TriviaSetSelector
              open={showCreateDialog}
              onClose={() => {
                setShowCreateDialog(false);
                setSelectedGame(null);
                setIsCreatingRoom(false);
              }}
              onSelect={handleGameSelected}
            />
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => {
                setShowCreateDialog(false);
                setSelectedGame(null);
                setIsCreatingRoom(false);
              }}
            >
              Cancel
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog open={showJoinDialog} onClose={() => setShowJoinDialog(false)}>
          <DialogTitle>Join Room</DialogTitle>
          <DialogContent>
            <TextField
              fullWidth
              label="Room ID"
              value={roomId}
              onChange={e => setRoomId(e.target.value)}
              sx={{ mt: 2 }}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowJoinDialog(false)}>Cancel</Button>
            <Button
              onClick={handleJoinRoom}
              variant="contained"
              disabled={!roomId.trim() || !playerName.trim() || isJoiningRoom}
            >
              {isJoiningRoom ? <CircularProgress size={24} /> : 'Join'}
            </Button>
          </DialogActions>
        </Dialog>

        <CreateTriviaSet
          open={showCreateTriviaSet}
          onClose={() => setShowCreateTriviaSet(false)}
          onSubmit={handleCreateTriviaSet}
        />

        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => setShowCreateTriviaSet(true)}
          sx={{ position: 'fixed', bottom: 16, right: 16 }}
        >
          Create Trivia Set
        </Button>
      </Box>
    </Container>
  );
};
