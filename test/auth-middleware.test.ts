import assert from 'node:assert/strict';
import {
  createSignedToken,
  requireAuthMiddleware
} from '../server/auth';

process.env.NODE_ENV = 'production';
process.env.AUTH_SECRET = 'test-only-secret-for-middleware';
process.env.ADMIN_PASSWORD = 'test-admin-password';
process.env.OPERATOR_PASSWORD = 'test-operator-password';

function invokeMiddleware(authorization?: string) {
  const req: any = {
    headers: authorization ? { authorization } : {},
  };

  const res: any = {
    statusCode: 200,
    body: undefined,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(body: unknown) {
      this.body = body;
      return this;
    },
  };

  let nextCalled = false;

  requireAuthMiddleware(req, res, () => {
    nextCalled = true;
  });

  return { req, res, nextCalled };
}

const tests = [
  {
    name: 'configuração ausente devolve 503',
    run() {
      delete process.env.AUTH_SECRET;
      const { res, nextCalled } = invokeMiddleware();
      assert.equal(res.statusCode, 503);
      assert.equal(res.body.configured, false);
      assert.equal(nextCalled, false);
      process.env.AUTH_SECRET = 'test-only-secret-for-middleware';
    },
  },
  {
    name: 'token ausente devolve 401',
    run() {
      const { res, nextCalled } = invokeMiddleware();
      assert.equal(res.statusCode, 401);
      assert.equal(nextCalled, false);
    },
  },
  {
    name: 'token inválido devolve 401',
    run() {
      const { res, nextCalled } = invokeMiddleware('Bearer token-invalido');
      assert.equal(res.statusCode, 401);
      assert.equal(nextCalled, false);
    },
  },
  {
    name: 'token válido atribui a identidade e chama next',
    run() {
      const token = createSignedToken({
        username: 'alice',
        role: 'operator',
        name: 'Alice',
      });

      const { req, res, nextCalled } = invokeMiddleware(`Bearer ${token}`);
      assert.equal(res.statusCode, 200);
      assert.equal(req.user.username, 'alice');
      assert.equal(req.user.role, 'operator');
      assert.equal(nextCalled, true);
    },
  },
];

let failures = 0;

for (const test of tests) {
  try {
    test.run();
    console.log(`PASS: ${test.name}`);
  } catch (error) {
    failures++;
    console.error(`FAIL: ${test.name}`);
    console.error(error);
  }
}

console.log(`\nResultado: ${tests.length - failures}/${tests.length} testes passaram.`);
if (failures) process.exitCode = 1;
