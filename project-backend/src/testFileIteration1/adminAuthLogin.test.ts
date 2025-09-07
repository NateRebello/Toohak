import { expect, test } from '@jest/globals';
import {
  reqAdminAuthRegister,
  reqAdminAuthLogin,
  reqClear
} from '../helperFile/serverRequests';

beforeEach(() => {
  reqClear();
});

describe('POST v1/admin/auth/login (adminAuthLogin)', () => {
  describe('Only one email created', () => {
    beforeEach(() => {
      const registerRes = reqAdminAuthRegister('johndoe@gmail.com', 'SecurePass1', 'John', 'Doe');
      if (!('session' in registerRes.body)) {
        throw new Error('User registration failed');
      }
    });

    describe('Error Cases', () => {
      test.each([
        { email: 'janedoe@gmail.com', password: 'SecurePass1' },
        { email: 'johndoe@gmail.com', password: 'Wrong' }
      ])('return error messages', ({ email, password }) => {
        const res = reqAdminAuthLogin(email, password);
        expect(res.body).toStrictEqual({ error: expect.any(String) });
        expect(res.statusCode).toStrictEqual(400);
      });
    });

    describe('Successive Cases', () => {
      test('return correct session', () => {
        const res = reqAdminAuthLogin('johndoe@gmail.com', 'SecurePass1');
        if ('session' in res.body) {
          expect(res.body).toStrictEqual({ session: res.body.session });
          expect(res.statusCode).toStrictEqual(200);
        }
      });
    });
  });

  describe('Multiple emails created', () => {
    beforeEach(() => {
      const result1 = reqAdminAuthRegister('johndoe@gmail.com', 'SecurePass1', 'John', 'Doe');
      const result2 = reqAdminAuthRegister('joshdoe@gmail.com', 'SecurePass2', 'Josh', 'Doo');
      const result3 = reqAdminAuthRegister('jamedoe@gmail.com', 'SecurePass3', 'Jame', 'Done');

      if (!('session' in result1.body && 'session' in result2.body && 'session' in result3.body)) {
        throw new Error('User Registration Failed');
      }
    });

    describe('Error Cases', () => {
      test.each([
        { email: 'janedoe@gmail.com', password: 'SecurePass1' },
        { email: 'johndoe@gmail.com', password: 'Wrong' }
      ])('return error messages', ({ email, password }) => {
        const res = reqAdminAuthLogin(email, password);
        expect(res.body).toStrictEqual({ error: expect.any(String) });
        expect(res.statusCode).toStrictEqual(400);
      });
    });

    describe('Successive Cases', () => {
      test('return correct session', () => {
        const res = reqAdminAuthLogin('jamedoe@gmail.com', 'SecurePass3');
        if ('session' in res.body) {
          expect(res.body).toStrictEqual({ session: res.body.session });
          expect(res.statusCode).toStrictEqual(200);
        }
      });
    });
  });
});
