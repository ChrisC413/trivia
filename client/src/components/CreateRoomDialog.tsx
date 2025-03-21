import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button
} from '@mui/material';
import { TriviaSetSelector } from './TriviaSetSelector';
import { Game } from '../shared-types';

interface CreateRoomDialogProps {
  open: boolean;
  onClose: () => void;
  onGameSelected: (game: Game) => void;
  isCreatingRoom: boolean;
}

export const CreateRoomDialog: React.FC<CreateRoomDialogProps> = ({
  open,
  onClose,
  onGameSelected,
  isCreatingRoom
}) => {
  const handleClose = () => {
    if (!isCreatingRoom) {
      onClose();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>Select Trivia Set</DialogTitle>
      <DialogContent>
        <TriviaSetSelector
          open={open}
          onClose={handleClose}
          onSelect={onGameSelected}
        />
      </DialogContent>
      <DialogActions>
        <Button
          onClick={handleClose}
          disabled={isCreatingRoom}
        >
          Cancel
        </Button>
      </DialogActions>
    </Dialog>
  );
}; 