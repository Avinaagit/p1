'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface LoginFormProps {
  variant?: 'email' | 'google';
  onSuccess?: () => void;
}

export function LoginForm({ variant = 'email', onSuccess }: LoginFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState('employee');

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!data.success) {
        setError(data.error || 'Login failed');
        return;
      }

      // Route based on role
      if (data.data?.user?.role === 'ADMIN' || data.data?.user?.role === 'CONSULTANT') {
        router.push('/dashboard');
      } else {
        router.push('/dashboard');
      }
      onSuccess?.();
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (variant === 'google') {
    return (
      <button
        onClick={() => {
          // Implement Google OAuth flow
          // Redirect to Google OAuth endpoint
          const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
          const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/auth/google/callback`;
          window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=openid email profile`;
        }}
        className="w-full px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition"
      >
        Continue with Google
      </button>
    );
  }

  return (
    <form onSubmit={handleEmailLogin} className="space-y-4">
      {error && <div className="p-3 bg-red-100 text-red-700 rounded-lg text-sm">{error}</div>}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Select User Type</label>
        <select
          value={selectedRole}
          onChange={(e) => setSelectedRole(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={loading}
        >
          <option value="admin">Admin Account</option>
          <option value="consultant">HR Admin / Consultant</option>
          <option value="employee">Employee</option>
        </select>
        <p className="text-xs text-gray-500 mt-1">Select your role to use the appropriate login credentials</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={loading}
          placeholder={selectedRole === 'admin' ? 'admin@company.com' : selectedRole === 'consultant' ? 'consultant@company.com' : 'employee@company.com'}
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={loading}
          placeholder="password123"
          required
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 font-medium transition"
      >
        {loading ? 'Signing in...' : 'Sign In'}
      </button>
    </form>
  );
}
