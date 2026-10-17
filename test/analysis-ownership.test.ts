import assert from 'node:assert/strict';
import { canAccessAnalysisJob } from '../server/analysisAuthorization';

const jobAlice = { ownerUsername: 'alice' };
const alice = { username: 'alice', role: 'operator' };
const bob = { username: 'bob', role: 'operator' };
const admin = { username: 'admin', role: 'admin' };

const cases = [
  {
    name: 'operador consulta o próprio job',
    actual: canAccessAnalysisJob(alice, jobAlice, true),
    expected: true
  },
  {
    name: 'operador não consulta job de outro operador',
    actual: canAccessAnalysisJob(bob, jobAlice, true),
    expected: false
  },
  {
    name: 'administrador consulta job de outro operador',
    actual: canAccessAnalysisJob(admin, jobAlice, true),
    expected: true
  },
  {
    name: 'utilizador não autenticado é recusado',
    actual: canAccessAnalysisJob(undefined, jobAlice, true),
    expected: false
  },
  {
    name: 'job sem proprietário é recusado a operadores',
    actual: canAccessAnalysisJob(alice, {}, true),
    expected: false
  },
  {
    name: 'username vazio é recusado',
    actual: canAccessAnalysisJob(
      { username: '  ', role: 'operator' },
      jobAlice,
      true
    ),
    expected: false
  },
  {
    name: 'papel ausente é recusado',
    actual: canAccessAnalysisJob({ username: 'alice' }, jobAlice, true),
    expected: false
  },
  {
    name: 'papel inesperado é recusado',
    actual: canAccessAnalysisJob(
      { username: 'alice', role: 'superuser' },
      jobAlice,
      true
    ),
    expected: false
  },
  {
    name: 'papel operador alternativo permite acesso ao próprio job',
    actual: canAccessAnalysisJob(
      { username: 'alice', role: 'operador' },
      jobAlice,
      true
    ),
    expected: true
  },
  {
    name: 'autenticação desativada permite acesso',
    actual: canAccessAnalysisJob(undefined, jobAlice, false),
    expected: true
  }
];

let failures = 0;

for (const test of cases) {
  try {
    assert.equal(test.actual, test.expected);
    console.log(`PASS: ${test.name}`);
  } catch {
    failures++;
    console.error(`FAIL: ${test.name}`);
  }
}

console.log(`\nResultado: ${cases.length - failures}/${cases.length} testes passaram.`);

if (failures > 0) process.exitCode = 1;
