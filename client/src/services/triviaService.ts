import { TriviaSet } from '../../../shared/types';
const API_URL = 'http://localhost:5001/api/trivia'; // Adjust the URL as needed

export const triviaService = {
  async getRandomName(): Promise<string> {
    const response = await fetch(`${API_URL}/random-name`);
    if (!response.ok) {
      throw new Error('Failed to fetch random name');
    }
    return response.json();
  },

  async saveTriviaSet(triviaSet: Omit<TriviaSet, 'id' | 'createdAt' | 'rating'>): Promise<TriviaSet> {
    const response = await fetch(`${API_URL}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(triviaSet),
    });

    if (!response.ok) {
      throw new Error('Failed to save trivia set');
    }
    return response.json();
  },

  async getTriviaSets(): Promise<TriviaSet[]> {
    const response = await fetch(`${API_URL}/`);
    if (!response.ok) {
      throw new Error('Failed to fetch trivia sets');
    }
    return response.json();
  },

  async getTriviaSet(id: string): Promise<TriviaSet | undefined> {
    const response = await fetch(`${API_URL}/trivia-sets/${id}`);
    if (!response.ok) {
      throw new Error('Failed to fetch trivia set');
    }
    return response.json();
  },

  async updateRating(id: string, rating: number): Promise<void> {
    const response = await fetch(`${API_URL}/trivia-sets/${id}/rating`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ rating }),
    });

    if (!response.ok) {
      throw new Error('Failed to update rating');
    }
  },
};