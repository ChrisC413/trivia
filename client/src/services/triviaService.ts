import { Game } from '../types';

// In a real application, this would be an API call to your backend
const STORAGE_KEY = 'trivia_sets';

const RANDOM_NAMES = [
  'Fun Facts Fiesta',
  'Brain Teaser Bonanza',
  'Knowledge Quest',
  'Trivia Time Machine',
  'Mind Bender Marathon',
  'Quiz Quest',
  'Brainstorm Bonanza',
  'Knowledge Nuggets',
  'Trivia Treasure Hunt',
  'Brain Teaser Bash',
  'Quiz Carnival',
  'Knowledge Kingdom',
  'Trivia Time Travel',
  'Brain Buster Blast',
  'Quiz Quest Adventure',
];

export interface TriviaSet {
  id: string;
  name: string;
  theme: string;
  questions: Array<{
    question: string;
    answer: string;
  }>;
  createdAt: string;
  rating: number;
}

export const triviaService = {
  getRandomName(): string {
    return RANDOM_NAMES[Math.floor(Math.random() * RANDOM_NAMES.length)];
  },

  saveTriviaSet(triviaSet: Omit<TriviaSet, 'id' | 'createdAt' | 'rating'>): TriviaSet {
    const existingSets = this.getTriviaSets();
    const newSet: TriviaSet = {
      ...triviaSet,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString(),
      rating: 0,
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify([...existingSets, newSet]));
    return newSet;
  },

  getTriviaSets(): TriviaSet[] {
    const sets = localStorage.getItem(STORAGE_KEY);
    return sets ? JSON.parse(sets) : [];
  },

  getTriviaSet(id: string): TriviaSet | undefined {
    const sets = this.getTriviaSets();
    return sets.find(set => set.id === id);
  },

  updateRating(id: string, rating: number): void {
    const sets = this.getTriviaSets();
    const updatedSets = sets.map(set => (set.id === id ? { ...set, rating } : set));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedSets));
  },

  convertToGame(triviaSet: TriviaSet): Game {
    return {
      id: triviaSet.id,
      name: triviaSet.name,
      theme: triviaSet.theme,
      questions: triviaSet.questions,
    };
  },
};
