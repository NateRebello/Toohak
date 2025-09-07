import { QuizGameAction } from '../enum';
import {
  reqAdminAuthRegister,
  reqAdminQuizCreate,
  reqAdminQuizGameGuestJoin,
  reqAdminQuizGameResultExport,
  reqAdminQuizGameStart,
  reqAdminQuizGameStateUpdate,
  reqAdminQuizQuestionCreateV2,
  reqClear
} from '../helperFile/serverRequests';
import { v4 as uuidv4 } from 'uuid';

let session: string;
let quizId: number;
let gameId: number;
let session2: string;

beforeEach(() => {
  reqClear();

  const res1 = reqAdminAuthRegister('test@email.com', 'testPass1', 'Test', 'One');
  session = (res1.body as { session: string }).session;

  const res2 = reqAdminAuthRegister('test2@email.com', 'testPass2', 'Test', 'Two');
  session2 = (res2.body as { session: string }).session;

  const quiz = reqAdminQuizCreate(session, 'CSV Quiz', 'To export test');
  quizId = (quiz.body as { quizId: number }).quizId;

  reqAdminQuizQuestionCreateV2(quizId, session,
    'What is 2 + 2?', 10, 5,
    [
      { answer: '4', correct: true },
      { answer: '5', correct: false }
    ],
    'https://example.com/image.jpg'
  );

  // game start: LOBBY
  const game = reqAdminQuizGameStart(session, quizId, 0);
  gameId = (game.body as { gameId: number }).gameId;

  // added 3 players
  reqAdminQuizGameGuestJoin(gameId, 'UserOne');
  reqAdminQuizGameGuestJoin(gameId, 'UserTwo');
  reqAdminQuizGameGuestJoin(gameId, 'UserThree');
});

describe('CSV export route', () => {
  describe('Error cases', () => {
    test.each([
      {
        name: 'Empty session',
        session: () => '',
        quizId: () => quizId,
        gameId: () => gameId,
        errorCode: 401
      },
      {
        name: 'Invalid session',
        session: () => uuidv4(),
        quizId: () => quizId,
        gameId: () => gameId,
        errorCode: 401
      },
      {
        name: 'Invalid quizId',
        session: () => session,
        quizId: () => quizId + 1,
        gameId: () => gameId,
        errorCode: 403
      },
      {
        name: 'User does not belong to the quiz',
        session: () => session2,
        quizId: () => quizId,
        gameId: () => gameId,
        errorCode: 403
      },
      {
        name: 'Invalid gameId',
        session: () => session,
        quizId: () => quizId,
        gameId: () => gameId + 1,
        errorCode: 400
      },
    ])('$name', ({ session, quizId, gameId, errorCode }) => {
      const res = reqAdminQuizGameResultExport(session(), quizId(), gameId());
      expect(res.statusCode).toStrictEqual(errorCode);
      expect(res.body).toStrictEqual({ error: expect.any(String) });
    });

    test('Game not in FINAL_RESULTS', () => {
      const res = reqAdminQuizGameResultExport(session, quizId, gameId);
      expect(res.statusCode).toStrictEqual(400);
      expect(res.body).toStrictEqual({ error: expect.any(String) });
    });
  });

  describe('Successive cases', () => {
    test('Correctly return a CSV file', () => {
      reqAdminQuizGameStateUpdate(quizId, gameId, session, QuizGameAction.NEXT_QUESTION);
      reqAdminQuizGameStateUpdate(quizId, gameId, session, QuizGameAction.SKIP_COUNTDOWN);
      reqAdminQuizGameStateUpdate(quizId, gameId, session, QuizGameAction.GO_TO_ANSWER);
      reqAdminQuizGameStateUpdate(quizId, gameId, session, QuizGameAction.GO_TO_FINAL_RESULTS);

      const res = reqAdminQuizGameResultExport(session, quizId, gameId);
      expect(res.statusCode).toStrictEqual(200);
      expect(res.headers['content-type']).toContain('text/csv');
      expect(res.body).toContain('Player Name,Score');
    });
  });
});
