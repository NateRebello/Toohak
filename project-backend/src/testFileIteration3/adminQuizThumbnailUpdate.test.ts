import { expect, test } from '@jest/globals';
import {
  reqAdminAuthRegister,
  reqAdminQuizCreate,
  reqAdminQuizInfoV2,
  reqAdminQuizQuestionCreateV2,
  reqAdminQuizThumbnailUpdate,
  reqClear
} from '../helperFile/serverRequests';
import { v4 as uuidv4 } from 'uuid';

let session: string;
let quizId: number;
let session2: string;
beforeEach(() => {
  reqClear();

  // create user1
  const res = reqAdminAuthRegister(
    'valid@email.com',
    'validPass1',
    'validFirstName',
    'validLastName'
  );
  session = (res.body as { session: string }).session;

  // create a quiz
  const quizRes = reqAdminQuizCreate(session, 'valid name', 'valid description');
  quizId = (quizRes.body as { quizId: number }).quizId;

  // create a question in the quiz
  reqAdminQuizQuestionCreateV2(quizId, session,
    'Is this question update valid?', 4, 5,
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

  // create user2
  const res2 = reqAdminAuthRegister(
    'valid2@email.com',
    'validPass2',
    'validFirst',
    'validLast'
  );
  session2 = (res2.body as { session: string }).session;
});

describe('adminThumbnailUpdate', () => {
  describe('Error cases', () => {
    // 401 and 403 Error conditions
    test.each([
      {
        name: 'Invalid session',
        session: () => uuidv4(),
        quizId: () => quizId,
        errorCode: 401
      },
      {
        name: 'Empty session',
        session: () => '',
        quizId: () => quizId,
        errorCode: 401
      },
      {
        name: 'Invalid quizId',
        session: () => session,
        quizId: () => quizId + 1,
        errorCode: 403
      },
      {
        name: 'User does not own the quiz',
        session: () => session2,
        quizId: () => quizId,
        errorCode: 403
      }
    ])('$name', ({ session, quizId, errorCode }) => {
      const res = reqAdminQuizThumbnailUpdate(quizId(), session(), 'https://valid.com/image.jpg');
      expect(res.body).toStrictEqual({ error: expect.any(String) });
      expect(res.statusCode).toStrictEqual(errorCode);
    });

    // 400 Error conditions
    test.each([
      { thumbnailUrl: 'http://google.com/image.gif' },
      { thumbnailUrl: 'https://example.com/picture.webp' },
      { thumbnailUrl: 'http://test.com/photo.txt' },
      { thumbnailUrl: 'https://mysite.org/chart.pdf' },
      { thumbnailUrl: 'ftp://files.com/image.jpg' },
      { thumbnailUrl: 'file://localhost/pic.png' },
      { thumbnailUrl: 'www.google.com/photo.jpeg' },
      { thumbnailUrl: '/relative/path/image.jpg' },
    ])('Invalid Url format', ({ thumbnailUrl }) => {
      const res = reqAdminQuizThumbnailUpdate(quizId, session, thumbnailUrl);
      expect(res.body).toStrictEqual({ error: expect.any(String) });
      expect(res.statusCode).toStrictEqual(400);
    });
  });

  describe('Success cases', () => {
    test('Successfully updates thumbnailUrl and timeLast Edited', () => {
      const resInfo1 = reqAdminQuizInfoV2(session, quizId);
      expect(resInfo1.statusCode).toStrictEqual(200);
      const timeBefore = (resInfo1.body as { timeLastEdited: number }).timeLastEdited;

      const res = reqAdminQuizThumbnailUpdate(quizId, session, 'https://valid.com/image.jpg');
      expect(res.body).toStrictEqual({});
      expect(res.statusCode).toStrictEqual(200);

      const resInfo2 = reqAdminQuizInfoV2(session, quizId);
      const url = (resInfo2.body as { thumbnailUrl: string }).thumbnailUrl;
      expect(url).toStrictEqual('https://valid.com/image.jpg');
      expect(resInfo2.statusCode).toStrictEqual(200);
      const timeAfter = (resInfo2.body as { timeLastEdited: number }).timeLastEdited;
      expect(timeAfter).toBeGreaterThanOrEqual(timeBefore);
    });
  });
});
