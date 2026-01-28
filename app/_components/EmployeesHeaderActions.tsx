'use client';

import { useEffect, useState } from 'react';

export function EmployeesHeaderActions() {
  const [role, setRole] = useState('EMPLOYEE');

  useEffect(() => {
    const loadRole = async () => {
      try {
        const res = await fetch('/api/v1/auth/me');
        const data = await res.json();
        if (data?.data?.user?.role) {
          setRole(data.data.user.role);
        }
      } catch {
        setRole('EMPLOYEE');
      }
    };

    loadRole();
  }, []);

  if (role !== 'HR') {
    return null;
  }

  return (
    <div className="flex items-center gap-3">
      <a
        href="/api/v1/employees/export?format=csv"
        className="px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 font-medium transition"
      >
        Export Employees
      </a>
      <a
        href="/employees/import"
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition"
      >
        Import Employees
      </a>
    </div>
  );
}
