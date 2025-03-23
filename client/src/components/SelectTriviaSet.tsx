import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button
} from '@mui/material';
import { TriviaSetSelector } from './TriviaSetSelector';

interface SelectTriviaSetDialogProps {
  open: boolean;
  onClose: () => void;
  onGameSelected: (triviaSetId: string) => void;
  isCreatingRoom: boolean;
}

export const SelectTriviaSetDialog: React.FC<SelectTriviaSetDialogProps> = ({
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

  const handleTriviaSetSelected = (triviaSet: { id: string }) => {
    onGameSelected(triviaSet.id);
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
          onSelect={handleTriviaSetSelected}
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