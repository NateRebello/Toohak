import { expect, test } from '@jest/globals';
import {
  reqAdminAuthRegister,
  reqAdminQuizCreate,
  reqAdminQuizGameStart,
  reqAdminQuizGameStatusGet,
  reqAdminQuizQuestionCreateV2,
  reqClear
} from '../helperFile/serverRequests';
import { v4 as uuidv4 } from 'uuid';

let session1: string;
let session2: string;
let quizId: number;
let gameId: number;
beforeEach(() => {
  reqClear();

  const res1 = reqAdminAuthRegister(
    'valid1@email.com',
    'validPass1',
    'ValidFirstName',
    'ValidLastName'
  );
  session1 = (res1.body as { session: string }).session;

  const quizRes = reqAdminQuizCreate(session1, 'Quiz Name', 'This is a quiz');
  quizId = (quizRes.body as { quizId: number }).quizId;

  reqAdminQuizQuestionCreateV2(quizId, session1,
    'Is this question update valid?', 4, 5,
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

  const gameRes = reqAdminQuizGameStart(session1, quizId, 3);
  gameId = (gameRes.body as { gameId: number }).gameId;

  const res2 = reqAdminAuthRegister(
    'valid2@email.com',
    'validPass2',
    'ValidFirst',
    'ValidLast'
  );
  session2 = (res2.body as { session: string }).session;
});

describe('adminQuizGameStatusGet', () => {
  describe('Error cases', () => {
    test.each([
      {
        name: 'empty session',
        session: () => '',
        quizId: () => quizId,
        gameId: () => gameId,
        errorCode: 401
      },
      {
        name: 'invalid session',
        session: () => uuidv4(),
        quizId: () => quizId,
        gameId: () => gameId,
        errorCode: 401
      },
      {
        name: 'invalid quizId',
        session: () => session1,
        quizId: () => quizId + 1,
        gameId: () => gameId,
        errorCode: 403
      },
      {
        name: 'quizId doesnt not belong to the user',
        session: () => session2,
        quizId: () => quizId,
        gameId: () => gameId,
        errorCode: 403
      },
      {
        name: 'invalid gameId',
        session: () => session1,
        quizId: () => quizId,
        gameId: () => gameId + 1,
        errorCode: 400
      }
    ])('$name', ({ session, quizId, gameId, errorCode }) => {
      const res = reqAdminQuizGameStatusGet(quizId(), gameId(), session());
      expect(res.body).toStrictEqual({ error: expect.any(String) });
      expect(res.statusCode).toStrictEqual(errorCode);
    });
  });

  describe('Successive case', () => {
    test('Successfully return the information', () => {
      const res = reqAdminQuizGameStatusGet(quizId, gameId, session1);
      expect(res.statusCode).toStrictEqual(200);

      expect(res.body).toStrictEqual({
        state: 'LOBBY',
        atQuestion: 1,
        players: [],
        metaData: {
          userId: expect.any(Number),
          quizId: quizId,
          name: 'Quiz Name',
          timeCreated: expect.any(Number),
          timeLastEdited: expect.any(Number),
          description: 'This is a quiz',
          numQuestions: 1,
          timeLimit: 4,
          thumbnailUrl: '',
          questions: [
            {
              questionId: 1,
              question: 'Is this question update valid?',
              timeLimit: 4,
              thumbnailUrl: 'http://jpg',
              points: 5,
              answerOptions: [
                {
                  answerId: expect.any(Number),
                  answer: 'Yes',
                  colour: expect.any(String),
                  correct: true
                },
                {
                  answerId: expect.any(Number),
                  answer: 'No',
                  colour: expect.any(String),
                  correct: false
                }
              ]
            }
          ]
        }
      });
    });
  });
});
