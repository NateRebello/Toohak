import request from 'sync-request-curl';
import config from '../config.json';
import {
  HTTPResponse,
  QuizId,
  AdminQuizInfoReturn,
  Answer,
  EmptyObject,
  Quizzes,
  UserDetails,
  SessionId,
  ErrorReturn,
  QuestionId,
  GameListsStatus,
  QuizGameStatusReturn,
  GameResult,
  PlayerId,
  GuestPlayerReturn,
  QuestionInfoPlayerReturn,
  QuestionResult,
  GameId,
} from '../interface';
import { QuizGameAction } from '../enum';

const port = config.port;
const url = config.url;

const SERVER_URL = `${url}:${port}`;
const TIMEOUT_MS = 5 * 1000;

/**
 * Makes a http server request, returning the output of adminAuthRegister
 *
 * @param {string} email
 * @param {string} password
 * @param {string} nameFirst
 * @param {string} nameLast
 * @returns {HTTPResponse<SessionId | ErrorReturn>}
 */
function reqAdminAuthRegister(email: string, password: string,
  nameFirst: string, nameLast: string): HTTPResponse<SessionId | ErrorReturn> {
  const res = request(
    'POST',
    SERVER_URL + '/v1/admin/auth/register', {
      json: {
        email: email,
        password: password,
        nameFirst: nameFirst,
        nameLast: nameLast
      },
      timeout: TIMEOUT_MS
    }
  );
  return {
    statusCode: res.statusCode,
    body: JSON.parse(res.body.toString())
  };
}

/**
 *
 * @param {string} email
 * @returns {string} session
 */
function registerAndGetSession(email: string): string {
  const password = 'Password123';
  const firstName = 'First';
  const lastName = 'Last';
  const res = reqAdminAuthRegister(email, password, firstName, lastName);
  expect('session' in res.body).toBe(true);
  const session = (res.body as { session: string }).session;

  return session;
}

/**
 * Makes a http server request, returning the output of adminAuthLogin
 *
 * @param {string} email
 * @param {string} password
 * @returns {HTTPResponse<SessionId | ErrorReturn>}
 */
function reqAdminAuthLogin(email: string, password: string): HTTPResponse<SessionId | ErrorReturn> {
  const res = request(
    'POST',
    SERVER_URL + '/v1/admin/auth/login', {
      json: {
        email: email,
        password: password,
      },
      timeout: TIMEOUT_MS
    }
  );
  return {
    statusCode: res.statusCode,
    body: JSON.parse(res.body.toString())
  };
}

/**
 * Makes a http server request, returning the output of adminUserDetails
 *
 * @param {string} session
 * @returns {HTTPResponse<UserDetails | ErrorReturn>}
 */
function reqAdminUserDetails(session: string): HTTPResponse<UserDetails | ErrorReturn> {
  const res = request(
    'GET',
    SERVER_URL + '/v1/admin/user/details', {
      headers: {
        session: session,
      },
      timeout: TIMEOUT_MS
    }
  );
  return {
    statusCode: res.statusCode,
    body: JSON.parse(res.body.toString())
  };
}

/**
 * Makes a http server request, returning the output of adminUserDetailsUpdate
 *
 * @param {string} session
 * @param {string} email
 * @param {string} nameFirst
 * @param {string} nameLast
 * @returns {HTTPResponse<EmptyObject | ErrorReturn>}
 */
function reqAdminUserDetailsUpdate(
  session: string,
  email: string,
  nameFirst: string,
  nameLast: string
): HTTPResponse<EmptyObject | ErrorReturn> {
  const res = request(
    'PUT',
    SERVER_URL + '/v1/admin/user/details', {
      headers: {
        session: session,
      },
      json: {
        email: email,
        nameFirst: nameFirst,
        nameLast: nameLast
      },
      timeout: TIMEOUT_MS
    }
  );
  return {
    statusCode: res.statusCode,
    body: JSON.parse(res.body.toString())
  };
}

/**
 * Makes a http server request, returning the output of adminUserPasswordUpdate
 *
 * @param {string} session
 * @param {string} oldPassword
 * @param {string} newPassword
 * @returns {HTTPResponse<EmptyObject | ErrorReturn>}
 */
