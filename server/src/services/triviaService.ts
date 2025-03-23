import fs from 'fs/promises';
import path from 'path';
import { Game } from '../types';
import { TriviaSet } from '@trivia-game/shared';

const TRIVIA_SETS_DIR = path.join(__dirname, '../../data/trivia-sets');


export class TriviaService {
  private async ensureDirectoryExists() {
    try {
      await fs.access(TRIVIA_SETS_DIR);
    } catch {
      await fs.mkdir(TRIVIA_SETS_DIR, { recursive: true });
    }
  }


  private async readTriviaSets(): Promise<TriviaSet[]> {
    await this.ensureDirectoryExists();
    const files = await fs.readdir(TRIVIA_SETS_DIR);
    const sets = await Promise.all(
      files
        .filter(file => file.endsWith('.json'))
        .map(async file => {
          const content = await fs.readFile(path.join(TRIVIA_SETS_DIR, file), 'utf-8');
          return JSON.parse(content);
        })
    );
    return sets;
  }

  private async writeTriviaSet(set: TriviaSet): Promise<void> {
    await this.ensureDirectoryExists();
    const filePath = path.join(TRIVIA_SETS_DIR, `${set.id}.json`);
    await fs.writeFile(filePath, JSON.stringify(set, null, 2));
  }

  async getAllTriviaSets(): Promise<TriviaSet[]> {
    return this.readTriviaSets();
  }

  async getTriviaSet(id: string): Promise<TriviaSet | null> {
    const sets = await this.readTriviaSets();
    return sets.find(set => set.id === id) || null;
  }

  async createTriviaSet(set: Omit<TriviaSet, 'id' | 'createdAt' | 'rating'>): Promise<TriviaSet> {
    const newSet: TriviaSet = {
      ...set,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString(),
      rating: 0
    };

    await this.writeTriviaSet(newSet);
    return newSet;
  }

  async updateTriviaSet(id: string, updates: Partial<TriviaSet>): Promise<TriviaSet | null> {
    const set = await this.getTriviaSet(id);
    if (!set) return null;

    const updatedSet = { ...set, ...updates };
    await this.writeTriviaSet(updatedSet);
    return updatedSet;
  }

  async deleteTriviaSet(id: string): Promise<boolean> {
    const filePath = path.join(TRIVIA_SETS_DIR, `${id}.json`);
    try {
      await fs.unlink(filePath);
      return true;
    } catch {
      return false;
    }
  }

  async updateRating(id: string, rating: number): Promise<TriviaSet | null> {
    return this.updateTriviaSet(id, { rating });
  }

  convertToGame(triviaSet: TriviaSet): Game {
    return {
      id: triviaSet.id,
      name: triviaSet.name,
      theme: triviaSet.theme,
      questions: triviaSet.questions
    };
  }
}

export const triviaService = new TriviaService(); 