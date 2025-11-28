'use client';

import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import AuthForm from '@/components/auth/AuthForm';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const registered = searchParams.get('registered');

  const handleLogin = async (data: { email: string; password: string }) => {
    try {
      const result = await signIn('credentials', {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      console.log('Login result:', result);

      if (result?.error) {
        throw new Error('Invalid email or password');
      }

      if (result?.ok) {
        // Wait a bit for the session to be established
        await new Promise(resolve => setTimeout(resolve, 100));
        router.push('/profile');
        router.refresh();
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  return (
    <div>
      {registered && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 max-w-md mx-auto p-4 bg-green-900/50 border border-green-700 rounded-md">
          <p className="text-green-200 text-center">
            Account created successfully! Please sign in.
          </p>
        </div>
      )}
      <AuthForm type="login" onSubmit={handleLogin} />
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-black text-white">Loading...</div>}>
      <LoginContent />
    </Suspense>
  );
}