function reqAdminUserPasswordUpdate(session: string, oldPassword: string,
  newPassword: string): HTTPResponse<EmptyObject | ErrorReturn> {
  const res = request(
    'PUT',
    SERVER_URL + '/v1/admin/user/password', {
      headers: {
        session: session,
      },
      json: {
        oldPassword: oldPassword,
        newPassword: newPassword
      },
      timeout: TIMEOUT_MS
    }
  );
  return {
    statusCode: res.statusCode,
    body: JSON.parse(res.body.toString())
  };
}

/**
 * Makes a http server request, returning the output of adminQuizList
 *
 * @param {string} session
 * @returns {HTTPResponse<Quizzes[]>}
 */
function reqAdminQuizList(session: string): HTTPResponse<Quizzes[]> {
  const res = request(
    'GET',
    SERVER_URL + '/v1/admin/quiz/list', {
      headers: {
        session: session,
      },
      timeout: TIMEOUT_MS
    }
  );
  return {
    statusCode: res.statusCode,
    body: JSON.parse(res.body.toString())
  };
}

/**
 * Makes a http server request, returning the output of adminQuizCreate
 *
 * @param {string} session
 * @param {string} name
 * @param {string} description
 * @returns {HTTPResponse<QuizId | ErrorReturn>}
 */
function reqAdminQuizCreate(session: string, name: string, description: string)
  : HTTPResponse<QuizId | ErrorReturn> {
  const res = request(
    'POST',
    SERVER_URL + '/v1/admin/quiz', {
      headers: {
        session: session,
      },
      json: {
        name: name,
        description: description
      },
      timeout: TIMEOUT_MS
    }
  );
  return {
    statusCode: res.statusCode,
    body: JSON.parse(res.body.toString())
  };
}

/**
 * Makes a http server request, returning the output of adminQuizRemove
 *
 * @param {string} session
 * @param {number} quizId
 * @returns {HTTPResponse<EmptyObject | ErrorReturn>}
 */
function reqAdminQuizRemove(session:string, quizId: number)
  : HTTPResponse<EmptyObject | ErrorReturn> {
  const res = request(
    'DELETE',
    SERVER_URL + `/v1/admin/quiz/${quizId}`, {
      headers: {
        session: session,
      },
      timeout: TIMEOUT_MS,
    }
  );
  return {
    statusCode: res.statusCode,
    body: JSON.parse(res.body.toString())
  };
}

/**
 * Makes a http server request, returning the output of adminQuizInfo
 *
 * @param {string} session
 * @param {string} quizId
 * @returns {HTTPResponse<AdminQuizInfoReturn>}
 */
function reqAdminQuizInfo(session: string, quizId: number): HTTPResponse<AdminQuizInfoReturn> {
  const res = request(
    'GET',
    SERVER_URL + `/v1/admin/quiz/${quizId}`, {
      headers: {
        session: session,
      },
      timeout: TIMEOUT_MS
    }
  );
  return {
    statusCode: res.statusCode,
    body: JSON.parse(res.body.toString())
  };
}

/**
 * Makes a http server request, returning the output of adminQuizNameUpdate
 *
 * @param {string} session
 * @param {string} quizId
 * @param {string} name
 * @returns {HTTPResponse<EmptyObject | ErrorReturn>}
 */
function reqAdminQuizNameUpdate(session: string, quizId: number, name: string)
  : HTTPResponse<EmptyObject | ErrorReturn> {
  const res = request(
    'PUT',
    SERVER_URL + `/v1/admin/quiz/${quizId}/name`, {
      headers: {
        session: session,
      },
      json: {
        name: name
      },
      timeout: TIMEOUT_MS
    }
  );
  return {
    statusCode: res.statusCode,
    body: JSON.parse(res.body.toString())
  };
}

/**
 * Makes a http server request, returning the output of adminQuizDescriptionUpdate
 *
 * @param {string} session
 * @param {number} quizId
 * @param {string} description
 */
function reqAdminQuizDescriptionUpdate(session: string, quizId: number, description: string)
  : HTTPResponse<EmptyObject | ErrorReturn> {
  const res = request(
    'PUT',
    SERVER_URL + `/v1/admin/quiz/${quizId}/description`, {
      headers: {
        session: session,
      },
      json: {
        description: description,
      },
      timeout: TIMEOUT_MS
    }
  );

  return {
    statusCode: res.statusCode,
    body: JSON.parse(res.body.toString())
  };
}

