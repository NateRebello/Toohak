import {
  reqAdminAuthRegister,
  reqAdminQuizCreate,
  reqAdminQuizRemove,
  reqClear
} from '../helperFile/serverRequests';
import { expect, test } from '@jest/globals';
import { v4 as uuidv4 } from 'uuid';

beforeEach(() => {
  reqClear();
});

describe('DELETE /v1/admin/quiz/{quizid} (adminQuizDelete)', () => {
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
      const res = reqAdminQuizRemove(session, quizId);
      expect(res.body).toStrictEqual({});
      expect(res.statusCode).toStrictEqual(200);
    });
  });

  describe('Error Cases', () => {
    test('Empty session', () => {
      const res = reqAdminQuizRemove('', quizId);
      expect(res.body).toStrictEqual({ error: expect.any(String) });
      expect(res.statusCode).toStrictEqual(401);
    });

    test('Invalid session', () => {
      const invalidSession = uuidv4();
      const res = reqAdminQuizRemove(invalidSession, quizId);
      expect(res.body).toStrictEqual({ error: expect.any(String) });
      expect(res.statusCode).toStrictEqual(401);
    });

    test('Invalid quizId', () => {
      const quizIdInvalid = quizId + 1;
      const res = reqAdminQuizRemove(session, quizIdInvalid);
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
      const res = reqAdminQuizRemove(anotherSession, quizId);
      expect(res.body).toStrictEqual({ error: expect.any(String) });
      expect(res.statusCode).toStrictEqual(403);
    });
  });
});
