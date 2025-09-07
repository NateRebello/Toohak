import { expect, test, beforeEach, describe } from '@jest/globals';
import {
  reqClear,
  reqAdminAuthRegister,
  reqAdminQuizCreate,
  reqAdminQuizQuestionCreateV2,
  reqAdminQuizGameStart,
  reqAdminQuizGameStateUpdate,
  reqAdminQuizGameGuestJoin,
  reqAdminQuizGameResults,
  reqAdminQuestionAnswerSubmission
} from '../helperFile/serverRequests';

import { QuizGameAction } from '../enum';

beforeEach(() => {
  reqClear();
});

describe('GET /v1/player/:playerid/results (adminQuizGameResults)', () => {
  let session: string;
  let quizId: number;
  let gameId: number;
  let playerId: number;

  beforeEach(() => {
    const regRes = reqAdminAuthRegister(
      'valid@email.com',
      'validPass1',
      'validFirstName',
      'validLastName'
    );
    expect(regRes.statusCode).toBe(200);
    session = (regRes.body as { session: string }).session;

    const quizRes = reqAdminQuizCreate(session, 'Test Quiz', 'Test Desc');
    expect(quizRes.statusCode).toBe(200);
    quizId = (quizRes.body as { quizId: number }).quizId;

    reqAdminQuizQuestionCreateV2(
      quizId,
      session,
      'Is this question update valid?', 3, 5,
      [
        { answer: 'Yes', correct: true },
        { answer: 'No', correct: false }
      ],
      'http://jpg'
    );

    const gameRes = reqAdminQuizGameStart(session, quizId, 1);
    expect(gameRes.statusCode).toBe(200);
    gameId = (gameRes.body as { gameId: number }).gameId;

    const joinRes = reqAdminQuizGameGuestJoin(quizId, 'Bob');
    expect(joinRes.statusCode).toBe(200);
    playerId = (joinRes.body as { playerId: number }).playerId;

    reqAdminQuizGameStateUpdate(quizId, gameId, session, QuizGameAction.NEXT_QUESTION);
    reqAdminQuizGameStateUpdate(quizId, gameId, session, QuizGameAction.SKIP_COUNTDOWN);
    reqAdminQuestionAnswerSubmission([0], playerId, 1);
    reqAdminQuizGameStateUpdate(quizId, gameId, session, QuizGameAction.GO_TO_ANSWER);
    reqAdminQuizGameStateUpdate(quizId, gameId, session, QuizGameAction.GO_TO_FINAL_RESULTS);
  });

  test('Returns correct result for valid player', () => {
    const res = reqAdminQuizGameResults(playerId);
    expect(res.statusCode).toBe(200);
    expect(res.body).toStrictEqual({
      userRankedByScore: [
        {
          playerName: 'Bob',
          score: 0
        }
      ],
      questionResults: [
        {
          averageAnswerTime: 0,
          percentCorrect: 0,
          playersCorrect: [],
          questionId: 1,
          submissions: []
        }
      ]
    });
  });

  test('Invalid playerId returns error', () => {
    const res = reqAdminQuizGameResults(playerId + 100);
    expect(res.statusCode).toBe(400);
    expect(res.body).toStrictEqual({ error: expect.any(String) });
  });
});
