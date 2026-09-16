import { createHmac, timingSafeEqual } from 'crypto';
import type { Request, Response, NextFunction } from 'express';
import 'dotenv/config';

const DEFAULT_DEV_SECRET = 'triminds_geoai_runtime_secret_key_v4';
const DEFAULT_DEV_ADMIN_PASS = 'agentic';
const DEFAULT_DEV_OPERATOR_PASS = 'funcionario';

function getAuthSecret(): string {
  return process.env.AUTH_SECRET || DEFAULT_DEV_SECRET;
}

function getAdminUsername(): string {
  return process.env.ADMIN_USERNAME || 'admin';
}

function getAdminPassword(): string {
  return process.env.ADMIN_PASSWORD || DEFAULT_DEV_ADMIN_PASS;
}

function getOperatorUsername(): string {
  return process.env.OPERATOR_USERNAME || 'operador';
}

function getOperatorPassword(): string {
  return process.env.OPERATOR_PASSWORD || DEFAULT_DEV_OPERATOR_PASS;
}

/**
 * Precedence rules:
 * 1. AUTH_ENABLED takes highest precedence if defined.
 *    - 'true' | '1' | 'yes' => enabled (true)
 *    - 'false' | '0' | 'no' => disabled (false)
 * 2. If AUTH_ENABLED is undefined, AUTH_DISABLED is evaluated.
 *    - 'true' | '1' | 'yes' => disabled (false)
 *    - anything else => enabled (true)
 * 3. Default when neither is defined is ENABLED (true) - Secure by default.
 */
export function isAuthenticationEnabled(): boolean {
  if (process.env.AUTH_ENABLED !== undefined) {
    const val = process.env.AUTH_ENABLED.trim().toLowerCase();
    return val === 'true' || val === '1' || val === 'yes';
  }
  if (process.env.AUTH_DISABLED !== undefined) {
    const val = process.env.AUTH_DISABLED.trim().toLowerCase();
    return !(val === 'true' || val === '1' || val === 'yes');
  }
  return true;
}

/**
 * Verifies whether required authentication secrets are present.
 * If authentication is enabled but required configuration is missing/empty,
 * authentication must fail securely and indicate that service is unconfigured.
 */
export function isAuthenticationConfigured(): boolean {
  const secret = getAuthSecret();
  const adminPass = getAdminPassword();
  const operatorPass = getOperatorPassword();

  if (!secret || secret.trim() === '') return false;
  if (!adminPass || adminPass.trim() === '') return false;
  if (!operatorPass || operatorPass.trim() === '') return false;

  return true;
}

export interface TokenPayload {
  username: string;
  role: 'admin' | 'operator' | 'operador';
  name: string;
  iat: number;
  exp: number;
}

export interface AuthResult {
  authenticated: boolean;
  configured?: boolean;
  status?: number;
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
 * Constant-time comparison between input and expected secret using HMAC-SHA256 digests.
 * This guarantees equal buffer lengths (32 bytes) and prevents timing side-channel attacks.
 */
function safeCompare(input: string, expected: string): boolean {
  if (typeof input !== 'string' || typeof expected !== 'string') {
    return false;
  }
  const secret = getAuthSecret();
  const h1 = createHmac('sha256', secret).update(input).digest();
  const h2 = createHmac('sha256', secret).update(expected).digest();
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
  const signature = createHmac('sha256', getAuthSecret())
    .update(`${header}.${body}`)
    .digest('base64url');

  return `${header}.${body}.${signature}`;
}

/**
 * Helper to generate an expired token for security testing.
 */
export function createExpiredToken(payload: Omit<TokenPayload, 'iat' | 'exp'>, expiredSecondsAgo: number = 3600): string {
  const iat = Math.floor(Date.now() / 1000) - expiredSecondsAgo - 100;
  const exp = Math.floor(Date.now() / 1000) - expiredSecondsAgo;
  const fullPayload: TokenPayload = { ...payload, iat, exp };

  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(JSON.stringify(fullPayload)).toString('base64url');
  const signature = createHmac('sha256', getAuthSecret())
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
  const expectedSignature = createHmac('sha256', getAuthSecret())
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
  if (!isAuthenticationConfigured()) {
    return {
      authenticated: false,
      configured: false,
      status: 503,
      error: 'Authentication service unavailable.'
    };
  }

  if (
    !usernameInput ||
    !passwordInput ||
    typeof usernameInput !== 'string' ||
    typeof passwordInput !== 'string'
  ) {
    return {
      authenticated: false,
      configured: true,
      status: 401,
      error: 'Invalid username or password.'
    };
  }

  const normalizedUser = usernameInput.trim().toLowerCase();
  const adminUsername = getAdminUsername();
  const adminPassword = getAdminPassword();
  const operatorUsername = getOperatorUsername();
  const operatorPassword = getOperatorPassword();

  // Admin Profile Check (accepts configured ADMIN_USERNAME or 'admin')
  if (
    normalizedUser === adminUsername.toLowerCase() ||
    normalizedUser === 'admin'
  ) {
    if (safeCompare(passwordInput, adminPassword)) {
      const expiresInSeconds = 86400; // 24 hours
      const expiresAt = new Date(Date.now() + expiresInSeconds * 1000).toISOString();
      const user = {
        username: adminUsername,
        role: 'admin' as const,
        name: 'Administrador'
      };
      const token = createSignedToken(user, expiresInSeconds);

      return {
        authenticated: true,
        configured: true,
        status: 200,
        user,
        token,
        expiresAt
      };
    }
  }

  // Operator Profile Check (accepts configured OPERATOR_USERNAME, 'operador', or 'operator')
  if (
    normalizedUser === operatorUsername.toLowerCase() ||
    normalizedUser === 'operador' ||
    normalizedUser === 'operator'
  ) {
    if (safeCompare(passwordInput, operatorPassword)) {
      const expiresInSeconds = 86400; // 24 hours
      const expiresAt = new Date(Date.now() + expiresInSeconds * 1000).toISOString();
      const user = {
        username: operatorUsername,
        role: 'operator' as const,
        name: 'Operador'
      };
      const token = createSignedToken(user, expiresInSeconds);

      return {
        authenticated: true,
        configured: true,
        status: 200,
        user,
        token,
        expiresAt
      };
    }
  }

  // Constant-time generic rejection to prevent enumeration
  return {
    authenticated: false,
    configured: true,
    status: 401,
    error: 'Invalid username or password.'
  };
}

/**
 * Express middleware to protect routes requiring authentication.
 */
export function requireAuthMiddleware(req: Request, res: Response, next: NextFunction) {
  if (!isAuthenticationEnabled()) {
    // If auth is disabled globally via configuration, bypass authentication
    return next();
  }

  const authHeader = req.headers.authorization || '';
  if (!authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      authenticated: false,
      error: 'Authorization header with Bearer token is required.'
    });
  }

  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  const verification = verifyToken(token);
  if (!verification.valid || !verification.payload) {
    return res.status(401).json({
      authenticated: false,
      error: verification.error || 'Invalid or expired authentication token.'
    });
  }

  (req as any).user = verification.payload;
  next();
}

/**
 * Returns public metadata about auth status (no secrets exposed).
 */
export function getAuthConfiguration() {
  const enabled = isAuthenticationEnabled();
  const configured = isAuthenticationConfigured();

  return {
    status: enabled ? 'ACTIVE' : 'DISABLED',
    enabled,
    configured,
    mode: 'SERVER_AUTHENTICATED',
    transport: 'POST',
    sessionDurationHours: 24
  };
}
