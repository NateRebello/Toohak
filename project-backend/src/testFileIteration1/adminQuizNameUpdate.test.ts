import { expect, test } from '@jest/globals';
import {
  reqAdminAuthRegister,
  reqAdminQuizInfo,
  reqAdminQuizCreate,
  reqAdminQuizNameUpdate,
  reqClear,
  reqAdminQuizNameUpdateV2
} from '../helperFile/serverRequests';
import { v4 as uuidv4 } from 'uuid';

beforeEach(() => {
  reqClear();
});

describe('PUT /v1/admin/quiz/{quizid}/name (adminQuizNameUpdate)', () => {
  // Creating a user who owns a quiz
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
      { test: 'Empty name', name: '' },
      { test: 'Non-alphanumeric characters', name: 'invalidName!' },
      { test: 'Name too short', name: 'Ah' },
      { test: 'Name too long', name: 'A'.repeat(31) }
    ])('Invalid name: $test', ({ name }) => {
      const res = reqAdminQuizNameUpdate(session, quizId, name);
      expect(res.body).toStrictEqual({ error: expect.any(String) });
      expect(res.statusCode).toStrictEqual(400);
    });

    test('Invalid session', () => {
      const invalidSession = uuidv4();
      const res = reqAdminQuizNameUpdate(invalidSession, quizId, 'ValidName');
      expect(res.body).toStrictEqual({ error: expect.any(String) });
      expect(res.statusCode).toStrictEqual(401);
    });

    test('Empty session', () => {
      const res = reqAdminQuizNameUpdate('', quizId, 'ValidName');
      expect(res.body).toStrictEqual({ error: expect.any(String) });
      expect(res.statusCode).toStrictEqual(401);
    });

    test('Invalid quizId', () => {
      const invalidQuizId = quizId + 1;
      const res = reqAdminQuizNameUpdate(session, invalidQuizId, 'ValidName');
      expect(res.body).toStrictEqual({ error: expect.any(String) });
      expect(res.statusCode).toStrictEqual(403);
    });

    test('Quiz belongs to another user', () => {
      let session2: string;
      const res2 = reqAdminAuthRegister(
        'second@user.com',
        'validPass2',
        'validFirstName',
        'validLastName'
      );

      if ('session' in res2.body) {
        session2 = res2.body.session;
      }

      const res = reqAdminQuizNameUpdate(session2, quizId, 'newValidName');
      expect(res.body).toStrictEqual({ error: expect.any(String) });
      expect(res.statusCode).toStrictEqual(403);
    });

    test('Name is already used by another quiz belonging to user', () => {
      const res = reqAdminQuizNameUpdate(session, quizId, 'valid name');
      expect(res.body).toStrictEqual({ error: expect.any(String) });
      expect(res.statusCode).toStrictEqual(400);
    });
  });

  describe('Success cases', () => {
    test.each([
      { test: 'valid name with just letters', Name: 'newValidName' },
      { test: 'valid name with numbers', Name: '123' },
      { test: 'valid name with spaces', Name: '   ' },
      { test: 'valid name with alphanumeric characters and spaces', Name: 'Valid name 1' },
    ])('Updating the name of one quiz : $test', ({ Name }) => {
      const res1 = reqAdminQuizNameUpdate(session, quizId, Name);
      expect(res1.body).toStrictEqual({});
      expect(res1.statusCode).toStrictEqual(200);

      const res2 = reqAdminQuizInfo(session, quizId);
      expect(res2.body).toStrictEqual({
        quizId: quizId,
        name: Name,
        timeCreated: expect.any(Number),
        timeLastEdited: expect.any(Number),
        description: expect.any(String),
        numQuestions: 0,
        questions: [],
        timeLimit: 0,
      });
      expect(res2.statusCode).toStrictEqual(200);
    });

    test('Updating the name of one quiz multiple times', () => {
      const namesForUpdate = ['newValidName', 'anotherValidName'];

      namesForUpdate.forEach((newName) => {
        const resUpdate = reqAdminQuizNameUpdate(session, quizId, newName);
        expect(resUpdate.body).toStrictEqual({});
        expect(resUpdate.statusCode).toStrictEqual(200);

        const resInfo = reqAdminQuizInfo(session, quizId);
        expect(resInfo.body).toStrictEqual({
          quizId: quizId,
          name: newName,
          timeCreated: expect.any(Number),
          timeLastEdited: expect.any(Number),
          description: expect.any(String),
          numQuestions: 0,
          questions: [],
          timeLimit: 0,
        });
        expect(resUpdate.statusCode).toStrictEqual(200);
      });
    });

    test('Updating the name of multiple quizzes', () => {
      // Second user who owns a quiz
      let session2: string;
      const resRegister2 = reqAdminAuthRegister(
        'second@user.com',
        'validPass2',
        'validFirstName',
        'validLastName'
      );
      if ('session' in resRegister2.body) {
        session2 = resRegister2.body.session;
      }

      let quizId2: number;
      const quizRes2 = reqAdminQuizCreate(
        session2,
        'valid name',
        'valid description'
      );
      if ('quizId' in quizRes2.body) {
        quizId2 = quizRes2.body.quizId;
      }

      // Testing first user
      const res1 = reqAdminQuizNameUpdate(session, quizId, 'newValidName');
      expect(res1.body).toStrictEqual({});
      expect(res1.statusCode).toStrictEqual(200);

      const resInfo1 = reqAdminQuizInfo(session, quizId);
      expect(resInfo1.body).toStrictEqual({
        quizId: quizId,
        name: 'newValidName',
        timeCreated: expect.any(Number),
        timeLastEdited: expect.any(Number),
        description: expect.any(String),
        numQuestions: 0,
        questions: [],
        timeLimit: 0,
      });
      expect(resInfo1.statusCode).toStrictEqual(200);

      // testing second user
      const res2 = reqAdminQuizNameUpdate(session2, quizId2, 'newValidName');
      expect(res2.body).toStrictEqual({});
      expect(res2.statusCode).toStrictEqual(200);

      const resInfo2 = reqAdminQuizInfo(session2, quizId2);
      expect(resInfo2.body).toStrictEqual({
        quizId: quizId2,
        name: 'newValidName',
        timeCreated: expect.any(Number),
        timeLastEdited: expect.any(Number),
        description: expect.any(String),
        numQuestions: 0,
        questions: [],
        timeLimit: 0,
      });
      expect(resInfo2.statusCode).toStrictEqual(200);
    });
  });
});

