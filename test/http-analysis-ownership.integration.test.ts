import assert from 'node:assert/strict';
import { createServer } from 'node:http';

async function main() {
  process.env.NODE_ENV = 'test';
  process.env.AUTH_SECRET = 'test-only-secret-for-http-integration';
  process.env.ADMIN_PASSWORD = 'test-admin-password';
  process.env.OPERATOR_PASSWORD = 'test-operator-password';
  delete process.env.K_SERVICE;

  const [{ app }, { createSignedToken }, { pipelineService }] =
    await Promise.all([
      import('../server'),
      import('../server/auth'),
      import('../server/services/pipelineService'),
    ]);

  const jobId = 'integration-owned-job';

  const fakeJob = {
    id: jobId,
    ownerUsername: 'operator-a',
    status: 'completed',
    progressPct: 100,
    stageMessage: 'Teste de integração',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    completedAt: new Date().toISOString(),
  } as any;

  const fakeResult = {
    vectorGeoJson: {
      type: 'FeatureCollection',
      features: [],
    },
  } as any;

  const originalGetJob = pipelineService.getJob;
  const originalGetResult = pipelineService.getResult;

  const tokens = {
    owner: createSignedToken({
      username: 'operator-a',
      role: 'operator',
      name: 'Operator A',
    }),
    other: createSignedToken({
      username: 'operator-b',
      role: 'operator',
      name: 'Operator B',
    }),
    admin: createSignedToken({
      username: 'admin-test',
      role: 'admin',
      name: 'Test Admin',
    }),
  };

  const routes = [
    `/api/v1/analysis/${jobId}/status`,
    `/api/v1/analysis/${jobId}`,
    `/api/v1/analysis/${jobId}/result`,
    `/api/v1/analysis/${jobId}/geojson`,
  ];

  const server = createServer(app);
  let listening = false;
  let passed = 0;

  try {
    // Simula os dados sem iniciar processamento geoespacial real.
    pipelineService.getJob = ((id: string) =>
      id === jobId ? fakeJob : undefined) as typeof pipelineService.getJob;

    pipelineService.getResult = ((id: string) =>
      id === jobId ? fakeResult : undefined) as typeof pipelineService.getResult;

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
    const baseUrl = `http://127.0.0.1:${address.port}`;

    for (const route of routes) {
      const cases = [
        { label: 'proprietário', token: tokens.owner, expected: 200 },
        { label: 'outro operador', token: tokens.other, expected: 404 },
        { label: 'administrador', token: tokens.admin, expected: 200 },
      ];

      for (const testCase of cases) {
        const response = await fetch(`${baseUrl}${route}`, {
          headers: {
            Authorization: `Bearer ${testCase.token}`,
          },
        });

        const message =
          `${route} — ${testCase.label}: esperado ${testCase.expected}, ` +
          `recebido ${response.status}`;

        assert.equal(response.status, testCase.expected, message);
        console.log(`PASS ${message}`);
        passed++;
      }
    }

    console.log(`\nResultado: ${passed}/12 verificações HTTP passaram.`);
  } finally {
    pipelineService.getJob = originalGetJob;
    pipelineService.getResult = originalGetResult;

    if (listening) {
      await new Promise<void>((resolve, reject) => {
        server.close((error) => error ? reject(error) : resolve());
      });
    }
  }
}

main().catch((error) => {
  console.error('FAIL', error);
  process.exitCode = 1;
});
