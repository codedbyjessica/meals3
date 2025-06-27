"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Loading from '@/components/Loading';
import AuthLayout from '@/components/AuthLayout';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState('');
  const { login, loading, error, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      router.push('/planner');
    }
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(''); // Clear any previous form errors

    try {
      await login(email, password);
    } catch {
      // Error is handled by the useAuth hook
    }
  };

  return (
    <AuthLayout 
      title="Crumb" 
      subtitle="Sign in to your account"
    >
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="space-y-4">
          <div>
            <label htmlFor="email-address" className="block text-sm font-medium text-gray-700 mb-1">
              Email address
            </label>
            <input
              id="email-address"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="appearance-none relative block w-full px-3 py-2 border border-purple-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-transparent bg-white/90"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className="appearance-none relative block w-full px-3 py-2 border border-purple-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-transparent bg-white/90"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
        </div>

        {(error || formError) && (
          <div className="mt-4 text-red-600 text-sm text-center bg-red-50 p-3 rounded-lg border border-red-200">
            {formError || error}
          </div>
        )}

        <div className="mt-4">
          <button
            type="submit"
            disabled={loading}
            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md"
          >
            {loading ? (
              <div className="flex items-center">
                <Loading size="xs" inline />
                <span className="ml-2">Signing in...</span>
              </div>
            ) : (
              'Sign In'
            )}
          </button>
        </div>

        <div className="mt-4 text-center space-y-2">
          <Link
            href="/forgot-password"
            className="text-purple-600 hover:text-purple-800 text-sm font-medium transition-colors block"
          >
            Forgot your password?
          </Link>
          <Link
            href="/signup"
            className="text-purple-600 hover:text-purple-800 text-sm font-medium transition-colors block"
          >
            Don&apos;t have an account? Sign up
          </Link>
        </div>
      </form>
    </AuthLayout>
  );
} 