// V2 tests

describe('PUT /v2/admin/quiz/{quizid}/name (adminQuizNameUpdate)', () => {
  // Creating a user who owns a quiz
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
      { test: 'Empty name', name: '' },
      { test: 'Non-alphanumeric characters', name: 'invalidName!' },
      { test: 'Name too short', name: 'Ah' },
      { test: 'Name too long', name: 'A'.repeat(31) }
    ])('Invalid name: $test', ({ name }) => {
      const res = reqAdminQuizNameUpdateV2(session, quizId, name);
      expect(res.body).toStrictEqual({ error: expect.any(String) });
      expect(res.statusCode).toStrictEqual(400);
    });

    test('Invalid session', () => {
      const invalidSession = uuidv4();
      const res = reqAdminQuizNameUpdateV2(invalidSession, quizId, 'ValidName');
      expect(res.body).toStrictEqual({ error: expect.any(String) });
      expect(res.statusCode).toStrictEqual(401);
    });

    test('Empty session', () => {
      const res = reqAdminQuizNameUpdateV2('', quizId, 'ValidName');
      expect(res.body).toStrictEqual({ error: expect.any(String) });
      expect(res.statusCode).toStrictEqual(401);
    });

    test('Invalid quizId', () => {
      const invalidQuizId = quizId + 1;
      const res = reqAdminQuizNameUpdateV2(session, invalidQuizId, 'ValidName');
      expect(res.body).toStrictEqual({ error: expect.any(String) });
      expect(res.statusCode).toStrictEqual(403);
    });

    test('Quiz belongs to another user', () => {
      let session2: string;
      const res2 = reqAdminAuthRegister(
        'second@user.com',
        'validPass2',
        'validFirstName',
        'validLastName'
      );

      if ('session' in res2.body) {
        session2 = res2.body.session;
      }

      const res = reqAdminQuizNameUpdateV2(session2, quizId, 'newValidName');
      expect(res.body).toStrictEqual({ error: expect.any(String) });
      expect(res.statusCode).toStrictEqual(403);
    });

    test('Name is already used by another quiz belonging to user', () => {
      const res = reqAdminQuizNameUpdateV2(session, quizId, 'valid name');
      expect(res.body).toStrictEqual({ error: expect.any(String) });
      expect(res.statusCode).toStrictEqual(400);
    });
  });

  describe('Success cases', () => {
    test.each([
      { test: 'valid name with just letters', Name: 'newValidName' },
      { test: 'valid name with numbers', Name: '123' },
      { test: 'valid name with spaces', Name: '   ' },
      { test: 'valid name with alphanumeric characters and spaces', Name: 'Valid name 1' },
    ])('Updating the name of one quiz : $test', ({ Name }) => {
      const res1 = reqAdminQuizNameUpdateV2(session, quizId, Name);
      expect(res1.body).toStrictEqual({});
      expect(res1.statusCode).toStrictEqual(200);

      const res2 = reqAdminQuizInfo(session, quizId);
      expect(res2.body).toStrictEqual({
        quizId: quizId,
        name: Name,
        timeCreated: expect.any(Number),
        timeLastEdited: expect.any(Number),
        description: expect.any(String),
        numQuestions: 0,
        questions: [],
        timeLimit: 0,
      });
      expect(res2.statusCode).toStrictEqual(200);
    });

    test('Updating the name of one quiz multiple times', () => {
      const namesForUpdate = ['newValidName', 'anotherValidName'];

      namesForUpdate.forEach((newName) => {
        const resUpdate = reqAdminQuizNameUpdateV2(session, quizId, newName);
        expect(resUpdate.body).toStrictEqual({});
        expect(resUpdate.statusCode).toStrictEqual(200);

        const resInfo = reqAdminQuizInfo(session, quizId);
        expect(resInfo.body).toStrictEqual({
          quizId: quizId,
          name: newName,
          timeCreated: expect.any(Number),
          timeLastEdited: expect.any(Number),
          description: expect.any(String),
          numQuestions: 0,
          questions: [],
          timeLimit: 0,
        });
        expect(resUpdate.statusCode).toStrictEqual(200);
      });
    });

    test('Updating the name of multiple quizzes', () => {
      // Second user who owns a quiz
      let session2: string;
      const resRegister2 = reqAdminAuthRegister(
        'second@user.com',
        'validPass2',
        'validFirstName',
        'validLastName'
      );
      if ('session' in resRegister2.body) {
        session2 = resRegister2.body.session;
      }

      let quizId2: number;
      const quizRes2 = reqAdminQuizCreate(
        session2,
        'valid name',
        'valid description'
      );
      if ('quizId' in quizRes2.body) {
        quizId2 = quizRes2.body.quizId;
      }

      // Testing first user
      const res1 = reqAdminQuizNameUpdateV2(session, quizId, 'newValidName');
      expect(res1.body).toStrictEqual({});
      expect(res1.statusCode).toStrictEqual(200);

      const resInfo1 = reqAdminQuizInfo(session, quizId);
      expect(resInfo1.body).toStrictEqual({
        quizId: quizId,
        name: 'newValidName',
        timeCreated: expect.any(Number),
        timeLastEdited: expect.any(Number),
        description: expect.any(String),
        numQuestions: 0,
        questions: [],
        timeLimit: 0,
      });
      expect(resInfo1.statusCode).toStrictEqual(200);

      // testing second user
      const res2 = reqAdminQuizNameUpdateV2(session2, quizId2, 'newValidName');
      expect(res2.body).toStrictEqual({});
      expect(res2.statusCode).toStrictEqual(200);

      const resInfo2 = reqAdminQuizInfo(session2, quizId2);
      expect(resInfo2.body).toStrictEqual({
        quizId: quizId2,
        name: 'newValidName',
        timeCreated: expect.any(Number),
        timeLastEdited: expect.any(Number),
        description: expect.any(String),
        numQuestions: 0,
        questions: [],
        timeLimit: 0,
      });
      expect(resInfo2.statusCode).toStrictEqual(200);
    });
  });
});
