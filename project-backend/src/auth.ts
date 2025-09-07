import { getData, loadDataFile, saveDataToFile, setData } from './dataStore';
import isEmail from 'validator/lib/isEmail';
import {
  findUserBySession,
  getUser,
  getUserIdFromSession,
  isValidName,
  registerErrorChecking,
  removeSession,
} from './helperFile/helperFunctionsIteration1';
import { Users, UserDetails, ErrorReturn, EmptyObject, SessionId } from './interface';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcrypt';

/**
 * Register a user with an email, password, and names,
 * return their userId value
 *
 * @param {string} email - a string enter
 * @param {string} password - a string enter
 * @param {string} nameFirst - a string enter
 * @param {string} nameLast - a string enter
 * @returns {{ session: string }} - when user sucessfully register, an string session will return
 */
function adminAuthRegister(email: string, password: string,
  nameFirst: string, nameLast: string): SessionId | ErrorReturn {
  const data = getData();

  const errorCheck = registerErrorChecking(email, password, nameFirst, nameLast, data.users);

  if (errorCheck !== null) {
    throw new Error(errorCheck.error);
  }

  const userId = data.users.length;
  const sessionId = uuidv4();
  const hashedPassword: string = bcrypt.hashSync(password, 10);
  const numSuccessfulLogins = 1;
  const numFailedPasswordsSinceLastLogin = 0;

  // push all data in
  const newUser: Users = {
    userId,
    nameFirst,
    nameLast,
    email,
    password: hashedPassword,
    numSuccessfulLogins,
    numFailedPasswordsSinceLastLogin,
    userSession: [sessionId],
    passwordHistory: []
  };

  data.users.push(newUser);
  setData(data);
  saveDataToFile(data);

  return { session: sessionId };
}

/**
 * Given a registered user's email and password
 * return userId value
 *
 * @param {string} email - a string enter
 * @param {string} password - a string eneter
 * @returns { session: string } - when user successfully login to the account,
 * an string session will return
 */
function adminAuthLogin(email: string, password: string): SessionId | ErrorReturn {
  const data = getData();

  const user = data.users.find(users => users.email === email);

  // check if user exists
  if (!user) {
    throw new Error('The email does not exist');
  }

  // check if password is correct
  if (!bcrypt.compareSync(password, user.password)) {
    user.numFailedPasswordsSinceLastLogin++;
    saveDataToFile(data);
    throw new Error('The password is incorrect');
  }

  user.numSuccessfulLogins++;
  user.numFailedPasswordsSinceLastLogin = 0;
  const sessionId = uuidv4();
  user.userSession.push(sessionId);
  saveDataToFile(data);
  return { session: sessionId };
}

/**
 * Given an admin user's userId,
 * return details about the user
 *
 * @param {string} session - an string enter
 * @returns {UserDetails}
 * user - when userId is enter it will return corresponding user information
 *
 */
function adminUserDetails(session: string): { user: UserDetails } | ErrorReturn {
  const data = getData();
  const user = data.users.find(users => users.userSession.includes(session));

  const name = user.nameFirst + ' ' + user.nameLast;
  return {
    user:
    {
      userId: user.userId,
      name: name,
      email: user.email,
      numSuccessfulLogins: user.numSuccessfulLogins,
      numFailedPasswordsSinceLastLogin: user.numFailedPasswordsSinceLastLogin,
    }
  };
}

/**
 * Given an admin user's userId and a set of properties,
 * update the properties of this logged in admin user.
 *
 * @param {string} session - a string enter
 * @param {string} email - a string enter
 * @param {string} nameFirst - a string enter
 * @param {string} nameLast - a string enter
 * @returns {} - when user successfuly updates their details, empty oject is return
 */
function adminUserDetailsUpdate(session: string, email: string, nameFirst: string, nameLast: string)
  : EmptyObject | ErrorReturn {
  const data = loadDataFile();

  // check if conditions are valid to continue
  const userId = getUserIdFromSession(session) as number;
  const user = getUser(userId, data);

  const emailUsed = data.users.some(users => users.email === email && users.userId !== userId);
  if (emailUsed) {
    throw new Error('Email is currently used by another user');
  }

  if (!isEmail(email)) {
    throw new Error('The email is not valid');
  }

  if (!isValidName(nameFirst)) {
    throw new Error('The first name is not valid');
  }

  if (!isValidName(nameLast)) {
    throw new Error('The last name is not valid');
  }

  user.email = email;
  user.nameFirst = nameFirst;
  user.nameLast = nameLast;
  // update the user's details and return an empty object
  setData(data);
  saveDataToFile(data);
  return {};
}

/**
 * Given details relating to a password change,
 * update the password of a logged in user.
 *
 * @param {string} session - a string enter
 * @param {string} oldPassword - a string enter
 * @param {string} newPassword - a string enter
 * @returns {} - when user successfully update their password, an empty object is return
 */
function adminUserPasswordUpdate(session: string, oldPassword: string, newPassword: string)
  : EmptyObject | ErrorReturn {
  const data = loadDataFile();

  // check if conditions are valid
  const userId = getUserIdFromSession(session) as number;
  const user = getUser(userId, data);

  if (!bcrypt.compareSync(oldPassword, user.password)) {
    throw new Error('Old Password is not the correct old password');
  }

  const hashedNewPassword = bcrypt.hashSync(newPassword, 10);

  if (oldPassword === newPassword) {
    throw new Error('Old Password and New Password match exactly');
  }

  if (newPassword.length < 8) {
    throw new Error('New Password is less than 8 characters');
  }

  if (!/[A-Za-z]/.test(newPassword) || !/\d/.test(newPassword)) {
    throw new Error('New Password must contain at least one letter and one number');
  }

  if (user.passwordHistory && user.passwordHistory.some(p => bcrypt.compareSync(newPassword, p))) {
    throw new Error('New Password has already been used before by this user');
  }

  user.passwordHistory.push(user.password);
  user.password = hashedNewPassword;

  // update the user's password details and return an empty object
  saveDataToFile(data);
  return {};
}

// iteration 2 function stubs
/**
 *
 * @param {string} session
 * @returns {} - when update succesfully
 */
function adminAuthLogout(sessionId: string): EmptyObject | ErrorReturn {
  const data = getData();
  const user = findUserBySession(sessionId);

  removeSession(user, sessionId);

  setData(data); // dynamically save data
  saveDataToFile(data); // save locally avoid random crash
  return {};
}

export {
  adminAuthRegister,
  adminAuthLogin,
  adminUserDetails,
  adminUserDetailsUpdate,
  adminUserPasswordUpdate,
  adminAuthLogout
};
