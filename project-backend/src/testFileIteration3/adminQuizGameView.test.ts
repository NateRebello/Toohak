import { expect, test } from '@jest/globals';
import {
  reqAdminAuthRegister,
  reqAdminQuizCreate,
  reqAdminQuizGameStart,
  reqAdminQuizGameStateUpdate,
  reqAdminQuizGameView,
  reqAdminQuizQuestionCreateV2,
  reqClear
} from '../helperFile/serverRequests';
import { v4 as uuidv4 } from 'uuid';
import { QuizGameAction } from '../enum';

beforeEach(() => {
  reqClear();
});

describe('adminQuizGameView', () => {
  let session: string;
  let quizId: number;
  let session2: string;
  beforeEach(() => {
    const res = reqAdminAuthRegister(
      'valid@email.com',
      'validPass1',
      'validFirstName',
      'validLastName'
    );
    session = (res.body as { session: string }).session;

    const quizRes = reqAdminQuizCreate(session, 'valid name', 'valid description');
    quizId = (quizRes.body as { quizId: number }).quizId;

    reqAdminQuizQuestionCreateV2(quizId, session,
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

    const res2 = reqAdminAuthRegister(
      'valid2@email.com',
      'validPass2',
      'validFirst',
      'validLast'
    );
    session2 = (res2.body as { session: string }).session;
  });

  describe('Error cases', () => {
    test.each([
      {
        name: 'Empty session',
        session: () => '',
        quizId: () => quizId,
        errorCode: 401
      },
      {
        name: 'Invalid session',
        session: () => uuidv4(),
        quizId: () => quizId,
        errorCode: 401
      },
      {
        name: 'Invalid QuizId',
        session: () => session,
        quizId: () => quizId + 1,
        errorCode: 403
      },
      {
        name: 'Quiz does not belong to the user',
        session: () => session2,
        quizId: () => quizId,
        errorCode: 403
      },
    ])('$name', ({ session, quizId, errorCode }) => {
      const res = reqAdminQuizGameView(session(), quizId());
      expect(res.body).toStrictEqual({ error: expect.any(String) });
      expect(res.statusCode).toStrictEqual(errorCode);
    });
  });

  describe('Successful cases', () => {
    test('One game created', () => {
      const resGame = reqAdminQuizGameStart(session, quizId, 3);
      const gameId = (resGame.body as { gameId: number }).gameId;
      const res1 = reqAdminQuizGameView(session, quizId);
      expect(res1.body).toStrictEqual({
        activeGames: [gameId],
        inactiveGames: []
      });
      expect(res1.statusCode).toStrictEqual(200);

      reqAdminQuizGameStateUpdate(quizId, gameId, session, QuizGameAction.END);
      const res2 = reqAdminQuizGameView(session, quizId);
      expect(res2.body).toStrictEqual({
        activeGames: [],
        inactiveGames: [gameId]
      });
      expect(res1.statusCode).toStrictEqual(200);
    });

    test('Multiple games created', () => {
      const resGame1 = reqAdminQuizGameStart(session, quizId, 3);
      const gameId1 = (resGame1.body as { gameId: number }).gameId;
      const resGame2 = reqAdminQuizGameStart(session, quizId, 3);
      const gameId2 = (resGame2.body as { gameId: number }).gameId;
      const resGame3 = reqAdminQuizGameStart(session, quizId, 3);
      const gameId3 = (resGame3.body as { gameId: number }).gameId;

      const res1 = reqAdminQuizGameView(session, quizId);
      const body1 = res1.body as {
        activeGames: number[],
        inactiveGames: number[]
      };
      expect(body1.activeGames).toStrictEqual([gameId1, gameId2, gameId3].sort((a, b) => a - b));
      expect(body1.inactiveGames).toStrictEqual([]);
      expect(res1.statusCode).toStrictEqual(200);

      reqAdminQuizGameStateUpdate(quizId, gameId2, session, QuizGameAction.END);

      const res2 = reqAdminQuizGameView(session, quizId);
      const body2 = res2.body as {
        activeGames: number[],
        inactiveGames: number[]
      };
      expect(body2.activeGames).toStrictEqual([gameId1, gameId3].sort((a, b) => a - b));
      expect(body2.inactiveGames).toStrictEqual([gameId2]);
      expect(res2.statusCode).toStrictEqual(200);
    });
  });
});
