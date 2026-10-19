import assert from 'node:assert/strict';
import { createServer } from 'node:http';

async function main() {
  process.env.NODE_ENV = 'test';
  process.env.AUTH_SECRET = 'test-only-secret-for-audit-integration';
  process.env.ADMIN_PASSWORD = 'test-admin-password';
  process.env.OPERATOR_PASSWORD = 'test-operator-password';
  delete process.env.K_SERVICE;
  delete process.env.AUTH_ENABLED;
  delete process.env.AUTH_DISABLED;

  const [{ app }, { createSignedToken }] = await Promise.all([
    import('../server'),
    import('../server/auth'),
  ]);

  const token = createSignedToken({
    username: 'real-operator',
    role: 'operator',
    name: 'Real Operator',
  });

  const server = createServer(app);
  let listening = false;

  try {
    await new Promise<void>((resolve, reject) => {
      server.once('error', reject);
      server.listen(0, '127.0.0.1', () => {
        server.removeListener('error', reject);
        listening = true;
        resolve();
      });
    });

    const address = server.address();
    assert.ok(address && typeof address !== 'string');
    const url = `http://127.0.0.1:${address.port}/api/v1/audit/logs`;
    const headers = {
      authorization: `Bearer ${token}`,
      'content-type': 'application/json',
    };

    const unauthenticated = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        action: 'TEST_EVENT',
        details: 'Tentativa sem autenticação',
      }),
    });
    assert.equal(unauthenticated.status, 401);
    console.log('PASS: registo sem token recusado');

    const spoofAttempt = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        user: 'admin',
        userName: 'Administrador Falsificado',
        action: 'TEST_EVENT',
        details: 'Teste de integridade da identidade',
      }),
    });
    assert.equal(spoofAttempt.status, 201);
    const spoofBody = await spoofAttempt.json() as any;
    assert.equal(spoofBody.log.user, 'real-operator');
    assert.equal(spoofBody.log.userName, 'Real Operator');
    assert.equal(spoofBody.log.status, 'DECLARED');
    console.log('PASS: identidade vem do token e o evento fica DECLARED');

    const invalidAction = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        action: 123,
        details: 'Detalhes válidos',
      }),
    });
    assert.equal(invalidAction.status, 400);
    console.log('PASS: action com tipo inválido recusada');

    const oversizedDetails = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        action: 'TEST_EVENT',
        details: 'x'.repeat(2001),
      }),
    });
    assert.equal(oversizedDetails.status, 400);
    console.log('PASS: details acima do limite recusados');

    process.env.AUTH_ENABLED = 'false';
    const noIdentityInBypass = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        action: 'TEST_EVENT',
        details: 'Teste sem identidade no bypass',
      }),
    });
    assert.equal(noIdentityInBypass.status, 401);
    console.log('PASS: bypass de desenvolvimento não permite logs sem identidade');

    console.log('\\nResultado: 5/5 testes de auditoria passaram.');
  } finally {
    delete process.env.AUTH_ENABLED;
    if (listening) {
      await new Promise<void>((resolve, reject) => {
        server.close((error) => error ? reject(error) : resolve());
      });
    }
  }
}

main().catch((error) => {
  console.error('FAIL: teste de integração de auditoria');
  console.error(error);
  process.exitCode = 1;
});
