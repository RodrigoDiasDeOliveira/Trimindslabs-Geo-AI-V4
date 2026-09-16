import { createHmac, randomBytes, timingSafeEqual } from 'crypto';

const AUTH_SECRET = process.env.AUTH_SECRET || 'triminds_geoai_runtime_secret_key_v4';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD; // If undefined, auth runs in AUTH_DISABLED dev mode
const OPERATOR_PASSWORD = process.env.OPERATOR_PASSWORD;

export interface TokenPayload {
  username: string;
  role: 'admin' | 'operador';
  name: string;
  iat: number;
  exp: number;
}

/**
 * Creates a signed JWT-style token using HMAC-SHA256.
 */
export function createSignedToken(payload: Omit<TokenPayload, 'iat' | 'exp'>): string {
  const iat = Math.floor(Date.now() / 1000);
  const exp = iat + 60 * 60 * 24; // 24h validity
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
    return { valid: false, error: 'Token não fornecido' };
  }

  const parts = token.split('.');
  if (parts.length !== 3) {
    return { valid: false, error: 'Formato de token inválido' };
  }

  const [header, body, signature] = parts;
  const expectedSignature = createHmac('sha256', AUTH_SECRET)
    .update(`${header}.${body}`)
    .digest('base64url');

  if (signature !== expectedSignature) {
    return { valid: false, error: 'Assinatura criptográfica inválida' };
  }

  try {
    const payload: TokenPayload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    const now = Math.floor(Date.now() / 1000);

    if (payload.exp && payload.exp < now) {
      return { valid: false, error: 'Token expirado' };
    }

    return { valid: true, payload };
  } catch {
    return { valid: false, error: 'Payload corrompido' };
  }
}

/**
 * Checks if authentication is configured with environment secrets or in AUTH_DISABLED mode.
 */
export function getAuthConfiguration() {
  const isAuthRequired = Boolean(ADMIN_PASSWORD || OPERATOR_PASSWORD);
  return {
    mode: isAuthRequired ? 'AUTH_ENABLED' : 'AUTH_DISABLED',
    adminPasswordConfigured: Boolean(ADMIN_PASSWORD),
    operatorPasswordConfigured: Boolean(OPERATOR_PASSWORD)
  };
}

/**
 * Authenticates login credentials without any hardcoded passwords.
 */
export function authenticateUser(role: 'admin' | 'operador', password?: string) {
  const authConfig = getAuthConfiguration();

  // If AUTH_DISABLED mode is active (no env password set), allow direct login
  if (authConfig.mode === 'AUTH_DISABLED') {
    const user = {
      username: role,
      role,
      name: role === 'admin' ? 'Administrador GeoAI' : 'Operador de Imagens',
      loginTime: new Date().toISOString()
    };
    const token = createSignedToken(user);
    return {
      success: true,
      mode: 'AUTH_DISABLED',
      token,
      user,
      message: 'Autenticação executada em modo AUTH_DISABLED (Desenvolvimento / Cloud Run inicial).'
    };
  }

  // If AUTH_ENABLED, verify password against environment variable
  const expectedPassword = role === 'admin' ? ADMIN_PASSWORD : (OPERATOR_PASSWORD || ADMIN_PASSWORD);
  if (!password || !expectedPassword) {
    return { success: false, error: 'Senha é obrigatória.' };
  }

  // Safe constant-time string comparison
  const passBuf = Buffer.from(password);
  const expBuf = Buffer.from(expectedPassword);

  if (passBuf.length !== expBuf.length || !timingSafeEqual(passBuf, expBuf)) {
    return { success: false, error: 'Senha incorreta para as credenciais configuradas no ambiente.' };
  }

  const user = {
    username: role,
    role,
    name: role === 'admin' ? 'Administrador GeoAI' : 'Operador de Imagens',
    loginTime: new Date().toISOString()
  };
  const token = createSignedToken(user);

  return {
    success: true,
    mode: 'AUTH_ENABLED',
    token,
    user
  };
}
