import { expect, test } from '@jest/globals';
import {
  reqAdminAuthRegister,
  reqAdminQuizCreate,
  reqAdminQuizGameGuestJoin,
  reqAdminQuizGameStart,
  reqAdminQuizGameStateUpdate,
  reqAdminQuizGameStatusGet,
  reqAdminQuizQuestionCreateV2,
  reqClear
} from '../helperFile/serverRequests';
import { v4 as uuidv4 } from 'uuid';
import { GameState, QuizGameAction } from '../enum';

beforeEach(() => {
  reqClear();
});

describe('adminQuizGameStateUpdate', () => {
  let session: string;
  let quizId: number;
  let gameId: number;
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

    const resGame = reqAdminQuizGameStart(session, quizId, 3);
    gameId = (resGame.body as { gameId: number }).gameId;
  });

  describe('Error cases', () => {
    // 401 and 403 error cases
    test.each([
      {
        name: 'Empty session',
        getSession: () => '',
        getQuizId: () => quizId,
        errorCode: 401
      },
      {
        name: 'Invalid session',
        getSession: () => uuidv4(),
        getQuizId: () => quizId,
        errorCode: 401
      },
      {
        name: 'Invalid quizId',
        getSession: () => session,
        getQuizId: () => quizId + 1,
        errorCode: 403
      },
      {
        name: 'User not the owner of the quiz',
        getSession: () => session2,
        getQuizId: () => quizId,
        errorCode: 403
      },
    ])('$name', ({ getSession, getQuizId, errorCode }) => {
      const res = reqAdminQuizGameStateUpdate(
        getQuizId(),
        gameId,
        getSession(),
        QuizGameAction.END
      );
      expect(res.body).toStrictEqual({ error: expect.any(String) });
      expect(res.statusCode).toStrictEqual(errorCode);
    });

    // 400 cases
    // Invalid gameId
    test('Invalid GameId', () => {
      const InvalidGameId = gameId + 1;
      const res = reqAdminQuizGameStateUpdate(
        quizId,
        InvalidGameId,
        session,
        QuizGameAction.END
      );
      expect(res.body).toStrictEqual({ error: expect.any(String) });
      expect(res.statusCode).toStrictEqual(400);
    });
    // LOBBY wrong actions
    test.each([
      {
        name: 'LOBBY => SKIP_COUNTDOWN',
        action: QuizGameAction.SKIP_COUNTDOWN
      },
      {
        name: 'LOBBY => GO_TO_ANSWE',
        action: QuizGameAction.GO_TO_ANSWER
      },
      {
        name: 'LOBBY => GO_TO_FINAL_RESULTS',
        action: QuizGameAction.GO_TO_FINAL_RESULTS
      },
    ])('$name', ({ action }) => {
      const res = reqAdminQuizGameStateUpdate(quizId, gameId, session, action);
      expect(res.body).toStrictEqual({ error: expect.any(String) });
      expect(res.statusCode).toStrictEqual(400);

      const resStatus = reqAdminQuizGameStatusGet(quizId, gameId, session);
      const gameState = resStatus.body as { state: GameState };
      expect(gameState.state).toStrictEqual(GameState.LOBBY);
      expect(resStatus.statusCode).toStrictEqual(200);
    });

    // QUESTION_COUNTDOWN wrong actions
    test.each([
      {
        name: 'QUESTION_COUNTDOWN => NEXT_QUESTION',
        action: QuizGameAction.NEXT_QUESTION
      },
      {
        name: 'QUESTION_COUNTDOWN => GO_TO_ANSWER',
        action: QuizGameAction.GO_TO_ANSWER
      },
      {
        name: 'QUESTION_COUNTDOWN => GO_TO_FINAL_RESULTS',
        action: QuizGameAction.GO_TO_FINAL_RESULTS
      },
    ])('$name', ({ action }) => {
      reqAdminQuizGameStateUpdate(quizId, gameId, session, QuizGameAction.NEXT_QUESTION);
      const res = reqAdminQuizGameStateUpdate(quizId, gameId, session, action);
      expect(res.body).toStrictEqual({ error: expect.any(String) });
      expect(res.statusCode).toStrictEqual(400);

      const resStatus = reqAdminQuizGameStatusGet(quizId, gameId, session);
      const gameState = resStatus.body as { state: GameState };
      expect(gameState.state).toStrictEqual(GameState.QUESTION_COUNTDOWN);
      expect(resStatus.statusCode).toStrictEqual(200);
    });

    // QUESTION_OPEN wrong actions
    test.each([
      {
        name: 'QUESTION_OPEN => NEXT_QUESTION',
        action: QuizGameAction.NEXT_QUESTION
      },
      {
        name: 'QUESTION_OPEN => SKIP_COUNTDOWN',
        action: QuizGameAction.SKIP_COUNTDOWN
      },
      {
        name: 'QUESTION_OPEN => GO_TO_FINAL_RESULTS',
        action: QuizGameAction.GO_TO_FINAL_RESULTS
      },
    ])('$name', ({ action }) => {
      reqAdminQuizGameStateUpdate(quizId, gameId, session, QuizGameAction.NEXT_QUESTION);
      reqAdminQuizGameStateUpdate(quizId, gameId, session, QuizGameAction.SKIP_COUNTDOWN);
      const res = reqAdminQuizGameStateUpdate(quizId, gameId, session, action);
      expect(res.body).toStrictEqual({ error: expect.any(String) });
      expect(res.statusCode).toStrictEqual(400);

      const resStatus = reqAdminQuizGameStatusGet(quizId, gameId, session);
      const gameState = resStatus.body as { state: GameState };
      expect(gameState.state).toStrictEqual(GameState.QUESTION_OPEN);
      expect(resStatus.statusCode).toStrictEqual(200);
    });

    // QUESTION_CLOSE wrong actions
    test.each([
      {
        name: 'QUESTION_CLOSE => NEXT_QUESTION',
        action: QuizGameAction.NEXT_QUESTION
      },
      {
        name: 'QUESTION_CLOSE => SKIP_COUNTDOWN',
        action: QuizGameAction.SKIP_COUNTDOWN
      },
    ])('$name', async ({ action }) => {
      reqAdminQuizGameStateUpdate(quizId, gameId, session, QuizGameAction.NEXT_QUESTION);
      reqAdminQuizGameStateUpdate(quizId, gameId, session, QuizGameAction.SKIP_COUNTDOWN);
      await new Promise(res => setTimeout(res, 4000));
      const res = reqAdminQuizGameStateUpdate(quizId, gameId, session, action);
      expect(res.body).toStrictEqual({ error: expect.any(String) });
      expect(res.statusCode).toStrictEqual(400);

      const resStatus = reqAdminQuizGameStatusGet(quizId, gameId, session);
      const gameState = resStatus.body as { state: GameState };
      expect(gameState.state).toStrictEqual(GameState.QUESTION_CLOSE);
      expect(resStatus.statusCode).toStrictEqual(200);
    });

    // ANSWER_SHOW wrong actions
    test.each([
      {
        name: 'ANSWER_SHOW => SKIP_COUNTDOWN',
        action: QuizGameAction.SKIP_COUNTDOWN
      },
      {
        name: 'ANSWER_SHOW => GO_TO_ANSWER',
        action: QuizGameAction.GO_TO_ANSWER
      }
    ])('$name', ({ action }) => {
      reqAdminQuizGameStateUpdate(quizId, gameId, session, QuizGameAction.NEXT_QUESTION);
      reqAdminQuizGameStateUpdate(quizId, gameId, session, QuizGameAction.SKIP_COUNTDOWN);
      reqAdminQuizGameStateUpdate(quizId, gameId, session, QuizGameAction.GO_TO_ANSWER);
      const res = reqAdminQuizGameStateUpdate(quizId, gameId, session, action);
      expect(res.body).toStrictEqual({ error: expect.any(String) });
      expect(res.statusCode).toStrictEqual(400);

      const resStatus = reqAdminQuizGameStatusGet(quizId, gameId, session);
      const gameState = resStatus.body as { state: GameState };
      expect(gameState.state).toStrictEqual(GameState.ANSWER_SHOW);
      expect(resStatus.statusCode).toStrictEqual(200);
    });

    // FINAL_RESULTS wrong actions
    test.each([
      {
        name: 'FINAL_RESULTS => NEXT_QUESTION',
        action: QuizGameAction.SKIP_COUNTDOWN
      },
      {
        name: 'FINAL_RESULTS => SKIP_COUNTDOWN',
        action: QuizGameAction.GO_TO_ANSWER
      },
      {
        name: 'FINAL_RESULTS => GO_TO_ANSWER',
        action: QuizGameAction.SKIP_COUNTDOWN
      },
      {
        name: 'FINAL_RESULTS => GO_TO_FINAL_RESULTS',
        action: QuizGameAction.GO_TO_ANSWER
      }
    ])('$name', ({ action }) => {
      reqAdminQuizGameStateUpdate(quizId, gameId, session, QuizGameAction.NEXT_QUESTION);
      reqAdminQuizGameStateUpdate(quizId, gameId, session, QuizGameAction.SKIP_COUNTDOWN);
      reqAdminQuizGameStateUpdate(quizId, gameId, session, QuizGameAction.GO_TO_ANSWER);
      reqAdminQuizGameStateUpdate(quizId, gameId, session, QuizGameAction.GO_TO_FINAL_RESULTS);
      const res = reqAdminQuizGameStateUpdate(quizId, gameId, session, action);
      expect(res.body).toStrictEqual({ error: expect.any(String) });
      expect(res.statusCode).toStrictEqual(400);

      const resStatus = reqAdminQuizGameStatusGet(quizId, gameId, session);
      const gameState = resStatus.body as { state: GameState };
      expect(gameState.state).toStrictEqual(GameState.FINAL_RESULTS);
      expect(resStatus.statusCode).toStrictEqual(200);
    });

    // END action after game end
    test('END => END', () => {
      reqAdminQuizGameStateUpdate(quizId, gameId, session, QuizGameAction.END);
      const res = reqAdminQuizGameStateUpdate(quizId, gameId, session, QuizGameAction.END);
      expect(res.body).toStrictEqual({ error: expect.any(String) });
      expect(res.statusCode).toStrictEqual(400);

      const resStatus = reqAdminQuizGameStatusGet(quizId, gameId, session);
      const gameState = resStatus.body as { state: GameState };
      expect(gameState.state).toStrictEqual(GameState.END);
      expect(resStatus.statusCode).toStrictEqual(200);
    });
  });

  describe('Successive cases', () => {
    // 200 cases
    // LOBBY correct action
    test.each([
      {
        name: 'LOBBY => NEXT_QUESTION',
        action: QuizGameAction.NEXT_QUESTION,
        state: GameState.QUESTION_COUNTDOWN
      },
      {
        name: 'LOBBY => END',
        action: QuizGameAction.END,
        state: GameState.END
      }
    ])('$name', ({ action, state }) => {
      const res = reqAdminQuizGameStateUpdate(quizId, gameId, session, action);
      expect(res.body).toStrictEqual({});
      expect(res.statusCode).toStrictEqual(200);

      const resStatus = reqAdminQuizGameStatusGet(quizId, gameId, session);
      const gameState = resStatus.body as { state: GameState };
      expect(gameState.state).toStrictEqual(state);
      expect(resStatus.statusCode).toStrictEqual(200);
    });

    // QUESTION_COUNTDOWN correct action
    test('QUESTION_COUNDOWN => END', () => {
      reqAdminQuizGameStateUpdate(quizId, gameId, session, QuizGameAction.NEXT_QUESTION);
      const res = reqAdminQuizGameStateUpdate(quizId, gameId, session, QuizGameAction.END);
      expect(res.body).toStrictEqual({});
      expect(res.statusCode).toStrictEqual(200);

      const resStatus = reqAdminQuizGameStatusGet(quizId, gameId, session);
      const gameState = resStatus.body as { state: GameState };
      expect(gameState.state).toStrictEqual(GameState.END);
      expect(resStatus.statusCode).toStrictEqual(200);
    });

    test('QUESTION_COUNDOWN => QUESTION_OPEN', async () => {
      const res = reqAdminQuizGameStateUpdate(
        quizId,
        gameId,
        session,
        QuizGameAction.NEXT_QUESTION
      );
      expect(res.body).toStrictEqual({});
      expect(res.statusCode).toStrictEqual(200);
      await new Promise(res => setTimeout(res, 3000));
      reqAdminQuizGameStateUpdate(quizId, gameId, session, QuizGameAction.PING);

      const resStatus = reqAdminQuizGameStatusGet(quizId, gameId, session);
      const gameState = resStatus.body as { state: GameState };
      expect(gameState.state).toStrictEqual(GameState.QUESTION_OPEN);
      expect(resStatus.statusCode).toStrictEqual(200);
    });

    // QUESTION_OPEN correct action
    test.each([
      {
        name: 'QUESTION_OPEN => ANSWER_SHOW',
        action: QuizGameAction.GO_TO_ANSWER,
        state: GameState.ANSWER_SHOW
      },
      {
        name: 'QUESTION_OPEN => END',
        action: QuizGameAction.END,
        state: GameState.END
      }
    ])('$name', ({ action, state }) => {
      reqAdminQuizGameStateUpdate(quizId, gameId, session, QuizGameAction.NEXT_QUESTION);
      reqAdminQuizGameStateUpdate(quizId, gameId, session, QuizGameAction.SKIP_COUNTDOWN);
      const res = reqAdminQuizGameStateUpdate(quizId, gameId, session, action);
      expect(res.body).toStrictEqual({});
      expect(res.statusCode).toStrictEqual(200);

      const resStatus = reqAdminQuizGameStatusGet(quizId, gameId, session);
      const gameState = resStatus.body as { state: GameState };
      expect(gameState.state).toStrictEqual(state);
      expect(resStatus.statusCode).toStrictEqual(200);
    });

    test('QUESTION_OPEN => QUESTION_CLOSE', async () => {
      reqAdminQuizGameStateUpdate(quizId, gameId, session, QuizGameAction.NEXT_QUESTION);
      reqAdminQuizGameStateUpdate(quizId, gameId, session, QuizGameAction.SKIP_COUNTDOWN);
      await new Promise(res => setTimeout(res, 4000));

      reqAdminQuizGameStateUpdate(quizId, gameId, session, QuizGameAction.PING);
      const resStatus = reqAdminQuizGameStatusGet(quizId, gameId, session);
      const gameState = resStatus.body as { state: GameState };
      expect(gameState.state).toStrictEqual(GameState.QUESTION_CLOSE);
      expect(resStatus.statusCode).toStrictEqual(200);
    });

    // ANSWER_SHOW correct action
    test.each([
      {
        name: 'ANSWER_SHOW => QUESTION_COUNTDOWN',
        action: QuizGameAction.NEXT_QUESTION,
        state: GameState.QUESTION_COUNTDOWN
      },
      {
        name: 'ANSWER_SHOW => FINAL_RESULTS',
        action: QuizGameAction.GO_TO_FINAL_RESULTS,
        state: GameState.FINAL_RESULTS
      },
      {
        name: 'ANSWER_SHOW => END',
        action: QuizGameAction.END,
        state: GameState.END
      }
    ])('$name', ({ action, state }) => {
      reqAdminQuizGameStateUpdate(quizId, gameId, session, QuizGameAction.NEXT_QUESTION);
      reqAdminQuizGameStateUpdate(quizId, gameId, session, QuizGameAction.SKIP_COUNTDOWN);
      reqAdminQuizGameStateUpdate(quizId, gameId, session, QuizGameAction.GO_TO_ANSWER);
      const res = reqAdminQuizGameStateUpdate(quizId, gameId, session, action);
      expect(res.body).toStrictEqual({});
      expect(res.statusCode).toStrictEqual(200);

      const resStatus = reqAdminQuizGameStatusGet(quizId, gameId, session);
      const gameState = resStatus.body as { state: GameState };
      expect(gameState.state).toStrictEqual(state);
      expect(resStatus.statusCode).toStrictEqual(200);
    });

    // QUESTION_CLOSE correct action
    test.each([
      {
        name: 'QUESTION_CLOSE => FINAL_RESULTS',
        action: QuizGameAction.GO_TO_FINAL_RESULTS,
        state: GameState.FINAL_RESULTS
      },
      {
        name: 'QUESTION_CLOSE => END',
        action: QuizGameAction.END,
        state: GameState.END
      },
      {
        name: 'QUESTION_CLOSE => ANSWER_SHOW',
        action: QuizGameAction.GO_TO_ANSWER,
        state: GameState.ANSWER_SHOW
      }
    ])('$name', async ({ action, state }) => {
      reqAdminQuizGameStateUpdate(quizId, gameId, session, QuizGameAction.NEXT_QUESTION);
      reqAdminQuizGameStateUpdate(quizId, gameId, session, QuizGameAction.SKIP_COUNTDOWN);
      await new Promise(res => setTimeout(res, 4000));

      const res = reqAdminQuizGameStateUpdate(quizId, gameId, session, action);
      expect(res.body).toStrictEqual({});
      expect(res.statusCode).toStrictEqual(200);

      const resStatus = reqAdminQuizGameStatusGet(quizId, gameId, session);
      const gameState = resStatus.body as { state: GameState };
      expect(gameState.state).toStrictEqual(state);
      expect(resStatus.statusCode).toStrictEqual(200);
    });

    // FINAL_RESULTS correct action
    // FINAL_RESULTS => END
    test('FINAL => END', () => {
      reqAdminQuizGameStateUpdate(quizId, gameId, session, QuizGameAction.NEXT_QUESTION);
      reqAdminQuizGameStateUpdate(quizId, gameId, session, QuizGameAction.SKIP_COUNTDOWN);
      reqAdminQuizGameStateUpdate(quizId, gameId, session, QuizGameAction.GO_TO_ANSWER);
      reqAdminQuizGameStateUpdate(quizId, gameId, session, QuizGameAction.GO_TO_FINAL_RESULTS);
      const res = reqAdminQuizGameStateUpdate(quizId, gameId, session, QuizGameAction.END);
      expect(res.body).toStrictEqual({});
      expect(res.statusCode).toStrictEqual(200);

      const resStatus = reqAdminQuizGameStatusGet(quizId, gameId, session);
      const gameState = resStatus.body as { state: GameState };
      expect(gameState.state).toStrictEqual(GameState.END);
      expect(resStatus.statusCode).toStrictEqual(200);
    });

    // add a test when autostartNum is being satisfied
    test('When autostartnum is being reached', () => {
      reqAdminQuizGameGuestJoin(gameId, 'UserOne');
      reqAdminQuizGameGuestJoin(gameId, 'UserTwo');
      reqAdminQuizGameGuestJoin(gameId, 'UserThree');

      const res = reqAdminQuizGameStateUpdate(quizId, gameId, session, QuizGameAction.PING);
      expect(res.body).toStrictEqual({});
      expect(res.statusCode).toStrictEqual(200);

      const resStatus = reqAdminQuizGameStatusGet(quizId, gameId, session);
      const gameState = resStatus.body as { state: GameState };
      expect(gameState.state).toStrictEqual(GameState.QUESTION_COUNTDOWN);
      expect(resStatus.statusCode).toStrictEqual(200);
    });
  });
});
