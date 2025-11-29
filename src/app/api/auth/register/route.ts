import { NextResponse } from 'next/server';
import { createUser, getUserByEmail } from '@/lib/models/User';
import { hashPassword, validateEmail, validatePassword } from '@/lib/auth';
import { initializeDatabase } from '@/lib/initDb';
import { setAuthCookie, signAuthToken } from '@/lib/jwt';

let dbInitialized = false;

export async function POST(request: Request) {
  try {
    if (!dbInitialized) {
      await initializeDatabase();
      dbInitialized = true;
    }

    const body = await request.json();
    const { email, password, name } = body;

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'Email, password, and name are required' },
        { status: 400 }
      );
    }

    if (!validateEmail(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return NextResponse.json(
        { error: 'Password does not meet requirements', details: passwordValidation.errors },
        { status: 400 }
      );
    }

    const existingUser = await getUserByEmail(email);
    if (existingUser) {
      return NextResponse.json(
        { error: 'Email is already registered' },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password);
    const user = await createUser({
      email,
      passwordHash,
      name,
    });

    const token = signAuthToken({
      id: user._id,
      email: user.email,
      name: user.name,
    });

    const response = NextResponse.json(
      {
        message: 'User created successfully',
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
        },
      },
      { status: 201 }
    );

    setAuthCookie(response, token);
    return response;
  } catch (error) {
    console.error('Register error:', error);
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    );
  }
}
