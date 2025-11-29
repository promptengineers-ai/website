'use client';

import { useRouter } from 'next/navigation';
import AuthForm from '@/components/auth/AuthForm';
import { useAuth } from '@/components/auth/AuthProvider';

export default function SignupPage() {
  const router = useRouter();
  const { register } = useAuth();

  const handleSignup = async (data: { email: string; password: string; name?: string }) => {
    await register({ email: data.email, password: data.password, name: data.name || '' });
    router.push('/profile');
    router.refresh();
  };

  return <AuthForm type="signup" onSubmit={handleSignup} />;
}