/**
 * Makes a http server request for clear
 *
 * @returns {HTTPResponse<EmptyObject>}
 */
function reqClear(): HTTPResponse<EmptyObject> {
  const res = request(
    'DELETE',
    SERVER_URL + '/v1/clear', {
      timeout: TIMEOUT_MS
    }
  );
  return {
    statusCode: res.statusCode,
    body: JSON.parse(res.body.toString())
  };
}

// iteration 2 helper functions
/**
 * Makes a http server request, returning the output of adminAuthLogout
 *
 * @param {string} session
 * @returns {HTTPResponse<EmptyObject | ErrorReturn>}
 */
function reqAdminAuthLogout(session: string): HTTPResponse<EmptyObject | ErrorReturn> {
  const res = request(
    'POST',
    SERVER_URL + '/v1/admin/auth/logout', {
      headers: { session },
      timeout: TIMEOUT_MS,
    });

  return {
    statusCode: res.statusCode,
    body: JSON.parse(res.body.toString())
  };
}

/**
 * Makes a http server request, returning the output of adminQuizTransfer
 *
 * @param {number} quizId
 * @param {string} session
 * @param {string} userEmail
 * @returns {HTTPResponse<EmptyObject | ErrorReturn>}
 */
function reqAdminQuizTransfer(quizId: number, session: string, userEmail: string)
  : HTTPResponse<EmptyObject | ErrorReturn> {
  const res = request(
    'POST',
    SERVER_URL + `/v1/admin/quiz/${quizId}/transfer`, {
      headers: { session },
      json: { userEmail },
      timeout: TIMEOUT_MS
    }
  );

  return {
    statusCode: res.statusCode,
    body: JSON.parse(res.body.toString())
  };
}

/**
 * Makes a http server request, returning the output of adminQuizQuestionCreate
 *
 * @param {string} session
 * @param {number} quizId
 * @param {string} question
 * @param {number} timeLimit
 * @param {number} points
 * @param {Answer[]} answerOptions
 * @param {string} thumbnailUrl
 * @returns {HTTPResponse<QuestionId | ErrorReturn>}
 */
function reqAdminQuizQuestionCreate(
  session: string,
  quizId: number,
  question: string,
  timeLimit: number,
  points: number,
  answerOptions: Answer[],
  thumbnailUrl: string
): HTTPResponse<QuestionId | ErrorReturn> {
  const res = request(
    'POST',
    SERVER_URL + `/v1/admin/quiz/${quizId}/question`, {
      headers: {
        session: session,
      },
      json: {
        questionBody: {
          question: question,
          timeLimit: timeLimit,
          points: points,
          answerOptions: answerOptions,
          thumbnailUrl: thumbnailUrl
        }
      },
      timeout: TIMEOUT_MS
    }
  );

  return {
    statusCode: res.statusCode,
    body: JSON.parse(res.body.toString())
  };
}

/**
 * Sends a DELETE request to remove a specific question from a quiz.
 * @param {string} session
 * @param {number} quizId
 * @param {number} questionId
 * @returns {HTTPResponse<EmptyObject>}
 */
function reqAdminQuizQuestionDelete(
  session: string,
  quizId: number,
  questionId: number
): HTTPResponse<EmptyObject> {
  const res = request(
    'DELETE',
    `${SERVER_URL}/v1/admin/quiz/${quizId}/question/${questionId}`,
    {
      headers: { session: session },
      timeout: TIMEOUT_MS,
    }
  );

  return {
    statusCode: res.statusCode,
    body: JSON.parse(res.body.toString()),
  };
}

/**
 * Makes a http server request, returning the output of adminQuizQuestionUpdate
 *
 * @param session
 * @param quizId
 * @param questionId
 * @param question
 * @param timeLlimit
 * @param points
 * @param answerOptions
 * @param thumbnailUrl
 * @returns {HTTPResponse<EmptyObject | ErrorReturn>}
 */
