import { expect, test } from '@jest/globals';
import {
  reqAdminAuthRegister,
  reqAdminQuizInfo,
  reqClear,
  reqAdminQuizCreate
} from '../helperFile/serverRequests';

beforeEach(() => {
  reqClear();
});

describe('clear', () => {
  test('Successfully clears all data', () => {
    const res = reqAdminAuthRegister(
      'valid@email.com',
      'validPass1',
      'validFirstName',
      'validLastName'
    );
    const session = (res.body as { session: string }).session;

    const quizRes = reqAdminQuizCreate(session, 'valid name', 'valid description');
    const quizId = (quizRes.body as { quizId: number }).quizId;

    const quizInfoBefore = reqAdminQuizInfo(session, quizId);
    expect(quizInfoBefore.body).toStrictEqual({
      quizId: quizId,
      name: expect.any(String),
      timeCreated: expect.any(Number),
      timeLastEdited: expect.any(Number),
      description: expect.any(String),
      numQuestions: 0,
      questions: [],
      timeLimit: 0
    });
    expect(quizInfoBefore.statusCode).toStrictEqual(200);

    // Clear all data
    const clearRes = reqClear();
    expect(clearRes.body).toStrictEqual({});
    expect(clearRes.statusCode).toStrictEqual(200);

    // After clearing, the quiz should not exist
    const quizInfoAfter = reqAdminQuizInfo(session, quizId);
    expect(quizInfoAfter.body).toStrictEqual({ error: expect.any(String) });
    expect(quizInfoAfter.statusCode).toStrictEqual(401);
  });
});
