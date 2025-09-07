import { expect, test } from '@jest/globals';
import {
  reqAdminAuthRegister,
  reqClear
} from '../helperFile/serverRequests';

beforeEach(() => {
  reqClear();
});

describe('POST /v1/admin/auth/register (adminAuthRegister)', () => {
  describe('Successive Cases', () => {
    test('Successfully register an account', () => {
      const registerRes = reqAdminAuthRegister(
        'johndoe@gmail.com',
        'SecurePass1',
        'Johnny',
        'Doey'
      );
      if ('session' in registerRes.body) {
        expect(registerRes.body).toStrictEqual({ session: registerRes.body.session });
        expect(registerRes.statusCode).toStrictEqual(200);
      } else {
        throw new Error('testing failed: function not working');
      }
    });
  });

  describe('Error Cases', () => {
    test('Repeated emails', () => {
      reqAdminAuthRegister('johndoe@gmail.com', 'SecurePass1', 'John', 'Doe');
      const registerRes = reqAdminAuthRegister(
        'johndoe@gmail.com',
        'SecurePass2',
        'Johnny',
        'Doey'
      );
      expect(registerRes.body).toStrictEqual({ error: expect.any(String) });
      expect(registerRes.statusCode).toStrictEqual(400);
    });

    test('Invalid Email', () => {
      const registerRes = reqAdminAuthRegister('notanemail', 'SecurePass1', 'John', 'Doe');
      expect(registerRes.body).toStrictEqual({ error: expect.any(String) });
      expect(registerRes.statusCode).toStrictEqual(400);
    });

    test.each([
      {
        email: 'johndoe@gmail.com',
        password: 'SecurePass1',
        nameFirst: 'Jo?',
        nameLast: 'Doe'
      },
      {
        email: 'johndoe@gmail.com',
        password: 'SecurePass1',
        nameFirst: 'J',
        nameLast: 'Doe'
      },
      {
        email: 'johndoe@gmail.com',
        password: 'SecurePass1',
        nameFirst: 'Johnsayheneedstodosomething',
        nameLast: 'Doe'
      }
    ])('Invalid First Name', ({ email, password, nameFirst, nameLast }) => {
      const res = reqAdminAuthRegister(email, password, nameFirst, nameLast);
      expect(res.body).toStrictEqual({ error: expect.any(String) });
      expect(res.statusCode).toStrictEqual(400);
    });

    test.each([
      {
        email: 'johndoe@gmail.com',
        password: 'SecurePass1',
        nameFirst: 'John',
        nameLast: 'Doe!'
      },
      {
        email: 'johndoe@gmail.com',
        password: 'SecurePass1',
        nameFirst: 'John',
        nameLast: 'D'
      },
      {
        email: 'johndoe@gmail.com',
        password: 'SecurePass1',
        nameFirst: 'John',
        nameLast: 'Doeisdoingnothingtospend'
      }
    ])('Invalid Last Name', ({ email, password, nameFirst, nameLast }) => {
      const res = reqAdminAuthRegister(email, password, nameFirst, nameLast);
      expect(res.body).toStrictEqual({ error: expect.any(String) });
      expect(res.statusCode).toStrictEqual(400);
    });

    test.each([
      { email: 'johndoe@gmail.com', password: 'Secure1', nameFirst: 'John', nameLast: 'Doe' },
      { email: 'johndoe@gmail.com', password: 'SecurePass', nameFirst: 'John', nameLast: 'Doe' }
    ])('Invalid Password', ({ email, password, nameFirst, nameLast }) => {
      const res = reqAdminAuthRegister(email, password, nameFirst, nameLast);
      expect(res.body).toStrictEqual({ error: expect.any(String) });
      expect(res.statusCode).toStrictEqual(400);
    });
  });
});
