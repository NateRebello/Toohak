// YOU MAY MODIFY THIS OBJECT BELOW
import { Users, Quizzes, Games, GameListsStatus } from './interface';
import fs from 'fs';

const dataFile = './data.json';

export interface Data {
  users: Users[],
  quizzes: Quizzes[],
  games: Games[],
  gameListStatus: GameListsStatus
}

let data: Data = {
  users: [],
  quizzes: [],
  games: [],
  gameListStatus: null
};

// Use getData() to access the data
function getData() {
  return data;
}

// setData() to get data if there is any
function setData(savedData: Data) {
  data = savedData;
}

// save data statically
function saveDataToFile(data: Data) {
  fs.writeFileSync(dataFile, JSON.stringify(data, null, 2));
}

// if there is data it will load
function loadDataFile() {
  if (!fs.existsSync(dataFile)) {
    fs.writeFileSync(dataFile, JSON.stringify(data, null, 2));
  }
  const loadedData = fs.readFileSync(dataFile, 'utf-8');
  const newData = JSON.parse(loadedData);
  data = {
    users: newData.users || [],
    quizzes: newData.quizzes || [],
    games: newData.games || [],
    gameListStatus: newData.gameListStatus || null
  };
  return data;
}

export {
  getData,
  setData,
  saveDataToFile,
  loadDataFile,
};
