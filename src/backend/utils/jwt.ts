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
  return jwt.sign(payload, getJwtSecret(), { expiresIn: '365d' });
};

/**
 * Verifies a JWT token
 * @param token - JWT token string
 * @returns {JwtPayload | null} Decoded payload or null if invalid
 */
export const verifyToken = (token: string): JwtPayload | null => {
  try {
    return jwt.verify(token, getJwtSecret()) as JwtPayload;
  } catch (err) {
    return null;
  }
};
