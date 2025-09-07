import { expect, test } from '@jest/globals';
import {
  reqAdminAuthRegister,
  reqClear,
  reqAdminQuizCreate,
  reqAdminQuizDescriptionUpdate,
  reqAdminQuizInfo,
} from '../helperFile/serverRequests';
import { v4 as uuidv4 } from 'uuid';

beforeEach(() => {
  reqClear();
});

describe('adminQuizDescriptionUpdate', () => {
  let session: string;
  let quizId: number;

  beforeEach(() => {
    const res = reqAdminAuthRegister(
      'valid@email.com',
      'validPass1',
      'validFirstName',
      'validLastName'
    );
    if ('session' in res.body) {
      session = res.body.session;
    }

    const quizRes = reqAdminQuizCreate(session, 'valid name', 'valid description');
    if ('quizId' in quizRes.body) {
      quizId = quizRes.body.quizId;
    }
  });

  describe('Error cases', () => {
    test.each([
      { test: 'Empty session', session: '' },
      { test: 'Invalid session', session: uuidv4() }
    ])('Invalid user: $test', ({ session }) => {
      const res = reqAdminQuizDescriptionUpdate(session, quizId, 'New description');
      expect(res.body).toStrictEqual({ error: expect.any(String) });
      expect(res.statusCode).toStrictEqual(401);
    });

    test.each([
      { test: 'Wrong quizId', QuizId: 3 },
      { test: 'Non integer value', QuizId: '!' },
    ])('Invalid quizId: $test', ({ QuizId }) => {
      const res = reqAdminQuizDescriptionUpdate(session, QuizId as any, 'New description');
      expect(res.body).toStrictEqual({ error: expect.any(String) });
      expect(res.statusCode).toStrictEqual(403);
    });

    test('Invalid description', () => {
      const invalidDescription = 'A'.repeat(101);
      const res = reqAdminQuizDescriptionUpdate(session, quizId, invalidDescription);
      expect(res.body).toStrictEqual({ error: expect.any(String) });
      expect(res.statusCode).toStrictEqual(400);
    });

    test('Quiz belongs to another user', () => {
      let session2: string;
      const resRegister = reqAdminAuthRegister(
        'second@user.com',
        'validPass2',
        'validFirstName',
        'validLastName'
      );
      if ('session' in resRegister.body) {
        session2 = resRegister.body.session;
      }

      const res = reqAdminQuizDescriptionUpdate(session2, quizId, 'New description');
      expect(res.body).toStrictEqual({ error: expect.any(String) });
      expect(res.statusCode).toStrictEqual(403);
    });
  });

  describe('Success cases', () => {
    test('Correctly updates quiz description', () => {
      const newDescription = 'Updated description';
      const res = reqAdminQuizDescriptionUpdate(session, quizId, newDescription);
      expect(res.body).toStrictEqual({});
      expect(res.statusCode).toStrictEqual(200);

      const resInfo = reqAdminQuizInfo(session, quizId);
      expect(resInfo.body).toStrictEqual({
        quizId: quizId,
        name: expect.any(String),
        timeCreated: expect.any(Number),
        timeLastEdited: expect.any(Number),
        description: newDescription,
        numQuestions: 0,
        questions: [],
        timeLimit: 0,
      });
      expect(resInfo.statusCode).toStrictEqual(200);
    });

    test('Empty strings', () => {
      const res = reqAdminQuizDescriptionUpdate(session, quizId, '');
      expect(res.body).toStrictEqual({});
      expect(res.statusCode).toStrictEqual(200);
    });
  });
});
