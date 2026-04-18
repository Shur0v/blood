import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key_change_in_prod';

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
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
};

/**
 * Verifies a JWT token
 * @param token - JWT token string
 * @returns {JwtPayload | null} Decoded payload or null if invalid
 */
export const verifyToken = (token: string): JwtPayload | null => {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
  } catch (err) {
    return null;
  }
};
