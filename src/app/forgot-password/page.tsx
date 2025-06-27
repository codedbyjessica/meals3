"use client";

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';
import Loading from '@/components/Loading';
import AuthLayout from '@/components/AuthLayout';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [formError, setFormError] = useState('');
  const [success, setSuccess] = useState(false);
  const { resetPassword, loading, error } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(''); // Clear any previous form errors
    setSuccess(false);

    try {
      await resetPassword(email);
      setSuccess(true);
    } catch {
      // Error is handled by the useAuth hook
    }
  };

  return (
    <AuthLayout 
      title="Reset Password" 
      subtitle="Enter your email address and we&apos;ll send you a link to reset your password"
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
        </div>

        {(error || formError) && (
          <div className="mt-4 text-red-600 text-sm text-center bg-red-50 p-3 rounded-lg border border-red-200">
            {formError || error}
          </div>
        )}

        {success && (
          <div className="mt-4 text-green-600 text-sm text-center bg-green-50 p-3 rounded-lg border border-green-200">
            Password reset email sent! Check your inbox and follow the link to reset your password.
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
                <span className="ml-2">Sending...</span>
              </div>
            ) : (
              'Send Reset Link'
            )}
          </button>
        </div>

        <div className="mt-4 text-center">
          <Link
            href="/login"
            className="text-purple-600 hover:text-purple-800 text-sm font-medium transition-colors"
          >
            Back to Sign In
          </Link>
        </div>
      </form>
    </AuthLayout>
  );
} 