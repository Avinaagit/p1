import { LoginForm } from './_components/LoginForm';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Employee Pulse</h1>
            <p className="text-gray-600 mt-2">
              Democratizing Employee Listening & Engagement
            </p>
          </div>

          <div className="space-y-6">
            {/* Google OAuth Button */}
            <LoginForm variant="google" />

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Or continue with email</span>
              </div>
            </div>

            {/* Email Login */}
            <LoginForm variant="email" />
          </div>

          {/* Information section */}
          <div className="mt-8 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-2">Demo Credentials:</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• <span className="font-semibold">Admin:</span> admin@company.com / password123</li>
              <li>• <span className="font-semibold">HR Admin:</span> consultant@company.com / password123</li>
              <li>• <span className="font-semibold">Employee:</span> employee@company.com / password123</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
