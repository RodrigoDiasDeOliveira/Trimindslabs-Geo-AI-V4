import assert from 'node:assert/strict';
import { createServer } from 'node:http';

process.env.NODE_ENV = 'test';
process.env.AUTH_SECRET = 'test-only-secret-for-http-integration';
process.env.ADMIN_PASSWORD = 'test-admin-password';
process.env.OPERATOR_PASSWORD = 'test-operator-password';
delete process.env.K_SERVICE;

async function main() {
  const { app } = await import('../server');
  const server = createServer(app);

  await new Promise<void>((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });

  const address = server.address();
  assert.ok(address && typeof address !== 'string');

  const baseUrl = `http://127.0.0.1:${address.port}`;

  try {
    const noTokenStatus = await fetch(
      `${baseUrl}/api/v1/analysis/test-job/status`
    );
    assert.equal(noTokenStatus.status, 401);
    console.log('PASS: consulta de estado sem token devolve 401');

    const noTokenCreate = await fetch(`${baseUrl}/api/v1/analysis`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({}),
    });
    assert.equal(noTokenCreate.status, 401);
    console.log('PASS: criação de análise sem token devolve 401');

    const { createSignedToken } = await import('../server/auth');
    const token = createSignedToken({
      username: 'http-test-operator',
      role: 'operator',
      name: 'HTTP Test Operator',
    });

    const missingJob = await fetch(
      `${baseUrl}/api/v1/analysis/job-inexistente/status`,
      { headers: { authorization: `Bearer ${token}` } }
    );
    assert.equal(missingJob.status, 404);
    console.log('PASS: operador autenticado recebe 404 para job inexistente');

    console.log('\nResultado: 3/3 testes de integração passaram.');
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => error ? reject(error) : resolve());
    });
  }
}

main().catch((error) => {
  console.error('FAIL: teste de integração HTTP');
  console.error(error);
  process.exitCode = 1;
});
