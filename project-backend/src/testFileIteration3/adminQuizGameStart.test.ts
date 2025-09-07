import { expect, test } from '@jest/globals';
import {
  reqAdminAuthRegister,
  reqAdminQuizCreate,
  reqClear,
  reqAdminQuizGameStart,
  reqAdminQuizQuestionCreateV2
} from '../helperFile/serverRequests';

beforeEach(() => {
  reqClear();
});

describe('POST /v1/admin/quiz/{quizid}/game/start (adminQuizGameStart)', () => {
  // Creating a second user who owns a quiz
  let session: string;
  let quizId: number;
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

    reqAdminQuizQuestionCreateV2(quizId, session,
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
  });

  describe('Error cases', () => {
    test('Invalid session', () => {
      const invalidSession = session + '1';
      const res = reqAdminQuizGameStart(invalidSession, quizId, 0);
      expect(res.body).toStrictEqual({ error: expect.any(String) });
      expect(res.statusCode).toStrictEqual(401);
    });

    test('Empty session', () => {
      const res = reqAdminQuizGameStart('', quizId, 0);
      expect(res.body).toStrictEqual({ error: expect.any(String) });
      expect(res.statusCode).toStrictEqual(401);
    });

    test('Invalid quizId', () => {
      const invalidQuizId = quizId + 1;
      const res = reqAdminQuizGameStart(session, invalidQuizId, 0);
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

      const res = reqAdminQuizGameStart(session2, quizId, 0);
      expect(res.body).toStrictEqual({ error: expect.any(String) });
      expect(res.statusCode).toStrictEqual(403);
    });

    test('Invalid autoStartNum', () => {
      const invalidAutoStartNum = 51;
      const res = reqAdminQuizGameStart(session, quizId, invalidAutoStartNum);
      expect(res.body).toStrictEqual({ error: expect.any(String) });
      expect(res.statusCode).toStrictEqual(400);
    });

    test('10 games that are not in END state currently exist for this quiz', () => {
      const validAutoStartNum = 0;
      reqAdminQuizGameStart(session, quizId, validAutoStartNum);
      reqAdminQuizGameStart(session, quizId, validAutoStartNum);
      reqAdminQuizGameStart(session, quizId, validAutoStartNum);
      reqAdminQuizGameStart(session, quizId, validAutoStartNum);
      reqAdminQuizGameStart(session, quizId, validAutoStartNum);
      reqAdminQuizGameStart(session, quizId, validAutoStartNum);
      reqAdminQuizGameStart(session, quizId, validAutoStartNum);
      reqAdminQuizGameStart(session, quizId, validAutoStartNum);
      reqAdminQuizGameStart(session, quizId, validAutoStartNum);
      reqAdminQuizGameStart(session, quizId, validAutoStartNum);
      const res = reqAdminQuizGameStart(session, quizId, validAutoStartNum);
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
      const validAutoStartNum = 0;
      const res = reqAdminQuizGameStart(session, quizId, validAutoStartNum);
      expect(res.statusCode).toStrictEqual(200);
    });

    test('Correct output', () => {
      const validAutoStartNum = 0;
      const res = reqAdminQuizGameStart(session, quizId, validAutoStartNum);
      expect(res.body).toStrictEqual({ gameId: expect.any(Number) });
    });

    test('9 active games and another active game from a different quiz', () => {
      const validAutoStartNum = 0;
      const quizRes = reqAdminQuizCreate(session, 'another valid name', 'valid description');
      const newQuizId = (quizRes.body as { quizId: number }).quizId;

      reqAdminQuizQuestionCreateV2(newQuizId, session,
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
      reqAdminQuizGameStart(session, newQuizId, validAutoStartNum);
      reqAdminQuizGameStart(session, quizId, validAutoStartNum);
      reqAdminQuizGameStart(session, quizId, validAutoStartNum);
      reqAdminQuizGameStart(session, quizId, validAutoStartNum);
      reqAdminQuizGameStart(session, quizId, validAutoStartNum);
      reqAdminQuizGameStart(session, quizId, validAutoStartNum);
      reqAdminQuizGameStart(session, quizId, validAutoStartNum);
      reqAdminQuizGameStart(session, quizId, validAutoStartNum);
      reqAdminQuizGameStart(session, quizId, validAutoStartNum);
      reqAdminQuizGameStart(session, quizId, validAutoStartNum);
      const res = reqAdminQuizGameStart(session, quizId, validAutoStartNum);
      expect(res.body).toStrictEqual({ gameId: expect.any(Number) });
    });
  });
});
