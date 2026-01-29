'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { NotificationBell } from './NotificationBell';

export function Navigation() {
  const router = useRouter();
  const [showMenu, setShowMenu] = useState(false);
  const [userRole, setUserRole] = useState('EMPLOYEE');
  const initialTitle = useRef('');

  useEffect(() => {
    if (!initialTitle.current && typeof document !== 'undefined') {
      initialTitle.current = document.title || '';
    }

    const loadUserRole = async () => {
      try {
        const res = await fetch('/api/v1/auth/me');
        const data = await res.json();
        const role = data?.data?.user?.role;
        if (role) {
          setUserRole(role);
        }
      } catch {
        setUserRole('EMPLOYEE');
      }
    };

    loadUserRole();
  }, []);

  useEffect(() => {
    if (typeof document === 'undefined' || !initialTitle.current) return;

    const brandLabel =
      userRole === 'SYSTEM_ADMIN'
        ? 'System Admin'
        : userRole === 'HR'
        ? 'HR'
        : userRole === 'CONSULTANT' || userRole === 'ADMIN'
        ? 'Consultant'
        : 'Employee Pulse';

    if (userRole === 'EMPLOYEE') {
      document.title = initialTitle.current;
      return;
    }

    document.title = initialTitle.current.replace(/Employee Pulse/g, brandLabel);
  }, [userRole]);

  const brandLabel =
    userRole === 'SYSTEM_ADMIN'
      ? 'System Admin'
      : userRole === 'HR'
      ? 'HR'
      : userRole === 'CONSULTANT' || userRole === 'ADMIN'
      ? 'Consultant'
      : 'Employee Pulse';
  const isConsultantRole = userRole === 'CONSULTANT' || userRole === 'ADMIN';
  const showImportEmployees = userRole === 'ADMIN' && !isConsultantRole;
  const showEmployeesMenu = userRole !== 'EMPLOYEE' && userRole !== 'SYSTEM_ADMIN';
  const showAccountManagement = userRole === 'SYSTEM_ADMIN';
  const mainNavClass = userRole === 'SYSTEM_ADMIN'
    ? 'hidden'
    : 'hidden md:flex gap-8 items-center';

  const handleLogout = async () => {
    await fetch('/api/v1/auth/logout', { method: 'POST' });
    router.push('/');
  };

  return (
    <nav className="bg-transparent sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <div className="flex items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-xl">EP</span>
              </div>
              <h1 className="text-2xl font-bold text-white">
                {brandLabel}
              </h1>
            </div>
          </div>

          {showAccountManagement ? (
            <div className="flex gap-8 items-center">
              <a
                href="/account-management"
                className="nav-link transition font-semibold relative group"
              >
                <span className="flex items-center gap-2">
                  Account Management
                </span>
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-white group-hover:w-full transition-all duration-300"></span>
              </a>
            </div>
          ) : (
            <div className={mainNavClass}>
              <a
                href="/dashboard"
                className="nav-link transition font-semibold relative group"
              >
                <span className="flex items-center gap-2">
                  Dashboard
                </span>
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-white group-hover:w-full transition-all duration-300"></span>
              </a>
              <a
                href="/surveys"
                className="nav-link transition font-semibold relative group"
              >
                <span className="flex items-center gap-2">
                  Surveys
                </span>
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-white group-hover:w-full transition-all duration-300"></span>
              </a>
              {!isConsultantRole && (
                <a
                  href="/tasks"
                  className="nav-link transition font-semibold relative group"
                >
                  <span className="flex items-center gap-2">
                    Tasks
                  </span>
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-white group-hover:w-full transition-all duration-300"></span>
                </a>
              )}
              {showImportEmployees && (
                <a
                  href="/employees/import"
                  className="nav-link transition relative group text-white"
                >
                  <span className="flex items-center gap-2 text-sm font-medium">
                    Import Employees
                  </span>
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-white group-hover:w-full transition-all duration-300"></span>
                </a>
              )}
              <a
                href="/analytics"
                className="nav-link transition font-semibold relative group"
              >
                <span className="flex items-center gap-2">
                  Analytics
                </span>
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-white group-hover:w-full transition-all duration-300"></span>
              </a>
              {showEmployeesMenu && (
                <a
                  href="/employees"
                  className="nav-link transition font-semibold relative group"
                >
                  <span className="flex items-center gap-2">
                    Employees
                  </span>
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-white group-hover:w-full transition-all duration-300"></span>
                </a>
              )}
            </div>
          )}

          <div className="flex items-center gap-3">
            <NotificationBell />
            
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-2.5 text-white hover:text-white hover:bg-white/10 rounded-xl transition-all duration-200"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                </svg>
              </button>

              {showMenu && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowMenu(false)}
                  />
                  <div className="absolute right-0 mt-3 w-64 bg-[#0f1bb8] border border-white/10 rounded-xl shadow-2xl z-20 overflow-hidden">
                    <div className="p-2 flex flex-col gap-1">
                      {/* Main navigation links for mobile */}
                      {!showAccountManagement && (
                        <>
                          <a href="/dashboard" className="block px-4 py-2.5 text-white/90 hover:bg-white/10 hover:text-white rounded-lg transition-all duration-200 font-medium">Dashboard</a>
                          <a href="/surveys" className="block px-4 py-2.5 text-white/90 hover:bg-white/10 hover:text-white rounded-lg transition-all duration-200 font-medium">Surveys</a>
                          {!isConsultantRole && (
                            <a href="/tasks" className="block px-4 py-2.5 text-white/90 hover:bg-white/10 hover:text-white rounded-lg transition-all duration-200 font-medium">Tasks</a>
                          )}
                          {showImportEmployees && (
                            <a href="/employees/import" className="block px-4 py-2.5 text-white/90 hover:bg-white/10 hover:text-white rounded-lg transition-all duration-200 font-medium">Import Employees</a>
                          )}
                          <a href="/analytics" className="block px-4 py-2.5 text-white/90 hover:bg-white/10 hover:text-white rounded-lg transition-all duration-200 font-medium">Analytics</a>
                          {showEmployeesMenu && (
                            <a href="/employees" className="block px-4 py-2.5 text-white/90 hover:bg-white/10 hover:text-white rounded-lg transition-all duration-200 font-medium">Employees</a>
                          )}
                        </>
                      )}
                      {showAccountManagement && (
                        <a href="/account-management" className="block px-4 py-2.5 text-white/90 hover:bg-white/10 hover:text-white rounded-lg transition-all duration-200 font-medium">Account Management</a>
                      )}
                      <a
                        href="/notifications"
                        className="block px-4 py-2.5 text-white/90 hover:bg-white/10 hover:text-white rounded-lg transition-all duration-200 font-medium"
                      >
                        🔔 Notifications
                      </a>
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2.5 text-pink-200 hover:bg-white/10 rounded-lg transition-all duration-200 font-medium"
                      >
                        🚪 Logout
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
