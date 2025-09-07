import { expect, test } from '@jest/globals';
import {
  reqClear,
  reqAdminAuthRegister,
  reqAdminQuizCreate,
  reqAdminQuizQuestionCreateV2,
  reqAdminQuizGameStart,
  reqAdminQuizGameGuestJoin,
  reqAdminQuizGameStateUpdate,
  reqAdminQuestionAnswerSubmission,
  reqAdminQuizGameResultGet
} from '../helperFile/serverRequests';
import { QuizGameAction } from '../enum';
import slync from 'slync';

beforeEach(() => {
  reqClear();
});

// (adminQuestionAnswerSubmission)
describe('PUT /v1/player/{playerid}/question/{questionposition}/answer', () => {
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
        },
        {
          answer: 'Maybe',
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
        const res = reqAdminQuestionAnswerSubmission([1], playerIdInvalid, 1);
        expect(res.body).toStrictEqual({ error: expect.any(String) });
        expect(res.statusCode).toStrictEqual(400);
      });

      test('The question position is invalid for this game', () => {
        // since there is only one question, question position 2 is invalid
        const questionPositionInvalid = 2;
        const res = reqAdminQuestionAnswerSubmission([1], playerId, questionPositionInvalid);
        expect(res.body).toStrictEqual({ error: expect.any(String) });
        expect(res.statusCode).toStrictEqual(400);
      });

      test('Game is not currently on this question', () => {
        // add another question to the quiz
        reqAdminQuizQuestionCreateV2(quizId, session,
          'Is this other question valid?', 3, 5,
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
          'http://google.com/some/image/path.jpg'
        );

        // traverse through the quiz up to question 2
        slync(3000);
        // we can now traverse through question after delay
        reqAdminQuizGameStateUpdate(
          quizId,
          gameId,
          session,
          QuizGameAction.NEXT_QUESTION
        );
        reqAdminQuizGameStateUpdate(
          quizId,
          gameId,
          session,
          QuizGameAction.SKIP_COUNTDOWN
        );
        // the game state is now QUESTION_OPEN and the questionPosition is 2
        // so, it is invalid to submit question 1 answer because the game is not
        // currently on the question
        const questionPositionInvalid = 1;
        const res = reqAdminQuestionAnswerSubmission([1], playerId, questionPositionInvalid);
        expect(res.body).toStrictEqual({ error: expect.any(String) });
        expect(res.statusCode).toStrictEqual(400);
      });
    });

    describe('Error cases due to game state (not QUESTION_OPEN state)', () => {
      test('Game is in LOBBY state', () => {
        // game is initially in lobby state
        const res = reqAdminQuestionAnswerSubmission([1], playerId, 1);
        expect(res.body).toStrictEqual({ error: expect.any(String) });
        expect(res.statusCode).toStrictEqual(400);
      });

      test('Game is in END state', () => {
        // game moves from lobby to end state with end action
        reqAdminQuizGameStateUpdate(
          quizId,
          gameId,
          session,
          QuizGameAction.END
        );
        const res = reqAdminQuestionAnswerSubmission([1, 2], playerId, 1);
        expect(res.body).toStrictEqual({ error: expect.any(String) });
        expect(res.statusCode).toStrictEqual(400);
      });
    });

    describe('Error cases due to answerIDs', () => {
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

      test('Answer IDs are not valid for this particular question', () => {
        // use an extremely large value for invalid answerId
        const answerIdInvalid = 999999;
        const res = reqAdminQuestionAnswerSubmission([answerIdInvalid], playerId, 1);
        expect(res.body).toStrictEqual({ error: expect.any(String) });
        expect(res.statusCode).toStrictEqual(400);
      });

      test('There are duplicate answer IDs provided', () => {
        // duplicate for answerId 1 is provided in answer IDs array
        const res = reqAdminQuestionAnswerSubmission([1, 1], playerId, 1);
        expect(res.body).toStrictEqual({ error: expect.any(String) });
        expect(res.statusCode).toStrictEqual(400);
      });

      test('Less than one answer ID was submitted', () => {
        const res = reqAdminQuestionAnswerSubmission([], playerId, 1);
        expect(res.body).toStrictEqual({ error: expect.any(String) });
        expect(res.statusCode).toStrictEqual(400);
      });
    });
  });

  describe('Success cases', () => {
    test('Successful question answer submitted for player', () => {
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
      // the game is now in QUESTION_OPEN game state so anwer can be
      // successfully submitted for quesiton 1
      const res = reqAdminQuestionAnswerSubmission([2], playerId, 1);
      expect(res.body).toStrictEqual({});
      expect(res.statusCode).toStrictEqual(200);
    });

    test('Player submits multiple answers(incorrect)', () => {
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
      // the game is now in QUESTION_OPEN game state so anwer can be
      // successfully submitted for quesiton 1
      const res = reqAdminQuestionAnswerSubmission([1, 2], playerId, 1);
      expect(res.body).toStrictEqual({});
      expect(res.statusCode).toStrictEqual(200);
    });

    test('Player makes multiple submissions', () => {
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
      // the game is now in QUESTION_OPEN game state so anwer can be
      // successfully submitted for quesiton 1
      reqAdminQuestionAnswerSubmission([1, 2], playerId, 1);
      const res = reqAdminQuestionAnswerSubmission([1], playerId, 1);
      expect(res.body).toStrictEqual({});
      expect(res.statusCode).toStrictEqual(200);
    });

    test('results reflects successful player submissions', () => {
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
      // the game is now in QUESTION_OPEN game state so anwer can be
      // successfully submitted for quesiton 1
      reqAdminQuestionAnswerSubmission([1], playerId, 1);
      reqAdminQuizGameStateUpdate(
        quizId,
        gameId,
        session,
        QuizGameAction.GO_TO_ANSWER
      );
      reqAdminQuizGameStateUpdate(
        quizId,
        gameId,
        session,
        QuizGameAction.GO_TO_FINAL_RESULTS
      );
      const res = reqAdminQuizGameResultGet(session, quizId, gameId);
      expect(res.body).toStrictEqual({
        userRankedByScore: [
          {
            playerName: 'player1',
            score: 5
          }
        ],
        questionResults: [
          {
            averageAnswerTime: expect.any(Number),
            percentCorrect: 100,
            playersCorrect: ['player1'],
            questionId: expect.any(Number),
            submissions: [
              {
                answerIds: [1],
                answerCorrect: true,
                playerId: playerId,
                name: 'player1',
                timeTaken: expect.any(Number)
              }
            ]
          }
        ]
      });
      expect(res.statusCode).toStrictEqual(200);
    });
  });
});
