import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import { Home } from './pages/Home';
import { GameRoom } from './pages/GameRoom';
import { websocketService } from './services/websocket';

// Create a theme instance
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

function App() {
  // Connect to WebSocket server when the app starts
  React.useEffect(() => {
    websocketService.connect(process.env.REACT_APP_WEBSOCKET_URL || 'ws://localhost:5000');
    return () => {
      websocketService.disconnect();
    };
  }, []);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/game/:roomId" element={<GameRoom />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
