import { expect, test } from '@jest/globals';
import {
  reqAdminAuthRegister,
  reqAdminUserDetails,
  reqAdminUserDetailsUpdate,
  reqClear,
} from '../helperFile/serverRequests';
import { v4 as uuidv4 } from 'uuid';

beforeEach(() => {
  reqClear();
});

describe('PUT /v1/admin/user/details (adminUserDetailsUpdate)', () => {
  let session: string;

  beforeEach(() => {
    const res = reqAdminAuthRegister(
      'valid@mail.com',
      'Val!dPassword1',
      'validFirst',
      'validLast'
    );

    if ('session' in res.body) {
      session = res.body.session;
    }
  });

  describe('Success Cases', () => {
    test('Update with Two Valid User', () => {
      let session2: string;
      const registerRes2 = reqAdminAuthRegister(
        'valid2@mail.com',
        'Val!dPassword12',
        'validFirst',
        'validLast'
      );

      if ('session' in registerRes2.body) {
        session2 = registerRes2.body.session;
      }
      // Update the first user with all new valid details
      const res = reqAdminUserDetailsUpdate(
        session,
        'valid@mail.com',
        'validFirstNew',
        'validLastNew'
      );
      expect(res.body).toStrictEqual({});
      expect(res.statusCode).toStrictEqual(200);
      // Check the first user details
      const resDetails1 = reqAdminUserDetails(session);
      expect(resDetails1.body).toStrictEqual({
        user: {
          userId: expect.any(Number),
          name: 'validFirstNew validLastNew',
          email: 'valid@mail.com',
          numSuccessfulLogins: expect.any(Number),
          numFailedPasswordsSinceLastLogin: expect.any(Number)
        }
      });

      // Update the second user
      const res2 = reqAdminUserDetailsUpdate(
        session2,
        'valid2@mail.com',
        'validFirstNewTwo',
        'validLastNewTwo'
      );
      expect(res2.body).toStrictEqual({});
      expect(res2.statusCode).toStrictEqual(200);
      // Check the second user details
      const resDetails2 = reqAdminUserDetails(session2);
      expect(resDetails2.body).toStrictEqual({
        user: {
          userId: expect.any(Number),
          name: 'validFirstNewTwo validLastNewTwo',
          email: 'valid2@mail.com',
          numSuccessfulLogins: expect.any(Number),
          numFailedPasswordsSinceLastLogin: expect.any(Number)
        }
      });
    });

    test('Update to Valid Email', () => {
      const res = reqAdminUserDetailsUpdate(
        session,
        'validNew@mail.com',
        'validFirst',
        'validLast'
      );
      expect(res.body).toStrictEqual({});
      expect(res.statusCode).toStrictEqual(200);
    });

    test.each([
      {
        test: 'Valid Special Char First Name',
        nameFirst: "Th-is valid'First",
        nameLast: 'validLast'
      },
      {
        test: 'Valid Special Char Last Name',
        nameFirst: 'validFirst',
        nameLast: "Th-is valid'Last"
      },
      {
        test: 'Basic Valid Names',
        nameFirst: 'This is First',
        nameLast: 'This is Last'
      }
    ])('Valid Name: $test', ({ nameFirst, nameLast }) => {
      const res = reqAdminUserDetailsUpdate(session, 'valid@mail.com', nameFirst, nameLast);
      expect(res.body).toStrictEqual({});
      expect(res.statusCode).toStrictEqual(200);
    });
  });

  describe('Error Cases', () => {
    test('Invalid SessionId', () => {
      const userSessionIdInvalid = uuidv4();
      const res = reqAdminUserDetailsUpdate(
        userSessionIdInvalid.toString(),
        'valid@mail.com',
        'validFirst',
        'validLast'
      );
      expect(res.body).toStrictEqual({ error: expect.any(String) });
      expect(res.statusCode).toStrictEqual(401);
    });

    test('Email taken by another user', () => {
      // Try to update user2 with the same email as user1
      let session2: string;
      const registerRes2 = reqAdminAuthRegister(
        'valid2@mail.com',
        'Val!dPassword1',
        'validFirst',
        'validLast'
      );

      if ('session' in registerRes2.body) {
        session2 = registerRes2.body.session;
      }

      const res3 = reqAdminUserDetailsUpdate(
        session2,
        'valid@mail.com',
        'validFirst',
        'validLast'
      );
      expect(res3.body).toStrictEqual({ error: expect.any(String) });
      expect(res3.statusCode).toStrictEqual(400);
    });

    test.each([
      { test: 'Empty email', email: '' },
      { test: 'Invalid domain', email: 'invalid@com' },
      { test: 'Only domain', email: 'invalidmail.com' },
      { test: 'Only username', email: 'invalidemail' }
    ])('Invalid Email: $test with input $email', ({ email }) => {
      const res = reqAdminUserDetailsUpdate(session, email, 'validFirst', 'validLast');
      expect(res.body).toStrictEqual({ error: expect.any(String) });
      expect(res.statusCode).toStrictEqual(400);
    });

    test.each([
      {
        test: 'NameFirst < 2 char',
        nameFirst: 'A',
        nameLast: 'validLast'
      },
      {
        test: 'NameLast < 2 char',
        nameFirst: 'validFirst',
        nameLast: 'Z'
      },
      {
        test: 'NameFirst > 20 char',
        nameFirst: 'A'.repeat(21),
        nameLast: 'validLast'
      },
      {
        test: 'NameLast > 20 char',
        nameFirst: 'validFirst',
        nameLast: 'Z'.repeat(21)
      },
      {
        test: 'NameFirst has invalid characters',
        nameFirst: 'invalidFirst!',
        nameLast: 'validLast'
      },
      {
        test: 'NameLast has invalid characters',
        nameFirst: 'validFirst',
        nameLast: 'invalidLast!'
      }
    ])('Invalid Name: $test with names $nameFirst and $nameLast', ({ nameFirst, nameLast }) => {
      const res = reqAdminUserDetailsUpdate(session, 'valid@mail.com', nameFirst, nameLast);
      expect(res.body).toStrictEqual({ error: expect.any(String) });
      expect(res.statusCode).toStrictEqual(400);
    });
  });
});
