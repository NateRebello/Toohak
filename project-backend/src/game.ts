import { getData, saveDataToFile, setData } from './dataStore';
import { GameActiveStatus, GameState, QuizGameAction } from './enum';
import {
  tenActiveGamesExist,
  gameBelongsToQuiz,
  getGame,
  generateRandomName,
  playerIsValid,
  getGameFromPlayerId,
  playerExists,
  submissionExists,
  getAllCorrectAnswers,
  areAnswersCorrect,
  initQuestionResults,
  calculateQuestionResults,
  updateScore
} from './helperFile/helperFunctionIteration3';
import { getQuiz } from './helperFile/helperFunctionsIteration1';
import {
  ErrorReturn,
  Quizzes,
  EmptyObject,
  GameId,
  GameListsStatus,
  Games,
  QuizGameStatusReturn,
  GameResult,
  PlayerId,
  GuestPlayerReturn,
  QuestionInfoPlayerReturn,
  QuestionResultReturn,
  Submission,
  Player
} from './interface';

// ==============================================
// Iteration 3 functions
// ==============================================

/**
 * update the quiz thumbnail
 * when called, it will update the timeLastEdited
 *
 * @param {number} quizId
 * @param {string} session
 * @param {string} thumbnailUrl
 * @returns {EmptyObject | ErrorReturn}
 */
function adminQuizThumbnailUpdate(quizId: number, session: string, thumbnailUrl: string)
  : EmptyObject | ErrorReturn {
  const data = getData();
  const quiz = data.quizzes.find(q => q.quizId === quizId) as Quizzes;

  // check if the url is valid
  const isHttp = thumbnailUrl.startsWith('http://') || thumbnailUrl.startsWith('https://');
  const isImage = thumbnailUrl.toLowerCase().endsWith('.jpg') ||
    thumbnailUrl.toLowerCase().endsWith('.jpeg') ||
    thumbnailUrl.toLowerCase().endsWith('.png');

  if (!isHttp || !isImage) {
    throw new Error('Invalid thumnail URL format');
  }

  quiz.thumbnailUrl = thumbnailUrl;
  quiz.timeLastEdited = Date.now();

  setData(data);
  saveDataToFile(data);
  return {};
}

/**
 * retrives active and inavtive game ids
 * sorted in ascending order for a quiz
 *
 * @param {string} session
 * @param {number} quizId
 * @returns {GameListsResponse | ErrorReturn}
 */
function adminQuizGameView(session: string, quizId: number): GameListsStatus | ErrorReturn {
  const data = getData();
  const allGames = data.games.filter(g => g.quizId === quizId);

  const activeGames = allGames
    .filter(g => g.gameState !== GameState.END)
    .map(g => g.gameId)
    .sort((a, b) => a - b);

  const inactiveGames = allGames
    .filter(g => g.gameState === GameState.END)
    .map(g => g.gameId)
    .sort((a, b) => a - b);

  return {
    activeGames,
    inactiveGames
  };
}

/**
 * starts a game corresponding to a certain quiz
 *
 * @param {number} quizId
 * @param {number} autoStartNum
 * @returns {GameId | ErrorReturn}
 */
