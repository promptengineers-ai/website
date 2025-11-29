import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { SignJWT, jwtVerify } from 'jose';

const AUTH_COOKIE_NAME = 'auth-token';
const JWT_MAX_AGE_SECONDS = 30 * 24 * 60 * 60; // 30 days
const REFRESH_THRESHOLD_SECONDS = 7 * 24 * 60 * 60; // 7 days

function getSecretKey() {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) {
    throw new Error('NEXTAUTH_SECRET is not set');
  }
  return new TextEncoder().encode(secret);
}

function setAuthCookie(response: NextResponse, token: string) {
  response.cookies.set({
    name: AUTH_COOKIE_NAME,
    value: token,
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: JWT_MAX_AGE_SECONDS,
  });
}

function clearAuthCookie(response: NextResponse) {
  response.cookies.set({
    name: AUTH_COOKIE_NAME,
    value: '',
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0,
  });
}

async function verifyToken(token: string) {
  return jwtVerify(token, getSecretKey(), {
    algorithms: ['HS256'],
  });
}

async function refreshToken(payload: { sub?: string; email?: string; name?: string }) {
  return new SignJWT({
    sub: payload.sub,
    email: payload.email,
    name: payload.name,
  })
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setIssuedAt()
    .setExpirationTime(`${JWT_MAX_AGE_SECONDS}s`)
    .sign(getSecretKey());
}

function shouldRefresh(exp?: number) {
  if (!exp) return false;
  const now = Math.floor(Date.now() / 1000);
  return exp - now <= REFRESH_THRESHOLD_SECONDS;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const protectedPaths = ['/profile'];
  const isProtectedPath = protectedPaths.some((path) => pathname.startsWith(path));

  if (!isProtectedPath) {
    return NextResponse.next();
  }

  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;

  if (!token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  try {
    const { payload } = await verifyToken(token);
    const response = NextResponse.next();

    if (shouldRefresh(typeof payload.exp === 'number' ? payload.exp : undefined)) {
      const refreshed = await refreshToken({
        sub: typeof payload.sub === 'string' ? payload.sub : undefined,
        email: typeof payload.email === 'string' ? payload.email : undefined,
        name: typeof payload.name === 'string' ? payload.name : undefined,
      });
      setAuthCookie(response, refreshed);
    }

    return response;
  } catch (error) {
    console.error('Auth middleware error:', error);
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('from', pathname);
    const response = NextResponse.redirect(loginUrl);
    clearAuthCookie(response);
    return response;
  }
}

export const config = {
  matcher: ['/profile/:path*'],
};
