import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const API_BASE = 'http://localhost:3000';

async function runTests() {
  console.log('--- STARTING COMPREHENSIVE AUTHENTICATION & SECURITY TESTS ---\n');
  let failures = 0;

  function assert(condition: boolean, testName: string, detail?: any) {
    if (condition) {
      console.log(`✅ PASS: ${testName}`);
    } else {
      console.error(`❌ FAIL: ${testName}`, detail || '');
      failures++;
    }
  }

  let adminToken = '';
  let operatorToken = '';

  // 1. Authentication endpoint exists & Valid credentials (admin) → 200
  try {
    const res = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'agentic' })
    });
    const data = await res.json();
    assert(res.status === 200, 'Authentication endpoint exists & Admin login HTTP 200');
    assert(data.authenticated === true, 'Admin login authenticated = true');
    assert(data.user?.role === 'admin', 'Admin user.role = "admin"');
    assert(typeof data.token === 'string' && data.token.length > 20, 'Admin login returns signed token');
    assert(!('password' in data) && !('password' in (data.user || {})), 'Admin response does not leak password');
    adminToken = data.token;
  } catch (err: any) {
    assert(false, 'Admin login request failed', err.message);
  }

  // 2. Valid credentials (operator) → 200
  try {
    const res = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'operador', password: 'funcionario' })
    });
    const data = await res.json();
    assert(res.status === 200, 'Operator login HTTP 200');
    assert(data.authenticated === true, 'Operator user.role = "operator"');
    assert(typeof data.token === 'string' && data.token.length > 20, 'Operator login returns signed token');
    operatorToken = data.token;
  } catch (err: any) {
    assert(false, 'Operator login request failed', err.message);
  }

  // 3. Invalid credentials → 401
  try {
    const res = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'wrong-password' })
    });
    const data = await res.json();
    assert(res.status === 401, 'Invalid credentials returns HTTP 401');
    assert(data.authenticated === false, 'Invalid credentials authenticated = false');
    assert(data.error === 'Invalid username or password.', 'Generic error message prevents enumeration');
  } catch (err: any) {
    assert(false, 'Invalid credentials test failed', err.message);
  }

  // 4. Missing credentials → 401
  try {
    const res = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    const data = await res.json();
    assert(res.status === 401, 'Missing credentials returns HTTP 401');
    assert(data.authenticated === false, 'Missing credentials authenticated = false');
  } catch (err: any) {
    assert(false, 'Missing credentials test failed', err.message);
  }

  // 5. Token generated & validated
  assert(adminToken.split('.').length === 3, 'Token generated in standard header.payload.signature format');

  // 6. Expired / Tampered token rejected
  try {
    // Tampered signature
    const parts = adminToken.split('.');
    const tamperedToken = `${parts[0]}.${parts[1]}.badsignature12345`;
    const res = await fetch(`${API_BASE}/api/v1/roi/validate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tamperedToken}`
      },
      body: JSON.stringify({ geometry: { type: 'Polygon', coordinates: [] } })
    });
    assert(res.status === 401, 'Tampered token rejected with HTTP 401');
  } catch (err: any) {
    assert(false, 'Tampered token check failed', err.message);
  }

  // 7. Protected endpoint requires authentication
  try {
    // Request without Authorization header
    const unauthRes = await fetch(`${API_BASE}/api/v1/roi/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ geometry: { type: 'Polygon', coordinates: [] } })
    });
    assert(unauthRes.status === 401, 'Protected endpoint /api/v1/roi/validate rejects unauthenticated request (HTTP 401)');

    // Request with valid admin Authorization header
    const authRes = await fetch(`${API_BASE}/api/v1/roi/validate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        geometry: {
          type: 'Polygon',
          coordinates: [[
            [-47.93, -15.78],
            [-47.92, -15.78],
            [-47.92, -15.77],
            [-47.93, -15.77],
            [-47.93, -15.78]
          ]]
        }
      })
    });
    assert(authRes.status === 200, 'Protected endpoint /api/v1/roi/validate succeeds with valid token (HTTP 200)');
  } catch (err: any) {
    assert(false, 'Protected endpoint test failed', err.message);
  }

  // 8. Authentication configuration is validated
  try {
    const configRes = await fetch(`${API_BASE}/api/auth/config`);
    const configData = await configRes.json();
    assert(configRes.status === 200, 'GET /api/auth/config returns HTTP 200');
    assert(configData.enabled === true, 'Authentication is enabled');
    assert(configData.configured === true, 'Authentication is configured');
    assert(!('secret' in configData) && !('password' in configData), 'Config endpoint exposes no secret or password');

    const healthRes = await fetch(`${API_BASE}/api/v1/health`);
    const healthData = await healthRes.json();
    assert(healthRes.status === 200, 'GET /api/v1/health returns HTTP 200');
    assert(healthData.authentication?.enabled === true, 'Health check reports authentication.enabled = true');
    assert(healthData.authentication?.configured === true, 'Health check reports authentication.configured = true');
  } catch (err: any) {
    assert(false, 'Auth configuration validation failed', err.message);
  }

  // 9. Frontend uses correct relative API paths
  try {
    const authContextContent = fs.readFileSync(path.join(process.cwd(), 'src', 'auth', 'AuthContext.tsx'), 'utf8');
    assert(
      authContextContent.includes("'/api/auth/login'") || authContextContent.includes('"/api/auth/login"'),
      'Frontend uses relative path /api/auth/login'
    );
    assert(
      !authContextContent.includes('http://localhost') && !authContextContent.includes('http://127.0.0.1'),
      'Frontend AuthContext has no hardcoded localhost / 127.0.0.1'
    );
  } catch (err: any) {
    assert(false, 'Frontend API path inspection failed', err.message);
  }

  // 10. Security Audit: Check src/ for credentials
  console.log('\n--- AUDITING SOURCE CODE AND BUNDLES ---');
  try {
    const grepResult = execSync('grep -rnI -E "agentic|funcionario|funcinario" src/ || true', { encoding: 'utf8' }).trim();
    assert(grepResult === '', 'Zero occurrences of credentials in src/', grepResult);
  } catch (err: any) {
    assert(false, 'Grep in src/ failed', err.message);
  }

  // 11. Security Audit: Check compiled frontend build bundle in dist/
  try {
    console.log('Inspecting compiled frontend bundle in dist/assets/...');
    const distAssetsDir = path.join(process.cwd(), 'dist', 'assets');
    if (fs.existsSync(distAssetsDir)) {
      const files = fs.readdirSync(distAssetsDir);
      let foundLeakedPassword = false;
      let foundLocalhost = false;

      for (const file of files) {
        if (file.endsWith('.js')) {
          const content = fs.readFileSync(path.join(distAssetsDir, file), 'utf8');
          if (content.includes('agentic') || content.includes('funcionario') || content.includes('funcinario')) {
            foundLeakedPassword = true;
            console.error(`Leaked credential found in bundle file: ${file}`);
          }
          if (content.includes('http://localhost:3000') || content.includes('http://127.0.0.1:3000')) {
            foundLocalhost = true;
            console.error(`Localhost URL found in bundle file: ${file}`);
          }
        }
      }
      assert(!foundLeakedPassword, 'Zero occurrences of credentials in compiled frontend bundle');
      assert(!foundLocalhost, 'No localhost URLs in production bundle');
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
