import { verifyToken, type JwtPayload } from './jwt';

export const SESSION_COOKIE = 'bloodnet_session';
export const ADMIN_ROLES = ['ADMIN', 'MANAGER'] as const;
export const USER_ROLE = 'USER' as const;

const extractCookies = (cookieHeader: string | null): Record<string, string> => {
  if (!cookieHeader) {
    return {};
  }

  return cookieHeader.split(';').reduce<Record<string, string>>((acc, entry) => {
    const [rawKey, ...rawValue] = entry.trim().split('=');
    if (!rawKey) {
      return acc;
    }
    acc[rawKey] = decodeURIComponent(rawValue.join('=') || '');
    return acc;
  }, {});
};

export const extractTokenFromRequest = (req: Request): string | null => {
  const authHeader = req.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const bearerToken = authHeader.slice('Bearer '.length).trim();
    if (bearerToken) {
      return bearerToken;
    }
  }

  const cookies = extractCookies(req.headers.get('cookie'));
  return cookies[SESSION_COOKIE] || null;
};

export const getSessionFromRequest = (req: Request): JwtPayload | null => {
  const token = extractTokenFromRequest(req);
  if (!token) {
    return null;
  }
  return verifyToken(token);
};

export const hasRequiredRole = (session: JwtPayload, allowedRoles: readonly string[]): boolean => {
  return allowedRoles.includes(session.role);
};
