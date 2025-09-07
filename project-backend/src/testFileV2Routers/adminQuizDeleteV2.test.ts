import {
  reqAdminAuthRegister,
  reqAdminQuizCreate,
  reqAdminQuizDeleteV2,
  reqAdminQuizGameStart,
  reqAdminQuizQuestionCreateV2,
  reqClear
} from '../helperFile/serverRequests';
import { expect, test } from '@jest/globals';
import { v4 as uuidv4 } from 'uuid';

beforeEach(() => {
  reqClear();
});

describe('DELETE /v2/admin/quiz/{quizid} (adminQuizDeleteV2)', () => {
  let quizId: number;
  let session: string;

  beforeEach(() => {
    const res = reqAdminAuthRegister(
      'valid@mail.com',
      'ValidPassword1',
      'ValidFirst',
      'ValidLast'
    );
    if ('session' in res.body) {
      session = res.body.session;
    }
    const quizRes = reqAdminQuizCreate(session, 'Sample Quiz', 'This is a simple quiz');
    if ('quizId' in quizRes.body) {
      quizId = quizRes.body.quizId;
    }
  });

  describe('Success Cases', () => {
    test('Successfully remove a quiz', () => {
      const res = reqAdminQuizDeleteV2(quizId, session);
      expect(res.body).toStrictEqual({});
      expect(res.statusCode).toStrictEqual(200);
    });
  });

  describe('Error Cases', () => {
    test('Empty session', () => {
      const res = reqAdminQuizDeleteV2(quizId, '');
      expect(res.body).toStrictEqual({ error: expect.any(String) });
      expect(res.statusCode).toStrictEqual(401);
    });

    test('Invalid session', () => {
      const invalidSession = uuidv4();
      const res = reqAdminQuizDeleteV2(quizId, invalidSession);
      expect(res.body).toStrictEqual({ error: expect.any(String) });
      expect(res.statusCode).toStrictEqual(401);
    });

    test('Invalid quizId', () => {
      const quizIdInvalid = quizId + 1;
      const res = reqAdminQuizDeleteV2(quizIdInvalid, session);
      expect(res.body).toStrictEqual({ error: expect.any(String) });
      expect(res.statusCode).toStrictEqual(403);
    });

    test('User does not own the quiz', () => {
      let anotherSession: string;
      const anotherRes = reqAdminAuthRegister(
        'another@mail.com',
        'ValidPassword2',
        'AnotherFirst',
        'AnotherLast'
      );
      if ('session' in anotherRes.body) {
        anotherSession = anotherRes.body.session;
      }
      const res = reqAdminQuizDeleteV2(quizId, anotherSession);
      expect(res.body).toStrictEqual({ error: expect.any(String) });
      expect(res.statusCode).toStrictEqual(403);
    });

    test('The game is not in END state', () => {
      const resQuestion = reqAdminQuizQuestionCreateV2(quizId, session,
        'Is this question valid?', 4, 5,
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
      expect(resQuestion.statusCode).toStrictEqual(200);
      const resGame = reqAdminQuizGameStart(session, quizId, 3);
      expect(resGame.statusCode).toStrictEqual(200);

      const resDelete = reqAdminQuizDeleteV2(quizId, session);
      expect(resDelete.statusCode).toStrictEqual(400);
      expect(resDelete.body).toStrictEqual({ error: expect.any(String) });
    });
  });
});
