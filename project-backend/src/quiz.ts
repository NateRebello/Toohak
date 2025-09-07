import { getData, saveDataToFile, setData } from './dataStore';
import { GameState } from './enum';
import {
  getQuiz,
  isValidQuizName,
  getUserIdFromSession,
  checkQuizCreateErrors,
  checkQuizQuestionCreateErrors,
  checkQuizQuestionUpdateErrors,
  findQuizIndex,
  findQuestionindex,
  quizNameInUse,
} from './helperFile/helperFunctionsIteration1';
import {
  Users,
  Quizzes,
  InfoQuestion,
  ErrorReturn,
  EmptyObject,
  QuestionId,
  InfoAnswer,
  AdminQuizInfoReturn,
} from './interface';

/**
 * Returns a quizzes object which is a list of all quizzes
 * that are owned by the currently logged in user
 *
 * @param {string} session - a string session token
 * @returns {AdminQuizListReturn} quizzes - when userId is being succesfully called,
 * return a list of all quizzes by the user
 */
function adminQuizList(session: string) {
  const data = getData();
  const user = data.users.find((users: Users) => users.userSession.includes(session)) as Users;

  const userId = user.userId;
  return {
    quizzes: data.quizzes
      .filter((quiz: Quizzes) => quiz.userId === userId)
      .map((quiz: Quizzes) => ({
        quizId: quiz.quizId,
        name: quiz.name
      })),
  };
}

/**
 * Given basic details about a new quiz, create one for the logged-in user.
 * @param {string} session - a string enter
 * @param {string} name
 * @param {string} description
 * @returns {QuizId} { quizId: number }
 */
function adminQuizCreate(session: string, name: string, description: string) {
  checkQuizCreateErrors(session, name, description);

  const userId = getUserIdFromSession(session) as number;
  const data = getData();
  // Generate new quizId (incrementing from last quizId)
  let newQuizId: number;
  const existingQuizzes = data.quizzes;

  if (existingQuizzes.length === 0) {
    newQuizId = 1;
  } else {
    // extracting all existing quizIds;
    const allQuizId = existingQuizzes.map((q: Quizzes) => q.quizId);
    // go through all to make sure to fetch the highest quizId;
    const maxId = Math.max(...allQuizId);
    newQuizId = maxId + 1;
  }

  const timestamp = Math.floor(Date.now() / 1000); // Current time in seconds

  // Create new quiz object
  const newQuiz: Quizzes = {
    userId,
    quizId: newQuizId,
    name,
    description,
    timeCreated: timestamp,
    timeLastEdited: timestamp,
    numQuestions: 0,
    questions: [],
    timeLimit: 0,
    thumbnailUrl: ''
  };

  // Update data and save
  data.quizzes.push(newQuiz);
  saveDataToFile(data);
  return { quizId: newQuizId };
}

/**
 * Permanently removes a quiz
 * @param {string} session
 * @param {number} quizId
 * @returns {{}}
 */
function adminQuizDelete(quizId: number, session: string) {
  const userId = getUserIdFromSession(session) as number;

  // Find quiz index
  const data = getData();
  const quizIndex = data.quizzes
    .findIndex((q: Quizzes) => q.quizId === quizId && q.userId === userId);

  // Remove quiz
  data.quizzes.splice(quizIndex, 1);

  saveDataToFile(data);
  return {};
}

/**
 * Received all relevant information about the quizId entered
 * @param {number} quizId - an integer enter
 * @returns {object} - when userId and quizId is succesfully input,
 * the corresponding quiz is then returned
 */
function adminQuizInfo(quizId: number) {
  const currQuiz = getQuiz(quizId) as Quizzes;
  return {
    quizId: quizId,
    name: currQuiz.name,
    timeCreated: currQuiz.timeCreated,
    timeLastEdited: currQuiz.timeLastEdited,
    description: currQuiz.description,
    numQuestions: currQuiz.numQuestions,
    questions: currQuiz.questions,
    timeLimit: currQuiz.timeLimit
  };
}

