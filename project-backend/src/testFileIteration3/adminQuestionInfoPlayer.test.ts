import { expect, test } from '@jest/globals';
import {
  reqClear,
  reqAdminAuthRegister,
  reqAdminQuizCreate,
  reqAdminQuizQuestionCreateV2,
  reqAdminQuizGameStart,
  reqAdminQuizGameGuestJoin,
  reqAdminQuizGameStateUpdate,
  reqAdminQuestionInfoPlayer
} from '../helperFile/serverRequests';
import { QuizGameAction } from '../enum';
import slync from 'slync';

beforeEach(() => {
  reqClear();
});

// Test if the information about the question that the guest player is on is successfully retrived
describe('GET /v1/player/{playerid}/question/{questionposition} (adminQuestionInfoPlayer)', () => {
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

  describe('Error cases', () => {
    describe('Error cases due to playerId or questionPosition', () => {
      beforeEach(() => {
        // go to first question so game has started
        reqAdminQuizGameStateUpdate(
          quizId,
          gameId,
          session,
          QuizGameAction.NEXT_QUESTION
        );

        // then perform action of skipping countdown so game is in right state
        reqAdminQuizGameStateUpdate(
          quizId,
          gameId,
          session,
          QuizGameAction.SKIP_COUNTDOWN
        );
        // the game is now in QUESTION_OPEN game state
      });

      test('The playerID does not exist', () => {
        const playerIdInvalid = playerId + 1;
        const res = reqAdminQuestionInfoPlayer(playerIdInvalid, 1);
        expect(res.body).toStrictEqual({ error: expect.any(String) });
        expect(res.statusCode).toStrictEqual(400);
      });

      test('The question position is invalid for this game', () => {
        // since there is only one question, question position 2 is invalid
        const questionPositionInvalid = 2;
        const res = reqAdminQuestionInfoPlayer(playerId, questionPositionInvalid);
        expect(res.body).toStrictEqual({ error: expect.any(String) });
        expect(res.statusCode).toStrictEqual(400);
      });
    });

    describe('Error cases due to game state', () => {
      test('Game is in LOBBY state', () => {
        // game is initially in lobby state
        const res = reqAdminQuestionInfoPlayer(playerId, 1);
        expect(res.body).toStrictEqual({ error: expect.any(String) });
        expect(res.statusCode).toStrictEqual(400);
      });

      test('Game is in QUESTION COUNTDOWN or FINAL RESULTS state', () => {
        // game moves from lobby to question countdown state with
        // next question action
        reqAdminQuizGameStateUpdate(
          quizId,
          gameId,
          session,
          QuizGameAction.NEXT_QUESTION
        );
        const res = reqAdminQuestionInfoPlayer(playerId, 1);
        expect(res.body).toStrictEqual({ error: expect.any(String) });
        expect(res.statusCode).toStrictEqual(400);

        // game moves from question countdown to final results state
        reqAdminQuizGameStateUpdate(
          quizId,
          gameId,
          session,
          QuizGameAction.SKIP_COUNTDOWN
        );
        slync(3000);
        reqAdminQuizGameStateUpdate(
          quizId,
          gameId,
          session,
          QuizGameAction.GO_TO_FINAL_RESULTS
        );
        const res1 = reqAdminQuestionInfoPlayer(playerId, 1);
        expect(res1.body).toStrictEqual({ error: expect.any(String) });
        expect(res1.statusCode).toStrictEqual(400);
      });

      test('Game is in END state', () => {
        // game moves from lobby to end state with end action
        reqAdminQuizGameStateUpdate(
          quizId,
          gameId,
          session,
          QuizGameAction.END
        );
        const res = reqAdminQuestionInfoPlayer(playerId, 1);
        expect(res.body).toStrictEqual({ error: expect.any(String) });
        expect(res.statusCode).toStrictEqual(400);
      });
    });
  });
  describe('Success cases', () => {
    test('Successful question information obtained for player', () => {
      // game moves from lobby to question countdown state with
      // next question action
      reqAdminQuizGameStateUpdate(
        quizId,
        gameId,
        session,
        QuizGameAction.NEXT_QUESTION
      );

      // then perform action of skipping countdown so game is in right state
      reqAdminQuizGameStateUpdate(
        quizId,
        gameId,
        session,
        QuizGameAction.SKIP_COUNTDOWN
      );
      // the game is now in QUESTION_OPEN game state so information can be
      // successfully retrived for question 1
      const res = reqAdminQuestionInfoPlayer(playerId, 1);
      expect(res.body).toStrictEqual({
        questionId: 1,
        question: 'Is this question update valid?',
        timeLimit: 3,
        thumbnailUrl: 'http://jpg',
        points: 5,
        answerOptions: [
          {
            answerId: 1,
            answer: 'Yes',
            colour: expect.any(String)
          },
          {
            answerId: 2,
            answer: 'No',
            colour: expect.any(String)
          },
        ]
      });
      expect(res.statusCode).toStrictEqual(200);
    });
  });
});
