import { expect, test } from '@jest/globals';
import {
  reqAdminAuthRegister,
  reqAdminQuizCreate,
  reqAdminQuizQuestionCreate,
  reqAdminQuizInfo,
  reqClear,
} from '../helperFile/serverRequests';

beforeEach(() => {
  reqClear();
});

describe('POST /v1/admin/quiz/{quizId}/question (adminQuizQuestionCreate)', () => {
  // Creating a second user who owns a quiz
  let session: string;
  let quizId: number;
  beforeEach(() => {
    const res = reqAdminAuthRegister(
      'valid@email.com',
      'validPass1',
      'validFirstName',
      'validLastName'
    );
    session = (res.body as { session: string }).session;

    const resQuiz = reqAdminQuizCreate(session, 'valid name', 'valid description');
    quizId = (resQuiz.body as { quizId: number }).quizId;
  });

  describe('Error cases', () => {
    test('Invalid session', () => {
      const sessionInvalid = session + '1';
      const res = reqAdminQuizQuestionCreate(sessionInvalid, quizId,
        'Is this question valid?', 4, 5,
        [
          {
            answer: 'Yes',
            correct: false
          },
          {
            answer: 'No',
            correct: true
          }
        ],
        'http://jpg'
      );
      expect(res.body).toStrictEqual({ error: expect.any(String) });
      expect(res.statusCode).toStrictEqual(401);
    });

    test('Invalid quizId', () => {
      const res = reqAdminQuizQuestionCreate(session, quizId + 1,
        'Is this question valid?', 4, 5,
        [
          {
            answer: 'Yes',
            correct: false
          },
          {
            answer: 'No',
            correct: true
          }
        ],
        'http://jpg'
      );
      expect(res.body).toStrictEqual({ error: expect.any(String) });
      expect(res.statusCode).toStrictEqual(403);
    });

    test('Quiz belongs to another user', () => {
      const res2 = reqAdminAuthRegister(
        'second@user.com',
        'validPass2',
        'validFirstName',
        'validLastName'
      );
      const session2 = (res2.body as { session: string }).session;

      const res = reqAdminQuizQuestionCreate(session2, quizId,
        'Is this question valid?', 4, 5,
        [
          {
            answer: 'Yes',
            correct: false
          },
          {
            answer: 'No',
            correct: true
          }
        ],
        'http://jpg'
      );
      expect(res.body).toStrictEqual({ error: expect.any(String) });
      expect(res.statusCode).toStrictEqual(403);
    });

    test.each([
      { test: 'Less than 5 characters', Question: 'Is?' },
      {
        test: 'More than 50 characters',
        Question: 'Is this question very very very very very very valid?'
      },
    ])('Invalid question length: $test', ({ Question }) => {
      const res = reqAdminQuizQuestionCreate(session, quizId, Question, 4, 5,
        [
          {
            answer: 'Yes',
            correct: false
          },
          {
            answer: 'No',
            correct: true
          }
        ],
        'http://jpg'
      );
      expect(res.body).toStrictEqual({ error: expect.any(String) });
      expect(res.statusCode).toStrictEqual(400);
    });

    test.each([
      {
        test: 'Less than 2 answers',
        Answers: [
          {
            answer: 'Yes',
            correct: false
          }
        ]
      },
      {
        test: 'More than 6 answers',
        Answers: [
          {
            answer: 'Yes',
            correct: false
          },
          {
            answer: 'No',
            correct: true
          },
          {
            answer: 'invalid',
            correct: false
          },
          {
            answer: 'wrong',
            correct: false
          },
          {
            answer: 'very invalid',
            correct: false
          },
          {
            answer: 'very wrong',
            correct: false
          },
          {
            answer: 'very very wrong',
            correct: false
          }
        ]
      },
    ])('Invalid amount of answers: $test', ({ Answers }) => {
      const res = reqAdminQuizQuestionCreate(session, quizId,
        'Is this question valid?', 4, 5, Answers, 'http://jpg');
      expect(res.body).toStrictEqual({ error: expect.any(String) });
      expect(res.statusCode).toStrictEqual(400);
    });

    test('Time limit is not positive', () => {
      const res = reqAdminQuizQuestionCreate(session, quizId,
        'Is this question valid?', -4, 5,
        [
          {
            answer: 'Yes',
            correct: false
          },
          {
            answer: 'No',
            correct: true
          }
        ],
        'http://jpg'
      );
      expect(res.body).toStrictEqual({ error: expect.any(String) });
      expect(res.statusCode).toStrictEqual(400);
    });

    test('Sum of questions which exceeds 3 minutes(same question)', () => {
      // Makes question which duration of 100 seconds
      const res1 = reqAdminQuizQuestionCreate(session, quizId, 'Is this question valid?', 100, 5,
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

      // Duration is now 180 seconds (3 mins)
      const res2 = reqAdminQuizQuestionCreate(session, quizId,
        'Is this other question valid?', 80, 5,
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

      // Since duration is over 3 minutes, this should return error
      const res3 = reqAdminQuizQuestionCreate(session, quizId,
        'What about this question?', 100, 5,
        [
          {
            answer: 'Yes',
            correct: false
          },
          {
            answer: 'No',
            correct: true
          }
        ],
        'http://jpg'
      );
      expect(res1.body).toStrictEqual({ questionId: expect.any(Number) });
      expect(res2.body).toStrictEqual({ questionId: expect.any(Number) });
      expect(res3.body).toStrictEqual({ error: expect.any(String) });
      expect(res3.statusCode).toStrictEqual(400);
    });

    test.each([
      { test: 'Less than 1 point', Points: 0 },
      { test: 'More than 10 points', Points: 11 },
    ])('Invalid amount of points given: $test', ({ Points }) => {
      const res = reqAdminQuizQuestionCreate(session, quizId,
        'Is this question valid?', 4, Points,
        [
          {
            answer: 'Yes',
            correct: false
          },
          {
            answer: 'No',
            correct: true
          }
        ],
        'http://jpg'
      );
      expect(res.body).toStrictEqual({ error: expect.any(String) });
      expect(res.statusCode).toStrictEqual(400);
    });

    test.each([
      {
        test: 'Less than 1 character',
        Answers: [
          {
            answer: '',
            correct: false
          },
          {
            answer: 'No',
            correct: true
          }
        ]
      },
      {
        test: 'More than 30 characters',
        Answers: [
          {
            answer: 'Yes                            ',
            correct: false
          },
          {
            answer: 'No',
            correct: true
          }
        ]
      },
    ])('Invalid answer length: $test', ({ Answers }) => {
      const res = reqAdminQuizQuestionCreate(session, quizId,
        'Is this question valid?', 4, 5, Answers, 'http://jpg');
      expect(res.body).toStrictEqual({ error: expect.any(String) });
      expect(res.statusCode).toStrictEqual(400);
    });

    test('Duplicate answers in same question', () => {
      const res = reqAdminQuizQuestionCreate(session, quizId,
        'Is this question valid?', 4, 5,
        [
          {
            answer: 'Yes',
            correct: false
          },
          {
            answer: 'Yes',
            correct: true
          }
        ],
        'http://jpg'
      );
      expect(res.body).toStrictEqual({ error: expect.any(String) });
      expect(res.statusCode).toStrictEqual(400);
    });

    test('No correct answers', () => {
      const res = reqAdminQuizQuestionCreate(session, quizId,
        'Is this question valid?', 4, 5,
        [
          {
            answer: 'Yes',
            correct: false
          },
          {
            answer: 'No',
            correct: false
          }
        ],
        'http://jpg'
      );
      expect(res.body).toStrictEqual({ error: expect.any(String) });
      expect(res.statusCode).toStrictEqual(400);
    });
  });

  describe('Success cases', () => {
    test('Successfully returns questionId of one question', () => {
      const res = reqAdminQuizQuestionCreate(session, quizId,
        'Is this question valid?', 4, 5,
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
      expect(res.body).toStrictEqual({ questionId: expect.any(Number) });
    });

    test('Questions is successfully created and shown in adminQuizInfo', () => {
      const res = reqAdminQuizQuestionCreate(session, quizId,
        'Is this question valid?', 4, 5,
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
      expect(res.body).toStrictEqual({ questionId: expect.any(Number) });
      expect(reqAdminQuizInfo(session, quizId).body.numQuestions).toEqual(1);
      expect(reqAdminQuizInfo(session, quizId).body.timeLimit).toEqual(4);
      expect(reqAdminQuizInfo(session, quizId).body.questions).toStrictEqual([
        {
          questionId: expect.any(Number),
          question: 'Is this question valid?',
          timeLimit: 4,
          thumbnailUrl: 'http://jpg',
          points: 5,
          answerOptions: [
            {
              answerId: expect.any(Number),
              answer: 'Yes',
              colour: expect.any(String),
              correct: true
            },
            {
              answerId: expect.any(Number),
              answer: 'No',
              colour: expect.any(String),
              correct: false
            }
          ]
        }
      ]);
    });

    test('Creating multiple questions', () => {
      const res1 = reqAdminQuizQuestionCreate(session, quizId,
        'Is this question valid?', 4, 5,
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

      const res2 = reqAdminQuizQuestionCreate(session, quizId,
        'What about this question?', 4, 5,
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

      expect(res1.body).toStrictEqual({ questionId: expect.any(Number) });
      expect(res2.body).toStrictEqual({ questionId: expect.any(Number) });

      expect(reqAdminQuizInfo(session, quizId).body.numQuestions).toEqual(2);
      expect(reqAdminQuizInfo(session, quizId).body.timeLimit).toEqual(8);
      expect(reqAdminQuizInfo(session, quizId).body.questions).toStrictEqual([
        {
          questionId: expect.any(Number),
          question: 'Is this question valid?',
          timeLimit: 4,
          thumbnailUrl: 'http://jpg',
          points: 5,
          answerOptions: [
            {
              answerId: expect.any(Number),
              answer: 'Yes',
              colour: expect.any(String),
              correct: true
            },
            {
              answerId: expect.any(Number),
              answer: 'No',
              colour: expect.any(String),
              correct: false
            }
          ]
        },
        {
          questionId: expect.any(Number),
          question: 'What about this question?',
          timeLimit: 4,
          thumbnailUrl: 'http://jpg',
          points: 5,
          answerOptions: [
            {
              answerId: expect.any(Number),
              answer: 'Yes',
              colour: expect.any(String),
              correct: true
            },
            {
              answerId: expect.any(Number),
              answer: 'No',
              colour: expect.any(String),
              correct: false
            }
          ]
        }
      ]);
    });
  });
});
