'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export function RoleGuard({ blockedRoles }: { blockedRoles: string[] }) {
  const router = useRouter();

  useEffect(() => {
    const checkRole = async () => {
      try {
        const res = await fetch('/api/v1/auth/me');
        const data = await res.json();
        const role = data?.data?.user?.role;
        if (role && blockedRoles.includes(role)) {
          router.replace('/dashboard');
        }
      } catch {
        // ignore
      }
    };

    checkRole();
  }, [blockedRoles, router]);

  return null;
}
