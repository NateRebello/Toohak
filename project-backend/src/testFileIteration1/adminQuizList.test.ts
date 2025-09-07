import {
  reqAdminAuthRegister,
  reqAdminQuizCreate,
  reqAdminQuizList,
  reqClear
} from '../helperFile/serverRequests';
import { expect, test } from '@jest/globals';
import { v4 as uuidv4 } from 'uuid';

beforeEach(() => {
  reqClear();
});

describe('GET /v1/admin/quiz/list (adminQuizList)', () => {
  let session: string;

  beforeEach(() => {
    const res = reqAdminAuthRegister(
      'valid@email.com',
      'validPass1',
      'validFirstName',
      'validLastName'
    );
    session = (res.body as { session: string }).session;
  });

  describe('Success Cases', () => {
    test('List of Quizzes', () => {
      let quizId1: number, quizId2: number, quizId3: number;
      const res1 = reqAdminQuizCreate(session, 'Quiz 1', 'Quiz 1 Description');
      const res2 = reqAdminQuizCreate(session, 'Quiz 2', 'Quiz 2 Description');
      const res3 = reqAdminQuizCreate(session, 'Quiz 3', 'Quiz 3 Description');

      if ('quizId' in res1.body && 'quizId' in res2.body && 'quizId' in res3.body) {
        quizId1 = res1.body.quizId;
        quizId2 = res2.body.quizId;
        quizId3 = res3.body.quizId;
      }

      const listRes = reqAdminQuizList(session);
      expect(listRes.body).toStrictEqual({
        quizzes: [
          { quizId: quizId1, name: 'Quiz 1' },
          { quizId: quizId2, name: 'Quiz 2' },
          { quizId: quizId3, name: 'Quiz 3' }
        ]
      });
      expect(listRes.statusCode).toStrictEqual(200);
    });

    test('One Quiz', () => {
      let quizId: number;
      const res = reqAdminQuizCreate(session, 'Quiz 1', 'Quiz 1 Description');

      if ('quizId' in res.body) {
        quizId = res.body.quizId;
      }

      const listRes = reqAdminQuizList(session);
      expect(listRes.body).toStrictEqual({
        quizzes: [
          { quizId: quizId, name: 'Quiz 1' }
        ]
      });
      expect(listRes.statusCode).toStrictEqual(200);
    });
  });

  describe('Error Cases', () => {
    test.each([
      { test: 'Empty session', session: '' },
      { test: 'Invalid session', session: uuidv4() },
      { test: 'Invalid session(string)', session: 'invalidsession' },
      { test: 'Special character userId', userId: '!' },
    ])('Invalid UserId: $test', ({ session }) => {
      const res = reqAdminQuizList(session);
      expect(res.body).toStrictEqual({ error: expect.any(String) });
      expect(res.statusCode).toStrictEqual(401);
    });
  });
});
