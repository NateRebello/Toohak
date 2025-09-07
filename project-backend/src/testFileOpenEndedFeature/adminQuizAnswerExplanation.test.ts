import { QuizGameAction } from '../enum';
import {
  reqAdminAuthRegister,
  reqAdminQuizCreate,
  reqAdminQuizGameStart,
  reqAdminQuizGameStateUpdate,
  reqAdminQuizQuestionCreateV2,
  reqClear,
  reqLLMGetAnswerExplanation
} from '../helperFile/serverRequests';
import { v4 as uuidv4 } from 'uuid';

let session: string;
let session2: string;
let quizId: number;
let questionId: number;
let gameId: number;
beforeEach(() => {
  reqClear();

  const res = reqAdminAuthRegister(
    'valid@email.com',
    'validPass1',
    'validFirstName',
    'validLastName'
  );
  session = (res.body as { session: string }).session;

  const quizRes = reqAdminQuizCreate(session, 'valid name', 'valid description');
  quizId = (quizRes.body as { quizId: number }).quizId;

  const quesRes = reqAdminQuizQuestionCreateV2(quizId, session,
    'Is 2 + 2 = 4?', 4, 5,
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
  questionId = (quesRes.body as { questionId: number }).questionId;

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

describe('adminQuizAnswerExplanation.test.ts', () => {
  describe('Error cases', () => {
    test.each([
      {
        name: 'Empty session',
        session: () => '',
        quizId: () => quizId,
        questionId: () => questionId,
        errorCode: 401
      },
      {
        name: 'Invalid session',
        session: () => uuidv4(),
        quizId: () => quizId,
        questionId: () => questionId,
        errorCode: 401
      },
      {
        name: 'Invalid quizId',
        session: () => session,
        quizId: () => quizId + 1,
        questionId: () => questionId,
        errorCode: 403
      },
      {
        name: 'User does not own the quiz',
        session: () => session2,
        quizId: () => quizId,
        questionId: () => questionId,
        errorCode: 403
      },
    ])('$name', ({ session, quizId, questionId, errorCode }) => {
      reqAdminQuizGameStateUpdate(quizId(), gameId, session(), QuizGameAction.NEXT_QUESTION);
      reqAdminQuizGameStateUpdate(quizId(), gameId, session(), QuizGameAction.SKIP_COUNTDOWN);
      reqAdminQuizGameStateUpdate(quizId(), gameId, session(), QuizGameAction.GO_TO_ANSWER);
      const res = reqLLMGetAnswerExplanation(quizId(), questionId(), session());
      expect(res.body).toStrictEqual({ error: expect.any(String) });
      expect(res.statusCode).toStrictEqual(errorCode);
    });

    test('Invalid QuestionId', () => {
      const InvalidQuestionId = questionId + 1;
      reqAdminQuizGameStateUpdate(quizId, gameId, session, QuizGameAction.END);
      const res = reqLLMGetAnswerExplanation(quizId, InvalidQuestionId, session);
      expect(res.body).toStrictEqual({ error: expect.any(String) });
      expect(res.statusCode).toStrictEqual(400);
    });

    test('Invalid GameId', () => {
      const InvalidGameId = gameId + 1;
      reqAdminQuizGameStateUpdate(quizId, InvalidGameId, session, QuizGameAction.END);
      const res = reqLLMGetAnswerExplanation(quizId, questionId, session);
      expect(res.body).toStrictEqual({ error: expect.any(String) });
      expect(res.statusCode).toStrictEqual(400);
    });

    test('Invalid GameState', () => {
      reqAdminQuizGameStateUpdate(quizId, gameId, session, QuizGameAction.END);
      const res = reqLLMGetAnswerExplanation(quizId, questionId, session);
      expect(res.body).toStrictEqual({ error: expect.any(String) });
      expect(res.statusCode).toStrictEqual(400);
    });
  });

  describe('Successive cases', () => {
    test('Successfully returns a explanation', () => {
      reqAdminQuizGameStateUpdate(quizId, gameId, session, QuizGameAction.NEXT_QUESTION);
      reqAdminQuizGameStateUpdate(quizId, gameId, session, QuizGameAction.SKIP_COUNTDOWN);
      reqAdminQuizGameStateUpdate(quizId, gameId, session, QuizGameAction.GO_TO_ANSWER);
      const res = reqLLMGetAnswerExplanation(quizId, questionId, session);
      expect(res.body).toStrictEqual({ explanation: expect.any(String) });
      expect(res.statusCode).toStrictEqual(200);
    });
  });
});