function adminQuizGameStart(
  quizId: number,
  autoStartNum: number
): GameId | ErrorReturn {
  if (autoStartNum > 50) {
    throw new Error('autoStartNum should not be greater than 50');
  }

  const data = getData();
  const quiz = data.quizzes.find(quiz => quiz.quizId === quizId) as Quizzes;
  if (quiz.questions.length === 0) {
    throw new Error('No questions in quiz');
  }

  if (tenActiveGamesExist(quizId)) {
    throw new Error('ten or more games if this quiz are already active');
  }

  let gameId: number;
  const games = data.games;
  if (games.length === 0) {
    gameId = 1;
  } else {
    // extracting all existing gameIds
    const allGameIds = games.map((game) => game.gameId);
    // go through all to make sure there are no collisions with gameId
    gameId = Math.max(...allGameIds) + 1;
  }

  const quizCopy = {
    userId: quiz.userId,
    quizId: quiz.quizId,
    name: quiz.name,
    description: quiz.description,
    timeCreated: quiz.timeCreated,
    timeLastEdited: quiz.timeLastEdited,
    numQuestions: quiz.questions.length,
    questions: quiz.questions.map(q => ({
      questionId: q.questionId,
      question: q.question,
      timeLimit: q.timeLimit,
      thumbnailUrl: q.thumbnailUrl,
      points: q.points,
      answerOptions: q.answerOptions.map(a => ({
        answerId: a.answerId,
        answer: a.answer,
        colour: a.colour,
        correct: a.correct
      }))
    })),
    timeLimit: quiz.timeLimit,
    thumbnailUrl: quiz.thumbnailUrl
  };

  const newGame: Games = {
    gameId: gameId,
    gameName: quiz.name,
    quizId: quizId,
    gameActive: GameActiveStatus.ACTIVE,
    gameAction: QuizGameAction.NEXT_QUESTION,
    gameState: GameState.LOBBY,
    enterTime: Date.now(),
    atQuestion: 1,
    players: [],
    autoStartNum: autoStartNum,
    result: {
      userRankedByScore: [],
      questionResults: initQuestionResults(quizId)
    },
    metaData: quizCopy,
    questionStartTimes: []
  };

  games.push(newGame);
  setData(data);
  saveDataToFile(data);
  return { gameId: gameId };
}

/**
 * A function that will review and update game status
 *
 * @param {number} quizId
 * @param {number} gameId
 * @param {string} session
 * @param {QuizGameAction} action
 * @returns {EmptyObject | ErrorReturn}
 */
