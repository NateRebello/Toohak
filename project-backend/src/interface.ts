import { GameActiveStatus, GameState, QuizGameAction } from './enum';

interface Users {
  userId: number,
  nameFirst: string,
  nameLast: string,
  email: string,
  password: string,
  numSuccessfulLogins: number,
  numFailedPasswordsSinceLastLogin: number
  userSession: string[];
  passwordHistory: string[];
}

interface UserDetails {
  userId: number,
  name: string,
  email: string,
  numSuccessfulLogins: number,
  numFailedPasswordsSinceLastLogin: number
}

interface Quizzes {
  userId: number,
  quizId: number,
  name: string,
  description: string,
  timeCreated: number,
  timeLastEdited: number,
  numQuestions: number,
  questions: InfoQuestion[],
  timeLimit: number,
  thumbnailUrl: string
}

interface UserId {
  userId: number
}

interface QuizId {
  quizId: number
}

interface SessionId {
  session: string
}

interface AdminQuizInfoReturn {
  quizId: number,
  name: string,
  timeCreated: number,
  timeLastEdited: number,
  description: string,
  numQuestions: number,
  questions: InfoQuestion[],
  timeLimit: number,
  thumbnailUrl: string
}

interface ListOfQuizzes {
  quizzes: Quizzes[]
}

interface Answer {
  answer: string,
  correct: boolean
}

interface InfoAnswer {
  answerId: number,
  answer: string,
  colour: string,
  correct: boolean
}

interface InfoQuestion {
  questionId: number,
  question: string,
  timeLimit: number,
  points: number,
  answerOptions: InfoAnswer[],
  thumbnailUrl: string,
}

interface QuestionId {
  questionId: number
}

interface AdminAuthRegisterReturn {
  userId: number;
  sessionId: string;
}

interface GameId {
  gameId: number
}

interface Games {
  gameId: number,
  gameName: string,
  quizId: number,
  gameActive: GameActiveStatus,
  gameAction: QuizGameAction,
  gameState: GameState,
  enterTime: number,
  atQuestion: number,
  players: Player[],
  autoStartNum: number,
  result: GameResult,
  metaData: MetaData,
  questionStartTimes: number[],
}

interface QuizGameStatusReturn{
  state: GameState,
  atQuestion: number,
  players: string[],
  metaData: MetaData
}

interface MetaData {
  quizId: number,
  name: string,
  timeCreated: number,
  timeLastEdited: number,
  description: string,
  numQuestions: number,
  timeLimit: number,
  thumbnailUrl: string,
  questions: InfoQuestion[]
}

interface GameResult {
  userRankedByScore: userAndScore[],
  questionResults: QuestionResult[]
}

interface userAndScore {
  playerName: string,
  score: number
}

interface QuestionResult {
  questionId: number,
  playersCorrect: string[],
  averageAnswerTime: number,
  percentCorrect: number,
  submissions: Submission[]
}

interface Submission {
  answerIds: number[],
  answerCorrect: boolean,
  playerId: number,
  name: string,
  timeTaken: number
}

interface QuestionResultReturn {
  questionId: number,
  playersCorrect: string[],
  averageAnswerTime: number,
  percentCorrect: number,
}

interface GameListsStatus {
  activeGames: number[];
  inactiveGames: number[];
}

interface Player {
  playerId: number,
  playerName: string,
  guestState: boolean,
  numQuestions: number,
  answers: PlayerAnswer[],
  answerTime: number[],
  score: number
}

interface PlayerAnswer {
  answerId: number,
  answerCorrect: boolean
}

interface GuestPlayerReturn {
  state: GameState,
  numQuestions: number,
  atQuestion: number
}

interface PlayerId {
  playerId: number;
}

// used for function returns
interface HTTPResponse<T> {
  statusCode: number;
  body: T;
}

interface ErrorReturn {
  error: string
}

interface QuestionInfoPlayerReturn {
  questionId: number,
  question: string,
  timeLimit: number,
  thumbnailUrl: string,
  points: number,
  answerOptions: QuestionAnswer[];
}

interface QuestionAnswer {
  answerId: number,
  answer: string,
  colour: string
}

interface PlayerGameObject {
  player: Player,
  game: Games
}

type EmptyObject = Record<string, never>;

export {
  Users,
  UserDetails,
  Quizzes,
  HTTPResponse,
  UserId,
  QuizId,
  AdminQuizInfoReturn,
  ListOfQuizzes,
  ErrorReturn,
  EmptyObject,
  QuestionId,
  SessionId,
  InfoQuestion,
  InfoAnswer,
  Answer,
  AdminAuthRegisterReturn,
  GameId,
  Games,
  QuestionResult,
  GameListsStatus,
  QuizGameStatusReturn,
  GuestPlayerReturn,
  GameResult,
  PlayerId,
  QuestionInfoPlayerReturn,
  PlayerGameObject,
  QuestionResultReturn,
  Submission,
  Player,
  userAndScore
};
