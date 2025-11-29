import NextAuth from 'next-auth';
import type { NextAuthConfig } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';

export const authConfig: NextAuthConfig = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password are required');
        }

        try {
          // Dynamic import to avoid loading MongoDB in middleware
          const { getUserByEmail } = await import('@/lib/models/User');
          const { verifyPassword } = await import('@/lib/auth');

          const user = await getUserByEmail(credentials.email as string);

          if (!user) {
            throw new Error('Invalid credentials');
          }

          const isValid = await verifyPassword(credentials.password as string, user.passwordHash);

          if (!isValid) {
            throw new Error('Invalid credentials');
          }

          return {
            id: user._id,
            email: user.email,
            name: user.name,
          };
        } catch (error) {
          console.error('Auth error:', error);
          throw new Error('Authentication failed');
        }
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === 'production'
        ? '__Secure-next-auth.session-token'
        : 'next-auth.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },
  pages: {
    signIn: '/login',
    signOut: '/',
    error: '/login',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
  trustHost: true,
  debug: process.env.NODE_ENV === 'development',
  logger: {
    error(error) {
      console.error('NextAuth Error:', error);
    },
    warn(message) {
      console.warn('NextAuth Warning:', message);
    },
    debug(message) {
      if (process.env.NODE_ENV === 'development') {
        console.log('NextAuth Debug:', message);
      }
    },
  },
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
