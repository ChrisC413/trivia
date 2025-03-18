# Trivia Game Server

This is the WebSocket server for the trivia game application.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Start the server:
```bash
# For production
npm start

# For development (with auto-reload)
npm run dev
```

The server will start on port 5000 by default. You can change this by setting the `PORT` environment variable.

## Environment Variables

- `PORT`: The port number to run the server on (default: 5000)

## API Endpoints

The server provides WebSocket endpoints for:

- Room creation and management
- Player joining and leaving
- Game state management
- Answer submission
- Theme guessing
- Score tracking

## Development

The server uses nodemon in development mode to automatically restart when files change. 