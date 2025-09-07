import { expect, test } from '@jest/globals';
import {
  reqAdminAuthRegister,
  reqAdminQuizInfo,
  reqAdminQuizCreate,
  reqAdminQuizTransfer,
  reqClear,
} from '../helperFile/serverRequests';

beforeEach(() => {
  // resets data before each tests
  reqClear();
});

describe('POST /v1/admin/quiz/{quizid}/transfer', () => {
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

    const resQuiz = reqAdminQuizCreate(
      session,
      'valid name',
      'valid description'
    );
    quizId = (resQuiz.body as { quizId: number }).quizId;
  });

  describe('Error cases', () => {
    test('Invalid session', () => {
      const invalidSession = session + '1';
      const res = reqAdminQuizTransfer(quizId, invalidSession, 'anotherValidEmail@email.com');
      expect(res.body).toStrictEqual({ error: expect.any(String) });
      expect(res.statusCode).toStrictEqual(401);
    });

    test('Invalid quizId: $test', () => {
      const invalidQuizId = quizId + 1;
      const res = reqAdminQuizTransfer(invalidQuizId, session, 'anotherValidEmail@email.com');
      expect(res.body).toStrictEqual({ error: expect.any(String) });
      expect(res.statusCode).toStrictEqual(403);
    });

    test('Quiz belongs to another user', () => {
      const res2 = reqAdminAuthRegister(
        'second@user.com',
        'validPass2',
        'validFirstName',
        'validLastName'
      );
      const session2 = (res2.body as { session: string }).session;

      const res = reqAdminQuizTransfer(quizId, session2, 'anotherValidEmail@email.com');
      expect(res.body).toStrictEqual({ error: expect.any(String) });
      expect(res.statusCode).toStrictEqual(403);
    });

    test('Email does not belong to a real user', () => {
      const res = reqAdminQuizTransfer(quizId, session, 'invalidEmail@email.com');
      expect(res.body).toStrictEqual({ error: expect.any(String) });
      expect(res.statusCode).toStrictEqual(400);
    });

    test('Email belongs to the current logged in user', () => {
      const res = reqAdminQuizTransfer(quizId, session, 'valid@email.com');
      expect(res.body).toStrictEqual({ error: expect.any(String) });
      expect(res.statusCode).toStrictEqual(400);
    });

    test('Target user already has a quiz with the same name', () => {
      const resReg = reqAdminAuthRegister(
        'second@user.com',
        'validPass2',
        'validFirstName',
        'validLastName'
      );
      const session2 = (resReg.body as { session: string }).session;
      reqAdminQuizCreate(session2, 'valid name', 'valid description');
      const res = reqAdminQuizTransfer(quizId, session, 'second@user.com');
      expect(res.body).toStrictEqual({ error: expect.any(String) });
      expect(res.statusCode).toStrictEqual(400);
    });
  });

  describe('Success cases', () => {
    let session2: string;
    beforeEach(() => {
      const res = reqAdminAuthRegister(
        'second@user.com',
        'validPass2',
        'validFirstName',
        'validLastName'
      );
      session2 = (res.body as { session: string }).session;
    });

    test('Correct return and status code', () => {
      const res = reqAdminQuizTransfer(quizId, session, 'second@user.com');
      expect(res.body).toStrictEqual({});
      expect(res.statusCode).toStrictEqual(200);
    });

    test('Quiz Info reflects change of quiz ownership', () => {
      reqAdminQuizTransfer(quizId, session, 'second@user.com');

      const res1 = reqAdminQuizInfo(session, quizId);
      expect(res1.body).toStrictEqual({ error: expect.any(String) });
      expect(res1.statusCode).toStrictEqual(403);

      const res2 = reqAdminQuizInfo(session2, quizId);
      expect(res2.body).toStrictEqual({
        quizId: quizId,
        name: 'valid name',
        timeCreated: expect.any(Number),
        timeLastEdited: expect.any(Number),
        description: 'valid description',
        numQuestions: 0,
        questions: [],
        timeLimit: 0,
      });
      expect(res2.statusCode).toStrictEqual(200);
    });

    test('Quiz Info reflects change of quiz ownership for more than 1 quiz', () => {
      const resQuiz2 = reqAdminQuizCreate(
        session,
        'anotherValidName',
        'anotherValidDescription'
      );
      const quizId2 = (resQuiz2.body as { quizId: number }).quizId;

      reqAdminQuizTransfer(quizId, session, 'second@user.com');
      reqAdminQuizTransfer(quizId2, session, 'second@user.com');

      const resInfo1 = reqAdminQuizInfo(session, quizId);
      expect(resInfo1.body).toStrictEqual({ error: expect.any(String) });
      expect(resInfo1.statusCode).toStrictEqual(403);

      const resInfo2 = reqAdminQuizInfo(session, quizId2);
      expect(resInfo2.body).toStrictEqual({ error: expect.any(String) });
      expect(resInfo1.statusCode).toStrictEqual(403);

      const resInfo3 = reqAdminQuizInfo(session2, quizId);
      expect(resInfo3.body).toStrictEqual({
        quizId: quizId,
        name: 'valid name',
        timeCreated: expect.any(Number),
        timeLastEdited: expect.any(Number),
        description: 'valid description',
        numQuestions: 0,
        questions: [],
        timeLimit: 0,
      });
      expect(resInfo3.statusCode).toStrictEqual(200);

      const resInfo4 = reqAdminQuizInfo(session2, quizId2);
      expect(resInfo4.body).toStrictEqual({
        quizId: quizId2,
        name: 'anotherValidName',
        timeCreated: expect.any(Number),
        timeLastEdited: expect.any(Number),
        description: 'anotherValidDescription',
        numQuestions: 0,
        questions: [],
        timeLimit: 0,
      });
      expect(resInfo4.statusCode).toStrictEqual(200);
    });

    test('Correctly transfers quiz multiple times', () => {
      reqAdminQuizTransfer(quizId, session, 'second@user.com');

      const resInfo1 = reqAdminQuizInfo(session, quizId);
      expect(resInfo1.body).toStrictEqual({ error: expect.any(String) });
      expect(resInfo1.statusCode).toStrictEqual(403);

      const resInfo2 = reqAdminQuizInfo(session2, quizId);
      expect(resInfo2.body).toStrictEqual({
        quizId: quizId,
        name: 'valid name',
        timeCreated: expect.any(Number),
        timeLastEdited: expect.any(Number),
        description: 'valid description',
        numQuestions: 0,
        questions: [],
        timeLimit: 0,
      });
      expect(resInfo2.statusCode).toStrictEqual(200);

      // Transfer the quiz back
      const res = reqAdminQuizTransfer(quizId, session2, 'valid@email.com');
      expect(res.body).toStrictEqual({});
      expect(res.statusCode).toStrictEqual(200);

      const resInfo3 = reqAdminQuizInfo(session2, quizId);
      expect(resInfo3.body).toStrictEqual({ error: expect.any(String) });
      expect(resInfo3.statusCode).toStrictEqual(403);

      const resInfo4 = reqAdminQuizInfo(session, quizId);
      expect(resInfo4.body).toStrictEqual({
        quizId: quizId,
        name: 'valid name',
        timeCreated: expect.any(Number),
        timeLastEdited: expect.any(Number),
        description: 'valid description',
        numQuestions: 0,
        questions: [],
        timeLimit: 0,
      });
      expect(resInfo4.statusCode).toStrictEqual(200);
    });
  });
});
