import { v4 as uuidv4 } from 'uuid';

const PLAYER_ID_KEY = 'trivia_player_id';

export function getOrCreatePlayerId(): string {
  let playerId = sessionStorage.getItem(PLAYER_ID_KEY);
  
  if (!playerId) {
    playerId = uuidv4();
    sessionStorage.setItem(PLAYER_ID_KEY, playerId);
  }
  
  return playerId;
}

export function clearPlayerId(): void {
  sessionStorage.removeItem(PLAYER_ID_KEY);
} 