import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import type { NextRequest, NextResponse } from 'next/server';

export const AUTH_COOKIE_NAME = 'auth-token';
export const JWT_MAX_AGE_SECONDS = 30 * 24 * 60 * 60; // 30 days
const REFRESH_THRESHOLD_SECONDS = 7 * 24 * 60 * 60; // 7 days

export type AuthUser = {
  id: string;
  email: string;
  name?: string;
};

export type AuthPayload = jwt.JwtPayload & {
  sub: string;
  email: string;
  name?: string;
};

export function getJwtSecret() {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) {
    throw new Error('NEXTAUTH_SECRET is not set');
  }
  return secret;
}

export function signAuthToken(user: AuthUser) {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      name: user.name,
    },
    getJwtSecret(),
    { algorithm: 'HS256', expiresIn: JWT_MAX_AGE_SECONDS }
  );
}

export function verifyAuthToken(token: string): AuthPayload {
  const decoded = jwt.verify(token, getJwtSecret());
  if (typeof decoded === 'string' || !decoded.sub || !decoded.email) {
    throw new Error('Invalid auth token payload');
  }
  return decoded as AuthPayload;
}

export function payloadToUser(payload: AuthPayload): AuthUser {
  return {
    id: payload.sub,
    email: payload.email,
    name: payload.name,
  };
}

export function shouldRefreshToken(payload: AuthPayload) {
  const now = Math.floor(Date.now() / 1000);
  return payload.exp !== undefined && payload.exp - now <= REFRESH_THRESHOLD_SECONDS;
}

export function refreshAuthToken(payload: AuthPayload) {
  return signAuthToken(payloadToUser(payload));
}

export function setAuthCookie(response: NextResponse, token: string) {
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

export function clearAuthCookie(response: NextResponse) {
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

export function getAuthFromCookies() {
  const token = cookies().get(AUTH_COOKIE_NAME)?.value;
  if (!token) return null;

  try {
    const payload = verifyAuthToken(token);
    return {
      token,
      payload,
      user: payloadToUser(payload),
    };
  } catch (error) {
    console.error('Auth token verification failed:', error);
    return null;
  }
}

export function getAuthFromRequest(request: NextRequest) {
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  if (!token) return null;

  try {
    const payload = verifyAuthToken(token);
    return {
      token,
      payload,
      user: payloadToUser(payload),
    };
  } catch (error) {
    console.error('Auth token verification failed:', error);
    return null;
  }
}
