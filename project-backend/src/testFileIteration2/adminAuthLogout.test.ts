import {
  reqAdminAuthLogout,
  reqClear,
  registerAndGetSession
} from '../helperFile/serverRequests';

beforeEach(() => {
  reqClear();
});

describe('POST /v1/admin/atuh/logout (adminAuthLogout)', () => {
  let session: string;
  beforeEach(() => {
    // register and get a session
    session = registerAndGetSession('example@gmail.com');
  });

  describe('Successive Cases', () => {
    test('Successfully logs out with a valid session', () => {
      // return response check the output
      const res = reqAdminAuthLogout(session);
      expect(res.statusCode).toStrictEqual(200);
      expect(res.body).toStrictEqual({});
    });
  });

  describe('Error Cases', () => {
    test('Invalid session', () => {
      const invalidSession = session + '1';
      const res = reqAdminAuthLogout(invalidSession);
      expect(res.statusCode).toStrictEqual(401);
      expect(res.body).toStrictEqual({ error: expect.any(String) });
    });

    test('Empty session', () => {
      const res = reqAdminAuthLogout('');
      expect(res.statusCode).toStrictEqual(401);
      expect(res.body).toStrictEqual({ error: expect.any(String) });
    });

    test('Fail logout on the second time', () => {
      reqAdminAuthLogout(session);
      // move it into successful cases
      const res = reqAdminAuthLogout(session);
      expect(res.statusCode).toStrictEqual(401);
      expect(res.body).toStrictEqual({ error: expect.any(String) });
    });
  });
});
