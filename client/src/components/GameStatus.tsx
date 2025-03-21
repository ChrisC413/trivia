import React, { useState, useEffect } from 'react';
import {
  Paper,
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  LinearProgress,
} from '@mui/material';

import { Room } from '../shared-types';

interface GameStatusProps {
  room: Room;
  currentPlayerId: string;
}

export const GameStatus: React.FC<GameStatusProps> = ({ room, currentPlayerId }) => {
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [currentScore, setCurrentScore] = useState(room.maxScore);

  useEffect(() => {
    if (room.gameState !== 'playing' || !room.questionStartTime) return;

    const timer = setInterval(() => {
      const elapsed = (Date.now() - room.questionStartTime!) / 1000;
      setTimeElapsed(elapsed);

      // Calculate current possible score
      const scoreDeduction = Math.floor(elapsed / 5) * (room.maxScore * 0.1);
      const newScore = Math.max(0, room.maxScore - scoreDeduction);
      setCurrentScore(newScore);
    }, 1000);

    return () => clearInterval(timer);
  }, [room.gameState, room.questionStartTime, room.maxScore]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const sortedPlayers = [...room.players].sort((a, b) => b.score - a.score);

  return (
    <Paper sx={{ p: 2, mb: 2 }}>
      <Box sx={{ mb: 2 }}>
        <Typography variant="h6" gutterBottom>
          Time Elapsed: {formatTime(timeElapsed)}
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Current Question Score: {Math.round(currentScore)} points
        </Typography>
        <LinearProgress
          variant="determinate"
          value={(currentScore / room.maxScore) * 100}
          sx={{ height: 8, borderRadius: 4 }}
        />
      </Box>

      <Typography variant="h6" gutterBottom>
        Leaderboard
      </Typography>
      <List dense>
        {sortedPlayers.map(player => (
          <ListItem
            key={player.id}
            sx={{
              bgcolor: player.id === currentPlayerId ? 'action.selected' : 'transparent',
              borderRadius: 1,
            }}
          >
            <ListItemText
              primary={
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    mb: 1,
                  }}
                >
                  <Typography>
                    {player.name}
                    {player.id === room.host && ' (Host)'}
                  </Typography>
                  <Typography>{player.score} points</Typography>
                </Box>
              }
              // secondary={
              //   player.lastAnswerTime && (
              //     <Typography variant="caption" color="text.secondary">
              //       Last answer: {formatTime((Date.now() - player.lastAnswerTime) / 1000)} ago
              //       {player.lastAnswerCorrect ? ' ✓' : ' ✗'}
              //     </Typography>
              //   )
              // }
            />
          </ListItem>
        ))}
      </List>
    </Paper>
  );
};
