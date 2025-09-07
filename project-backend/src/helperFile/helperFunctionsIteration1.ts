import { getData, loadDataFile } from '../dataStore';
import isEmail from 'validator/lib/isEmail';
import {
  Answer,
  Quizzes,
  Users,
  ErrorReturn,
  InfoQuestion,
} from '../interface';
import { Data } from '../dataStore';

// ==============================================
// Iteration 1 functions
// ==============================================

/**
 * Handles errors for adminAuthRegister
 *
 * @param {string} email
 * @param {string} password
 * @param {string} nameFirst
 * @param {string} nameLast
 * @param {Users[]} existingUsers
 * @returns {ErrorReturn | null}
 */
function registerErrorChecking(
  email: string,
  password: string,
  nameFirst: string,
  nameLast: string,
  existingUsers: Users[]
) : ErrorReturn | null {
  const userExists = existingUsers.find(users => users.email === email);
  if (userExists) {
    return { error: 'Email already exists' };
  }

  // checking if email is an email
  const emailExists = isEmail(email);
  if (!emailExists) {
    return { error: 'Not an email' };
  }

  // checking if first name is valid
  if (!isValidName(nameFirst)) {
    return { error: 'Invalid first name' };
  }

  // checking if last name is valid
  if (!isValidName(nameLast)) {
    return { error: 'Invalid last name' };
  }

  // checking if the password fits the requirement
  const validPassword = /[A-Za-z]/.test(password) && /\d/.test(password);
  if (!validPassword || password.length < 8) {
    return { error: 'Invalid password' };
  }

  return null;
}

/**
 * Returns true if session exists and false otherwise
 *
 * @param {string} session
 * @returns {boolean}
 */
function sessionExists(session: string): boolean {
  const data = getData();
  for (const user of data.users) {
    if (user.userSession.includes(session)) {
      return true;
    }
  }

  return false;
}

/**
 * Returns target user object
 *
 * @param {number} userId
 * @returns {Users | undefined}
 */
function getUser(userId: number, data?: Data): Users | undefined {
  const users = data.users;
  return users.find((user) => user.userId === userId);
}

/**
 * Returns associated userId for a specific sessionId, or undefined if not found
 *
 * @param {string} session
 * @returns {number | undefined}
 */
function getUserIdFromSession(session: string): number | undefined {
  const data = loadDataFile();
  const users = data.users;
  const currUser = users.find((user) => user.userSession.includes(session)) as Users;
  return currUser.userId;
}

/**
 * Returns target quiz object
 *
 * @param {number} quizId
 * @returns { quiz } if the quiz can be found to exist else undefined
 */
function getQuiz(quizId: number): Quizzes | undefined {
  const data = getData();
  const quizzes = data.quizzes;
  return quizzes.find((quiz) => quiz.quizId === quizId);
}

/**
 * Checks if quiz exists and belongs to userId associated with
 * the given session
 *
 * @param {number} quizId
 * @param {string} session
 * @returns {boolean}
 */
function validQuiz(quizId: number, session: string): boolean {
  const userId = getUserIdFromSession(session);
  const currQuiz = getQuiz(quizId) as Quizzes;
  if (!currQuiz) {
    return false;
  }

  return currQuiz.userId === userId;
}

/**
 * Check if the name is valid
 * return true if valid, false if not
 *
 * @param {string} name - a string enter
 * @returns {boolean} - true if valid, false if not
 */
