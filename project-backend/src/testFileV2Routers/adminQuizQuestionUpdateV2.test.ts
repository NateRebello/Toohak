import {
  reqAdminAuthRegister,
  reqAdminQuizCreate,
  reqAdminQuizInfoV2,
  reqAdminQuizQuestionCreateV2,
  reqAdminQuizQuestionUpdateV2,
  reqClear
} from '../helperFile/serverRequests';
import { InfoQuestion } from '../interface';

beforeEach(() => {
  reqClear();
});

describe('PUT v2/admin/quiz/{quizid}/question/{questionid} (adminQuizQuestionUpdate)', () => {
  // Creating a user with a quiz and a question
  let session: string;
  let quizId: number;
  let questionId: number;
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

    const resQuestionCreate = reqAdminQuizQuestionCreateV2(quizId, session,
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
    if ('questionId' in resQuestionCreate.body) {
      questionId = resQuestionCreate.body.questionId;
    }
  });

  describe('Error cases', () => {
    test('Invalid session', () => {
      const sessionInvalid = session + '1';
      const res = reqAdminQuizQuestionUpdateV2(sessionInvalid, quizId,
        questionId, 'Is this question update valid?', 4, 5,
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
      const quizIdInvalid = quizId + 1;
      const res = reqAdminQuizQuestionUpdateV2(session, quizIdInvalid,
        questionId, 'Is this question update valid?', 4, 5,
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
      // The user2 in session2 cannot update the question from
      // user1 as the quiz does not belong to user2
      const res = reqAdminQuizQuestionUpdateV2(session2, quizId,
        questionId, 'Is this question update valid?', 4, 5,
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

    test('Invalid questionId', () => {
      const questionIdInvalid = questionId + 1;
      const res = reqAdminQuizQuestionUpdateV2(session, quizId,
        questionIdInvalid, 'Is this question update valid?', 4, 5,
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
      { test: 'Less than 5 characters', Question: 'Is?' },
      {
        test: 'More than 50 characters',
        Question: 'Is this question update very very very very very valid?'
      },
    ])('Invalid question length: $test', ({ Question }) => {
      const res = reqAdminQuizQuestionUpdateV2(
        session,
        quizId,
        questionId,
        Question,
        4,
        5,
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
      const res = reqAdminQuizQuestionUpdateV2(session, quizId, questionId,
        'Is this question update valid?', 4, 5, Answers, 'http://jpg');
      expect(res.body).toStrictEqual({ error: expect.any(String) });
      expect(res.statusCode).toStrictEqual(400);
    });

    test('Time limit is not positive', () => {
      const res = reqAdminQuizQuestionUpdateV2(session, quizId, questionId,
        'Is this question update valid?', -4, 5,
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
      // Makes question so quiz total duration is 179 seconds (less than 3 mins)
      const res1 = reqAdminQuizQuestionCreateV2(quizId, session,
        'Is this question valid?', 175, 5,
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

      // The update makes the duration over 3 minutes so this should return error
      const res2 = reqAdminQuizQuestionUpdateV2(session, quizId, questionId,
        'What about this question?', 177, 5,
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
      expect(res2.body).toStrictEqual({ error: expect.any(String) });
      expect(res2.statusCode).toStrictEqual(400);
    });

    test.each([
      { test: 'Less than 1 point', Points: 0 },
      { test: 'More than 10 points', Points: 11 },
    ])('Invalid amount of points given: $test', ({ Points }) => {
      const res = reqAdminQuizQuestionUpdateV2(session, quizId, questionId,
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
      const res = reqAdminQuizQuestionUpdateV2(session, quizId, questionId,
        'Is this update question valid?', 4, 5, Answers, 'http://jpg');
      expect(res.body).toStrictEqual({ error: expect.any(String) });
      expect(res.statusCode).toStrictEqual(400);
    });

    test('Duplicate answers in same question', () => {
      const res = reqAdminQuizQuestionUpdateV2(session, quizId, questionId,
        'Is this update question valid?', 4, 5,
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
      const res = reqAdminQuizQuestionUpdateV2(session, quizId, questionId,
        'Is this question update valid?', 4, 5,
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

    test.each([
      {
        test: 'empty thumbnailUrl',
        ThumbnailUrl: ''
      },
      {
        test: 'Does not end with jpg, jpeg or png',
        ThumbnailUrl: 'http://invalid'
      },
      {
        test: 'Does not start with http:// or https://',
        ThumbnailUrl: 'invalidjpg'
      },
    ])('Invalid thumbnailUrl: $test', ({ ThumbnailUrl }) => {
      const res = reqAdminQuizQuestionUpdateV2(session, quizId, questionId,
        'Is this question valid?', 4, 5, [
          {
            answer: 'Yes',
            correct: true
          },
          {
            answer: 'No',
            correct: false
          }
        ],
        ThumbnailUrl
      );
      expect(res.body).toStrictEqual({ error: expect.any(String) });
      expect(res.statusCode).toStrictEqual(400);
    });
  });

  describe('Success cases', () => {
    test('Successfully updates one question', () => {
      const res = reqAdminQuizQuestionUpdateV2(session, quizId, questionId,
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
      expect(res.body).toStrictEqual({});
      expect(res.statusCode).toStrictEqual(200);
    });

    test('Questions is successfully updated and shown in adminQuizInfo', () => {
      const res = reqAdminQuizQuestionUpdateV2(session, quizId, questionId,
        'Is this question update valid?', 4, 5,
        [
          {
            answer: 'Yes it is',
            correct: true
          },
          {
            answer: 'No it is not',
            correct: false
          }
        ],
        'http://jpg'
      );
      expect(res.body).toStrictEqual({});
      expect(res.statusCode).toStrictEqual(200);
      const resInfo1 = reqAdminQuizInfoV2(session, quizId);
      const numQuestions = (resInfo1.body as { numQuestions: number }).numQuestions;
      const timeLimt = (resInfo1.body as { timeLimit: number }).timeLimit;
      const questions = (resInfo1.body as { questions: InfoQuestion[] }).questions;
      expect(numQuestions).toEqual(1);
      expect(timeLimt).toEqual(4);
      expect(questions).toStrictEqual([
        {
          answerOptions: [
            {
              answerId: expect.any(Number),
              answer: 'Yes it is',
              colour: expect.any(String),
              correct: true
            },
            {
              answerId: expect.any(Number),
              answer: 'No it is not',
              colour: expect.any(String),
              correct: false
            }
          ],
          points: 5,
          question: 'Is this question update valid?',
          questionId: expect.any(Number),
          timeLimit: 4,
          thumbnailUrl: 'http://jpg'
        }
      ]);
    });
  });
});
