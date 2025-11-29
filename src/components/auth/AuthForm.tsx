'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { FiEye, FiEyeOff, FiArrowLeft } from 'react-icons/fi';

type AuthFormProps = {
  type: 'login' | 'signup';
  onSubmit: (data: { email: string; password: string; name?: string }) => Promise<void>;
};

export default function AuthForm({ type, onSubmit }: AuthFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate password confirmation for signup
    if (type === 'signup' && password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      await onSubmit({ email, password, name: type === 'signup' ? name : undefined });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
          >
            <FiArrowLeft className="h-4 w-4" />
            Go Home
          </Link>
        </div>

        {/* Logo */}
        <div className="flex justify-center">
          <div className="text-6xl">🤖</div>
        </div>

        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-white">
            {type === 'login' ? 'Sign in to your account' : 'Create your account'}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-400">
            {type === 'login' ? (
              <>
                Or{' '}
                <Link href="/signup" className="font-medium text-blue-400 hover:text-blue-300">
                  create a new account
                </Link>
              </>
            ) : (
              <>
                Already have an account?{' '}
                <Link href="/login" className="font-medium text-blue-400 hover:text-blue-300">
                  Sign in
                </Link>
              </>
            )}
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            {type === 'signup' && (
              <div>
                <label htmlFor="name" className="sr-only">
                  Full Name
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="appearance-none relative block w-full px-3 py-3 border border-gray-700 bg-gray-900 placeholder-gray-500 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent sm:text-sm"
                  placeholder="Full Name"
                />
              </div>
            )}
            <div>
              <label htmlFor="email" className="sr-only">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="appearance-none relative block w-full px-3 py-3 border border-gray-700 bg-gray-900 placeholder-gray-500 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent sm:text-sm"
                placeholder="Email address"
              />
            </div>
            <div className="relative">
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete={type === 'login' ? 'current-password' : 'new-password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="appearance-none relative block w-full px-3 py-3 pr-10 border border-gray-700 bg-gray-900 placeholder-gray-500 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent sm:text-sm"
                placeholder="Password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-300"
              >
                {showPassword ? <FiEyeOff className="h-5 w-5" /> : <FiEye className="h-5 w-5" />}
              </button>
            </div>
            {type === 'signup' && (
              <div className="relative">
                <label htmlFor="confirmPassword" className="sr-only">
                  Confirm Password
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="appearance-none relative block w-full px-3 py-3 pr-10 border border-gray-700 bg-gray-900 placeholder-gray-500 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent sm:text-sm"
                  placeholder="Confirm Password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-300"
                >
                  {showConfirmPassword ? <FiEyeOff className="h-5 w-5" /> : <FiEye className="h-5 w-5" />}
                </button>
              </div>
            )}
          </div>

          {type === 'signup' && (
            <div className="text-sm text-gray-400 bg-gray-900 border border-gray-700 rounded-md p-4">
              <p className="mb-2 font-medium text-white">Password must contain:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>At least 8 characters</li>
                <li>One uppercase letter</li>
                <li>One lowercase letter</li>
                <li>One number</li>
              </ul>
            </div>
          )}

          {error && (
            <div className="rounded-md bg-red-900/50 border border-red-700 p-4">
              <div className="text-sm text-red-200">{error}</div>
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 focus:ring-offset-black disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              {loading ? 'Processing...' : type === 'login' ? 'Sign in' : 'Sign up'}
            </button>
          </div>

          {type === 'login' && (
            <div className="text-center text-sm">
              <p className="text-gray-400">
                Forgot your password?{' '}
                <a
                  href="https://www.linkedin.com/company/prompt-engineers-ai"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-blue-400 hover:text-blue-300"
                >
                  Contact us on LinkedIn
                </a>
              </p>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
