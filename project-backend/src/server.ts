import express, { json, Request, Response } from 'express';
import { echo } from './newecho';
import morgan from 'morgan';
import config from './config.json';
import cors from 'cors';
import YAML from 'yaml';
import sui from 'swagger-ui-express';
import process from 'process';
import fs from 'fs';
import path from 'path';
import { loadDataFile } from './dataStore';
import { clear } from './other';
import {
  adminQuizCreate,
  adminQuizDescriptionUpdate,
  adminQuizInfo, adminQuizList,
  adminQuizNameUpdate,
  adminQuizQuestionCreate,
  adminQuizQuestionDelete,
  adminQuizQuestionMove,
  adminQuizQuestionUpdate,
  adminQuizDelete,
  adminQuizTransfer,
  adminQuizDeleteV2,
  adminQuizInfoV2,
  adminQuizTransferV2,
  adminQuizQuestionCreateV2,
  adminQuizQuestionDeleteV2,
  adminQuizQuestionUpdateV2,
} from './quiz';
import {
  adminAuthRegister,
  adminAuthLogin,
  adminUserDetails,
  adminUserDetailsUpdate,
  adminUserPasswordUpdate,
  adminAuthLogout
} from './auth';
import {
  adminQuestionAnswerSubmission,
  adminQuestionInfoPlayer,
  adminQuestionResult,
  adminQuizGameGuestJoin,
  adminQuizGameGuestStatus,
  adminQuizGameResults,
  adminQuizGameResultGet,
  adminQuizGameStart,
  adminQuizGameStateUpdate,
  adminQuizGameStatusGet,
  adminQuizGameView,
  adminQuizThumbnailUpdate
} from './game';
import {
  sessionIsValid,
  quizIsValid
} from './helperFile/helperFunctionIteration3';
import dotenv from 'dotenv';
import {
  adminExportGameResultToCSV,
  adminQuizAnswerExplanation,
  generateLLMQuestion
} from './openEnded';
dotenv.config();

loadDataFile();

// Set up web app
const app = express();
// Use middleware that allows us to access the JSON body of requests
app.use(json());
// Use middleware that allows for access from other domains
app.use(cors());
// for logging errors (print to terminal)
app.use(morgan('dev'));
// for producing the docs that define the API
const file = fs.readFileSync(path.join(process.cwd(), 'swagger.yaml'), 'utf8');
// define root URL
app.get('/', (req: Request, res: Response) => res.redirect('/docs'));
app.use('/docs', sui.serve, sui.setup(YAML.parse(file),
  { swaggerOptions: { docExpansion: config.expandDocs ? 'full' : 'list' } }));

const PORT: number = parseInt(process.env.PORT || config.port);
const HOST: string = process.env.IP || '127.0.0.1';

// ====================================================================
//  ================= WORK IS DONE BELOW THIS LINE ===================
// ====================================================================

// Example get request
app.get('/echo', (req: Request, res: Response) => {
  const result = echo(req.query.echo as string);
  if ('error' in result) {
    res.status(400);
  }
  return res.json(result);
});

/// /// /// /// /// /// /// /// /// /// /// /// /// /// /// /// ///
/// Iteration 1 routes                                           //
/// /// /// /// /// /// /// /// /// /// /// /// /// /// /// /// ///

