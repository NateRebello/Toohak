import { expect, test } from '@jest/globals';
import {
  reqAdminAuthRegister,
  reqAdminUserPasswordUpdate,
  reqClear
} from '../helperFile/serverRequests';
import { v4 as uuidv4 } from 'uuid';

beforeEach(() => {
  reqClear();
});

describe('PUT /v1/admin/user/password (adminUserPasswordUpdate)', () => {
  let session: string;

  beforeEach(() => {
    const registerRes = reqAdminAuthRegister(
      'valid@mail.com',
      'Val!dPassword1',
      'validFirst',
      'validLast'
    );

    if ('session' in registerRes.body) {
      session = registerRes.body.session;
    }
  });

  describe('Success Cases', () => {
    test.each([
      {
        test: 'mainly letters',
        oldPassword: 'Val!dPassword1',
        newPassword: 'Val!dPassword2'
      },
      {
        test: 'mainly numbers',
        oldPassword: 'Val!dPassword1',
        newPassword: '12345678P'
      },
      {
        test: 'combination of numbers and letters',
        oldPassword: 'Val!dPassword1',
        newPassword: 'Val!dPwdNew12'
      }
    ])('Password successfully updated: $test', ({ oldPassword, newPassword }) => {
      const res = reqAdminUserPasswordUpdate(session, oldPassword, newPassword);
      expect(res.body).toStrictEqual({});
      expect(res.statusCode).toStrictEqual(200);
    });
  });

  describe('Error Cases', () => {
    test('Invalid UserId (non-integer): $test', () => {
      const sessionIdInvalid = uuidv4();
      const res = reqAdminUserPasswordUpdate(sessionIdInvalid, 'Val!dPassword1', 'Val!dPassword2');
      expect(res.body).toStrictEqual({ error: expect.any(String) });
      expect(res.statusCode).toStrictEqual(401);
    });

    test('Old Password is not the correct old password', () => {
      const res = reqAdminUserPasswordUpdate(session, 'INVal!dPassword1', 'Val!dPassword2');
      expect(res.body).toStrictEqual({ error: expect.any(String) });
      expect(res.statusCode).toStrictEqual(400);
    });

    test('New User: Old Password is not correct', () => {
      let session2: string;
      const resRegister2 = reqAdminAuthRegister(
        'valid2@mail.com',
        'Val!dPassword12',
        'validFirst',
        'validLast'
      );
      if ('session' in resRegister2.body) {
        session2 = resRegister2.body.session;
      }

      const res = reqAdminUserPasswordUpdate(session2, 'INVal!dPassword1', 'Val!dPassword2');
      expect(res.body).toStrictEqual({ error: expect.any(String) });
      expect(res.statusCode).toStrictEqual(400);
    });

    test('Old Password and New Password match exactly', () => {
      const res = reqAdminUserPasswordUpdate(session, 'Val!dPassword1', 'Val!dPassword1');
      expect(res.body).toStrictEqual({ error: expect.any(String) });
      expect(res.statusCode).toStrictEqual(400);
    });

    test('New Password has already been used before by this user', () => {
      // Successfully changes password to Val!dPassword2
      let currentPassword = 'Val!dPassword1';
      const res1 = reqAdminUserPasswordUpdate(session, currentPassword, 'Val!dPassword2');
      expect(res1.body).toStrictEqual({});
      expect(res1.statusCode).toStrictEqual(200);
      currentPassword = 'Val!dPassword2';

      // Successfully changes password to Val!dPassword3
      const res2 = reqAdminUserPasswordUpdate(session, currentPassword, 'Val!dPassword3');
      expect(res2.body).toStrictEqual({});
      expect(res2.statusCode).toStrictEqual(200);
      currentPassword = 'Val!dPassword3';

      // Should fail to change password back to Val!dPassword2
      const res3 = reqAdminUserPasswordUpdate(session, currentPassword, 'Val!dPassword2');
      expect(res3.body).toStrictEqual({ error: expect.any(String) });
      expect(res3.statusCode).toStrictEqual(400);

      // Should also fail to change password to Val!dPassword1
      const res4 = reqAdminUserPasswordUpdate(session, currentPassword, 'Val!dPassword1');
      expect(res4.body).toStrictEqual({ error: expect.any(String) });
      expect(res4.statusCode).toStrictEqual(400);
    });

    test.each([
      { test: 'at least one number', oldPassword: 'Val!dPassword1', newPassword: 'invalidPwd' },
      { test: 'at least one letter', oldPassword: 'Val!dPassword1', newPassword: '123456789' },
      { test: 'at least 8 characters', oldPassword: 'Val!dPassword1', newPassword: 'Val!dP1' }
    ])('New Password does not have: $test', ({ oldPassword, newPassword }) => {
      const res = reqAdminUserPasswordUpdate(session, oldPassword, newPassword);
      expect(res.body).toStrictEqual({ error: expect.any(String) });
      expect(res.statusCode).toStrictEqual(400);
    });
  });
});
