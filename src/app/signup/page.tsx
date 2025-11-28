'use client';

import { useRouter } from 'next/navigation';
import AuthForm from '@/components/auth/AuthForm';

export default function SignupPage() {
  const router = useRouter();

  const handleSignup = async (data: { email: string; password: string; name?: string }) => {
    const response = await fetch('/api/users/signup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Signup failed');
    }

    // Redirect to login page after successful signup
    router.push('/login?registered=true');
  };

  return <AuthForm type="signup" onSubmit={handleSignup} />;
}
