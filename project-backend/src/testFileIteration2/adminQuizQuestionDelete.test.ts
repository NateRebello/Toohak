import { expect, test } from '@jest/globals';
import {
  reqAdminAuthRegister,
  reqAdminQuizCreate,
  reqAdminQuizQuestionCreate,
  reqAdminQuizQuestionDelete,
  reqAdminQuizInfo,
  reqClear,
} from '../helperFile/serverRequests';
import { v4 as uuidv4 } from 'uuid';

beforeEach(() => {
  reqClear();
});

describe('DELETE /v1/admin/quiz/{quizId}/question/{questionId} (adminQuizQuestionDelete)', () => {
  let session: string;
  let quizId: number;
  let questionId: number;

  beforeEach(() => {
    // Register a new admin user
    const res = reqAdminAuthRegister(
      'admin@example.com',
      'securePassword123',
      'Admin',
      'User'
    );
    session = (res.body as { session: string }).session;

    const resQuiz = reqAdminQuizCreate(session, 'Sample Quiz', 'A sample quiz description.');
    quizId = (resQuiz.body as { quizId: number }).quizId;

    const resQuestion = reqAdminQuizQuestionCreate(session, quizId,
      'Sample Question1', 30, 10,
      [
        {
          answer: 'Option 1',
          correct: false
        },
        {
          answer: 'Option 2',
          correct: true
        }
      ],
      'http://jpg'
    );
    questionId = (resQuestion.body as {questionId: number}).questionId;
  });

  describe('Error cases', () => {
    test('Invalid session token', () => {
      const invalidSession = uuidv4();
      const res = reqAdminQuizQuestionDelete(invalidSession, quizId, questionId);
      expect(res.body).toStrictEqual({ error: expect.any(String) });
      expect(res.statusCode).toBe(401);
    });

    test('Non-existent quizId', () => {
      const nonExistentQuizId = quizId + 1;
      const res = reqAdminQuizQuestionDelete(session, nonExistentQuizId, questionId);
      expect(res.body).toStrictEqual({ error: expect.any(String) });
      expect(res.statusCode).toBe(403);
    });

    test('Non-existent questionId', () => {
      const nonExistentQuestionId = questionId + 1;
      const res = reqAdminQuizQuestionDelete(session, quizId, nonExistentQuestionId);
      expect(res.body).toStrictEqual({ error: expect.any(String) });
      expect(res.statusCode).toBe(400);
    });

    test('Deleting question from another user\'s quiz', () => {
      // Register a second admin
      const resSecondUser = reqAdminAuthRegister(
        'secondadmin@example.com',
        'anotherSecurePass123',
        'Second',
        'Admin'
      );
      const secondSession = (resSecondUser.body as { session: string }).session;

      const res = reqAdminQuizQuestionDelete(secondSession, quizId, questionId);
      expect(res.body).toStrictEqual({ error: expect.any(String) });
      expect(res.statusCode).toBe(403);
    });
  });

  describe('Success cases', () => {
    test('Successfully deletes a question', () => {
      const res = reqAdminQuizQuestionDelete(session, quizId, questionId);
      expect(res.statusCode).toBe(200);
      expect(res.body).toStrictEqual({});

      // Verifying whether the question count is updated
      const quizInfo = reqAdminQuizInfo(session, quizId);
      expect(quizInfo.statusCode).toStrictEqual(200);
      expect(quizInfo.body).toStrictEqual({
        quizId: quizId,
        name: 'Sample Quiz',
        timeCreated: expect.any(Number),
        timeLastEdited: expect.any(Number),
        description: 'A sample quiz description.',
        numQuestions: 0,
        questions: [],
        timeLimit: 0,
      });
    });

    test('Successfully remove a question from a quiz with multiple question', () => {
      const resQuestion2 = reqAdminQuizQuestionCreate(session, quizId,
        'Sample Question2', 30, 10,
        [
          {
            answer: 'Option 1',
            correct: false
          },
          {
            answer: 'Option 2',
            correct: true
          }
        ],
        'http://jpg'
      );
      const questionId2 = (resQuestion2.body as { questionId: number }).questionId;

      const resDelete = reqAdminQuizQuestionDelete(session, quizId, questionId);
      expect(resDelete.body).toStrictEqual({});
      expect(resDelete.statusCode).toStrictEqual(200);

      const quizInfo = reqAdminQuizInfo(session, quizId);
      expect(quizInfo.statusCode).toStrictEqual(200);
      expect(quizInfo.body).toStrictEqual({
        quizId: quizId,
        name: 'Sample Quiz',
        timeCreated: expect.any(Number),
        timeLastEdited: expect.any(Number),
        description: 'A sample quiz description.',
        numQuestions: 1,
        questions: [
          {
            questionId: questionId2,
            question: 'Sample Question2',
            timeLimit: 30,
            thumbnailUrl: 'http://jpg',
            points: 10,
            answerOptions: [
              {
                answer: 'Option 1',
                correct: false,
                answerId: expect.any(Number),
                colour: expect.any(String)
              },
              {
                answer: 'Option 2',
                correct: true,
                answerId: expect.any(Number),
                colour: expect.any(String)
              }
            ]
          }
        ],
        timeLimit: 30
      });
    });
  });
});
