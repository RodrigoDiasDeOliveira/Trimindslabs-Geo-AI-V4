import assert from 'node:assert/strict';
import { createServer } from 'node:http';

async function main() {
  process.env.NODE_ENV = 'test';
  process.env.AUTH_SECURITY_TEST_RUNNER = '1';
  process.env.AUTH_SECRET = 'local-only-auth-security-test-secret';
  process.env.ADMIN_PASSWORD = 'agentic';
  process.env.OPERATOR_PASSWORD = 'funcionario';

  delete process.env.K_SERVICE;
  delete process.env.AUTH_ENABLED;
  delete process.env.AUTH_DISABLED;

  const { app } = await import('../server');
  const server = createServer(app);

  try {
    await new Promise<void>((resolve, reject) => {
      server.once('error', reject);
      server.listen(0, '127.0.0.1', () => {
        server.removeListener('error', reject);
        resolve();
      });
    });

    const address = server.address();
    assert.ok(address && typeof address !== 'string');

    process.env.TEST_API_BASE =
      `http://127.0.0.1:${address.port}`;

    const { runTests } = await import('./auth-security.test');
    await runTests();
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close(error => error ? reject(error) : resolve());
    });
  }
}

main().catch(error => {
  console.error('Falha no executor de segurança:', error);
  process.exitCode = 1;
});
