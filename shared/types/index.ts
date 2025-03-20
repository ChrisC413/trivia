export interface RequestRoom {
    roomId: string;
}

export interface ResponseRoom {
    roomId: string;
}

export interface RequestJoinRoom {
    roomId: string;
    playerName: string;
}

export interface ResponseJoinRoom {
    roomId: string;
    playerId: string;
    playerName: string;
}

export interface RequestStartGame {
    roomId: string;
}

export interface ResponseStartGame {
    roomId: string;
}  

export interface RequestGuessAnswer {
    roomId: string;
    playerId: string;
    questionNumber: number;
    answer: string;
}

export interface ResponseGuessAnswer {
    roomId: string;
    playerId: string;
    correct: boolean;
    questionNumber: number;
}


export interface RequestSubmitThemeGuess {
    roomId: string;
    playerId: string;
    themeGuess: string;
}

export interface ResponseSubmitThemeGuess {
    roomId: string;
    playerId: string;
    themeGuess: string;
}




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