function reqAdminQuizQuestionUpdate(
  session: string,
  quizId: number,
  questionId: number,
  question: string,
  timeLimit: number,
  points: number,
  answerOptions: Answer[],
  thumbnailUrl: string
): HTTPResponse<EmptyObject | ErrorReturn> {
  const res = request(
    'PUT',
    SERVER_URL + `/v1/admin/quiz/${quizId}/question/${questionId}`, {
      headers: {
        session: session,
      },
      json: {
        questionBody: {
          question: question,
          timeLimit: timeLimit,
          points: points,
          answerOptions: answerOptions,
          thumbnailUrl: thumbnailUrl
        }
      },
      timeout: TIMEOUT_MS
    });

  return {
    statusCode: res.statusCode,
    body: JSON.parse(res.body.toString())
  };
}

/**
 *
 * @param {string} session
 * @param {number} quizId
 * @param {number} questionId
 * @param {number} newPosition
 * @returns {HTTPResponse<EmptyObject | ErrorReturn>}
 */
function reqAdminQuizQuestionMove(
  session: string,
  quizId: number,
  questionId: number,
  newPosition: number
): HTTPResponse<EmptyObject | ErrorReturn> {
  const res = request(
    'PUT',
    SERVER_URL + `/v1/admin/quiz/${quizId}/question/${questionId}/move`, {
      headers: { session: session },
      json: { newPosition: newPosition },
      timeout: TIMEOUT_MS,
    }
  );

  return {
    statusCode: res.statusCode,
    body: JSON.parse(res.body.toString())
  };
}

/// /// /// /// /// /// /// /// /// /// /// /// /// /// /// /// ///
/// V2 wrapper functions                                         //
/// /// /// /// /// /// /// /// /// /// /// /// /// /// /// /// ///

function reqAdminQuizDeleteV2(quizId: number, session: string)
  : HTTPResponse<EmptyObject | ErrorReturn> {
  const res = request(
    'DELETE',
    SERVER_URL + `/v2/admin/quiz/${quizId}`, {
      headers: {
        session: session,
      },
      timeout: TIMEOUT_MS
    }
  );
  return {
    statusCode: res.statusCode,
    body: JSON.parse(res.body.toString())
  };
}
/**
 * Makes a http server request, returning the output of adminQuizInfo
 *
 * @param {string} session
 * @param {string} quizId
 * @returns {HTTPResponse<AdminQuizInfoReturn>}
 */
function reqAdminQuizInfoV2(session: string, quizId: number): HTTPResponse<AdminQuizInfoReturn> {
  const res = request(
    'GET',
    SERVER_URL + `/v2/admin/quiz/${quizId}`, {
      headers: {
        session: session,
      },
      timeout: TIMEOUT_MS
    }
  );
  return {
    statusCode: res.statusCode,
    body: JSON.parse(res.body.toString())
  };
}

function reqAdminQuizTransferV2(quizId: number, session: string, userEmail: string)
: HTTPResponse<EmptyObject | ErrorReturn> {
  const res = request(
    'POST',
    SERVER_URL + `/v2/admin/quiz/${quizId}/transfer`, {
      headers: {
        session: session,
      },
      json: {
        userEmail: userEmail
      },
      timeout: TIMEOUT_MS
    }
  );
  return {
    statusCode: res.statusCode,
    body: JSON.parse(res.body.toString())
  };
}

/**
 * Makes a http server request, returning the output of adminQuizQuestionCreate
 *
 * @param {string} session
 * @param {number} quizId
 * @param {string} question
 * @param {number} timeLimit
 * @param {number} points
 * @param {Answer[]} answerOptions
 * @param {string} thumbnailUrl
 * @returns {HTTPResponse<QuestionId | ErrorReturn>}
 */
function reqAdminQuizQuestionCreateV2(
  quizId: number,
  session: string,
  question: string,
  timeLimit: number,
  points: number,
  answerOptions: Answer[],
  thumbnailUrl: string
): HTTPResponse<QuestionId | ErrorReturn> {
  const res = request(
    'POST',
    SERVER_URL + `/v2/admin/quiz/${quizId}/question`, {
      headers: {
        session: session,
        'Content-Type': 'application/json',
      },
      json: {
        questionBody: {
          question,
          timeLimit,
          points,
          answerOptions,
          thumbnailUrl
        }
      },
      timeout: TIMEOUT_MS
    }
  );

  return {
    statusCode: res.statusCode,
    body: JSON.parse(res.body.toString())
  };
}

