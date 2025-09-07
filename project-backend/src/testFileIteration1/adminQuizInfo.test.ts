import { expect, test } from '@jest/globals';
import {
  reqAdminAuthRegister,
  reqAdminQuizInfo,
  reqAdminQuizCreate,
  reqClear,
} from '../helperFile/serverRequests';

beforeEach(() => {
  reqClear();
});

describe('GET /v1/admin/quiz/{quizid} (adminQuizInfo)', () => {
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
    if ('session' in res.body) {
      session = res.body.session;
    }

    const quizRes = reqAdminQuizCreate(session, 'valid name', 'valid description');
    if ('quizId' in quizRes.body) {
      quizId = quizRes.body.quizId;
    }
  });

  describe('Error cases', () => {
    test('Invalid session', () => {
      const invalidSession = session + '1';
      const res = reqAdminQuizInfo(invalidSession, quizId);
      expect(res.body).toStrictEqual({ error: expect.any(String) });
      expect(res.statusCode).toStrictEqual(401);
    });

    test('Empty session', () => {
      const res = reqAdminQuizInfo('', quizId);
      expect(res.body).toStrictEqual({ error: expect.any(String) });
      expect(res.statusCode).toStrictEqual(401);
    });

    test('Invalid quizId', () => {
      const invalidQuizId = quizId + 1;
      const res = reqAdminQuizInfo(session, invalidQuizId);
      expect(res.body).toStrictEqual({ error: expect.any(String) });
      expect(res.statusCode).toStrictEqual(403);
    });

    test('Quiz belongs to another user', () => {
      let session2: string;
      const sessionRes2 = reqAdminAuthRegister(
        'second@user.com',
        'validPass2',
        'validFirstName',
        'validLastName'
      );

      if ('session' in sessionRes2.body) {
        session2 = sessionRes2.body.session;
      }

      const res = reqAdminQuizInfo(session2, quizId);
      expect(res.body).toStrictEqual({ error: expect.any(String) });
      expect(res.statusCode).toStrictEqual(403);
    });
  });

  describe('Success cases', () => {
    test('Correctly returns info for one quiz with no questions', () => {
      const res = reqAdminQuizInfo(session, quizId);
      expect(res.body).toStrictEqual({
        quizId: quizId,
        name: 'valid name',
        timeCreated: expect.any(Number),
        timeLastEdited: expect.any(Number),
        description: 'valid description',
        numQuestions: 0,
        questions: [],
        timeLimit: 0,
      });
      expect(res.statusCode).toStrictEqual(200);
    });

    describe('Multiple quizzes from multiple users', () => {
      // Create 2nd and 3rd users
      let session2: string, session3: string;
      let quizId2: number, quizId3: number;

      beforeEach(() => {
        const sessionRes2 = reqAdminAuthRegister(
          'second@user.com',
          'validPass2',
          'validFirstName',
          'validLastName'
        );
        const sessionRes3 = reqAdminAuthRegister(
          'third@user.com',
          'validPass3',
          'validFirstName',
          'validLastName'
        );

        if ('session' in sessionRes2.body && 'session' in sessionRes3.body) {
          session2 = sessionRes2.body.session;
          session3 = sessionRes3.body.session;
        }
        const quizRes2 = reqAdminQuizCreate(
          session2,
          'valid name',
          'valid description'
        );
        const quizRes3 = reqAdminQuizCreate(
          session3,
          'valid name',
          'valid description'
        );

        if ('quizId' in quizRes2.body && 'quizId' in quizRes3.body) {
          quizId2 = quizRes2.body.quizId;
          quizId3 = quizRes3.body.quizId;
        }
      });

      // using the Field format to makesure the beforeEach can run
      // without making the values undefined during testing
      test.each([
        { test: 'First User\'s quiz', sessionField: () => session, quizIdField: () => quizId },
        { test: 'Second User\'s quiz', sessionField: () => session2, quizIdField: () => quizId2 },
        { test: 'Third User\'s quiz', sessionField: () => session3, quizIdField: () => quizId3 },
      ])('$test', ({ sessionField, quizIdField }) => {
        const res = reqAdminQuizInfo(sessionField(), quizIdField());
        expect(res.body).toStrictEqual({
          quizId: quizIdField(),
          name: 'valid name',
          timeCreated: expect.any(Number),
          timeLastEdited: expect.any(Number),
          description: 'valid description',
          numQuestions: 0,
          questions: [],
          timeLimit: 0,
        });
        expect(res.statusCode).toStrictEqual(200);
      });
    });
  });
});
