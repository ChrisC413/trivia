import express from 'express';
import { triviaService } from '../services/triviaService';
// import { TriviaSet } from '@trivia-game/shared';

const router = express.Router();

// Get all trivia sets
router.get('/', async (req, res) => {
  try {
    const sets = await triviaService.getAllTriviaSets();
    res.json(sets);
  } catch (error) {
    console.error('Error getting trivia sets:', error);
    res.status(500).json({ error: 'Failed to get trivia sets' });
  }
});

// Get a specific trivia set
router.get('/:id', async (req, res) => {
  try {
    const set = await triviaService.getTriviaSet(req.params.id);
    if (!set) {
      res.status(404).json({ error: 'Trivia set not found' });
      return;
    }
    res.json(set);
  } catch (error) {
    console.error('Error getting trivia set:', error);
    res.status(500).json({ error: 'Failed to get trivia set' });
  }
});

// Create a new trivia set
router.post('/', async (req, res) => {
  try {
    const newSet = await triviaService.createTriviaSet(req.body);
    res.status(201).json(newSet);
  } catch (error) {
    console.error('Error creating trivia set:', error);
    res.status(500).json({ error: 'Failed to create trivia set' });
  }
});

// Update a trivia set
router.put('/:id', async (req, res) => {
  try {
    const updatedSet = await triviaService.updateTriviaSet(req.params.id, req.body);
    if (!updatedSet) {
      res.status(404).json({ error: 'Trivia set not found' });
      return;
    }
    res.json(updatedSet);
  } catch (error) {
    console.error('Error updating trivia set:', error);
    res.status(500).json({ error: 'Failed to update trivia set' });
  }
});

// Delete a trivia set
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await triviaService.deleteTriviaSet(req.params.id);
    if (!deleted) {
      res.status(404).json({ error: 'Trivia set not found' });
      return;
    }
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting trivia set:', error);
    res.status(500).json({ error: 'Failed to delete trivia set' });
  }
});

// Update rating
router.put('/:id/rating', async (req, res) => {
  try {
    const { rating } = req.body;
    const updatedSet = await triviaService.updateRating(req.params.id, rating);
    if (!updatedSet) {
      res.status(404).json({ error: 'Trivia set not found' });
      return;
    }
    res.json(updatedSet);
  } catch (error) {
    console.error('Error updating rating:', error);
    res.status(500).json({ error: 'Failed to update rating' });
  }
});

export default router; 