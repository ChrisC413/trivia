# Trivia Game

A multiplayer trivia game where players answer questions to guess a theme and score points. Built with React, TypeScript, and AWS CDK.

## Features

- Create and join game rooms
- Real-time multiplayer gameplay
- QR code sharing for easy room joining
- Theme guessing with bonus points
- Responsive design for mobile and desktop
- Host controls for game progression

## Prerequisites

- Node.js 22 or later
- AWS CLI configured with appropriate credentials
- AWS CDK CLI installed globally (`npm install -g aws-cdk`)

## Project Structure

```
trivia/
├── bin/                    # CDK app entry point
├── lib/                    # CDK stack definition
├── handlers/              # Lambda function handlers
├── client/               # React frontend application
└── cdk.json              # CDK configuration
```

## Setup

1. Install dependencies:
   ```bash
   # Install backend dependencies
   npm install

   # Install frontend dependencies
   cd client
   npm install
   ```

2. Configure environment variables:
   Create a `.env` file in the client directory:
   ```
   REACT_APP_WEBSOCKET_URL=wss://your-api-gateway-url
   ```

3. Deploy the backend:
   ```bash
   # Deploy CDK stack
   npm run deploy
   ```

4. Update the WebSocket URL:
   After deployment, update the `REACT_APP_WEBSOCKET_URL` in the client's `.env` file with the URL from the CDK output.

5. Deploy the frontend to GitHub Pages:
   ```bash
   cd client
   npm run deploy
   ```

## Development

1. Start the development server:
   ```bash
   # Start the frontend development server
   cd client
   npm start
   ```

2. The application will be available at `http://localhost:3000`

## Game Rules

1. The host creates a game room and shares the link/QR code with players
2. Players join the room and wait for the host to start the game
3. Each game has 5 questions that provide clues about a theme
4. Players can submit answers to questions and guess the theme at any time
5. Points are awarded for:
   - Correct answers (100 points)
   - Theme guesses (200-1000 points, depending on when guessed)
6. The game ends after all questions are answered
7. The player with the most points wins

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details. 