import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Card,
  CardContent,
  Typography,
  Rating,
  Grid,
  Chip,
} from '@mui/material';
import { triviaService } from '../services/triviaService';
import { TriviaSet } from '../../../shared/types';

interface TriviaSetSelectorProps {
  open: boolean;
  onClose: () => void;
  onSelect: (triviaSet: TriviaSet) => void;
}

export const TriviaSetSelector: React.FC<TriviaSetSelectorProps> = ({
  open,
  onClose,
  onSelect,
}) => {
  const [triviaSets, setTriviaSets] = useState<TriviaSet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTriviaSets = async () => {
      try {
        const sets = await triviaService.getTriviaSets();
        setTriviaSets(sets);
      } catch (err) {
        setError('Failed to load trivia sets.');
      } finally {
        setLoading(false);
      }
    };

    if (open) {
      fetchTriviaSets();
    }
  }, [open]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Select a Trivia Set</DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 2 }}>
          {loading ? (
            <Typography color="text.secondary" align="center">
              Loading trivia sets...
            </Typography>
          ) : error ? (
            <Typography color="error" align="center">
              {error}
            </Typography>
          ) : triviaSets.length === 0 ? (
            <Typography color="text.secondary" align="center">
              No trivia sets available. Create one first!
            </Typography>
          ) : (
            <Grid container spacing={2}>
              {triviaSets.map(set => (
                <Grid item xs={12} sm={6} key={set.id}>
                  <Card
                    sx={{
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      cursor: 'pointer',
                      '&:hover': {
                        boxShadow: 6,
                      },
                    }}
                    onClick={() => onSelect(set)}
                  >
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        {set.name}
                      </Typography>
                      <Typography color="text.secondary" gutterBottom>
                        Theme: {set.theme}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <Rating value={set.rating} readOnly size="small" />
                        <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                          ({set.rating})
                        </Typography>
                      </Box>
                      <Chip
                        label={`${set.questions.length} questions`}
                        size="small"
                        sx={{ mr: 1 }}
                      />
                      <Chip
                        label={`Created ${formatDate(set.createdAt)}`}
                        size="small"
                        variant="outlined"
                      />
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
      </DialogActions>
    </Dialog>
  );
};
