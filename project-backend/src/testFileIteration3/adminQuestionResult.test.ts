import { expect, test } from '@jest/globals';
import {
  reqAdminAuthRegister,
  reqAdminQuizCreate,
  reqClear,
  reqAdminQuizGameStart,
  reqAdminQuizQuestionCreate,
  reqAdminQuizGameStateUpdate,
  reqAdminQuizGameGuestJoin,
  reqAdminQuestionResult
} from '../helperFile/serverRequests';
import {
  QuizGameAction
} from '../enum';

beforeEach(() => {
  reqClear();
});

describe('GET /v1/admin/{playerid}/question/{questionposition}/results', () => {
  let session: string;
  let quizId: number;
  let questionId1: number;
  let questionId2: number;
  let gameId: number;
  let playerId: number;
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

    const questionRes = reqAdminQuizQuestionCreate(session, quizId,
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
    questionId1 = (questionRes.body as { questionId: number }).questionId;

    const questionRes2 = reqAdminQuizQuestionCreate(session, quizId,
      'What about this one?', 4, 5,
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
    questionId2 = (questionRes2.body as { questionId: number }).questionId;

    const gameRes = reqAdminQuizGameStart(session, quizId, 0);
    gameId = (gameRes.body as { gameId: number }).gameId;

    const playerRes = reqAdminQuizGameGuestJoin(gameId, 'valid name');
    playerId = (playerRes.body as { playerId: number }).playerId;

    reqAdminQuizGameStateUpdate(quizId, gameId, session, QuizGameAction.NEXT_QUESTION);
    reqAdminQuizGameStateUpdate(quizId, gameId, session, QuizGameAction.SKIP_COUNTDOWN);
    reqAdminQuizGameStateUpdate(quizId, gameId, session, QuizGameAction.GO_TO_ANSWER);
  });

  describe('Error cases', () => {
    test('Invalid playerId', () => {
      const invalidPlayerId = playerId + 1;
      const res = reqAdminQuestionResult(invalidPlayerId, 1);
      expect(res.body).toStrictEqual({ error: expect.any(String) });
      expect(res.statusCode).toStrictEqual(400);
    });

    test.each([
      { test: 'negative', Position: -1 },
      { test: 'Wrong position', Position: 3 },
    ])('Invalid question position: $test', ({ Position }) => {
      const res = reqAdminQuestionResult(playerId, Position);
      expect(res.body).toStrictEqual({ error: expect.any(String) });
      expect(res.statusCode).toStrictEqual(400);
    });

    test('Not in ANSWER_SHOW state', () => {
      // Going to next question
      reqAdminQuizGameStateUpdate(quizId, gameId, session, QuizGameAction.NEXT_QUESTION);
      let res = reqAdminQuestionResult(playerId, 1);
      expect(res.body).toStrictEqual({ error: expect.any(String) });
      expect(res.statusCode).toStrictEqual(400);

      // Skipping countdown
      reqAdminQuizGameStateUpdate(quizId, gameId, session, QuizGameAction.SKIP_COUNTDOWN);
      res = reqAdminQuestionResult(playerId, 1);
      expect(res.body).toStrictEqual({ error: expect.any(String) });
      expect(res.statusCode).toStrictEqual(400);

      // going to answer(questionResult is valid here)
      reqAdminQuizGameStateUpdate(quizId, gameId, session, QuizGameAction.GO_TO_ANSWER);

      // going to final results
      reqAdminQuizGameStateUpdate(quizId, gameId, session, QuizGameAction.GO_TO_FINAL_RESULTS);
      res = reqAdminQuestionResult(playerId, 1);
      expect(res.body).toStrictEqual({ error: expect.any(String) });
      expect(res.statusCode).toStrictEqual(400);

      // going to end
      reqAdminQuizGameStateUpdate(quizId, gameId, session, QuizGameAction.END);
      res = reqAdminQuestionResult(playerId, 1);
      expect(res.body).toStrictEqual({ error: expect.any(String) });
      expect(res.statusCode).toStrictEqual(400);
    });

    test('Game is not up to question yet', () => {
      const res = reqAdminQuestionResult(playerId, 2);
      expect(res.body).toStrictEqual({ error: expect.any(String) });
      expect(res.statusCode).toStrictEqual(400);
    });
  });

  describe('success cases', () => {
    test('correct status code', () => {
      const res = reqAdminQuestionResult(playerId, 1);
      expect(res.statusCode).toStrictEqual(200);
    });

    test('correct output for one question', () => {
      const res = reqAdminQuestionResult(playerId, 1);
      expect(res.body).toStrictEqual({
        questionId: questionId1,
        playersCorrect: [],
        averageAnswerTime: expect.any(Number),
        percentCorrect: expect.any(Number)
      });
    });

    test('correct output for two questions', () => {
      const res = reqAdminQuestionResult(playerId, 1);
      expect(res.body).toStrictEqual({
        questionId: questionId1,
        playersCorrect: [],
        averageAnswerTime: expect.any(Number),
        percentCorrect: expect.any(Number)
      });

      reqAdminQuizGameStateUpdate(quizId, gameId, session, QuizGameAction.NEXT_QUESTION);
      reqAdminQuizGameStateUpdate(quizId, gameId, session, QuizGameAction.SKIP_COUNTDOWN);
      reqAdminQuizGameStateUpdate(quizId, gameId, session, QuizGameAction.GO_TO_ANSWER);

      const res2 = reqAdminQuestionResult(playerId, 2);
      expect(res2.body).toStrictEqual({
        questionId: questionId2,
        playersCorrect: [],
        averageAnswerTime: expect.any(Number),
        percentCorrect: expect.any(Number)
      });
    });
  });
});
