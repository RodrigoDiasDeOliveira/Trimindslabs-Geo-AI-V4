import { createHmac, timingSafeEqual } from 'crypto';
import type { Request, Response, NextFunction } from 'express';
import 'dotenv/config';

const DEFAULT_DEV_SECRET = 'triminds_geoai_runtime_secret_key_v4';
const DEFAULT_DEV_ADMIN_PASS = 'agentic';
const DEFAULT_DEV_OPERATOR_PASS = 'funcionario';

function isProductionEnvironment(): boolean {
  if (process.env.NODE_ENV === 'development' || process.env.K_SERVICE?.startsWith('ais-dev-')) {
    return false;
  }
  return process.env.NODE_ENV === 'production' || (Boolean(process.env.K_SERVICE) && !process.env.K_SERVICE.startsWith('ais-dev-'));
}

function getAuthSecret(): string {
  if (isProductionEnvironment()) return process.env.AUTH_SECRET || '';
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
  if (isProductionEnvironment()) return true;

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
  const production = isProductionEnvironment();
  const secret = process.env.AUTH_SECRET || (production ? '' : DEFAULT_DEV_SECRET);
  const adminPass = process.env.ADMIN_PASSWORD || (production ? '' : DEFAULT_DEV_ADMIN_PASS);
  const operatorPass = process.env.OPERATOR_PASSWORD || (production ? '' : DEFAULT_DEV_OPERATOR_PASS);

  if (!secret.trim() || !adminPass.trim() || !operatorPass.trim()) return false;

  if (production && (
    secret === DEFAULT_DEV_SECRET ||
    adminPass === DEFAULT_DEV_ADMIN_PASS ||
    operatorPass === DEFAULT_DEV_OPERATOR_PASS
  )) return false;

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
  if (!isAuthenticationConfigured()) {
    return { valid: false, error: 'Authentication service is not securely configured.' };
  }
  if (!token || typeof token !== 'string') {
    return { valid: false, error: 'Token não fornecido.' };
  }

  const parts = token.split('.');
  if (parts.length !== 3 || parts.some(part => !part)) {
    return { valid: false, error: 'Formato de token inválido.' };
  }

  const [header, body, signature] = parts;
  if (![header, body, signature].every(part => /^[A-Za-z0-9_-]+$/.test(part))) {
    return { valid: false, error: 'Formato de token inválido.' };
  }

  try {
    const decodedHeader = JSON.parse(Buffer.from(header, 'base64url').toString('utf8'));
    if (!decodedHeader || decodedHeader.alg !== 'HS256' || decodedHeader.typ !== 'JWT') {
      return { valid: false, error: 'Cabeçalho de token inválido.' };
    }
  } catch {
    return { valid: false, error: 'Cabeçalho de token inválido.' };
  }

  const expected = createHmac('sha256', getAuthSecret())
    .update(`${header}.${body}`).digest();
  const supplied = Buffer.from(signature, 'base64url');

  if (supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) {
    return { valid: false, error: 'Assinatura criptográfica inválida.' };
  }

  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    const now = Math.floor(Date.now() / 1000);
    const roles = ['admin', 'operator', 'operador'];

    if (!payload || typeof payload !== 'object' || Array.isArray(payload) ||
        typeof payload.username !== 'string' || !payload.username.trim() ||
        typeof payload.name !== 'string' || !payload.name.trim() ||
        !roles.includes(payload.role) ||
        !Number.isSafeInteger(payload.iat) ||
        !Number.isSafeInteger(payload.exp)) {
      return { valid: false, error: 'Payload de token inválido.' };
    }

    if (payload.iat > now + 60) {
      return { valid: false, error: 'Token emitido no futuro.' };
    }
    if (payload.exp <= now) {
      return { valid: false, error: 'Token expirado.' };
    }
    if (payload.exp <= payload.iat || payload.exp - payload.iat > 86400) {
      return { valid: false, error: 'Duração do token inválida.' };
    }

    return { valid: true, payload: payload as TokenPayload };
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
    // Preserve the explicitly configured development bypass.
    return next();
  }

  if (!isAuthenticationConfigured()) {
    return res.status(503).json({
      authenticated: false,
      configured: false,
      error: 'Authentication service unavailable.'
    });
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
