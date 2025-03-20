import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  IconButton,
  Typography,
  Paper,
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon, Refresh as RefreshIcon } from '@mui/icons-material';
import { triviaService } from '../services/triviaService';
import { TriviaSet } from '../../../shared/types';

interface Question {
  question: string;
  answer: string;
}

interface CreateTriviaSetProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (triviaSet: Omit<TriviaSet, 'id' | 'createdAt' | 'rating'>) => void;
}

export const CreateTriviaSet: React.FC<CreateTriviaSetProps> = ({ open, onClose, onSubmit }) => {
  const [name, setName] = useState('');
  const [theme, setTheme] = useState('');
  const [questions, setQuestions] = useState<Question[]>([{ question: '', answer: '' }]);

  useEffect(() => {
    if (open) {
      setName(triviaService.getRandomName());
    }
  }, [open]);

  const handleAddQuestion = () => {
    setQuestions([...questions, { question: '', answer: '' }]);
  };

  const handleRemoveQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const handleQuestionChange = (index: number, field: keyof Question, value: string) => {
    const newQuestions = [...questions];
    newQuestions[index] = { ...newQuestions[index], [field]: value };
    setQuestions(newQuestions);
  };

  const handleSubmit = () => {
    if (!name || !theme || questions.some(q => !q.question || !q.answer)) {
      return;
    }

    onSubmit({
      name,
      theme,
      questions: questions.filter(q => q.question && q.answer),
    });

    // Reset form
    setName('');
    setTheme('');
    setQuestions([{ question: '', answer: '' }]);
    onClose();
  };

  const handleNewRandomName = () => {
    setName(triviaService.getRandomName());
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Create New Trivia Set</DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <TextField
              fullWidth
              label="Trivia Set Name"
              value={name}
              onChange={e => setName(e.target.value)}
              margin="normal"
              required
            />
            <IconButton onClick={handleNewRandomName} color="primary" sx={{ mt: 2 }}>
              <RefreshIcon />
            </IconButton>
          </Box>
          <TextField
            fullWidth
            label="Theme"
            value={theme}
            onChange={e => setTheme(e.target.value)}
            margin="normal"
            required
          />

          <Typography variant="h6" sx={{ mt: 3, mb: 2 }}>
            Questions
          </Typography>

          {questions.map((q, index) => (
            <Paper key={index} sx={{ p: 2, mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                <Box sx={{ flex: 1 }}>
                  <TextField
                    fullWidth
                    label={`Question ${index + 1}`}
                    value={q.question}
                    onChange={e => handleQuestionChange(index, 'question', e.target.value)}
                    margin="normal"
                    required
                  />
                  <TextField
                    fullWidth
                    label={`Answer ${index + 1}`}
                    value={q.answer}
                    onChange={e => handleQuestionChange(index, 'answer', e.target.value)}
                    margin="normal"
                    required
                  />
                </Box>
                {questions.length > 1 && (
                  <IconButton
                    onClick={() => handleRemoveQuestion(index)}
                    color="error"
                    sx={{ mt: 2 }}
                  >
                    <DeleteIcon />
                  </IconButton>
                )}
              </Box>
            </Paper>
          ))}

          <Button startIcon={<AddIcon />} onClick={handleAddQuestion} sx={{ mt: 2 }}>
            Add Question
          </Button>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          color="primary"
          disabled={!name || !theme || questions.some(q => !q.question || !q.answer)}
        >
          Create Trivia Set
        </Button>
      </DialogActions>
    </Dialog>
  );
};
