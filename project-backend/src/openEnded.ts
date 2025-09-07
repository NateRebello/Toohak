import request from 'sync-request-curl';
import { getData } from './dataStore';
import { ErrorReturn } from './interface';
import { GameState } from './enum';
import fs from 'fs';
import path from 'path';
import Papa from 'papaparse';

const HUGGINGFACE_API_TOKEN = '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';
// hard code in for now but better
// const HUGGINGFACE_API_TOKEN = process.env.HUGGINGFACE_API_TOKEN

/**
 * A function that provides a question from LLM
 *
 * @param {number} quizId
 * @param {string} session
 * @returns {{ question: string } | ErrorReturn }
 */
function generateLLMQuestion(quizId: number, session: string): { question: string } | ErrorReturn {
  const data = getData();
  const quiz = data.quizzes.find(q => q.quizId === quizId);
  const prompt = `Give a quiz question about '${quiz.name}' and '${quiz.description}'.` +
  'Only output a question that starts with a question word.';

  const res = request(
    'POST',
    'https://api-inference.huggingface.co/models/google/flan-t5-large', {
      headers: {
        Authorization: `Bearer ${HUGGINGFACE_API_TOKEN}`,
        'Content-Type': 'application/json'
      },
      json: { inputs: prompt }
    }
  );

  const body = JSON.parse(res.getBody('utf-8'));
  return body[0].generated_text;
}

/**
 * A function that use LLM to provide an answer explanation
 *
 * @param {number} quizId
 * @param {number} questionId
 * @returns {{ explanation: string } | ErrorReturn}
 */
function adminQuizAnswerExplanation(quizId: number, questionId: number)
: { explanation: string } | ErrorReturn {
  const data = getData();
  const quiz = data.quizzes.find(q => q.quizId === quizId);
  const game = data.games.find(g => g.quizId === quizId);

  const question = quiz.questions.find(q => q.questionId === questionId);
  if (!question) {
    throw new Error('Invalid questionId');
  }

  if (game.gameState !== GameState.ANSWER_SHOW) {
    throw new Error('Answer only show in ANSWER_SHOW state');
  }

  const correctAnswers = question.answerOptions
    .filter(opt => opt.correct)
    .map(opt => opt.answer)
    .join(', ');

  const prompt = 'The following is a quiz question and its correct answer.' +
  'Provide a detailed explanation of why the answer is correct.\n\n' +
  `Q: ${question.question}\n` +
  `Correct Answer: ${correctAnswers}\n\n` +
  'Only the explanation is needed to be provide:';

  const res = request(
    'POST',
    'https://api-inference.huggingface.co/models/mistralai/Mistral-Nemo-Instruct-2407', {
      headers: {
        authorization: `Bearer ${HUGGINGFACE_API_TOKEN}`,
        'Content-Type': 'application/json'
      },
      json: {
        inputs: prompt
      }
    }
  );

  const body = JSON.parse(res.getBody('utf-8'));

  const fullText = body[0].generated_text;
  const marker = 'Only the explanation is needed to be provide:';
  const explanation = fullText.split(marker)[1].trim();

  return explanation;
}

/**
 *
 * @param {string} session
 * @param {number} quizId
 * @param {number} gameId
 * @returns {string | ErrorReturn}
 */
function adminExportGameResultToCSV(session: string, quizId: number, gameId: number)
: string | ErrorReturn {
  const data = getData();
  const game = data.games.find(g => g.gameId === gameId && g.quizId === quizId);

  if (!game) {
    throw new Error('Game does not exist for this quiz');
  }

  if (game.gameState !== GameState.FINAL_RESULTS) {
    throw new Error('Game is not in FINAL_RESULTS state');
  }

  // get what is needed
  const info = game.players.map(p => ({
    'Player Name': p.playerName,
    Score: p.score
  }));

  // connvert array into csv
  const csv = Papa.unparse(info);
  // assure directory existence
  const exportDir = path.join(__dirname, 'exports');
  if (!fs.existsSync(exportDir)) {
    fs.mkdirSync(exportDir, { recursive: true });
  }

  // write files, just in case
  const fileName = path.join(exportDir, `quiz${quizId}_game${gameId}_results.csv`);
  fs.writeFileSync(fileName, csv);
  return csv;
}

export {
  generateLLMQuestion,
  adminQuizAnswerExplanation,
  adminExportGameResultToCSV
};
