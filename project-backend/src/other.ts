import { Data, saveDataToFile, setData } from './dataStore';
/**
 * Reset the state of the application back to start
 * - no enter
 *
 * @returns {} - when the function is successfully called,
 * empty object is being returned
 */

function clear() {
  const data: Data = {
    users: [],
    quizzes: [],
    games: [],
    gameListStatus: null
  };
  setData(data);
  saveDataToFile(data);
  return {};
}

export { clear };
