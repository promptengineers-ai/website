import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Simple middleware that checks for NextAuth session cookie
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protected paths that require authentication
  const protectedPaths = ['/profile'];
  const isProtectedPath = protectedPaths.some((path) => pathname.startsWith(path));

  if (isProtectedPath) {
    // Check if NextAuth session token exists
    const token = request.cookies.get('next-auth.session-token') ||
                  request.cookies.get('__Secure-next-auth.session-token');

    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/profile/:path*'],
};