/**
 * Makes a http server request, returning the output of adminQuizQuestionUpdate
 *
 * @param session
 * @param quizId
 * @param questionId
 * @param question
 * @param timeLlimit
 * @param points
 * @param answerOptions
 * @param thumbnailUrl
 * @returns {HTTPResponse<EmptyObject | ErrorReturn>}
 */
function reqAdminQuizQuestionUpdateV2(
  session: string,
  quizId: number,
  questionId: number,
  question: string,
  timeLimit: number,
  points: number,
  answerOptions: Answer[],
  thumbnailUrl: string
): HTTPResponse<EmptyObject | ErrorReturn> {
  const res = request(
    'PUT',
    SERVER_URL + `/v2/admin/quiz/${quizId}/question/${questionId}`, {
      headers: {
        session: session,
        'Content-Type': 'application/json',
      },
      json: {
        questionBody: {
          question,
          timeLimit,
          points,
          answerOptions,
          thumbnailUrl
        }
      },
      timeout: TIMEOUT_MS
    });

  return {
    statusCode: res.statusCode,
    body: JSON.parse(res.body.toString())
  };
}

/**
 * Makes a http server request, returning the output of adminQuizNameUpdate
 *
 * @param {string} session
 * @param {string} quizId
 * @param {string} name
 * @returns {HTTPResponse<EmptyObject | ErrorReturn>}
 */
function reqAdminQuizNameUpdateV2(session: string, quizId: number, name: string)
  : HTTPResponse<EmptyObject | ErrorReturn> {
  const res = request(
    'PUT',
    SERVER_URL + `/v1/admin/quiz/${quizId}/name`, {
      headers: {
        session: session,
      },
      json: {
        name: name
      },
      timeout: TIMEOUT_MS
    }
  );
  return {
    statusCode: res.statusCode,
    body: JSON.parse(res.body.toString())
  };
}

/**
 * Makes an HTTP server request, returning the output of adminQuizQuestionDelete
 *
 * @param {string} session
 * @param {number} quizId
 * @param {number} questionId
 * @returns {HTTPResponse<EmptyObject | ErrorReturn>}
 */
function reqAdminQuizQuestionDeleteV2(
  session: string,
  quizId: number,
  questionId: number
): HTTPResponse<EmptyObject | ErrorReturn> {
  const res = request(
    'DELETE',
    SERVER_URL + `/v2/admin/quiz/${quizId}/question/${questionId}`, {
      headers: {
        session: session,
      },
      timeout: TIMEOUT_MS
    }
  );
  return {
    statusCode: res.statusCode,
    body: JSON.parse(res.body.toString())
  };
}

/// /// /// /// /// /// /// /// /// /// /// /// /// /// /// /// ///
/// Iter 3 new wrapper functions                                 //
/// /// /// /// /// /// /// /// /// /// /// /// /// /// /// /// ///

function reqAdminQuizThumbnailUpdate(quizId: number, session: string, thumbnailUrl: string)
  : HTTPResponse<EmptyObject | ErrorReturn> {
  const res = request(
    'PUT',
    SERVER_URL + `/v1/admin/quiz/${quizId}/thumbnail`, {
      headers: {
        session: session,
      },
      json: {
        thumbnailUrl: thumbnailUrl
      },
      timeout: TIMEOUT_MS
    }
  );
  return {
    statusCode: res.statusCode,
    body: JSON.parse(res.body.toString())
  };
}

function reqAdminQuizGameView(session: string, quizId: number)
: HTTPResponse<GameListsStatus | ErrorReturn> {
  const res = request(
    'GET',
    SERVER_URL + `/v1/admin/quiz/${quizId}/games`, {
      headers: {
        session: session,
      },
      timeout: TIMEOUT_MS
    }
  );
  return {
    statusCode: res.statusCode,
    body: JSON.parse(res.body.toString())
  };
}

/**
 * Makes a http server request, returning the output of adminQuizGameStart
 *
 * @param {string} session
 * @param {string} quizId
 * @param {number} startNum
 * @returns {HTTPResponse<GameId | ErrorReturn>}
 */
