'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function Navigation() {
  const router = useRouter();
  const [showMenu, setShowMenu] = useState(false);

  const handleLogout = async () => {
    await fetch('/api/v1/auth/logout', { method: 'POST' });
    router.push('/');
  };

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <h1 className="text-xl font-bold text-blue-600">Employee Pulse</h1>
          </div>

          <div className="hidden md:flex gap-6 items-center">
            <a
              href="/dashboard"
              className="text-gray-700 hover:text-blue-600 transition font-medium"
            >
              Dashboard
            </a>
            <a
              href="/surveys"
              className="text-gray-700 hover:text-blue-600 transition font-medium"
            >
              Surveys
            </a>
            <a
              href="/tasks"
              className="text-gray-700 hover:text-blue-600 transition font-medium"
            >
              Tasks
            </a>
            <a
              href="/analytics"
              className="text-gray-700 hover:text-blue-600 transition font-medium"
            >
              Analytics
            </a>
          </div>

          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
            >
              ⚙️
            </button>

            {showMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg">
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 transition"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