/**
 * The function update the name of the relevant quiz
 *
 * @param {number} quizId - an integer enter
 * @param {string} name - an string enter
 * @returns {} - when the name of the quiz is successfully updated, empty object is returned
 */
function adminQuizNameUpdate(session: string, quizId: number, name: string) {
  // Checking vaidity of name length
  if (name.length < 3) {
    throw new Error('Name is less than 3 characters long');
  } else if (name.length > 30) {
    throw new Error('Name is more than 30 characters long');
  }

  // Checking if name contains valid characters
  if (!isValidQuizName(name)) {
    throw new Error(
      'Name contains invalid characters.' +
      'Valid characters are alphanumeric and spaces.'
    );
  }

  // Checking if name is in use
  const userId = getUserIdFromSession(session);
  const data = getData();
  const quizzes = data.quizzes;
  const nameInUse = quizzes.find((quiz: Quizzes) => quiz.name === name && quiz.userId === userId);
  if (nameInUse) {
    throw new Error('Name is already used by the current logged in user for another quiz.');
  }

  const timestamp = Math.floor(Date.now() / 1000); // Current time in seconds
  const currQuiz = quizzes.find((quiz: Quizzes) => quiz.quizId === quizId) as Quizzes;
  currQuiz.timeLastEdited = timestamp;
  currQuiz.name = name;
  saveDataToFile(data);
  return {};
}

/**
 * Update the description of the relevant quiz.
 *
 * @param {string} session - a string enter
 * @param {number} quizId - an integer enter
 * @param {string} description - an string enter
 * @returns {} - when the description of the quiz is being successfully updated,
 * an empty object is returned
 */
function adminQuizDescriptionUpdate(session: string, quizId: number, description: string) {
  // if (typeof description !== 'string') {
  //   throw new Error('Description must be a string');
  // }

  const data = getData();
  const quiz = data.quizzes.find((q:Quizzes) => q.quizId === quizId) as Quizzes;

  if (description.length > 100) {
    throw new Error('Description is more than 100 characters in length.');
  }

  quiz.description = description;
  quiz.timeLastEdited = Math.floor(Date.now() / 1000);

  saveDataToFile(data);

  return {};
}

// Iteration 2 Functions
/**
 *
 * @param {number} quizId
 * @param {string} session
 * @param {string} userEmail
 * @returns {}
 */
function adminQuizTransfer(quizId: number, session: string, userEmail: string)
  : EmptyObject | ErrorReturn {
  const data = getData();
  const target = data.users.find(u => u.email === userEmail);
  if (!target) {
    throw new Error('Email does not belong to a valid user.');
  }

  const senderUserId = getUserIdFromSession(session);
  if (target.userId === senderUserId) {
    throw new Error('Email belongs to the current logged in user.');
  }

  if (quizNameInUse(userEmail, quizId)) {
    throw new Error('Target user already has a quiz with the same quiz name');
  }

  const quiz = data.quizzes.find(quiz => quiz.quizId === quizId) as Quizzes;
  quiz.userId = target.userId;
  const timestamp = Math.floor(Date.now() / 1000); // Current time in seconds
  quiz.timeLastEdited = timestamp;
  setData(data);
  saveDataToFile(data);
  return {};
}

/**
 *
 * @param {number} quizId
 * @param {string} session
 * @param {InfoQuestion} questionBody
 * @returns {number} questionId
 */
