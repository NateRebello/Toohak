import { expect, test } from '@jest/globals';
import {
  reqAdminQuizQuestionMove,
  reqAdminAuthRegister,
  reqAdminQuizCreate,
  reqAdminQuizInfo,
  reqAdminQuizQuestionCreate,
  reqClear,
} from '../helperFile/serverRequests';

beforeEach(() => {
  reqClear();
});

describe('POST v1/admin/quiz/{quizid}/question/{questionid}/move (adminQuizQuestionMove)', () => {
  // Creating a user with a quiz and multiple questions
  let session: string;
  let quizId: number;
  let questionId1: number;
  let questionId2: number;
  let questionId3: number;

  beforeEach(() => {
    const res = reqAdminAuthRegister(
      'valid@email.com',
      'validPass1',
      'validFirstName',
      'validLastName'
    );
    session = (res.body as { session: string }).session;

    const resQuiz = reqAdminQuizCreate(session, 'valid name', 'valid description');
    quizId = (resQuiz.body as {quizId: number}).quizId;

    // Create three questions
    const resQuestion1 = reqAdminQuizQuestionCreate(session, quizId,
      'Question 1?', 4, 5,
      [
        { answer: 'Yes', correct: true },
        { answer: 'No', correct: false }
      ],
      'http://jpg'
    );
    questionId1 = (resQuestion1.body as {questionId: number}).questionId;

    const resQuestion2 = reqAdminQuizQuestionCreate(session, quizId,
      'Question 2?', 4, 5,
      [
        { answer: 'Yes', correct: true },
        { answer: 'No', correct: false }
      ],
      'http://jpg'
    );
    questionId2 = (resQuestion2.body as {questionId: number}).questionId;

    const resQuestion3 = reqAdminQuizQuestionCreate(session, quizId,
      'Question 3?', 4, 5,
      [
        { answer: 'Yes', correct: true },
        { answer: 'No', correct: false }
      ],
      'http://jpg'
    );
    questionId3 = (resQuestion3.body as {questionId: number}).questionId;
  });

  describe('Error cases', () => {
    test('Invalid session', () => {
      const sessionInvalid = session + '1';
      const res = reqAdminQuizQuestionMove(sessionInvalid, quizId, questionId1, 1);
      expect(res.body).toStrictEqual({ error: expect.any(String) });
      expect(res.statusCode).toStrictEqual(401);
    });

    test('Invalid quizId', () => {
      const quizIdInvalid = quizId + 1;
      const res = reqAdminQuizQuestionMove(session, quizIdInvalid, questionId1, 1);
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
      const session2 = 'session' in res2.body ? res2.body.session : '';

      const res = reqAdminQuizQuestionMove(session2, quizId, questionId1, 1);
      expect(res.body).toStrictEqual({ error: expect.any(String) });
      expect(res.statusCode).toStrictEqual(403);
    });

    test('Invalid questionId (not in quiz)', () => {
      const questionIdInvalid = questionId3 + 1;
      const res = reqAdminQuizQuestionMove(session, quizId, questionIdInvalid, 1);
      expect(res.body).toStrictEqual({ error: expect.any(String) });
      expect(res.statusCode).toStrictEqual(400);
    });

    test('NewPosition is less than 0', () => {
      const res = reqAdminQuizQuestionMove(session, quizId, questionId1, -1);
      expect(res.body).toStrictEqual({ error: expect.any(String) });
      expect(res.statusCode).toStrictEqual(400);
    });

    test('NewPosition is greater than number of questions - 1', () => {
      const res = reqAdminQuizQuestionMove(session, quizId, questionId1, 3);
      expect(res.body).toStrictEqual({ error: expect.any(String) });
      expect(res.statusCode).toStrictEqual(400);
    });

    test('NewPosition is current position', () => {
      const res = reqAdminQuizQuestionMove(session, quizId, questionId1, 0);
      expect(res.body).toStrictEqual({ error: expect.any(String) });
      expect(res.statusCode).toStrictEqual(400);
    });
  });

  describe('Success cases', () => {
    test('Successfully move question from position 0 to 1', () => {
      const res = reqAdminQuizQuestionMove(session, quizId, questionId1, 1);
      expect(res.body).toStrictEqual({});
      expect(res.statusCode).toStrictEqual(200);

      // Verify the order changed
      const quizInfo = reqAdminQuizInfo(session, quizId).body;
      expect(quizInfo.questions[0].questionId).toStrictEqual(questionId2);
      expect(quizInfo.questions[1].questionId).toStrictEqual(questionId1);
      expect(quizInfo.questions[2].questionId).toStrictEqual(questionId3);
    });

    test('Successfully move question from position 2 to 0', () => {
      const res = reqAdminQuizQuestionMove(session, quizId, questionId3, 0);
      expect(res.body).toStrictEqual({});
      expect(res.statusCode).toStrictEqual(200);

      // Verify the order changed
      const quizInfo = reqAdminQuizInfo(session, quizId).body;
      expect(quizInfo.questions[0].questionId).toStrictEqual(questionId3);
      expect(quizInfo.questions[1].questionId).toStrictEqual(questionId1);
      expect(quizInfo.questions[2].questionId).toStrictEqual(questionId2);
    });

    test('TimeLastEdited is updated after successful move', () => {
      const quizInfoBefore = reqAdminQuizInfo(session, quizId).body;
      const res = reqAdminQuizQuestionMove(session, quizId, questionId1, 1);
      expect(res.body).toStrictEqual({});
      expect(res.statusCode).toStrictEqual(200);

      const quizInfoAfter = reqAdminQuizInfo(session, quizId).body;
      expect(new Date(quizInfoAfter.timeLastEdited).getTime())
        .toBeGreaterThan(new Date(quizInfoBefore.timeLastEdited).getTime());
    });
  });
});
