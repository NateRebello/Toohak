import { expect, test } from '@jest/globals';
import {
  reqAdminAuthRegister,
  reqAdminQuizCreate,
  reqClear,
  reqAdminQuizGameStart,
  reqAdminQuizQuestionCreate,
  reqAdminQuizGameResultGet,
  reqAdminQuizGameStateUpdate
} from '../helperFile/serverRequests';
import {
  QuizGameAction
} from '../enum';

beforeEach(() => {
  reqClear();
});

describe('GET /v1/admin/quiz/{quizid}/game/{gameid}/results (adminQuizGameResults)', () => {
  let session: string;
  let quizId: number;
  let gameId: number;
  beforeEach(() => {
    const res = reqAdminAuthRegister(
      'valid@email.com',
      'validPass1',
      'validFirstName',
      'validLastName'
    );
    session = (res.body as { session: string }).session;

    const quizRes = reqAdminQuizCreate(session, 'valid name', 'valid description');
    quizId = (quizRes.body as { quizId: number }).quizId;

    reqAdminQuizQuestionCreate(session, quizId,
      'Is this question update valid?', 4, 5,
      [
        {
          answer: 'Yes',
          correct: true
        },
        {
          answer: 'No',
          correct: false
        }
      ],
      'http://jpg'
    );

    const gameRes = reqAdminQuizGameStart(session, quizId, 0);
    gameId = (gameRes.body as { gameId: number }).gameId;

    reqAdminQuizGameStateUpdate(quizId, gameId, session, QuizGameAction.NEXT_QUESTION);
    reqAdminQuizGameStateUpdate(quizId, gameId, session, QuizGameAction.SKIP_COUNTDOWN);
    reqAdminQuizGameStateUpdate(quizId, gameId, session, QuizGameAction.GO_TO_ANSWER);
    reqAdminQuizGameStateUpdate(quizId, gameId, session, QuizGameAction.GO_TO_FINAL_RESULTS);
  });

  describe('Error cases', () => {
    test('Invalid session', () => {
      const invalidSession = session + '1';
      const res = reqAdminQuizGameResultGet(invalidSession, quizId, gameId);
      expect(res.body).toStrictEqual({ error: expect.any(String) });
      expect(res.statusCode).toStrictEqual(401);
    });

    test('Empty session', () => {
      const res = reqAdminQuizGameResultGet('', quizId, gameId);
      expect(res.body).toStrictEqual({ error: expect.any(String) });
      expect(res.statusCode).toStrictEqual(401);
    });

    test('Invalid quizId', () => {
      const invalidQuizId = quizId + 1;
      const res = reqAdminQuizGameResultGet(session, invalidQuizId, gameId);
      expect(res.body).toStrictEqual({ error: expect.any(String) });
      expect(res.statusCode).toStrictEqual(403);
    });

    test('Quiz belongs to another user', () => {
      const sessionRes2 = reqAdminAuthRegister(
        'second@user.com',
        'validPass2',
        'validFirstName',
        'validLastName'
      );
      const session2 = (sessionRes2.body as { session: string }).session;

      const res = reqAdminQuizGameResultGet(session2, quizId, gameId);
      expect(res.body).toStrictEqual({ error: expect.any(String) });
      expect(res.statusCode).toStrictEqual(403);
    });

    test('Invalid game(game does not exist)', () => {
      const res = reqAdminQuizGameResultGet(session, quizId, gameId + 1);
      expect(res.body).toStrictEqual({ error: expect.any(String) });
      expect(res.statusCode).toStrictEqual(400);
    });

    test('Invalid game(game does not refer to the quizId)', () => {
      const newQuizRes = reqAdminQuizCreate(session, 'another valid name', 'valid description');
      const newQuizId = (newQuizRes.body as { quizId: number }).quizId;
      reqAdminQuizQuestionCreate(session, newQuizId,
        'Is this question update valid?', 4, 5,
        [
          {
            answer: 'Yes',
            correct: true
          },
          {
            answer: 'No',
            correct: false
          }
        ],
        'http://jpg'
      );

      reqAdminQuizGameStart(session, newQuizId, 0);
      reqAdminQuizGameStateUpdate(newQuizId, gameId, session, QuizGameAction.GO_TO_FINAL_RESULTS);

      const res = reqAdminQuizGameResultGet(session, newQuizId, gameId);
      expect(res.body).toStrictEqual({ error: expect.any(String) });
      expect(res.statusCode).toStrictEqual(400);
    });

    test('game is not in FINAL_RESULTS state', () => {
      const newGameRes = reqAdminQuizGameStart(session, quizId, 0);
      const newGameId = (newGameRes.body as { gameId: number }).gameId;
      const res = reqAdminQuizGameResultGet(session, quizId, newGameId);
      expect(res.body).toStrictEqual({ error: expect.any(String) });
      expect(res.statusCode).toStrictEqual(400);
    });

    test('quiz has no questions', () => {
      const validAutoStartNum = 0;
      const resQuiz = reqAdminQuizCreate(session, 'another valid name', 'valid description');
      const diffQuizId = (resQuiz.body as { quizId: number }).quizId;
      const res = reqAdminQuizGameStart(session, diffQuizId, validAutoStartNum);
      expect(res.body).toStrictEqual({ error: expect.any(String) });
      expect(res.statusCode).toStrictEqual(400);
    });
  });

  describe('Success cases', () => {
    test('Correct status code', () => {
      const res = reqAdminQuizGameResultGet(session, quizId, gameId);
      expect(res.statusCode).toStrictEqual(200);
    });

    test('Correct output', () => {
      const res = reqAdminQuizGameResultGet(session, quizId, gameId);
      expect(res.body).toStrictEqual({
        userRankedByScore: [],
        questionResults: [
          {
            averageAnswerTime: 0,
            percentCorrect: 0,
            playersCorrect: [],
            questionId: expect.any(Number),
            submissions: []
          }
        ]
      });
    });
  });
});