function adminQuizGameStateUpdate(
  quizId: number,
  gameId: number,
  session: string,
  action: QuizGameAction
): EmptyObject | ErrorReturn {
  const data = getData();

  const quiz = data.quizzes.find(q => q.quizId === quizId) as Quizzes;
  const game = data.games.find(g => g.gameId === gameId && g.quizId === quizId);
  if (!game) {
    throw new Error('Invalid gameId');
  }

  const now = Date.now();

  if (game.gameState === GameState.QUESTION_COUNTDOWN) {
    const elapsed = now - game.enterTime;
    if (elapsed >= 3000) {
      game.gameState = GameState.QUESTION_OPEN;
      game.enterTime = now;
      game.questionStartTimes[game.atQuestion - 1] = Date.now();
      if (game.atQuestion < quiz.questions.length) {
        game.atQuestion += 1;
      }
      saveDataToFile(data);
    }
  }

  if (game.gameState === GameState.QUESTION_OPEN) {
    const currentQuestion = quiz.questions[game.atQuestion - 1];
    const elapsed = now - game.enterTime;
    if (elapsed >= currentQuestion.timeLimit * 1000) {
      game.gameState = GameState.QUESTION_CLOSE;
      game.enterTime = now;
      saveDataToFile(data);
    }
  }

  const currentState = game.gameState;

  if (currentState === GameState.END) {
    throw new Error('The game has already end');
  }

  if (currentState === GameState.LOBBY) {
    if (action === QuizGameAction.NEXT_QUESTION) {
      game.gameState = GameState.QUESTION_COUNTDOWN;
      game.enterTime = now;
    } else if (game.autoStartNum <= game.players.length + 1) {
      game.gameState = GameState.QUESTION_COUNTDOWN;
      game.enterTime = now;
    } else if (action === QuizGameAction.END) {
      game.gameState = GameState.END;
      game.gameActive = GameActiveStatus.INACTIVE;
      game.atQuestion = 1;
    } else {
      throw new Error('Invalid action for LOBBY state');
    }
  } else if (currentState === GameState.QUESTION_COUNTDOWN) {
    if (action === QuizGameAction.SKIP_COUNTDOWN) {
      game.gameState = GameState.QUESTION_OPEN;
      game.enterTime = now;
      game.questionStartTimes[game.atQuestion - 1] = Date.now();
    } else if (action === QuizGameAction.END) {
      game.gameState = GameState.END;
      game.gameActive = GameActiveStatus.INACTIVE;
      game.atQuestion = 1;
    } else {
      throw new Error('Invalid action for QUESTION_COUNTDOWN state');
    }
  } else if (currentState === GameState.QUESTION_OPEN) {
    if (action === QuizGameAction.GO_TO_ANSWER) {
      updateScore(game);
      game.gameState = GameState.ANSWER_SHOW;
    } else if (action === QuizGameAction.END) {
      game.gameState = GameState.END;
      game.gameActive = GameActiveStatus.INACTIVE;
      game.atQuestion = 1;
    } else {
      throw new Error('Invalid action from QUESTION_OPEN state');
    }
  } else if (currentState === GameState.QUESTION_CLOSE) {
    updateScore(game);
    if (action === QuizGameAction.GO_TO_ANSWER) {
      game.gameState = GameState.ANSWER_SHOW;
    } else if (action === QuizGameAction.GO_TO_FINAL_RESULTS) {
      game.gameState = GameState.FINAL_RESULTS;
    } else if (action === QuizGameAction.END) {
      game.gameState = GameState.END;
      game.gameActive = GameActiveStatus.INACTIVE;
      game.atQuestion = 1;
    } else {
      throw new Error('Invalid action from QUESTION_CLOSE state');
    }
  } else if (currentState === GameState.ANSWER_SHOW) {
    if (action === QuizGameAction.GO_TO_FINAL_RESULTS) {
      game.gameState = GameState.FINAL_RESULTS;
      game.atQuestion = 1;
    } else if (action === QuizGameAction.NEXT_QUESTION) {
      game.gameState = GameState.QUESTION_COUNTDOWN;
      if (game.atQuestion < quiz.questions.length) {
        game.atQuestion += 1;
      }
    } else if (action === QuizGameAction.END) {
      game.gameState = GameState.END;
      game.gameActive = GameActiveStatus.INACTIVE;
      game.atQuestion = 1;
    } else {
      throw new Error('Invalid action from ANSWER_SHOW state');
    }
  } else {
    if (action === QuizGameAction.END) {
      game.gameState = GameState.END;
      game.gameActive = GameActiveStatus.INACTIVE;
      game.atQuestion = 1;
    } else {
      throw new Error('Invalid action from FINAL_RESULTS state');
    }
  }

  setData(data);
  saveDataToFile(data);
  return {};
}

function adminQuizGameStatusGet(quizId: number, gameId: number)
  : QuizGameStatusReturn | ErrorReturn {
  const data = getData();

  const game = data.games.find(g => g.gameId === gameId && g.quizId === quizId);
  if (!game) {
    throw new Error('Game does not exist for this quiz');
  }

  const playerNames = game.players.map(p => p.playerName).sort((a, b) => a.localeCompare(b));
  return {
    state: game.gameState,
    atQuestion: game.atQuestion,
    players: playerNames,
    metaData: game.metaData
  };
}

function adminQuizGameResultGet(quizId: number, gameId: number)
  : GameResult | ErrorReturn {
  if (!gameBelongsToQuiz(gameId, quizId)) {
    throw new Error('Game Id does not refer to a valid game within this quiz');
  }

  const gameStatus = adminQuizGameStatusGet(quizId, gameId) as QuizGameStatusReturn;
  if (gameStatus.state !== GameState.FINAL_RESULTS) {
    throw new Error('Game is not in FINAL_RESULTS state');
  }

  const game = getGame(gameId) as Games;
  return {
    userRankedByScore: game.result.userRankedByScore,
    questionResults: game.result.questionResults
  };
}

