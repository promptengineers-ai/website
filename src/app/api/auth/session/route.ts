import { NextResponse } from 'next/server';
import {
  clearAuthCookie,
  getAuthFromCookies,
  refreshAuthToken,
  setAuthCookie,
  shouldRefreshToken,
} from '@/lib/jwt';

export async function GET() {
  const auth = getAuthFromCookies();

  if (!auth) {
    const response = NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    clearAuthCookie(response);
    return response;
  }

  const response = NextResponse.json(
    { user: auth.user },
    { status: 200 }
  );

  if (shouldRefreshToken(auth.payload)) {
    const refreshed = refreshAuthToken(auth.payload);
    setAuthCookie(response, refreshed);
  }

  return response;
}