function reqAdminQuizGameStart(session: string, quizId: number, startNum: number)
  : HTTPResponse<GameId | ErrorReturn> {
  const res = request(
    'POST',
    SERVER_URL + `/v1/admin/quiz/${quizId}/game/start`, {
      headers: {
        session: session,
      },
      json: {
        autoStartNum: startNum
      },
      timeout: TIMEOUT_MS
    }
  );
  return {
    statusCode: res.statusCode,
    body: JSON.parse(res.body.toString())
  };
}

/**
 * Makes a http server request, returning the output of adminQuizGameStateUpdate
 *
 * @param {number} quizId
 * @param {number} gameId
 * @param {number} session
 * @param {number} action
 * @returns {HTTPResponse<EmptyObject | ErrorReturn>}
 */
function reqAdminQuizGameStateUpdate(
  quizId: number,
  gameId: number,
  session: string,
  action: QuizGameAction
): HTTPResponse<EmptyObject | ErrorReturn> {
  const res = request(
    'PUT',
    SERVER_URL + `/v1/admin/quiz/${quizId}/game/${gameId}`, {
      headers: {
        session: session,
      },
      json: {
        action: action
      },
      timeout: TIMEOUT_MS
    }
  );
  return {
    statusCode: res.statusCode,
    body: JSON.parse(res.body.toString())
  };
}

function reqAdminQuizGameStatusGet(quizId: number, gameId: number, session: string)
  : HTTPResponse<QuizGameStatusReturn | ErrorReturn> {
  const res = request(
    'GET',
    SERVER_URL + `/v1/admin/quiz/${quizId}/game/${gameId}`, {
      headers: {
        session: session,
      },
      timeout: TIMEOUT_MS
    }
  );
  return {
    statusCode: res.statusCode,
    body: JSON.parse(res.body.toString())
  };
}

function reqAdminQuizGameGuestJoin(gameId: number, playerName: string)
  : HTTPResponse<PlayerId | ErrorReturn> {
  const res = request(
    'POST',
    SERVER_URL + '/v1/player/join', {
      json: {
        gameId: gameId,
        playerName: playerName
      },
      timeout: TIMEOUT_MS
    }
  );
  return {
    statusCode: res.statusCode,
    body: JSON.parse(res.body.toString())
  };
}

function reqAdminQuizGameGuestStatus(playerId: number)
  : HTTPResponse<GuestPlayerReturn | ErrorReturn> {
  const res = request(
    'GET',
    SERVER_URL + `/v1/player/${playerId}`, {
      timeout: TIMEOUT_MS
    }
  );
  return {
    statusCode: res.statusCode,
    body: JSON.parse(res.body.toString())
  };
}

function reqAdminQuestionInfoPlayer(playerId: number, questionPosition: number)
  : HTTPResponse<QuestionInfoPlayerReturn | ErrorReturn> {
  const res = request(
    'GET',
    SERVER_URL + `/v1/player/${playerId}/question/${questionPosition}`, {
      timeout: TIMEOUT_MS
    }
  );
  return {
    statusCode: res.statusCode,
    body: JSON.parse(res.body.toString())
  };
}

function reqAdminQuestionAnswerSubmission(
  answerId: number[],
  playerId: number,
  questionPosition: number
): HTTPResponse<EmptyObject | ErrorReturn> {
  const res = request(
    'PUT',
    SERVER_URL + `/v1/player/${playerId}/question/${questionPosition}/answer`, {
      json: {
        answerId: answerId
      },
      timeout: TIMEOUT_MS
    }
  );
  return {
    statusCode: res.statusCode,
    body: JSON.parse(res.body.toString())
  };
}

function reqAdminQuestionResult(playerId: number, questionPosition: number)
  : HTTPResponse<QuestionResult | ErrorReturn> {
  const res = request(
    'GET',
    SERVER_URL + `/v1/player/${playerId}/question/${questionPosition}/results`, {
      timeout: TIMEOUT_MS
    }
  );
  return {
    statusCode: res.statusCode,
    body: JSON.parse(res.body.toString())
  };
}

function reqAdminQuizGameResults(playerId: number)
  : HTTPResponse<GameResult | ErrorReturn> {
  const res = request(
    'GET',
    SERVER_URL + `/v1/player/${playerId}/results`, {
      timeout: TIMEOUT_MS
    }
  );
  return {
    statusCode: res.statusCode,
    body: JSON.parse(res.body.toString())
  };
}