function adminQuizGameGuestJoin(gameId: number, playerName: string): PlayerId | ErrorReturn {
  const data = getData();

  const game = data.games.find(game => game.gameId === gameId);
  if (!game) {
    throw new Error('Invalid GameId');
  }

  // Ensure the game is in LOBBY state
  if (game.gameState !== GameState.LOBBY) {
    throw new Error('Game is not at LOBBY state');
  }

  if (game.players.length >= 100) {
    throw new Error('The game is full');
  }

  if (playerName === '') {
    playerName = generateRandomName();
  }

  const validName = /^[a-zA-Z0-9 ]+$/.test(playerName);
  if (!validName) {
    throw new Error('Invalid characters in name');
  }

  const existingPlayer = game.players.find(p => p.playerName === playerName);
  if (existingPlayer) {
    throw new Error('Player already exists in this game');
  }

  const newPlayerId = game.players.length + 1; // Or a safer unique ID method in prod

  const newGuestPlayer = {
    playerId: newPlayerId,
    playerName: playerName,
    guestState: true,
    state: GameState.LOBBY,
    numQuestions: game.metaData.numQuestions,
    atQuestion: game.atQuestion,
    answers: [] as any[],
    score: 0,
    answerTime: [] as any[]
  };

  game.players.push(newGuestPlayer);
  setData(data);
  saveDataToFile(data);

  return { playerId: newPlayerId };
}

function adminQuizGameGuestStatus(playerId:number): GuestPlayerReturn | ErrorReturn {
  const data = getData();
  for (const game of data.games) {
    const player = game.players.find(p => p.playerId === playerId);
    if (player) {
      return {
        state: game.gameState,
        numQuestions: player.numQuestions,
        atQuestion: game.atQuestion
      };
    }
  }
  throw new Error('Player ID does not exist');
}

function adminQuestionInfoPlayer(playerId: number, questionPosition: number)
  : QuestionInfoPlayerReturn | ErrorReturn {
  const { player, game } = playerExists(playerId);

  if (!game.metaData.questions || questionPosition < 1 ||
      questionPosition > player.numQuestions) {
    throw new Error('Question position is not valid for the game this player is in');
  }

  if (questionPosition !== game.atQuestion) {
    throw new Error('Game is not currently on this question');
  }

  if (
    game.gameState === GameState.LOBBY ||
    game.gameState === GameState.QUESTION_COUNTDOWN ||
    game.gameState === GameState.FINAL_RESULTS ||
    game.gameState === GameState.END
  ) {
    throw new Error('Game is not in the right game state');
  }

  const question = game.metaData.questions[questionPosition - 1];
  return {
    questionId: question.questionId,
    question: question.question,
    timeLimit: question.timeLimit,
    thumbnailUrl: question.thumbnailUrl,
    points: question.points,
    answerOptions: question.answerOptions.map(({ answerId, answer, colour }) => ({
      answerId,
      answer,
      colour
    }))
  };
}

