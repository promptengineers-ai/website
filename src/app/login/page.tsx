'use client';

import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import AuthForm from '@/components/auth/AuthForm';
import { useAuth } from '@/components/auth/AuthProvider';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const registered = searchParams.get('registered');
  const { login } = useAuth();

  const handleLogin = async (data: { email: string; password: string }) => {
    try {
      await login({ email: data.email, password: data.password });
      router.push('/profile');
      router.refresh();
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