function reqAdminQuizGameResultGet(session: string, quizId: number, gameId: number)
  : HTTPResponse<GameResult | ErrorReturn> {
  const res = request(
    'GET',
    SERVER_URL + `/v1/admin/quiz/${quizId}/game/${gameId}/results`, {
      headers: {
        session: session,
      },
      timeout: TIMEOUT_MS
    }
  );
  return {
    statusCode: res.statusCode,
    body: JSON.parse(res.body.toString())
  };
}

function reqLLMGetQuestion(quizId: number, session: string)
: HTTPResponse<{ question: string } | ErrorReturn> {
  const res = request(
    'GET',
    SERVER_URL + `/v1/admin/quiz/${quizId}/question/suggestion`, {
      headers: {
        session: session,
      },
      timeout: TIMEOUT_MS
    }
  );
  return {
    statusCode: res.statusCode,
    body: JSON.parse(res.body.toString())
  };
}

function reqLLMGetAnswerExplanation(quizId: number, questionId: number, session: string)
: HTTPResponse<{ explanation: string} | ErrorReturn> {
  const res = request(
    'GET',
    SERVER_URL + `/v1/admin/quiz/${quizId}/question/${questionId}/explanation`, {
      headers: {
        session: session,
      },
      timeout: TIMEOUT_MS
    }
  );
  return {
    statusCode: res.statusCode,
    body: JSON.parse(res.body.toString())
  };
}

function reqAdminQuizGameResultExport(session: string, quizId: number, gameId: number): {
  statusCode: number;
  headers: Record<string, string>;
  body: string | ErrorReturn;
} {
  const res = request(
    'GET',
    `${SERVER_URL}/v1/admin/quiz/${quizId}/game/${gameId}/export`,
    {
      headers: { session },
      timeout: TIMEOUT_MS,
    }
  );

  const simplifiedHeaders: Record<string, string> = {};

  for (const [headerName, headerValue] of Object.entries(res.headers)) {
    // Some headers may be arrays like: ['text/html', 'charset=utf-8']
    // Convert all header names to lowercase for consistency
    const lowerCaseHeader = headerName.toLowerCase();

    // If it's already a string, keep it. If it's an array, join it into a string.
    simplifiedHeaders[lowerCaseHeader] = Array.isArray(headerValue)
      ? headerValue.join(',')
      : String(headerValue);
  }

  return {
    statusCode: res.statusCode,
    headers: simplifiedHeaders,
    body: res.statusCode === 200 ? res.body.toString() : JSON.parse(res.body.toString()),
  };
}

export {
  reqAdminAuthRegister,
  registerAndGetSession,
  reqAdminAuthLogin,
  reqAdminUserDetails,
  reqAdminUserDetailsUpdate,
  reqAdminUserPasswordUpdate,
  reqAdminQuizList,
  reqAdminQuizCreate,
  reqAdminQuizRemove,
  reqAdminQuizInfo,
  reqAdminQuizNameUpdate,
  reqAdminQuizDescriptionUpdate,
  reqAdminAuthLogout,
  reqAdminQuizTransfer,
  reqAdminQuizQuestionUpdate,
  reqClear,
  reqAdminQuizQuestionCreate,
  reqAdminQuizQuestionDelete,
  reqAdminQuizQuestionMove,
  reqAdminQuizDeleteV2,
  reqAdminQuizInfoV2,
  reqAdminQuizTransferV2,
  reqAdminQuizQuestionCreateV2,
  reqAdminQuizQuestionUpdateV2,
  reqAdminQuizNameUpdateV2,
  reqAdminQuizQuestionDeleteV2,
  reqAdminQuizThumbnailUpdate,
  reqAdminQuizGameView,
  reqAdminQuizGameStart,
  reqAdminQuizGameStateUpdate,
  reqAdminQuizGameStatusGet,
  reqAdminQuizGameGuestJoin,
  reqAdminQuizGameGuestStatus,
  reqAdminQuestionInfoPlayer,
  reqAdminQuestionAnswerSubmission,
  reqAdminQuestionResult,
  reqLLMGetAnswerExplanation,
  reqAdminQuizGameResults,
  reqLLMGetQuestion,
  reqAdminQuizGameResultGet,
  reqAdminQuizGameResultExport
};
