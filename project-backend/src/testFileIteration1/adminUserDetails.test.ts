import { expect, test } from '@jest/globals';
import {
  reqAdminAuthRegister,
  reqAdminAuthLogin,
  reqAdminUserDetails,
  reqClear
} from '../helperFile/serverRequests';
import { v4 as uuidv4 } from 'uuid';

beforeEach(() => {
  reqClear();
});

describe('GET /v1/admin/user/details (adminUserDetails)', () => {
  describe('Only one email created', () => {
    let session: string;
    beforeEach(() => {
      const registerRes = reqAdminAuthRegister('johndoe@gmail.com', 'SecurePass1', 'John', 'Doe');
      if ('session' in registerRes.body) {
        session = registerRes.body.session;
      }
    });

    describe('Successive Cases', () => {
      test('return correct user', () => {
        const res = reqAdminUserDetails(session);
        expect(res.body).toStrictEqual({
          user: {
            userId: expect.any(Number),
            name: 'John Doe',
            email: 'johndoe@gmail.com',
            numSuccessfulLogins: 1,
            numFailedPasswordsSinceLastLogin: 0
          }
        });
        expect(res.statusCode).toStrictEqual(200);
      });

      test('return correct numSuccessfulLogins and numFailedPasswordsSinceLastLogin', () => {
        reqAdminAuthLogin('janedoe@gmail.com', 'SecurePass1');
        const res = reqAdminUserDetails(session);
        expect(res.body).toStrictEqual({
          user: {
            userId: expect.any(Number),
            name: 'John Doe',
            email: 'johndoe@gmail.com',
            numSuccessfulLogins: 1,
            numFailedPasswordsSinceLastLogin: 0
          }
        });
        expect(res.statusCode).toStrictEqual(200);
      });
    });

    describe('Error Cases', () => {
      test('user not found', () => {
        const session2 = uuidv4();
        const res = reqAdminUserDetails(session2);
        expect(res.body).toStrictEqual({ error: expect.any(String) });
        expect(res.statusCode).toStrictEqual(401);
      });
    });
  });

  describe('Multiple emails are created', () => {
    let session3: string;
    beforeEach(() => {
      const res1 = reqAdminAuthRegister('johndoe@gmail.com', 'SecurePass1', 'John', 'Doe');
      const res2 = reqAdminAuthRegister('joshdoe@gmail.com', 'SecurePass2', 'Josh', 'Doo');
      const res3 = reqAdminAuthRegister('jamedoe@gmail.com', 'SecurePass3', 'Jame', 'Done');
      if ('session' in res1.body && 'session' in res2.body && 'session' in res3.body) {
        session3 = res3.body.session;
      }
    });

    describe('Successive Cases', () => {
      test('return correct user', () => {
        const res = reqAdminUserDetails(session3);
        expect(res.body).toStrictEqual({
          user: {
            userId: expect.any(Number),
            name: 'Jame Done',
            email: 'jamedoe@gmail.com',
            numSuccessfulLogins: 1,
            numFailedPasswordsSinceLastLogin: 0
          }
        });
        expect(res.statusCode).toStrictEqual(200);
      });

      test('return correct numSuccessfulLogins and numFailedPasswordsSinceLastLogin', () => {
        reqAdminAuthLogin('jamedoe@gmail.com', 'SecurePass3');
        reqAdminAuthLogin('jamedoe@gmail.com', 'SecurePass4');
        const res = reqAdminUserDetails(session3);
        expect(res.body).toStrictEqual({
          user: {
            userId: expect.any(Number),
            name: 'Jame Done',
            email: 'jamedoe@gmail.com',
            numSuccessfulLogins: 2,
            numFailedPasswordsSinceLastLogin: 1
          }
        });
        expect(res.statusCode).toStrictEqual(200);
      });
    });

    describe('Error Cases', () => {
      test('userId not found', () => {
        const invalidSessionId = uuidv4();
        const res = reqAdminUserDetails(invalidSessionId);
        expect(res.body).toStrictEqual({ error: expect.any(String) });
        expect(res.statusCode).toStrictEqual(401);
      });
    });
  });
});