function adminQuizQuestionCreate(quizId: number, session: string, questionBody: InfoQuestion)
  : QuestionId | ErrorReturn {
  checkQuizQuestionCreateErrors(quizId, session, questionBody);

  const data = getData();
  const quizIndex = findQuizIndex(data, quizId);
  const quiz = data.quizzes[quizIndex];

  // Converting answers associated to question to randomly generated colours
  const colours = ['red', 'blue', 'green', 'yellow', 'purple', 'pink', 'orange'];
  const colourIndex = Math.floor(Math.random() * colours.length);
  const newAnswers: InfoAnswer[] = [];
  for (const option of questionBody.answerOptions) {
    const newAnswer = {
      answerId: questionBody.answerOptions.length + 1,
      answer: option.answer,
      colour: colours[colourIndex],
      correct: option.correct
    };
    newAnswers.push(newAnswer);
  }

  const newQuestionId = quiz.questions.length + 1;
  const newQuestionBody: InfoQuestion = {
    questionId: newQuestionId,
    question: questionBody.question,
    timeLimit: questionBody.timeLimit,
    thumbnailUrl: questionBody.thumbnailUrl,
    points: questionBody.points,
    answerOptions: newAnswers
  };
  quiz.numQuestions++;
  quiz.timeLastEdited = Math.floor(Date.now() / 1000);
  quiz.timeLimit += questionBody.timeLimit;
  quiz.questions.push(newQuestionBody);
  saveDataToFile(data);
  return { questionId: newQuestionId };
}

/**
 *
 * @param {number} quizId
 * @param {number} questionId
 * @param {string} session
 * @param {InfoQuestion} questionBody
 * @returns {}
 */
function adminQuizQuestionUpdate(
  quizId: number,
  questionId: number,
  session: string,
  questionBody: InfoQuestion
): EmptyObject | ErrorReturn {
  checkQuizQuestionUpdateErrors(quizId, questionId, questionBody);

  const data = getData();
  const quizIndex = findQuizIndex(data, quizId);
  const quiz = data.quizzes[quizIndex];

  const questionIndex = findQuestionindex(quiz, questionId);
  const question = quiz.questions[questionIndex];
  const newTimeLimit = quiz.timeLimit - question.timeLimit + questionBody.timeLimit;

  // Converting answers associated to question to randomly generated colours
  const colours = ['red', 'blue', 'green', 'yellow', 'purple', 'pink', 'orange'];
  const colourIndex = Math.floor(Math.random() * colours.length);

  const newAnswers: InfoAnswer[] = [];
  for (const option of questionBody.answerOptions) {
    const newAnswer = {
      answerId: questionBody.answerOptions.length + 1,
      answer: option.answer,
      colour: colours[colourIndex],
      correct: option.correct
    };
    newAnswers.push(newAnswer);
  }

  quiz.questions[questionIndex] = {
    questionId: questionId,
    question: questionBody.question,
    timeLimit: questionBody.timeLimit,
    thumbnailUrl: questionBody.thumbnailUrl,
    points: questionBody.points,
    answerOptions: newAnswers
  };
  quiz.timeLimit = newTimeLimit;
  quiz.timeLastEdited = Math.floor(Date.now() / 1000);
  saveDataToFile(data);
  return {};
}

/**
 *
 * @param {string} session
 * @param {number} quizId
 * @param {number} questionId
 * @returns {}
 */
function adminQuizQuestionDelete(
  quizId: number,
  questionId: number,
  session: string
): EmptyObject | ErrorReturn {
  const data = getData();
  const quiz = data.quizzes.find(quiz => quiz.quizId === quizId) as Quizzes;

  const questionIndex = quiz.questions.findIndex(q => q.questionId === questionId);
  if (questionIndex === -1) {
    throw new Error('Question ID does not refer to a valid question within this quiz.');
  }

  const [removedQuestion] = quiz.questions.splice(questionIndex, 1);

  quiz.numQuestions--;
  quiz.timeLimit -= removedQuestion.timeLimit;

  saveDataToFile(data);

  return {};
}

/**
 *
 * @param {number} quizId
 * @param {number} questionId
 * @param {string} session
 * @param {number} newPosition
 * @returns {}
 */
