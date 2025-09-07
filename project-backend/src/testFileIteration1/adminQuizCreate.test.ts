import {
  reqAdminAuthRegister,
  reqAdminQuizCreate,
  reqClear
} from '../helperFile/serverRequests';
import { expect, test } from '@jest/globals';
import { v4 as uuidv4 } from 'uuid';

beforeEach(() => {
  reqClear();
});

describe('POST /v1/admin/quiz (adminQuizCreate)', () => {
  let session: string;

  beforeEach(() => {
    const registerRes = reqAdminAuthRegister(
      'valid@mail.com',
      'ValidPassword1',
      'ValidFirst',
      'ValidLast'
    );
    if ('session' in registerRes.body) {
      session = registerRes.body.session;
    }
  });

  describe('Success Cases', () => {
    test('Successfully create a quiz', () => {
      const res = reqAdminQuizCreate(
        session,
        'Sample Quiz',
        'This is a sample quiz description'
      );
      expect(res.body).toStrictEqual({ quizId: expect.any(Number) });
      expect(res.statusCode).toStrictEqual(200);
    });
  });

  describe('Error Cases', () => {
    test('Invalid session', () => {
      const sessionIdInvalid = uuidv4();
      const res = reqAdminQuizCreate(
        sessionIdInvalid,
        'Sample Quiz',
        'This is a valid description'
      );
      expect(res.body).toStrictEqual({ error: expect.any(String) });
      expect(res.statusCode).toStrictEqual(401);
    });

    test('Invalid quiz name (too short)', () => {
      const res = reqAdminQuizCreate(session, 'S', 'Valid description');
      expect(res.body).toStrictEqual({ error: expect.any(String) });
      expect(res.statusCode).toStrictEqual(400);
    });

    test('Invalid quiz name (too long)', () => {
      const res = reqAdminQuizCreate(session, 'A'.repeat(31), 'Valid description');
      expect(res.body).toStrictEqual({ error: expect.any(String) });
      expect(res.statusCode).toStrictEqual(400);
    });

    test('Invalid characters in quiz name', () => {
      const res = reqAdminQuizCreate(session, 'Invalid@QuizName!', 'Valid description');
      expect(res.body).toStrictEqual({ error: expect.any(String) });
      expect(res.statusCode).toStrictEqual(400);
    });

    test('Quiz name already used by the user', () => {
      reqAdminQuizCreate(session, 'Existing Quiz Name', 'Valid description');
      const res = reqAdminQuizCreate(session, 'Existing Quiz Name', 'Another description');
      expect(res.body).toStrictEqual({ error: expect.any(String) });
      expect(res.statusCode).toStrictEqual(400);
    });

    test('Empty quiz name', () => {
      const res = reqAdminQuizCreate(session, '', 'Valid description');
      expect(res.body).toStrictEqual({ error: expect.any(String) });
      expect(res.statusCode).toStrictEqual(400);
    });

    test('Description with more than 100 characters', () => {
      const longDescription = 'A'.repeat(101);
      const res = reqAdminQuizCreate(session, 'Valid Quiz Name', longDescription);
      expect(res.body).toStrictEqual({ error: expect.any(String) });
      expect(res.statusCode).toStrictEqual(400);
    });
  });
});