function isValidName(name: string): boolean {
  // check to see the name fits requirement:
  // contains all letters, within length of 2-20
  const validName = /^[A-Za-z-' ]{2,20}$/.test(name);
  if (!validName || name.length < 2 || name.length > 20) {
    return false;
  }
  return true;
}

/**
 * The helper function checks if the quiz name is valid
 * returns true if valid, else false
 *
 * @param {*} name
 * @returns {boolean} - true if valid, else false
 */
function isValidQuizName(name: string): boolean {
  // the name is alphanumeric and within the length restriction
  const validQuizName = /^[A-Za-z-0-9 -]{3,30}$/.test(name);
  if (!validQuizName || name.length < 3 || name.length > 30) {
    return false;
  }
  return true;
}

/**
 *
 * @param {string} session
 * @param {string} name
 * @param {string }description
 */
function checkQuizCreateErrors(session: string, name: string, description: string)
  : ErrorReturn | null {
  // Ensure user exists
  const userId = getUserIdFromSession(session) as number;

  if (!isValidQuizName(name)) {
    throw new Error('Invalid Quiz name');
  }

  if (description.length > 100) {
    throw new Error('Description is too long');
  }

  // check through all quiz to see if the quiz name cannot be used
  const data = getData();
  const quizNameTaken = data.quizzes.some(
    (q: Quizzes) => q.userId === userId && q.name === name
  );

  if (quizNameTaken) {
    throw new Error('Quiz name already taken');
  }

  return null;
}

/**
 * Checks if duplicate answer
 *
 * @param {InfoAnswer} answerOptions
 * @returns {boolean}
 */
function duplicateExists(answerOptions: Answer[]): boolean {
  for (const option of answerOptions) {
    const currIndex = answerOptions.indexOf(option);
    const currAnswer = option.answer;
    const duplicates = answerOptions.filter((option, index) => option.answer === currAnswer &&
    currIndex !== index);
    if (duplicates.length === 0) {
      return false;
    }
  }
  return true;
}

/**
 * Returns false if no answers are correct for a given question
 *
 * @param {Answer[]} answerOptions
 * @returns {boolean}
 */
function noCorrectAnswers(answerOptions: Answer[]): boolean {
  const correctOptions = answerOptions.filter((option) => {
    return option.correct === true;
  });
  if (correctOptions.length === 0) {
    return true;
  }
  return false;
}

/**
 * Checks if name of quiz corresponding to the quizId belongs to
 * another quiz the target user owns
 *
 * @param {string} email
 * @param {number} quizId
 * @returns {boolean}
 */
function quizNameInUse(email: string, quizId: number): boolean {
  const users = getData().users;
  const quizzes = getData().quizzes;

  // Making array of target Users quizzes
  const targetUser = users.find((user) => user.email === email) as Users;
  const targetUserQuizzes = quizzes.filter((quiz) => {
    return quiz.userId === targetUser.userId;
  });

  // If target user does not own any quiz
  if (targetUserQuizzes.length === 0) {
    return false;
  }

  const givenQuiz = getQuiz(quizId) as Quizzes;
  const quizWithSameName = targetUserQuizzes.find((quiz) => quiz.name === givenQuiz.name);
  if (!quizWithSameName) {
    return false;
  }
  return true;
}

/**
 *
 * @param {number} quizId
 * @param {string} session
 * @param {InfoQuestion} questionBody
 * @returns {}
 */
function checkQuizQuestionCreateErrors(quizId: number, session: string, questionBody: InfoQuestion)
: ErrorReturn | null {
  errorCheckQuestion(questionBody);

  const data = getData();
  const quizIndex = findQuizIndex(data, quizId);
  const quiz = data.quizzes[quizIndex];

  if (quiz.timeLimit + questionBody.timeLimit > 180) {
    throw new Error('The sum of the question timeLimits in the quiz exceeds 3 minutes.');
  }

  return null;
}
// ==============================================
// Iteration 2 functions
// ==============================================

// adminAuthLogout helper functions
/**
 *
 * @param {string} sessionId;
 * @return {Users} - if finds one succesfully
 */
function findUserBySession(sessionId: string): Users | null {
  const data = getData();
  const user = data.users.find(user => user.userSession.includes(sessionId));
  // if found return user else null
  return user;
}

/**
 *
 * @param {User} user
 * @param {string} sessionId
 */
function removeSession(user: Users, sessionId: string): void {
  user.userSession = user.userSession.filter(session => session !== sessionId);
}

/**
 * Handles errors for adminQuizQuestionCreate
 *
 * @param questionBody
 * @returns {ErrorReturn | null}
 */
function errorCheckQuestion(
  questionBody: InfoQuestion
): ErrorReturn | null {
  // check if conditions are valid to continue
  if (questionBody.question.length < 5) {
    throw new Error('Question is less than 5 characters in length.');
  } else if (questionBody.question.length > 50) {
    throw new Error('Question is greater than 50 characters in length.');
  }

  if (questionBody.answerOptions.length < 2) {
    throw new Error('Question has less than 2 answers.');
  } else if (questionBody.answerOptions.length > 6) {
    throw new Error('Question has more than 6 answers.');
  }

  if (questionBody.timeLimit < 0) {
    throw new Error('The question timeLimit is not a positive number');
  }

  if (questionBody.points < 1) {
    throw new Error('Less than 1 point awarded for this question.');
  } else if (questionBody.points > 10) {
    throw new Error('More than 10 points awarded for this question.');
  }

  for (const option of questionBody.answerOptions) {
    if (option.answer.length < 1) {
      throw new Error('Length of answer is less than 1 character.');
    } else if (option.answer.length > 30) {
      throw new Error('Length of answer is more than 30 characters.');
    }
  }

  if (duplicateExists(questionBody.answerOptions)) {
    throw new Error('A duplicate answer exists.');
  }

  if (noCorrectAnswers(questionBody.answerOptions)) {
    throw new Error('There are no correct answers.');
  }

  // Checking thumbnailUrl validity
  if (questionBody.thumbnailUrl === '') {
    throw new Error('No thumbnailUrl provided');
  } else if (!questionBody.thumbnailUrl.startsWith('https://') &&
  !questionBody.thumbnailUrl.startsWith('http://')) {
    throw new Error('Start of thumbnailUrl is invalid');
  } else if (!questionBody.thumbnailUrl.endsWith('jpg') &&
  !questionBody.thumbnailUrl.endsWith('jpeg') &&
  !questionBody.thumbnailUrl.endsWith('png')) {
    throw new Error('End of thumbnailUrl is invalid');
  }

  return null;
}

/**
 * This is a helper function checking all errors for adminQuizQuestionUpdate
 *
 * @param {number} quizId
 * @param {number} questionId
 * @param {string} session
 * @param {InfoQuestion} questionBody
 * @return null - if no errors
 */
function checkQuizQuestionUpdateErrors(
  quizId: number,
  questionId: number,
  questionBody: InfoQuestion
): ErrorReturn | null {
  const data = getData();

  errorCheckQuestion(questionBody);

  const quizIndex = findQuizIndex(data, quizId);
  const quiz = data.quizzes[quizIndex];

  const questionIndex = findQuestionindex(quiz, questionId);
  const question = quiz.questions[questionIndex] as InfoQuestion;
  if (questionIndex === -1) {
    throw new Error('The questionId does not refer to a valid question in this quiz.');
  }

  const newTimeLimit = quiz.timeLimit - question.timeLimit + questionBody.timeLimit;
  if (newTimeLimit > 180) {
    throw new Error('The sum of the question timeLimits in the quiz exceeds 3 minutes.');
  }

  return null;
}

/**
 * A helper function that finds quizIndex
 * @param {Data} data
 * @param {number} quizId
 * @returns {number}
 */
function findQuizIndex(data: Data, quizId: number): number {
  return data.quizzes.findIndex(quiz => quiz.quizId === quizId);
}

/**
 * A helper function that finds questionIndex
 * @param {Quizzes} quiz
 * @param {number} questionId
 * @returns {number}
 */
function findQuestionindex(quiz:Quizzes, questionId: number): number {
  return quiz.questions.findIndex(question => question.questionId === questionId);
}

export {
  registerErrorChecking,
  sessionExists,
  getUser,
  getQuiz,
  isValidName,
  isValidQuizName,
  checkQuizCreateErrors,
  validQuiz,
  duplicateExists,
  noCorrectAnswers,
  getUserIdFromSession,
  findUserBySession,
  removeSession,
  quizNameInUse,
  checkQuizQuestionCreateErrors,
  errorCheckQuestion,
  checkQuizQuestionUpdateErrors,
  findQuizIndex,
  findQuestionindex
};
