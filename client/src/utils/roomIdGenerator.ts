import { ADJECTIVES, FUNNY_WORDS, NOUNS } from '../constants/words';

function getRandomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

export function generateRoomId(): string {
  const adjective = getRandomElement(ADJECTIVES);
  const funnyWord = getRandomElement(FUNNY_WORDS);
  const noun = getRandomElement(NOUNS);

  return `${adjective}${funnyWord}${noun}`;
}
