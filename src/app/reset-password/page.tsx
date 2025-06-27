"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Loading from '@/components/Loading';
import AuthLayout from '@/components/AuthLayout';

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [formError, setFormError] = useState('');
  const [success, setSuccess] = useState(false);
  const { updatePassword, loading, error, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      router.push('/planner');
    }
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(''); // Clear any previous form errors
    setSuccess(false);

    if (password !== confirmPassword) {
      setFormError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setFormError('Password must be at least 6 characters long');
      return;
    }

    try {
      await updatePassword(password);
      setSuccess(true);
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } catch {
      // Error is handled by the useAuth hook
    }
  };

  return (
    <AuthLayout 
      title="Set New Password" 
      subtitle="Enter your new password below"
    >
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="space-y-4">
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              New Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              className="appearance-none relative block w-full px-3 py-2 border border-purple-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-transparent bg-white/90"
              placeholder="New password (min 6 characters)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700 mb-1">
              Confirm New Password
            </label>
            <input
              id="confirm-password"
              name="confirm-password"
              type="password"
              autoComplete="new-password"
              required
              className="appearance-none relative block w-full px-3 py-2 border border-purple-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-transparent bg-white/90"
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
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
            Password updated successfully! Redirecting to login...
          </div>
        )}

        <div className="mt-4">
          <button
            type="submit"
            disabled={loading || success}
            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md"
          >
            {loading ? (
              <div className="flex items-center">
                <Loading size="xs" inline />
                <span className="ml-2">Updating password...</span>
              </div>
            ) : (
              'Update Password'
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