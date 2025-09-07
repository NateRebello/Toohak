import { expect, test } from '@jest/globals';
import {
  reqAdminAuthRegister,
  reqAdminQuizCreate,
  reqClear,
  reqAdminQuizQuestionCreateV2,
  reqAdminQuizGameStart,
  reqAdminQuizGameGuestJoin,
  reqAdminQuizGameStateUpdate,
} from '../helperFile/serverRequests';
import { QuizGameAction } from '../enum';

beforeEach(() => {
  reqClear();
});

describe('POST /v1/player/join (adminQuizGameGuestJoin)', () => {
  let session: string;
  let quizId: number;
  let gameId: number;

  beforeEach(() => {
    // 1. Register user and get session
    const res = reqAdminAuthRegister(
      'valid@email.com',
      'validPass1',
      'validFirstName',
      'validLastName'
    );
    session = (res.body as { session: string }).session;

    // 2. Create a quiz
    const quizRes = reqAdminQuizCreate(session, 'valid name', 'valid description');
    quizId = (quizRes.body as { quizId: number }).quizId;

    // 3. Add a question to the quiz
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

    // 4. Start a game for the quiz and store the gameId
    const resGame = reqAdminQuizGameStart(session, quizId, 3);
    gameId = (resGame.body as { gameId: number }).gameId;
  });

  describe('Error cases', () => {
    test('Join with invalid name', () => {
      const res = reqAdminQuizGameGuestJoin(gameId, 'Invalid@Name');
      expect(res.statusCode).toStrictEqual(400);
      expect(res.body).toStrictEqual({ error: expect.any(String) });
    });

    test('Join with the same name', () => {
      reqAdminQuizGameGuestJoin(gameId, 'Name');
      const res = reqAdminQuizGameGuestJoin(gameId, 'Name');
      expect(res.statusCode).toStrictEqual(400);
      expect(res.body).toStrictEqual({ error: expect.any(String) });
    });

    test('Join with Invalid gameId', () => {
      const InvalidGameId = gameId + 1;
      const res = reqAdminQuizGameGuestJoin(InvalidGameId, 'Name');
      expect(res.statusCode).toStrictEqual(400);
      expect(res.body).toStrictEqual({ error: expect.any(String) });
    });

    test('Join when game is not in LOBBY state', () => {
      reqAdminQuizGameStateUpdate(quizId, gameId, session, QuizGameAction.NEXT_QUESTION);
      const res = reqAdminQuizGameGuestJoin(gameId, 'Name');
      expect(res.statusCode).toStrictEqual(400);
      expect(res.body).toStrictEqual({ error: expect.any(String) });
    });
  });

  describe('Success cases', () => {
    test.each([
      {
        name: 'Join with valid name',
        playerName: () => 'Valid Name'
      },
      {
        name: 'Join with an empty name',
        playerName: () => ''
      }
    ])('$name', ({ playerName }) => {
      const res = reqAdminQuizGameGuestJoin(gameId, playerName());
      expect(res.statusCode).toStrictEqual(200);
      expect(res.body).toStrictEqual({ playerId: 1 });

      // const resInfo = reqAdminQuestionInfoPlayer(playerId, 1);
    });
  });
});
