import { getData } from '../dataStore';
import { GameState } from '../enum';
import { getQuiz, sessionExists, validQuiz } from './helperFunctionsIteration1';
import {
  PlayerGameObject,
  EmptyObject,
  Games,
  InfoAnswer,
  Submission,
  QuestionResult,
  Quizzes,
  Player,
  userAndScore,
  QuizGameStatusReturn
} from '../interface';
import {
  adminQuizGameStatusGet
} from '../game';
// ==============================================
// Iteration 3 functions
// ==============================================
/**
 * throws an error if session is invalid(used in server)
 *
 * @param {string} session
 */
function sessionIsValid(session: string) {
  if (!sessionExists(session)) {
    throw new Error('Invalid session');
  }
}

/**
 * throws an error is quizId is invalid(used in server)
 * @param {string} session
 * @param {number} quizId
 */
function quizIsValid(session: string, quizId: number) {
  if (!validQuiz(quizId, session)) {
    throw new Error('Invalid quizId');
  }
}

/**
 * Checks if 10 or more games corresponding to a certain quiz is active
 *
 * @param {number} quizId
 */
function tenActiveGamesExist(quizId: number): boolean {
  const data = getData();
  const games = data.games;
  const listOfActiveGames = games.filter((game) => game.gameState !== GameState.END &&
  game.quizId === quizId);
  if (listOfActiveGames.length > 9) {
    return true;
  }
  return false;
}

function generateRandomName(): string {
  const letters = 'abcdefghijklmnopqrstuvwxyz'.split('');
  const digits = '0123456789'.split('');

  const shuffledLetters = letters.sort(() => 0.5 - Math.random()).slice(0, 5).join('');
  const shuffledDigits = digits.sort(() => 0.5 - Math.random()).slice(0, 3).join('');
  const randomName = shuffledLetters + shuffledDigits;

  return randomName;
}

/**
 * Checks if gameId refers to a valid game corresponding to a given quizId
 *
 * @param {number} gameId
 * @param {number} quizId
 */
function gameBelongsToQuiz(gameId: number, quizId: number): boolean {
  const data = getData();
  const games = data.games;
  const targetGame = games.find((game) => game.gameId === gameId &&
  game.quizId === quizId);
  if (!targetGame) {
    return false;
  }
  return true;
}

/**
 * Gets a given game
 *
 * @param {number} gameId
 * @param {number} quizId
 */
function getGame(gameId: number): Games | undefined {
  const data = getData();
  const games = data.games;
  return games.find((game) => game.gameId === gameId);
}

/**
 * Checks if a given playerId refers to a valid player
 *
 * @param {number} playerId
 */
function playerIsValid(playerId: number): boolean {
  const data = getData();
  const games = data.games;
  for (const game of games) {
    const validPlayer = game.players.find((game) => game.playerId === playerId);
    if (validPlayer) {
      return true;
    }
  }
  return false;
}

/**
 * Finds game asociated with playerId
 *
 * @param {number} playerId
 */
function getGameFromPlayerId(playerId: number): Games | undefined {
  const data = getData();
  const games = data.games;
  for (const game of games) {
    const validPlayer = game.players.find((game) => game.playerId === playerId);
    if (validPlayer) {
      return game;
    }
  }
  return undefined;
}

/*
 * A helper function that finds the player based on the player ID
 * @param {number} playerId
 */
function playerExists(playerId: number): PlayerGameObject | EmptyObject {
  const data = getData();
  for (const game of data.games) {
    const player = game.players.find(p => p.playerId === playerId);
    if (player) {
      return { player, game };
    }
  }
  throw new Error('Player ID does not exist');
}

/**
 * Checks if a player has already submitted an answer
 *
 * @param {number} playerId
 * @param {number} currQuestion
 */
function submissionExists(playerId: number, currQuestion: number): boolean {
  const game = getGameFromPlayerId(playerId) as Games;
  const subExists = game.result.questionResults[currQuestion].submissions.find(
    sub => sub.playerId === playerId
  );
  if (!subExists) {
    return false;
  }
  return true;
}

/**
 * Checks if an answer is correct or not
 *
 * @param {number[]} correctAnswers
 * @param {number[]} playerAnswers
 */
