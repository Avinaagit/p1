'use client';

import { useEffect, useState } from 'react';

interface ManagedUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  department: string | null;
  isActive: boolean;
  createdAt: string;
}

export function AccountManagement() {
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/account-management/users');
      const data = await res.json();
      if (!res.ok) {
        setError(data?.message || 'Хэрэглэгчийн мэдээлэл авахад алдаа гарлаа');
        return;
      }
      setUsers(data?.data || []);
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleResetPassword = async () => {
    setError('');
    setSuccess('');

    if (!selectedUserId) {
      setError('Хэрэглэгч сонгоно уу');
      return;
    }

    if (!newPassword || !confirmPassword) {
      setError('Нууц үгээ бөглөнө үү');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Нууц үг таарахгүй байна');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/v1/account-management/users/${selectedUserId}/password`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.message || 'Нууц үг солиход алдаа гарлаа');
        return;
      }

      setSuccess('Нууц үг амжилттай солигдлоо');
      setNewPassword('');
      setConfirmPassword('');
    } catch {
      setError('Network error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="bg-white rounded-lg shadow p-6 space-y-6">
      {error ? <div className="text-red-600">{error}</div> : null}
      {success ? <div className="text-green-600">{success}</div> : null}

      <div>
        <h2 className="text-xl font-semibold text-gray-900">Account Management</h2>
        <p className="text-sm text-gray-600 mt-1">System Admin хэрэглэгчийн нууц үгийг солих боломжтой.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="md:col-span-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">Хэрэглэгч</label>
          <select
            value={selectedUserId}
            onChange={(event) => setSelectedUserId(event.target.value)}
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="">Сонгох...</option>
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.firstName} {user.lastName} — {user.email}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Шинэ нууц үг</label>
          <input
            type="password"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Давтан нууц үг</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleResetPassword}
          disabled={saving}
          className="px-4 py-2 rounded bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-60"
        >
          {saving ? 'Сольж байна...' : 'Нууц үг солих'}
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm text-left">
          <thead>
            <tr className="border-b">
              <th className="py-2 px-3 font-semibold">Нэр</th>
              <th className="py-2 px-3 font-semibold">И-мэйл</th>
              <th className="py-2 px-3 font-semibold">Role</th>
              <th className="py-2 px-3 font-semibold">Хэлтэс</th>
              <th className="py-2 px-3 font-semibold">Идэвх</th>
              <th className="py-2 px-3 font-semibold">Бүртгэсэн огноо</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-b last:border-0">
                <td className="py-2 px-3">{user.firstName} {user.lastName}</td>
                <td className="py-2 px-3">{user.email}</td>
                <td className="py-2 px-3">{user.role}</td>
                <td className="py-2 px-3">{user.department || '—'}</td>
                <td className="py-2 px-3">{user.isActive ? 'Идэвхтэй' : 'Идэвхгүй'}</td>
                <td className="py-2 px-3">{new Date(user.createdAt).toLocaleDateString('mn-MN')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
