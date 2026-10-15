import jwt from 'jsonwebtoken';

let cachedSecret: string | null = null;

const getJwtSecret = (): string => {
  if (cachedSecret) {
    return cachedSecret;
  }

  const secret = process.env.JWT_SECRET;
  if (!secret || secret.trim().length < 32) {
    throw new Error('JWT_SECRET must be configured and at least 32 characters long.');
  }

  cachedSecret = secret;
  return cachedSecret;
};

export interface JwtPayload {
  user_id: string;
  role: string;
}

/**
 * Signs a custom JWT token
 * @param payload - Expected data: { user_id, role }
 * @returns {string} Signed JWT token
 */
export const signToken = (payload: JwtPayload): string => {
  return jwt.sign(payload, getJwtSecret(), { algorithm: 'HS256', expiresIn: payload.role === 'USER' ? '365d' : '8h' });
};

/**
 * Verifies a JWT token
 * @param token - JWT token string
 * @returns {JwtPayload | null} Decoded payload or null if invalid
 */
export const verifyToken = (token: string): JwtPayload | null => {
  try {
    const decoded = jwt.verify(token, getJwtSecret(), { algorithms: ['HS256'] });
    if (typeof decoded !== 'object' || typeof decoded.user_id !== 'string' || !decoded.user_id || !['USER','ADMIN','MANAGER'].includes(decoded.role) || typeof decoded.exp !== 'number' || typeof decoded.iat !== 'number') return null;
    // Also bound old privileged cookies minted before the shorter lifetime.
    if (decoded.role !== 'USER' && Date.now()/1000 - decoded.iat > 8*60*60) return null;
    return { user_id: decoded.user_id, role: decoded.role };
  } catch (err) {
    return null;
  }
};