// V1 server route for adminAuthRegister
app.post('/v1/admin/auth/register', (req: Request, res: Response) => {
  const { email, password, nameFirst, nameLast } = req.body;

  try {
    const result = adminAuthRegister(email, password, nameFirst, nameLast);
    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});

// V1 server route for adminAuthLogin
app.post('/v1/admin/auth/login', (req: Request, res: Response) => {
  const { email, password } = req.body;

  try {
    const result = adminAuthLogin(email, password);
    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});

// V1 server route for adminUserDetails
app.get('/v1/admin/user/details', (req: Request, res: Response) => {
  const session = req.header('session') as string;

  try {
    sessionIsValid(session);
  } catch (error) {
    return res.status(401).json({ error: error.message });
  }

  const result = adminUserDetails(session);
  return res.status(200).json(result);
});

// V1 server route for adminUserDetailsUpdate
app.put('/v1/admin/user/details', (req: Request, res: Response) => {
  const session = req.header('session') as string;
  const { email, nameFirst, nameLast } = req.body;

  try {
    sessionIsValid(session);
  } catch (error) {
    return res.status(401).json({ error: error.message });
  }

  try {
    const result = adminUserDetailsUpdate(session, email, nameFirst, nameLast);
    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});

// V1 server route for adminUserPasswordUpdate
app.put('/v1/admin/user/password', (req: Request, res: Response) => {
  const session = req.header('session') as string;
  const { oldPassword, newPassword } = req.body;

  try {
    sessionIsValid(session);
  } catch (error) {
    return res.status(401).json({ error: error.message });
  }

  try {
    const result = adminUserPasswordUpdate(session, oldPassword, newPassword);
    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});

// V1 server route for adminQuizList
app.get('/v1/admin/quiz/list', (req: Request, res: Response) => {
  const session = req.header('session') as string;

  try {
    sessionIsValid(session);
  } catch (error) {
    return res.status(401).json({ error: error.message });
  }

  const result = adminQuizList(session);
  return res.status(200).json(result);
});

// V1 server route for adminQuizCreate
app.post('/v1/admin/quiz', (req: Request, res: Response) => {
  const session = req.header('session') as string;
  const { name, description } = req.body;

  try {
    sessionIsValid(session);
  } catch (error) {
    return res.status(401).json({ error: error.message });
  }

  try {
    const result = adminQuizCreate(session, name, description);
    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});

// Define adminQuizDelete router (V1)
// V1 server route for adminQuizRemove
app.delete('/v1/admin/quiz/:quizid', (req: Request, res: Response) => {
  const quizId = parseInt(req.params.quizid);
  const session = req.header('session') as string;

  try {
    sessionIsValid(session);
  } catch (error) {
    return res.status(401).json({ error: error.message });
  }

  try {
    quizIsValid(session, quizId);
  } catch (error) {
    return res.status(403).json({ error: error.message });
  }

  const result = adminQuizDelete(quizId, session);
  return res.status(200).json(result);
});

// Define adminQuizInfo router (V1)
app.get('/v1/admin/quiz/:quizid', (req: Request, res: Response) => {
  const quizId = parseInt(req.params.quizid);
  const session = req.header('session') as string;

  try {
    sessionIsValid(session);
  } catch (error) {
    return res.status(401).json({ error: error.message });
  }

  try {
    quizIsValid(session, quizId);
  } catch (error) {
    return res.status(403).json({ error: error.message });
  }

  const result = adminQuizInfo(quizId);
  return res.status(200).json(result);
});

// V1 server route for adminQuizNameUpdate
app.put('/v1/admin/quiz/:quizid/name', (req: Request, res: Response) => {
  const quizId = parseInt(req.params.quizid);
  const session = req.header('session') as string;
  const { name } = req.body;

  try {
    sessionIsValid(session);
  } catch (error) {
    return res.status(401).json({ error: error.message });
  }

  try {
    quizIsValid(session, quizId);
  } catch (error) {
    return res.status(403).json({ error: error.message });
  }

  try {
    const result = adminQuizNameUpdate(session, quizId, name);
    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});

// V1 server route for adminQuizDescriptionUpdate
app.put('/v1/admin/quiz/:quizid/description', (req: Request, res: Response) => {
  const quizId = parseInt(req.params.quizid);
  const session = req.header('session') as string;
  const { description } = req.body;

  try {
    sessionIsValid(session);
  } catch (error) {
    return res.status(401).json({ error: error.message });
  }

  try {
    quizIsValid(session, quizId);
  } catch (error) {
    return res.status(403).json({ error: error.message });
  }

  try {
    const result = adminQuizDescriptionUpdate(session, quizId, description);
    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});

// V1 server route for clear
app.delete('/v1/clear', (req: Request, res: Response) => {
  clear();
  res.status(200).json({});
});

/// /// /// /// /// /// /// /// /// /// /// /// /// /// /// /// ///
/// Iteration 2 Routes                                           //
/// /// /// /// /// /// /// /// /// /// /// /// /// /// /// /// ///
// Define adminAuthLogout router
app.post('/v1/admin/auth/logout', (req: Request, res: Response) => {
  const session = req.header('session') as string;

  try {
    sessionIsValid(session);
  } catch (error) {
    return res.status(401).json({ error: error.message });
  }

  const result = adminAuthLogout(session);
  return res.status(200).json(result);
});

// Define adminQuizTransfer router (V1)
app.post('/v1/admin/quiz/:quizid/transfer', (req: Request, res: Response) => {
  const quizId = parseInt(req.params.quizid);
  const session = req.header('session') as string;
  const { userEmail } = req.body;

  try {
    sessionIsValid(session);
  } catch (error) {
    return res.status(401).json({ error: error.message });
  }

  try {
    quizIsValid(session, quizId);
  } catch (error) {
    return res.status(403).json({ error: error.message });
  }

  try {
    const result = adminQuizTransfer(quizId, session, userEmail);
    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});

// Define adminQuizQuestionCreate router (V1)
app.post('/v1/admin/quiz/:quizid/question', (req: Request, res: Response) => {
  const quizId = parseInt(req.params.quizid);
  const session = req.header('session') as string;
  const { questionBody } = req.body;

  try {
    sessionIsValid(session);
  } catch (error) {
    return res.status(401).json({ error: error.message });
  }

  try {
    quizIsValid(session, quizId);
  } catch (error) {
    return res.status(403).json({ error: error.message });
  }

  try {
    const result = adminQuizQuestionCreate(quizId, session, questionBody);
    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});

// Define adminQuizQuestionDelete router
app.delete('/v1/admin/quiz/:quizid/question/:questionid', (req: Request, res: Response) => {
  const quizId = parseInt(req.params.quizid, 10);
  const questionId = parseInt(req.params.questionid, 10);
  const session = req.header('session') as string;

  try {
    sessionIsValid(session);
  } catch (error) {
    return res.status(401).json({ error: error.message });
  }

  try {
    quizIsValid(session, quizId);
  } catch (error) {
    return res.status(403).json({ error: error.message });
  }

  try {
    const result = adminQuizQuestionDelete(quizId, questionId, session);
    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});

// Define getLLMGeneratedQuestion router
// required to change into another model (do for open-ended)
app.get('/v1/admin/quiz/:quizid/question/suggestion', (req: Request, res: Response) => {
  const quizId = parseInt(req.params.quizid);
  const session = req.header('session') as string;

  try {
    sessionIsValid(session);
  } catch (error) {
    return res.status(401).json({ error: error.message });
  }

  try {
    quizIsValid(session, quizId);
  } catch (error) {
    return res.status(403).json({ error: error.message });
  }

  const generatedQuestion = generateLLMQuestion(quizId, session);
  return res.status(200).json({ question: generatedQuestion });
});

// Define adminQuizQuestionUpdate router (V1)
app.put('/v1/admin/quiz/:quizid/question/:questionid', (req: Request, res: Response) => {
  const quizId = parseInt(req.params.quizid);
  const questionId = parseInt(req.params.questionid);
  const session = req.header('session') as string;
  const { questionBody } = req.body;

  try {
    sessionIsValid(session);
  } catch (error) {
    return res.status(401).json({ error: error.message });
  }

  try {
    quizIsValid(session, quizId);
  } catch (error) {
    return res.status(403).json({ error: error.message });
  }

  try {
    const result = adminQuizQuestionUpdate(quizId, questionId, session, questionBody);
    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});

// Define adminQuizQuestionMove router
app.put('/v1/admin/quiz/:quizid/question/:questionid/move', (req: Request, res: Response) => {
  const quizId = parseInt(req.params.quizid);
  const questionId = parseInt(req.params.questionid);
  const session = req.header('session') as string;
  const { newPosition } = req.body;

  try {
    sessionIsValid(session);
  } catch (error) {
    return res.status(401).json({ error: error.message });
  }

  try {
    quizIsValid(session, quizId);
  } catch (error) {
    return res.status(403).json({ error: error.message });
  }

  try {
    const result = adminQuizQuestionMove(quizId, questionId, session, newPosition);
    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});

/// /// /// /// /// /// /// /// /// /// /// /// /// /// /// /// ///
/// Iteration 3 routes (v2 routes)                               //
/// /// /// /// /// /// /// /// /// /// /// /// /// /// /// /// ///

// V2 server route for adminQuizDeleteV2
app.delete('/v2/admin/quiz/:quizid', (req: Request, res: Response) => {
  const quizId = parseInt(req.params.quizid);
  const session = req.header('session') as string;

  try {
    sessionIsValid(session);
  } catch (error) {
    return res.status(401).json({ error: error.message });
  }

  try {
    quizIsValid(session, quizId);
  } catch (error) {
    return res.status(403).json({ error: error.message });
  }

  try {
    const result = adminQuizDeleteV2(quizId, session);
    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});

// V2 server route for adminQuizInfoV2
app.get('/v2/admin/quiz/:quizid', (req: Request, res: Response) => {
  const quizId = parseInt(req.params.quizid);
  const session = req.header('session') as string;

  try {
    sessionIsValid(session);
  } catch (error) {
    return res.status(401).json({ error: error.message });
  }

  try {
    quizIsValid(session, quizId);
  } catch (error) {
    return res.status(403).json({ error: error.message });
  }

  const result = adminQuizInfoV2(quizId, session);
  return res.status(200).json(result);
});

// V2 server for adminQuizTransferV2
app.post('/v2/admin/quiz/:quizid/transfer', (req: Request, res: Response) => {
  const quizId = parseInt(req.params.quizid);
  const session = req.header('session') as string;
  const { userEmail } = req.body;

  try {
    sessionIsValid(session);
  } catch (error) {
    return res.status(401).json({ error: error.message });
  }

  try {
    quizIsValid(session, quizId);
  } catch (error) {
    return res.status(403).json({ error: error.message });
  }

  try {
    const result = adminQuizTransferV2(quizId, session, userEmail);
    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});

// V2 server route for adminQuizQuestionCreateV2
app.post('/v2/admin/quiz/:quizid/question', (req: Request, res: Response) => {
  const quizId = parseInt(req.params.quizid);
  const session = req.header('session') as string;
  const { questionBody } = req.body;

  try {
    sessionIsValid(session);
  } catch (error) {
    return res.status(401).json({ error: error.message });
  }

  try {
    quizIsValid(session, quizId);
  } catch (error) {
    return res.status(403).json({ error: error.message });
  }

  try {
    const result = adminQuizQuestionCreateV2(quizId, session, questionBody);
    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});

// V2 server route for adminQuizQuestionDeleteV2
app.delete('/v2/admin/quiz/:quizid/question/:questionid', (req: Request, res: Response) => {
  const quizId = parseInt(req.params.quizid, 10);
  const questionId = parseInt(req.params.questionid, 10);
  const session = req.header('session') as string;

  try {
    sessionIsValid(session);
  } catch (error) {
    return res.status(401).json({ error: error.message });
  }

  try {
    quizIsValid(session, quizId);
  } catch (error) {
    return res.status(403).json({ error: error.message });
  }

  try {
    const result = adminQuizQuestionDeleteV2(quizId, questionId, session);
    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});

// V2 server route for adminQuizQuestionUpdateV2
app.put('/v2/admin/quiz/:quizid/question/:questionid', (req: Request, res: Response) => {
  const quizId = parseInt(req.params.quizid);
  const questionId = parseInt(req.params.questionid);
  const session = req.header('session') as string;
  const { questionBody } = req.body;

  try {
    sessionIsValid(session);
  } catch (error) {
    return res.status(401).json({ error: error.message });
  }

  try {
    quizIsValid(session, quizId);
  } catch (error) {
    return res.status(403).json({ error: error.message });
  }

  try {
    const result = adminQuizQuestionUpdateV2(quizId, questionId, session, questionBody);
    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});

/// /// /// /// /// /// /// /// /// /// /// /// /// /// /// /// ///
/// Iteration 3 routes (new function)                            //
/// /// /// /// /// /// /// /// /// /// /// /// /// /// /// /// ///

// server for adminQuizThumbnailUpdate
app.put('/v1/admin/quiz/:quizid/thumbnail', (req: Request, res: Response) => {
  const quizId = parseInt(req.params.quizid);
  const session = req.header('session') as string;
  const { thumbnailUrl } = req.body;

  try {
    sessionIsValid(session);
  } catch (error) {
    return res.status(401).json({ error: error.message });
  }

  try {
    quizIsValid(session, quizId);
  } catch (error) {
    return res.status(403).json({ error: error.message });
  }

  try {
    const result = adminQuizThumbnailUpdate(quizId, session, thumbnailUrl);
    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});

// server for adminQuizGameView
app.get('/v1/admin/quiz/:quizid/games', (req: Request, res: Response) => {
  const quizId = parseInt(req.params.quizid);
  const session = req.header('session') as string;

  try {
    sessionIsValid(session);
  } catch (error) {
    return res.status(401).json({ error: error.message });
  }

  try {
    quizIsValid(session, quizId);
  } catch (error) {
    return res.status(403).json({ error: error.message });
  }

  const result = adminQuizGameView(session, quizId);
  return res.status(200).json(result);
});

// server for adminQuizGameStart
app.post('/v1/admin/quiz/:quizid/game/start', (req: Request, res: Response) => {
  const quizId = parseInt(req.params.quizid);
  const session = req.header('session') as string;
  const { autoStartNum } = req.body;

  try {
    sessionIsValid(session);
  } catch (error) {
    return res.status(401).json({ error: error.message });
  }

  try {
    quizIsValid(session, quizId);
  } catch (error) {
    return res.status(403).json({ error: error.message });
  }

  try {
    const result = adminQuizGameStart(quizId, autoStartNum);
    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});

// server for adminQuizGameStateUpdate
app.put('/v1/admin/quiz/:quizid/game/:gameid', (req: Request, res: Response) => {
  const quizId = parseInt(req.params.quizid);
  const gameId = parseInt(req.params.gameid);
  const session = req.header('session') as string;
  const { action } = req.body;

  try {
    sessionIsValid(session);
  } catch (error) {
    return res.status(401).json({ error: error.message });
  }

  try {
    quizIsValid(session, quizId);
  } catch (error) {
    return res.status(403).json({ error: error.message });
  }

  try {
    const result = adminQuizGameStateUpdate(quizId, gameId, session, action);
    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});

// server for adminQuizGameStatusGet
app.get('/v1/admin/quiz/:quizid/game/:gameid', (req: Request, res: Response) => {
  const quizId = parseInt(req.params.quizid);
  const gameId = parseInt(req.params.gameid);
  const session = req.header('session') as string;

  try {
    sessionIsValid(session);
  } catch (error) {
    return res.status(401).json({ error: error.message });
  }

  try {
    quizIsValid(session, quizId);
  } catch (error) {
    return res.status(403).json({ error: error.message });
  }

  try {
    const result = adminQuizGameStatusGet(quizId, gameId);
    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});

// server for adminQuizGameResults
app.get('/v1/admin/quiz/:quizid/game/:gameid/results', (req: Request, res: Response) => {
  const quizId = parseInt(req.params.quizid);
  const gameId = parseInt(req.params.gameid);
  const session = req.header('session') as string;

  try {
    sessionIsValid(session);
  } catch (error) {
    return res.status(401).json({ error: error.message });
  }

  try {
    quizIsValid(session, quizId);
  } catch (error) {
    return res.status(403).json({ error: error.message });
  }

  try {
    const result = adminQuizGameResultGet(quizId, gameId);
    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});

// server for adminQuizGameGuestJoin
app.post('/v1/player/join', (req: Request, res: Response) => {
  const { gameId, playerName } = req.body;

  try {
    const result = adminQuizGameGuestJoin(gameId, playerName);
    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});

// server for adminQuizGameGuestStatus
app.get('/v1/player/:playerid', (req: Request, res: Response) => {
  const playerId = parseInt(req.params.playerid);

  try {
    const result = adminQuizGameGuestStatus(playerId);
    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});

// server for adminQuestionInfoPlayer
app.get('/v1/player/:playerid/question/:questionposition', (req: Request, res: Response) => {
  const playerId = parseInt(req.params.playerid);
  const questionPosition = parseInt(req.params.questionposition);

  try {
    const result = adminQuestionInfoPlayer(playerId, questionPosition);
    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});

// server for adminQuestionAnswerSubmission
app.put('/v1/player/:playerid/question/:questionposition/answer', (req: Request, res: Response) => {
  const { answerId } = req.body;
  const playerId = parseInt(req.params.playerid);
  const questionPosition = parseInt(req.params.questionposition);

  try {
    const result = adminQuestionAnswerSubmission(answerId, playerId, questionPosition);
    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});

// server for adminQuestionResult
app.get('/v1/player/:playerid/question/:questionposition/results',
  (req: Request, res: Response) => {
    const playerId = parseInt(req.params.playerid);
    const questionPosition = parseInt(req.params.questionposition);

    try {
      const result = adminQuestionResult(playerId, questionPosition);
      return res.status(200).json(result);
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  });

// server for adminQuizGameResultsPlayer
app.get('/v1/player/:playerid/results', (req: Request, res: Response) => {
  const playerId = parseInt(req.params.playerid);

  try {
    const result = adminQuizGameResults(playerId);
    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});

// Open-ended server
// part A
app.get('/v1/admin/quiz/:quizid/question/:questionid/explanation',
  (req: Request, res: Response) => {
    const quizId = parseInt(req.params.quizid);
    const questionId = parseInt(req.params.questionid);
    const session = req.header('session') as string;

    try {
      sessionIsValid(session);
    } catch (error) {
      return res.status(401).json({ error: error.message });
    }

    try {
      quizIsValid(session, quizId);
    } catch (error) {
      return res.status(403).json({ error: error.message });
    }

    try {
      const explanation = adminQuizAnswerExplanation(quizId, questionId);
      return res.status(200).json({ explanation: explanation });
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  });

// part b
app.get('/v1/admin/quiz/:quizid/game/:gameid/export', (req: Request, res: Response) => {
  const quizId = parseInt(req.params.quizid);
  const gameId = parseInt(req.params.gameid);
  const session = req.header('session') as string;

  try {
    sessionIsValid(session);
  } catch (error) {
    return res.status(401).json({ error: error.message });
  }

  try {
    quizIsValid(session, quizId);
  } catch (error) {
    return res.status(403).json({ error: error.message });
  }

  try {
    const csv = adminExportGameResultToCSV(session, quizId, gameId);
    res.setHeader('Content-Type', 'text/csv');
    return res.status(200).send(csv);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});

// ====================================================================
//  ================= WORK IS DONE ABOVE THIS LINE ===================
// ====================================================================

app.use((req: Request, res: Response) => {
  const error = `
    Route not found - This could be because:
      0. You have defined routes below (not above) this middleware in server.ts
      1. You have not implemented the route ${req.method} ${req.path}
      2. There is a typo in either your test or server, e.g. /posts/list in one
         and, incorrectly, /post/list in the other
      3. You are using ts-node (instead of ts-node-dev) to start your server and
         have forgotten to manually restart to load the new changes
      4. You've forgotten a leading slash (/), e.g. you have posts/list instead
         of /posts/list in your server.ts or test file
  `;
  res.status(404).json({ error });
});

// start server
const server = app.listen(PORT, HOST, () => {
  // DO NOT CHANGE THIS LINE
  console.log(`⚡️ Server started on port ${PORT} at ${HOST}`);
});

// For coverage, handle Ctrl+C gracefully
process.on('SIGINT', () => {
  server.close(() => {
    console.log('Shutting down server gracefully.');
    process.exit();
  });
});
