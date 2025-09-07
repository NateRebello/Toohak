import { expect, test } from '@jest/globals';
import {
  reqClear,
  reqAdminAuthRegister,
  reqAdminQuizCreate,
  reqAdminQuizQuestionCreateV2,
  reqAdminQuizGameStart,
  reqAdminQuizGameGuestJoin,
  reqAdminQuizGameGuestStatus,
  reqAdminQuizGameStateUpdate,
  reqAdminQuestionAnswerSubmission,
  reqAdminQuizGameStatusGet
} from '../helperFile/serverRequests';
import { QuizGameAction, GameState } from '../enum';
beforeEach(() => {
  reqClear();
});

// Test how the status of a guest player that has already joined a game is retrived
describe('GET /v1/player/{playerid} (adminQuizGameGuestStatus)', () => {
  let session: string;
  let quizId: number;
  let gameId: number;
  let playerId: number;
  // create an admin, quiz and game with a guest player in it
  beforeEach(() => {
    // register a user
    const res = reqAdminAuthRegister(
      'valid@email.com',
      'validPass1',
      'validFirstName',
      'validLastName'
    );
    session = (res.body as { session: string }).session;

    // create a new quiz for this user
    const quizRes = reqAdminQuizCreate(session, 'valid name', 'valid description');
    quizId = (quizRes.body as { quizId: number }).quizId;

    // add a question to this quiz
    reqAdminQuizQuestionCreateV2(quizId, session,
      'Is this question update valid?', 3, 5,
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

    // create a new game with autostart with one player
    const gameRes = reqAdminQuizGameStart(
      session,
      quizId,
      1
    );
    gameId = (gameRes.body as { gameId: number }).gameId;

    // create a player in the game
    const playerRes = reqAdminQuizGameGuestJoin(
      gameId,
      'player1'
    );
    playerId = (playerRes.body as { playerId: number }).playerId;
  });

  describe('Error case', () => {
    test('The playerID does not exist', () => {
      const playerIdInvalid = playerId + 1;
      const res = reqAdminQuizGameGuestStatus(playerIdInvalid);
      expect(res.body).toStrictEqual({ error: expect.any(String) });
      expect(res.statusCode).toStrictEqual(400);
    });
  });

  describe('Success case', () => {
    test('A valid player who completes the whole game', async () => {
      const res1 = reqAdminQuizGameGuestStatus(playerId);
      expect(res1.body).toStrictEqual(
        {
          state: GameState.LOBBY,
          numQuestions: 1,
          atQuestion: 1
        }
      );
      expect(res1.statusCode).toStrictEqual(200);

      // go to first question and then check the guest status
      reqAdminQuizGameStateUpdate(
        quizId,
        gameId,
        session,
        QuizGameAction.NEXT_QUESTION
      );
      const res2 = reqAdminQuizGameGuestStatus(playerId);
      expect(res2.body).toStrictEqual(
        {
          state: GameState.QUESTION_COUNTDOWN,
          numQuestions: 1,
          atQuestion: 1
        }
      );
      expect(res2.statusCode).toStrictEqual(200);

      // answer the first question as yes then check game status for player
      reqAdminQuestionAnswerSubmission(
        [1],
        playerId,
        1
      );
      const res3 = reqAdminQuizGameGuestStatus(playerId);
      expect(res3.body).toStrictEqual(
        {
          state: GameState.QUESTION_COUNTDOWN,
          numQuestions: 1,
          atQuestion: 1
        }
      );
      expect(res3.statusCode).toStrictEqual(200);

      // skip the countdown then check the game status for the player
      reqAdminQuizGameStateUpdate(
        quizId,
        gameId,
        session,
        QuizGameAction.SKIP_COUNTDOWN
      );
      const res4 = reqAdminQuizGameGuestStatus(playerId);
      expect(res4.body).toStrictEqual(
        {
          state: GameState.QUESTION_OPEN,
          numQuestions: 1,
          atQuestion: 1
        }
      );
      expect(res4.statusCode).toStrictEqual(200);

      // sleep for question duration (4s -> 4000ms) then check state changed
      await new Promise(res => setTimeout(res, 4000));

      reqAdminQuizGameStateUpdate(quizId, gameId, session, QuizGameAction.PING);
      const resStatus = reqAdminQuizGameStatusGet(quizId, gameId, session);
      const gameState = resStatus.body as { state: GameState };
      expect(gameState.state).toStrictEqual(GameState.QUESTION_CLOSE);

      const res5 = reqAdminQuizGameGuestStatus(playerId);
      expect(res5.body).toStrictEqual(
        {
          state: GameState.QUESTION_CLOSE,
          numQuestions: 1,
          atQuestion: 1
        }
      );
      expect(res5.statusCode).toStrictEqual(200);
      // go to the answer and check game status for the player is ANSWER_SHOW
      reqAdminQuizGameStateUpdate(
        quizId,
        gameId,
        session,
        QuizGameAction.GO_TO_ANSWER
      );
      const res6 = reqAdminQuizGameGuestStatus(playerId);
      expect(res6.body).toStrictEqual(
        {
          state: GameState.ANSWER_SHOW,
          numQuestions: 1,
          atQuestion: 1
        }
      );
      expect(res6.statusCode).toStrictEqual(200);

      // go to the final results and check the game status for the player
      reqAdminQuizGameStateUpdate(
        quizId,
        gameId,
        session,
        QuizGameAction.GO_TO_FINAL_RESULTS
      );
      const res7 = reqAdminQuizGameGuestStatus(playerId);
      expect(res7.body).toStrictEqual(
        {
          state: GameState.FINAL_RESULTS,
          numQuestions: 1,
          atQuestion: 1
        }
      );
      expect(res7.statusCode).toStrictEqual(200);

      // end the game and check the game state is at end
      reqAdminQuizGameStateUpdate(
        quizId,
        gameId,
        session,
        QuizGameAction.END
      );
      const res8 = reqAdminQuizGameGuestStatus(playerId);
      expect(res8.body).toStrictEqual(
        {
          state: GameState.END,
          numQuestions: 1,
          atQuestion: 1
        }
      );
      expect(res8.statusCode).toStrictEqual(200);
    });
  });
});
