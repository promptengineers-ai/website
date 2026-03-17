import { NextResponse } from 'next/server';
import {
  clearAuthCookie,
  getAuthFromCookies,
  refreshAuthToken,
  setAuthCookie,
  shouldRefreshToken,
} from '@/lib/jwt';
import { getUserById } from '@/lib/models/User';

export async function GET() {
  const auth = getAuthFromCookies();

  if (!auth) {
    const response = NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    clearAuthCookie(response);
    return response;
  }

  // Include isAdmin flag
  const dbUser = await getUserById(auth.user.id);
  const userWithAdmin = {
    ...auth.user,
    isAdmin: dbUser?.isAdmin || false,
  };

  const response = NextResponse.json(
    { user: userWithAdmin },
    { status: 200 }
  );

  if (shouldRefreshToken(auth.payload)) {
    const refreshed = refreshAuthToken(auth.payload);
    setAuthCookie(response, refreshed);
  }

  return response;
}
