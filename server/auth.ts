import { createHmac, timingSafeEqual } from 'crypto';
import 'dotenv/config';

const AUTH_SECRET = process.env.AUTH_SECRET || 'triminds_geoai_runtime_secret_key_v4';

const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'agentic';

const OPERATOR_USERNAME = process.env.OPERATOR_USERNAME || 'operador';
const OPERATOR_PASSWORD = process.env.OPERATOR_PASSWORD || 'funcionario';

export interface TokenPayload {
  username: string;
  role: 'admin' | 'operator' | 'operador';
  name: string;
  iat: number;
  exp: number;
}

export interface AuthResult {
  authenticated: boolean;
  user?: {
    username: string;
    role: 'admin' | 'operator';
    name: string;
  };
  token?: string;
  expiresAt?: string;
  error?: string;
}

/**
 * Constant-time comparison between input and stored secret using HMAC-SHA256 digests.
 * This guarantees equal buffer lengths (32 bytes) and avoids timing side-channel attacks.
 */
function safeCompare(input: string, expected: string): boolean {
  if (typeof input !== 'string' || typeof expected !== 'string') {
    return false;
  }
  const h1 = createHmac('sha256', AUTH_SECRET).update(input).digest();
  const h2 = createHmac('sha256', AUTH_SECRET).update(expected).digest();
  return timingSafeEqual(h1, h2);
}

/**
 * Creates a signed JWT-style token using HMAC-SHA256 with expiration.
 */
export function createSignedToken(payload: Omit<TokenPayload, 'iat' | 'exp'>, expiresInSeconds: number = 86400): string {
  const iat = Math.floor(Date.now() / 1000);
  const exp = iat + expiresInSeconds;
  const fullPayload: TokenPayload = { ...payload, iat, exp };

  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(JSON.stringify(fullPayload)).toString('base64url');
  const signature = createHmac('sha256', AUTH_SECRET)
    .update(`${header}.${body}`)
    .digest('base64url');

  return `${header}.${body}.${signature}`;
}

/**
 * Verifies and decodes a signed token.
 */
export function verifyToken(token: string): { valid: boolean; payload?: TokenPayload; error?: string } {
  if (!token || typeof token !== 'string') {
    return { valid: false, error: 'Token não fornecido.' };
  }

  const parts = token.split('.');
  if (parts.length !== 3) {
    return { valid: false, error: 'Formato de token inválido.' };
  }

  const [header, body, signature] = parts;
  const expectedSignature = createHmac('sha256', AUTH_SECRET)
    .update(`${header}.${body}`)
    .digest('base64url');

  const sigBuf = Buffer.from(signature);
  const expBuf = Buffer.from(expectedSignature);

  if (sigBuf.length !== expBuf.length || !timingSafeEqual(sigBuf, expBuf)) {
    return { valid: false, error: 'Assinatura criptográfica inválida.' };
  }

  try {
    const payload: TokenPayload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    const now = Math.floor(Date.now() / 1000);

    if (payload.exp && payload.exp < now) {
      return { valid: false, error: 'Token expirado.' };
    }

    return { valid: true, payload };
  } catch {
    return { valid: false, error: 'Payload corrompido.' };
  }
}

/**
 * Validates user credentials against server-side configuration.
 * Returns generic "Invalid username or password." to prevent username enumeration.
 * NEVER returns the user password.
 */
export function authenticateUser(usernameInput?: string, passwordInput?: string): AuthResult {
  if (
    !usernameInput ||
    !passwordInput ||
    typeof usernameInput !== 'string' ||
    typeof passwordInput !== 'string'
  ) {
    return {
      authenticated: false,
      error: 'Invalid username or password.'
    };
  }

  const normalizedUser = usernameInput.trim().toLowerCase();

  // Admin Profile Check
  if (normalizedUser === ADMIN_USERNAME.toLowerCase()) {
    if (safeCompare(passwordInput, ADMIN_PASSWORD)) {
      const expiresInSeconds = 86400; // 24 hours
      const expiresAt = new Date(Date.now() + expiresInSeconds * 1000).toISOString();
      const user = {
        username: ADMIN_USERNAME,
        role: 'admin' as const,
        name: 'Administrador'
      };
      const token = createSignedToken(user, expiresInSeconds);

      return {
        authenticated: true,
        user,
        token,
        expiresAt
      };
    }
  }

  // Operator Profile Check (accepts configured OPERATOR_USERNAME or 'operator')
  if (
    normalizedUser === OPERATOR_USERNAME.toLowerCase() ||
    normalizedUser === 'operator'
  ) {
    if (safeCompare(passwordInput, OPERATOR_PASSWORD)) {
      const expiresInSeconds = 86400; // 24 hours
      const expiresAt = new Date(Date.now() + expiresInSeconds * 1000).toISOString();
      const user = {
        username: OPERATOR_USERNAME,
        role: 'operator' as const,
        name: 'Operador'
      };
      const token = createSignedToken(user, expiresInSeconds);

      return {
        authenticated: true,
        user,
        token,
        expiresAt
      };
    }
  }

  // Constant-time generic rejection to prevent enumeration
  return {
    authenticated: false,
    error: 'Invalid username or password.'
  };
}

/**
 * Returns public metadata about auth status (no secrets exposed).
 */
export function getAuthConfiguration() {
  return {
    status: 'ACTIVE',
    mode: 'SERVER_AUTHENTICATED',
    transport: 'POST',
    sessionDurationHours: 24
  };
}