function areAnswersCorrect(correctAnswers: number[], playerAnswers: number[]): boolean {
  if (correctAnswers.length !== playerAnswers.length) {
    return false;
  }
  const newCorrectAnswers = correctAnswers.sort();
  const newPlayerAnswers = playerAnswers.sort();
  let index = 0;
  for (const answer of newCorrectAnswers) {
    if (answer !== newPlayerAnswers[index]) {
      return false;
    }
    index++;
  }
  return true;
}

/**
 * Gets list of all correct answers
 *
 * @param {Games} game
 * @param {number} currQuestion
 */
function getAllCorrectAnswers(game: Games, currQuestion: number): number[] {
  const listOfAnswers = game.metaData.questions[currQuestion].answerOptions.filter(
    answer => answer.correct === true
  ) as InfoAnswer[];

  const listOfAnswerIds: number[] = [];
  for (const answer of listOfAnswers) {
    listOfAnswerIds.push(answer.answerId);
  }
  return listOfAnswerIds;
}

/**
 * Gets list of all correct answers
 *
 * @param {Games} game
 * @param {number} currQuestion
 */
function calculateQuestionResults(game: Games, submissions: Submission[],
  currQuestion: number): QuestionResult {
  const questionId = game.metaData.questions[currQuestion].questionId;
  const submissionsCorrect = submissions.filter(sub => sub.answerCorrect === true);
  const playersCorrect: string[] = [];
  for (const player of submissionsCorrect) {
    playersCorrect.push(player.name);
  }

  const sumOfAnswerTimes = submissions.reduce((sum, sub) => sum + sub.timeTaken, 0);
  const averageAnswerTime = sumOfAnswerTimes / submissions.length;
  const percentCorrect = (submissionsCorrect.length / submissions.length) * 100;
  const result = {
    questionId: questionId,
    playersCorrect: playersCorrect,
    averageAnswerTime: averageAnswerTime,
    percentCorrect: percentCorrect,
    submissions: submissions
  };
  return result;
}

/**
 * Initialises question results
 *
 * @param {number} quizId
 */
function initQuestionResults(quizId: number): QuestionResult[] {
  const quiz = getQuiz(quizId) as Quizzes;
  const questions = quiz.questions;
  const listOfQuestionResults: QuestionResult[] = [];
  for (const question of questions) {
    listOfQuestionResults.push({
      questionId: question.questionId,
      playersCorrect: [],
      averageAnswerTime: 0,
      percentCorrect: 0,
      submissions: []
    });
  }
  return listOfQuestionResults;
}

/**
 * Gets player from a name
 *
 * @param {string} name
 * @param {Games} game
 */
function getPlayerFromName(name: string, game: Games): Player {
  return game.players.find(player => player.playerName === name) as Player;
}

/**
 * Returns array of users ranked by score
 *
 * @param {string} name
 * @param {Games} game
 */
function getLeaderboard(game: Games): userAndScore[] {
  const listOfRanks = game.players.sort((a, b) => b.score - a.score);
  const newList: userAndScore[] = [];
  for (const player of listOfRanks) {
    newList.push({
      playerName: player.playerName,
      score: player.score
    });
  }
  return newList;
}

/**
 * Updates scores of a game
 *
 * @param {Games} game
 */
function updateScore(game: Games) {
  const gameStatus = adminQuizGameStatusGet(game.quizId, game.gameId) as QuizGameStatusReturn;
  const index = gameStatus.atQuestion - 1;
  const question = game.metaData.questions[index];
  const results = calculateQuestionResults(
    game, game.result.questionResults[index].submissions, index
  );
  let scalingFactor = 1;
  for (const player of results.playersCorrect) {
    const currPlayer = getPlayerFromName(player, game);
    currPlayer.score += question.points * (1 / scalingFactor);
    scalingFactor++;
  }
  game.result.userRankedByScore = getLeaderboard(game);
}

export {
  sessionIsValid,
  quizIsValid,
  tenActiveGamesExist,
  generateRandomName,
  gameBelongsToQuiz,
  getGame,
  playerIsValid,
  getGameFromPlayerId,
  playerExists,
  submissionExists,
  getAllCorrectAnswers,
  areAnswersCorrect,
  initQuestionResults,
  calculateQuestionResults,
  getPlayerFromName,
  getLeaderboard,
  updateScore
};