function adminQuizQuestionMove(
  quizId: number,
  questionId: number,
  session: string,
  newPosition: number
): EmptyObject | ErrorReturn {
  const data = getData();
  const quiz = data.quizzes.find(quiz => quiz.quizId === quizId) as Quizzes;

  const questionPos = quiz.questions.findIndex(q => q.questionId === questionId);
  if (questionPos === -1) {
    throw new Error('Question Id does not refer to a valid question in the quiz');
  }

  if (newPosition < 0 || newPosition >= quiz.questions.length || newPosition === questionPos) {
    throw new Error('newPosition is invalid');
  }

  // take the question that is needed out
  const [questionToMove] = quiz.questions.splice(questionPos, 1);
  // put the question into the new position
  quiz.questions.splice(newPosition, 0, questionToMove);
  // update the time last edited
  const oldTime = quiz.timeLastEdited;
  quiz.timeLastEdited = Math.floor(Date.now() / 1000);
  if (oldTime === quiz.timeLastEdited) {
    quiz.timeLastEdited++;
  }

  saveDataToFile(data);

  return {};
}

function adminQuizDeleteV2(quizId: number, session: string): EmptyObject | ErrorReturn {
  const data = getData();

  const hasUnfinishedGame = data.games.some(
    game => game.quizId === quizId && game.gameState !== GameState.END
  );

  if (hasUnfinishedGame) {
    throw new Error('Games are not in END state');
  }

  data.quizzes = data.quizzes.filter(q => q.quizId !== quizId);
  setData(data);
  saveDataToFile(data);

  return {};
}

function adminQuizInfoV2(quizId: number, session: string): AdminQuizInfoReturn | ErrorReturn {
  const currQuiz = getQuiz(quizId) as Quizzes;
  return {
    quizId: quizId,
    name: currQuiz.name,
    timeCreated: currQuiz.timeCreated,
    timeLastEdited: currQuiz.timeLastEdited,
    description: currQuiz.description,
    numQuestions: currQuiz.numQuestions,
    questions: currQuiz.questions,
    timeLimit: currQuiz.timeLimit,
    thumbnailUrl: currQuiz.thumbnailUrl
  };
}

function adminQuizTransferV2(quizId: number, session: string, userEmail: string)
  : EmptyObject | ErrorReturn {
  const data = getData();

  const hasActiveGames = data.games.some(game => game.quizId === quizId &&
    game.gameState !== GameState.END);
  if (hasActiveGames) {
    throw new Error('Games for this quiz are not in END state.');
  }

  const target = data.users.find(u => u.email === userEmail);
  if (!target) {
    throw new Error('Email does not belong to a valid user.');
  }

  const senderUserId = getUserIdFromSession(session);
  if (target.userId === senderUserId) {
    throw new Error('Email belongs to the current logged in user.');
  }

  if (quizNameInUse(userEmail, quizId)) {
    throw new Error('Target user already has a quiz with the same quiz name');
  }

  const quiz = data.quizzes.find(q => q.quizId === quizId) as Quizzes;
  quiz.userId = target.userId;
  const timestamp = Math.floor(Date.now() / 1000); // Current time in seconds
  quiz.timeLastEdited = timestamp;
  setData(data);
  saveDataToFile(data);
  return {};
}

