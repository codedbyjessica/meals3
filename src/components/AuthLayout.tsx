import { ReactNode } from 'react';

interface AuthLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
}

export default function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold bg-gradient-to-r from-pink-600 via-purple-600 to-blue-600 bg-clip-text text-transparent">
            {title}
          </h2>
          {subtitle && (
            <p className="mt-2 text-center text-sm text-gray-600">
              {subtitle}
            </p>
          )}
        </div>
        
        <div className="mt-4 space-y-6">
          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-purple-200 p-6">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
} 