function adminQuestionAnswerSubmission(
  answerid: number[],
  playerId: number,
  questionPosition: number)
  : EmptyObject | ErrorReturn {
  const data = getData();
  const { player, game } = playerExists(playerId);
  if (!Array.isArray(answerid) || answerid.length === 0) {
    throw new Error('Less than 1 answer ID was submitted');
  }

  const nonDuplicateAns = new Set(answerid);
  if (nonDuplicateAns.size !== answerid.length) {
    throw new Error('There are duplicate answer IDs provided');
  }

  if (!game.metaData.questions || questionPosition < 1 ||
      questionPosition > player.numQuestions) {
    throw new Error('Question position is not valid for the game this player is in');
  }

  if (game.gameState !== GameState.QUESTION_OPEN) {
    throw new Error('Game is not in QUESTION_OPEN state');
  }

  if (questionPosition !== game.atQuestion) {
    throw new Error('The game is not currently on this question');
  }

  const question = game.metaData.questions[questionPosition - 1];

  for (const id of answerid) {
    if (!question.answerOptions.find(a => a.answerId === id)) {
      throw new Error('Answer IDs are not valid for this particular question');
    }
  }

  player.answers = [];

  for (const id of answerid) {
    const answerOption = question.answerOptions.find(a => a.answerId === id);
    if (answerOption) {
      player.answers.push({ answerId: id, answerCorrect: answerOption.correct });
    }
  }

  if (!player.answerTime) {
    player.answerTime = [];
  }

  const index = questionPosition - 1;
  const startTime = game.questionStartTimes[index];
  player.answerTime[index] = Date.now() - startTime;

  // make helper which checks if a submissions has been already made
  const subs: Submission[] = [];
  if (submissionExists(playerId, questionPosition - 1)) {
    const submission = game.result.questionResults[index].submissions.find(
      (sub: Submission) => sub.playerId === playerId
    ) as Submission;
    submission.answerIds = answerid;

    const listOfCorrectAnswers = getAllCorrectAnswers(game, index);
    if (areAnswersCorrect(listOfCorrectAnswers, answerid)) {
      submission.answerCorrect = true;
    }

    submission.timeTaken = Date.now() - startTime;
  } else {
    const listOfCorrectAnswers = getAllCorrectAnswers(game, index);
    let answersCorrect = false;
    if (areAnswersCorrect(listOfCorrectAnswers, answerid)) {
      answersCorrect = true;
    }
    const player = game.players.find(player => player.playerId === playerId) as Player;
    subs.push({
      answerIds: answerid,
      answerCorrect: answersCorrect,
      playerId,
      name: player.playerName,
      timeTaken: Date.now() - startTime
    });
  }
  game.result.questionResults[index].submissions = subs;
  const results = calculateQuestionResults(
    game, game.result.questionResults[index].submissions, index
  );

  game.result.questionResults[index].percentCorrect = results.percentCorrect;
  game.result.questionResults[index].averageAnswerTime = results.averageAnswerTime;
  game.result.questionResults[index].playersCorrect = results.playersCorrect;

  setData(data);
  saveDataToFile(data);
  return {};
}

function adminQuestionResult(playerId: number, questionPosition: number)
  : QuestionResultReturn | ErrorReturn {
  if (!playerIsValid(playerId)) {
    throw new Error('playerId does not exist');
  }

  const game = getGameFromPlayerId(playerId) as Games;
  const quiz = getQuiz(game.quizId) as Quizzes;
  const numQuestions = quiz.numQuestions;
  if (questionPosition < 0 || questionPosition > numQuestions) {
    throw new Error('question position is not valid for this game');
  }

  const gameStatus = adminQuizGameStatusGet(game.quizId, game.gameId) as QuizGameStatusReturn;
  if (gameStatus.state !== GameState.ANSWER_SHOW) {
    throw new Error('Game is not in ANSWER_SHOW state');
  }

  if (questionPosition > gameStatus.atQuestion) {
    throw new Error('Game is not currently on this question');
  }

  return {
    questionId: game.result.questionResults[questionPosition - 1].questionId,
    playersCorrect: game.result.questionResults[questionPosition - 1].playersCorrect,
    averageAnswerTime: game.result.questionResults[questionPosition - 1].averageAnswerTime,
    percentCorrect: game.result.questionResults[questionPosition - 1].percentCorrect
  };
}

function adminQuizGameResults(playerId: number): GameResult {
  const playerGame = playerExists(playerId);
  if (!playerGame) {
    throw new Error('Player does not exist');
  }

  const { game } = playerGame;

  return {
    userRankedByScore: game.result.userRankedByScore,
    questionResults: game.result.questionResults
  };
}

export {
  adminQuizThumbnailUpdate,
  adminQuizGameView,
  adminQuizGameStart,
  adminQuizGameStateUpdate,
  adminQuizGameStatusGet,
  adminQuizGameGuestJoin,
  adminQuizGameGuestStatus,
  adminQuestionInfoPlayer,
  adminQuestionAnswerSubmission,
  adminQuestionResult,
  adminQuizGameResults,
  adminQuizGameResultGet
};
