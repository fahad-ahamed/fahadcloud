import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

function getSecret() {
  if (!process.env.JWT_SECRET) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('FATAL: JWT_SECRET environment variable must be set in production');
    }
    console.warn('[AUTH] WARNING: Using fallback JWT secret. Set JWT_SECRET env var for production.');
  }
  return new TextEncoder().encode(process.env.JWT_SECRET || 'fallback-dev-secret-change-in-prod');
}

let _secret: Uint8Array | null = null;
function secret() {
  if (!_secret) _secret = getSecret();
  return _secret;
}

interface TokenPayload {
  userId: string;
  email: string;
  role?: string;
  purpose?: string;
  [key: string]: any;
}

export async function createToken(payload: TokenPayload, expiresIn?: string) {
  const jwt = new SignJWT(payload as any)
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime(expiresIn || '7d');
  return jwt.sign(secret());
}

export async function verifyToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, secret());
    return payload as any;
  } catch { return null; }
}

export async function getCurrentUser() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('fahadcloud-token')?.value;
    if (!token) return null;
    return verifyToken(token);
  } catch { return null; }
}
