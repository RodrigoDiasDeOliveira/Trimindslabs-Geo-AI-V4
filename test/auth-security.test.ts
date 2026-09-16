import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const API_BASE = 'http://localhost:3000';

async function runTests() {
  console.log('--- STARTING AUTHENTICATION & SECURITY TESTS ---\n');
  let failures = 0;

  function assert(condition: boolean, testName: string, detail?: any) {
    if (condition) {
      console.log(`✅ PASS: ${testName}`);
    } else {
      console.error(`❌ FAIL: ${testName}`, detail || '');
      failures++;
    }
  }

  // 1. Admin Login (admin + agentic)
  try {
    const res = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'agentic' })
    });
    const data = await res.json();
    assert(res.status === 200, 'Admin login HTTP 200');
    assert(data.authenticated === true, 'Admin login authenticated = true');
    assert(data.user?.role === 'admin', 'Admin login user.role = "admin"');
    assert(data.user?.username === 'admin', 'Admin login user.username = "admin"');
    assert(typeof data.token === 'string' && data.token.length > 20, 'Admin login returns signed token');
    assert(!('password' in data) && !('password' in (data.user || {})), 'Admin response does not leak password');
  } catch (err: any) {
    assert(false, 'Admin login request failed', err.message);
  }

  // 2. Operator Login (operador + funcionario)
  try {
    const res = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'operador', password: 'funcionario' })
    });
    const data = await res.json();
    assert(res.status === 200, 'Operator login HTTP 200');
    assert(data.authenticated === true, 'Operator login authenticated = true');
    assert(data.user?.role === 'operator', 'Operator login user.role = "operator"');
    assert(data.user?.username === 'operador', 'Operator login user.username = "operador"');
    assert(typeof data.token === 'string' && data.token.length > 20, 'Operator login returns signed token');
    assert(!('password' in data) && !('password' in (data.user || {})), 'Operator response does not leak password');
  } catch (err: any) {
    assert(false, 'Operator login request failed', err.message);
  }

  // 3. Invalid Password (admin + wrong-password)
  try {
    const res = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'wrong-password' })
    });
    const data = await res.json();
    assert(res.status === 401, 'Invalid password returns HTTP 401');
    assert(data.authenticated === false, 'Invalid password authenticated = false');
    assert(data.error === 'Invalid username or password.', 'Generic error prevents username enumeration');
    assert(!JSON.stringify(data).includes('admin'), 'Error response does not reveal admin existed');
  } catch (err: any) {
    assert(false, 'Invalid password request failed', err.message);
  }

  // 4. Invalid Username (unknown-user + anything)
  try {
    const res = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'unknown-user-999', password: 'some-arbitrary-password' })
    });
    const data = await res.json();
    assert(res.status === 401, 'Invalid username returns HTTP 401');
    assert(data.authenticated === false, 'Invalid username authenticated = false');
    assert(data.error === 'Invalid username or password.', 'Generic error on unknown user');
  } catch (err: any) {
    assert(false, 'Invalid username request failed', err.message);
  }

  // 5. Empty payload check
  try {
    const res = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    const data = await res.json();
    assert(res.status === 401, 'Empty payload returns HTTP 401');
    assert(data.error === 'Invalid username or password.', 'Generic error on empty payload');
  } catch (err: any) {
    assert(false, 'Empty payload request failed', err.message);
  }

  // 6. Security Audit: Check src/ for real credentials
  console.log('\n--- AUDITING SOURCE CODE AND BUNDLES ---');
  try {
    const grepResult = execSync('grep -rnI -E "agentic|funcionario|funcinario" src/ || true', { encoding: 'utf8' }).trim();
    assert(grepResult === '', 'Zero occurrences of credentials in src/', grepResult);
  } catch (err: any) {
    assert(false, 'Grep in src/ failed', err.message);
  }

  // 7. Security Audit: Check compiled frontend build bundle in dist/
  try {
    console.log('Building frontend assets to inspect output bundle...');
    execSync('npx vite build', { encoding: 'utf8' });
    const distAssetsDir = path.join(process.cwd(), 'dist', 'assets');
    if (fs.existsSync(distAssetsDir)) {
      const files = fs.readdirSync(distAssetsDir);
      let foundLeakedPassword = false;
      for (const file of files) {
        if (file.endsWith('.js')) {
          const content = fs.readFileSync(path.join(distAssetsDir, file), 'utf8');
          if (content.includes('agentic') || content.includes('funcionario') || content.includes('funcinario')) {
            foundLeakedPassword = true;
            console.error(`Leaked credential found in bundle file: ${file}`);
          }
        }
      }
      assert(!foundLeakedPassword, 'Zero occurrences of credentials in compiled frontend bundle (dist/assets/*.js)');
    } else {
      assert(false, 'dist/assets directory not found after build');
    }
  } catch (err: any) {
    assert(false, 'Build/bundle inspection failed', err.message);
  }

  console.log(`\n--- TEST SUMMARY: ${failures === 0 ? 'ALL TESTS PASSED ✅' : `${failures} FAILURES ❌`} ---`);
  if (failures > 0) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Test runner fatal error:', err);
  process.exit(1);
});