function adminQuizQuestionCreateV2(quizId: number, session: string, questionBody: InfoQuestion)
  : QuestionId | ErrorReturn {
  checkQuizQuestionCreateErrors(quizId, session, questionBody);

  const data = getData();
  const quizIndex = findQuizIndex(data, quizId);
  const quiz = data.quizzes[quizIndex];

  const colours = ['red', 'blue', 'green', 'yellow', 'purple', 'pink', 'orange'];
  const colourIndex = Math.floor(Math.random() * colours.length);
  const chosenColour = colours[colourIndex];

  const newAnswers: InfoAnswer[] = questionBody.answerOptions.map((options, i) => ({
    answerId: i + 1,
    answer: options.answer,
    colour: chosenColour,
    correct: options.correct,
  }));

  const newQuestionId = quiz.questions.length + 1;
  const timestamp = Math.floor(Date.now() / 1000);

  const newQuestion: InfoQuestion = {
    questionId: newQuestionId,
    question: questionBody.question,
    timeLimit: questionBody.timeLimit,
    points: questionBody.points,
    thumbnailUrl: questionBody.thumbnailUrl,
    answerOptions: newAnswers,
  };

  quiz.questions.push(newQuestion);
  quiz.numQuestions++;
  quiz.timeLimit += questionBody.timeLimit;
  quiz.timeLastEdited = timestamp;

  setData(data);
  saveDataToFile(data);

  return { questionId: newQuestionId };
}

function adminQuizQuestionUpdateV2(
  quizId: number,
  questionId: number,
  session: string,
  questionBody: InfoQuestion
): EmptyObject | ErrorReturn {
  checkQuizQuestionUpdateErrors(quizId, questionId, questionBody);

  const data = getData();
  const quizIndex = findQuizIndex(data, quizId);
  const quiz = data.quizzes[quizIndex];

  const questionIndex = findQuestionindex(quiz, questionId);
  const question = quiz.questions[questionIndex];
  const newTimeLimit = quiz.timeLimit - question.timeLimit + questionBody.timeLimit;

  // Converting answers associated to question to randomly generated colours
  const colours = ['red', 'blue', 'green', 'yellow', 'purple', 'pink', 'orange'];
  const colourIndex = Math.floor(Math.random() * colours.length);

  const newAnswers: InfoAnswer[] = [];
  for (const option of questionBody.answerOptions) {
    const newAnswer = {
      answerId: questionBody.answerOptions.length + 1,
      answer: option.answer,
      colour: colours[colourIndex],
      correct: option.correct
    };
    newAnswers.push(newAnswer);
  }

  quiz.questions[questionIndex] = {
    questionId: questionId,
    question: questionBody.question,
    timeLimit: questionBody.timeLimit,
    thumbnailUrl: questionBody.thumbnailUrl,
    points: questionBody.points,
    answerOptions: newAnswers
  };
  quiz.timeLimit = newTimeLimit;
  quiz.timeLastEdited = Math.floor(Date.now() / 1000);
  saveDataToFile(data);
  return {};
}

function adminQuizQuestionDeleteV2(quizId: number, questionId: number, session: string)
  : EmptyObject | ErrorReturn {
  const data = getData();
  const quiz = data.quizzes.find(quiz => quiz.quizId === quizId) as Quizzes;

  const questionIndex = quiz.questions.findIndex(q => q.questionId === questionId);
  if (questionIndex === -1) {
    throw new Error('Question ID does not refer to a valid question within this quiz.');
  }
  const hasActiveGames = data.games.some(
    game => game.quizId === quizId && game.gameState !== GameState.END
  );
  if (hasActiveGames) {
    throw new Error('Games for this quiz are not in END state.');
  }

  const [removedQuestion] = quiz.questions.splice(questionIndex, 1);

  quiz.numQuestions--;
  quiz.timeLimit -= removedQuestion.timeLimit;

  saveDataToFile(data);

  return {};
}

export {
  adminQuizList,
  adminQuizCreate,
  adminQuizDelete,
  adminQuizInfo,
  adminQuizNameUpdate,
  adminQuizDescriptionUpdate,
  adminQuizTransfer,
  adminQuizQuestionCreate,
  adminQuizQuestionUpdate,
  adminQuizQuestionDelete,
  adminQuizQuestionMove,
  adminQuizDeleteV2,
  adminQuizInfoV2,
  adminQuizTransferV2,
  adminQuizQuestionCreateV2,
  adminQuizQuestionUpdateV2,
  adminQuizQuestionDeleteV2
};
