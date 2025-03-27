import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Alert,
} from '@mui/material';
import { websocketService } from '../services/websocket';

interface PlayerNamePromptProps {
  open: boolean;
  onSubmit: (name: string) => void;
}

export const PlayerNamePrompt: React.FC<PlayerNamePromptProps> = ({ open, onSubmit }) => {
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false); // New state to track submission

  
  const handleSubmit = () => {
    if (!name.trim()) {
      setError('Please enter your name');
      return;
    }
    websocketService.submitPlayerName(name.trim());
    onSubmit(name.trim());

  };

  return (
    <Dialog
      open={open}
      disableEscapeKeyDown
      sx={{
        '& .MuiBackdrop-root': {
          pointerEvents: 'none',
        },
      }}
    >
      <DialogTitle>Enter Your Name</DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        <TextField
          autoFocus
          fullWidth
          label="Your Name"
          value={name}
          onChange={e => {
            setName(e.target.value);
            setError('');
          }}
          onKeyPress={e => {
            if (e.key === 'Enter') {
              handleSubmit();
            }
          }}
          sx={{ mt: 1 }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleSubmit} variant="contained">
          Join Game
        </Button>
      </DialogActions>
    </Dialog>
  );
};
