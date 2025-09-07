import { expect, test } from '@jest/globals';
import {
  reqAdminAuthRegister,
  reqAdminQuizCreate,
  reqClear,
  reqAdminQuizTransferV2,
  reqAdminQuizInfoV2,
  reqAdminQuizGameStart,
  reqAdminQuizQuestionCreateV2,
} from '../helperFile/serverRequests';

beforeEach(() => {
  // resets data before each tests
  reqClear();
});

describe('POST /v2/admin/quiz/{quizid}/transfer', () => {
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
      const res = reqAdminQuizTransferV2(quizId, invalidSession, 'anotherValidEmail@email.com');
      expect(res.body).toStrictEqual({ error: expect.any(String) });
      expect(res.statusCode).toStrictEqual(401);
    });

    test('Invalid quizId: $test', () => {
      const invalidQuizId = quizId + 1;
      const res = reqAdminQuizTransferV2(invalidQuizId, session, 'anotherValidEmail@email.com');
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

      const res = reqAdminQuizTransferV2(quizId, session2, 'anotherValidEmail@email.com');
      expect(res.body).toStrictEqual({ error: expect.any(String) });
      expect(res.statusCode).toStrictEqual(403);
    });

    test('Email does not belong to a real user', () => {
      const res = reqAdminQuizTransferV2(quizId, session, 'invalidEmail@email.com');
      expect(res.body).toStrictEqual({ error: expect.any(String) });
      expect(res.statusCode).toStrictEqual(400);
    });

    test('Email belongs to the current logged in user', () => {
      const res = reqAdminQuizTransferV2(quizId, session, 'valid@email.com');
      expect(res.body).toStrictEqual({ error: expect.any(String) });
      expect(res.statusCode).toStrictEqual(400);
    });

    test('Quiz name already exists for target user', () => {
      const res2 = reqAdminAuthRegister(
        'second@user.com',
        'validPass2',
        'validFirstName',
        'validLastName'
      );
      const session2 = (res2.body as { session: string }).session;

      const resQuiz2 = reqAdminQuizCreate(session2, 'valid name', 'duplicate');
      expect(resQuiz2.statusCode).toStrictEqual(200);

      const resTransfer = reqAdminQuizTransferV2(quizId, session, 'second@user.com');
      expect(resTransfer.body).toStrictEqual({ error: expect.any(String) });
      expect(resTransfer.statusCode).toStrictEqual(400);
    });

    test('Game not in END state', () => {
      reqAdminQuizQuestionCreateV2(quizId, session,
        'Is 2 + 2 = 4?', 4, 5,
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
      const resGame = reqAdminQuizGameStart(session, quizId, 0);
      expect(resGame.statusCode).toStrictEqual(200);

      const res = reqAdminQuizTransferV2(quizId, session, 'second@user.com');
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
      const res = reqAdminQuizTransferV2(quizId, session, 'second@user.com');
      expect(res.body).toStrictEqual({});
      expect(res.statusCode).toStrictEqual(200);
    });

    test('Quiz Info reflects change of quiz ownership', () => {
      reqAdminQuizTransferV2(quizId, session, 'second@user.com');

      const res1 = reqAdminQuizInfoV2(session, quizId);
      expect(res1.body).toStrictEqual({ error: expect.any(String) });
      expect(res1.statusCode).toStrictEqual(403);

      const res2 = reqAdminQuizInfoV2(session2, quizId);
      expect(res2.body).toStrictEqual({
        quizId: quizId,
        name: 'valid name',
        timeCreated: expect.any(Number),
        timeLastEdited: expect.any(Number),
        description: 'valid description',
        numQuestions: 0,
        questions: [],
        timeLimit: 0,
        thumbnailUrl: ''
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

      reqAdminQuizTransferV2(quizId, session, 'second@user.com');
      reqAdminQuizTransferV2(quizId2, session, 'second@user.com');

      const resInfo1 = reqAdminQuizInfoV2(session, quizId);
      expect(resInfo1.body).toStrictEqual({ error: expect.any(String) });
      expect(resInfo1.statusCode).toStrictEqual(403);

      const resInfo2 = reqAdminQuizInfoV2(session, quizId2);
      expect(resInfo2.body).toStrictEqual({ error: expect.any(String) });
      expect(resInfo1.statusCode).toStrictEqual(403);

      const resInfo3 = reqAdminQuizInfoV2(session2, quizId);
      expect(resInfo3.body).toStrictEqual({
        quizId: quizId,
        name: 'valid name',
        timeCreated: expect.any(Number),
        timeLastEdited: expect.any(Number),
        description: 'valid description',
        numQuestions: 0,
        questions: [],
        timeLimit: 0,
        thumbnailUrl: ''
      });
      expect(resInfo3.statusCode).toStrictEqual(200);

      const resInfo4 = reqAdminQuizInfoV2(session2, quizId2);
      expect(resInfo4.body).toStrictEqual({
        quizId: quizId2,
        name: 'anotherValidName',
        timeCreated: expect.any(Number),
        timeLastEdited: expect.any(Number),
        description: 'anotherValidDescription',
        numQuestions: 0,
        questions: [],
        timeLimit: 0,
        thumbnailUrl: ''
      });
      expect(resInfo4.statusCode).toStrictEqual(200);
    });

    test('Correctly transfers quiz multiple times', () => {
      reqAdminQuizTransferV2(quizId, session, 'second@user.com');

      const resInfo1 = reqAdminQuizInfoV2(session, quizId);
      expect(resInfo1.body).toStrictEqual({ error: expect.any(String) });
      expect(resInfo1.statusCode).toStrictEqual(403);

      const resInfo2 = reqAdminQuizInfoV2(session2, quizId);
      expect(resInfo2.body).toStrictEqual({
        quizId: quizId,
        name: 'valid name',
        timeCreated: expect.any(Number),
        timeLastEdited: expect.any(Number),
        description: 'valid description',
        numQuestions: 0,
        questions: [],
        timeLimit: 0,
        thumbnailUrl: ''
      });
      expect(resInfo2.statusCode).toStrictEqual(200);

      // Transfer the quiz back
      const res = reqAdminQuizTransferV2(quizId, session2, 'valid@email.com');
      expect(res.body).toStrictEqual({});
      expect(res.statusCode).toStrictEqual(200);

      const resInfo3 = reqAdminQuizInfoV2(session2, quizId);
      expect(resInfo3.body).toStrictEqual({ error: expect.any(String) });
      expect(resInfo3.statusCode).toStrictEqual(403);

      const resInfo4 = reqAdminQuizInfoV2(session, quizId);
      expect(resInfo4.body).toStrictEqual({
        quizId: quizId,
        name: 'valid name',
        timeCreated: expect.any(Number),
        timeLastEdited: expect.any(Number),
        description: 'valid description',
        numQuestions: 0,
        questions: [],
        timeLimit: 0,
        thumbnailUrl: ''
      });
      expect(resInfo4.statusCode).toStrictEqual(200);
    });
  });
});
