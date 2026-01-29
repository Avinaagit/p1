'use client';

import { useEffect, useState } from 'react';

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  department: string | null;
  companyName?: string | null;
  locationName?: string | null;
  role: string;
  isActive: boolean;
  createdAt: string;
}

export function EmployeeList() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userRole, setUserRole] = useState('EMPLOYEE');
  const [userDepartment, setUserDepartment] = useState('');
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState({
    companyName: '',
    locationName: '',
    firstName: '',
    lastName: '',
    email: '',
    department: '',
    isActive: true,
  });
  const [formValues, setFormValues] = useState({
    firstName: '',
    lastName: '',
    email: '',
    department: '',
    companyName: '',
    locationName: '',
  });
  const [searchQuery, setSearchQuery] = useState('');
  const companyNames = ['Employee Pulse LLC', 'Blue Horizon LLC', 'Nomad Tech LLC'];
  const locationNames = ['Улаанбаатар', 'Дархан', 'Эрдэнэт'];

  const fetchEmployees = async (role: string) => {
    setLoading(true);
    try {
      const scopeParam = role === 'CONSULTANT' || role === 'ADMIN' ? '?scope=all' : '';
      const res = await fetch(`/api/v1/employees${scopeParam}`);
      const data = await res.json();

      if (!res.ok) {
        setError(data?.message || 'Ажилтны мэдээлэл авахад алдаа гарлаа');
        return;
      }

      setEmployees(data?.data || []);
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        const res = await fetch('/api/v1/auth/me');
        const data = await res.json();
        if (data?.data?.user?.role) {
          setUserRole(data.data.user.role);
        }
        if (data?.data?.user?.department) {
          setUserDepartment(data.data.user.department);
        }
      } catch {
        setUserRole('EMPLOYEE');
      }
    };

    fetchUserRole();
  }, []);

  useEffect(() => {
    if (userRole) {
      fetchEmployees(userRole);
    }
  }, [userRole]);

  useEffect(() => {
    if (userRole === 'HR' && userDepartment && !formValues.department) {
      setFormValues((prev) => ({ ...prev, department: userDepartment }));
    }
  }, [userRole, userDepartment, formValues.department]);

  if (loading) {
    return <div className="p-4">Loading employees...</div>;
  }

  const handleInputChange = (field: keyof typeof formValues, value: string) => {
    setFormValues((prev) => ({ ...prev, [field]: value }));
  };

  const handleEditChange = (field: keyof typeof editValues, value: string | boolean) => {
    setEditValues((prev) => ({ ...prev, [field]: value }));
  };

  const startEditing = (employee: Employee) => {
    setEditingId(employee.id);
    setFormError('');
    setFormSuccess('');
    setEditValues({
      companyName: employee.companyName || '',
      locationName: employee.locationName || '',
      firstName: employee.firstName || '',
      lastName: employee.lastName || '',
      email: employee.email || '',
      department: employee.department || '',
      isActive: employee.isActive,
    });
  };

  const cancelEditing = () => {
    setEditingId(null);
  };

  const hashString = (value: string) =>
    value
      .split('')
      .reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const getCompanyName = (email: string) =>
    companyNames[hashString(email) % companyNames.length];
  const getLocationName = (email: string) =>
    locationNames[hashString(email) % locationNames.length];
  const normalizedQuery = searchQuery.trim().toLowerCase();
  const filteredEmployees = employees.filter((employee) => {
    if (!normalizedQuery) return true;
    const fullName = `${employee.firstName} ${employee.lastName}`.toLowerCase();
    return (
      fullName.includes(normalizedQuery) ||
      employee.email.toLowerCase().includes(normalizedQuery) ||
      (employee.department || '').toLowerCase().includes(normalizedQuery)
    );
  });

  const handleCreateEmployee = async () => {
    setFormError('');
    setFormSuccess('');

    if (!formValues.firstName.trim() || !formValues.lastName.trim() || !formValues.email.trim()) {
      setFormError('Нэр, овог, и-мэйл заавал шаардлагатай');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/v1/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: formValues.firstName.trim(),
          lastName: formValues.lastName.trim(),
          email: formValues.email.trim(),
          department: formValues.department.trim(),
          companyName: formValues.companyName.trim(),
          locationName: formValues.locationName.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setFormError(data?.message || data?.error || 'Ажилтан бүртгэхэд алдаа гарлаа');
        return;
      }

      setEmployees((prev) => [
        {
          ...data.data,
          companyName: formValues.companyName.trim() || null,
          locationName: formValues.locationName.trim() || null,
        },
        ...prev,
      ]);
      setFormValues({
        firstName: '',
        lastName: '',
        email: '',
        department: '',
        companyName: '',
        locationName: '',
      });
      setFormSuccess('Шинэ ажилтан амжилттай бүртгэгдлээ');
    } catch {
      setFormError('Network error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateEmployee = async (employeeId: string) => {
    setFormError('');
    setFormSuccess('');

    if (!editValues.firstName.trim() || !editValues.lastName.trim() || !editValues.email.trim()) {
      setFormError('Нэр, овог, и-мэйл заавал шаардлагатай');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/v1/employees/${employeeId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName: editValues.companyName.trim(),
          locationName: editValues.locationName.trim(),
          firstName: editValues.firstName.trim(),
          lastName: editValues.lastName.trim(),
          email: editValues.email.trim(),
          department: editValues.department.trim(),
          isActive: editValues.isActive,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setFormError(data?.message || data?.error || 'Ажилтны мэдээлэл засахад алдаа гарлаа');
        return;
      }

      setEmployees((prev) =>
        prev.map((employee) => (employee.id === employeeId ? data.data : employee))
      );
      setEditingId(null);
      setFormSuccess('Ажилтны мэдээлэл шинэчлэгдлээ');
    } catch {
      setFormError('Network error');
    } finally {
      setSubmitting(false);
    }
  };

  if (userRole === 'EMPLOYEE') {
    return <div className="p-4 text-gray-500">Хандалтгүй</div>;
  }

  return (
    <div className="space-y-4">
      {error ? <div className="text-red-600">Error: {error}</div> : null}
      {formError ? <div className="text-red-600">{formError}</div> : null}
      {formSuccess ? <div className="text-green-600">{formSuccess}</div> : null}
      <div className="flex items-center gap-3">
        <input
          type="text"
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          placeholder="Хайх (нэр, и-мэйл, хэлтэс)"
          className="w-full max-w-md rounded border border-gray-300 px-3 py-2 text-sm"
          aria-label="Ажилтан хайх"
        />
        {normalizedQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            Цэвэрлэх
          </button>
        )}
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm text-left">
          <thead>
            <tr className="border-b">
              <th className="py-2 px-3 font-semibold">Company</th>
              <th className="py-2 px-3 font-semibold">Газрын нэр</th>
              <th className="py-2 px-3 font-semibold">Хэлтэс</th>
              <th className="py-2 px-3 font-semibold">Нэр</th>
              <th className="py-2 px-3 font-semibold">И-мэйл</th>
              <th className="py-2 px-3 font-semibold">Идэвх</th>
              <th className="py-2 px-3 font-semibold">Бүртгэсэн огноо</th>
              {userRole !== 'CONSULTANT' && userRole !== 'ADMIN' ? (
                <th className="py-2 px-3 font-semibold">Үйлдэл</th>
              ) : null}
            </tr>
          </thead>
          <tbody>
            {userRole === 'HR' && (
              <tr className="border-b bg-blue-50/40">
                <td className="py-2 px-3">
                  <input
                    className="w-full rounded border border-gray-300 px-2 py-1 text-sm"
                    placeholder="Company"
                    value={formValues.companyName}
                    onChange={(event) => handleInputChange('companyName', event.target.value)}
                    aria-label="Company"
                  />
                </td>
                <td className="py-2 px-3">
                  <input
                    className="w-full rounded border border-gray-300 px-2 py-1 text-sm"
                    placeholder="Газрын нэр"
                    value={formValues.locationName}
                    onChange={(event) => handleInputChange('locationName', event.target.value)}
                    aria-label="Газрын нэр"
                  />
                </td>
                <td className="py-2 px-3">
                  <input
                    className="w-full rounded border border-gray-300 px-2 py-1 text-sm"
                    placeholder="Хэлтэс"
                    value={formValues.department}
                    onChange={(event) => handleInputChange('department', event.target.value)}
                    readOnly={userRole === 'HR' && Boolean(userDepartment)}
                    disabled={userRole === 'HR' && Boolean(userDepartment)}
                    aria-label="Хэлтэс"
                  />
                </td>
                <td className="py-2 px-3">
                  <div className="flex gap-2">
                    <input
                      className="w-full rounded border border-gray-300 px-2 py-1 text-sm"
                      placeholder="Нэр"
                      value={formValues.firstName}
                      onChange={(event) => handleInputChange('firstName', event.target.value)}
                      aria-label="Нэр"
                    />
                    <input
                      className="w-full rounded border border-gray-300 px-2 py-1 text-sm"
                      placeholder="Овог"
                      value={formValues.lastName}
                      onChange={(event) => handleInputChange('lastName', event.target.value)}
                      aria-label="Овог"
                    />
                  </div>
                </td>
                <td className="py-2 px-3">
                  <input
                    className="w-full rounded border border-gray-300 px-2 py-1 text-sm"
                    placeholder="И-мэйл"
                    type="email"
                    value={formValues.email}
                    onChange={(event) => handleInputChange('email', event.target.value)}
                    aria-label="И-мэйл"
                  />
                </td>
                <td className="py-2 px-3">
                  <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-700">
                    Идэвхтэй
                  </span>
                </td>
                <td className="py-2 px-3 text-gray-400">—</td>
                <td className="py-2 px-3">
                  <button
                    type="button"
                    onClick={handleCreateEmployee}
                    disabled={submitting}
                    className="px-3 py-1.5 rounded bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-60"
                  >
                    {submitting ? 'Бүртгэж байна...' : 'Бүртгэх'}
                  </button>
                </td>
              </tr>
            )}
            {filteredEmployees.length === 0 ? (
              <tr>
                <td
                  className="py-4 px-3 text-gray-500"
                  colSpan={userRole === 'CONSULTANT' || userRole === 'ADMIN' ? 7 : 8}
                >
                  Ажилтан олдсонгүй
                </td>
              </tr>
            ) : (
              filteredEmployees.map((employee) => (
                <tr key={employee.id} className="border-b last:border-0">
                  <td className="py-2 px-3">
                    {editingId === employee.id ? (
                      <input
                        className="w-full rounded border border-gray-300 px-2 py-1 text-sm"
                        value={editValues.companyName}
                        onChange={(event) => handleEditChange('companyName', event.target.value)}
                        aria-label="Company"
                      />
                    ) : (
                      employee.companyName || getCompanyName(employee.email)
                    )}
                  </td>
                  <td className="py-2 px-3">
                    {editingId === employee.id ? (
                      <input
                        className="w-full rounded border border-gray-300 px-2 py-1 text-sm"
                        value={editValues.locationName}
                        onChange={(event) => handleEditChange('locationName', event.target.value)}
                        aria-label="Газрын нэр"
                      />
                    ) : (
                      employee.locationName || getLocationName(employee.email)
                    )}
                  </td>
                  <td className="py-2 px-3">
                    {editingId === employee.id ? (
                      <input
                        className="w-full rounded border border-gray-300 px-2 py-1 text-sm"
                        value={editValues.department}
                        onChange={(event) => handleEditChange('department', event.target.value)}
                        readOnly={userRole === 'HR' && Boolean(userDepartment)}
                        disabled={userRole === 'HR' && Boolean(userDepartment)}
                        aria-label="Хэлтэс"
                      />
                    ) : (
                      employee.department || '—'
                    )}
                  </td>
                  <td className="py-2 px-3">
                    {editingId === employee.id ? (
                      <div className="flex gap-2">
                        <input
                          className="w-full rounded border border-gray-300 px-2 py-1 text-sm"
                          value={editValues.firstName}
                          onChange={(event) => handleEditChange('firstName', event.target.value)}
                          aria-label="Нэр"
                        />
                        <input
                          className="w-full rounded border border-gray-300 px-2 py-1 text-sm"
                          value={editValues.lastName}
                          onChange={(event) => handleEditChange('lastName', event.target.value)}
                          aria-label="Овог"
                        />
                      </div>
                    ) : (
                      <>
                        {employee.firstName} {employee.lastName}
                      </>
                    )}
                  </td>
                  <td className="py-2 px-3">
                    {editingId === employee.id ? (
                      <input
                        className="w-full rounded border border-gray-300 px-2 py-1 text-sm"
                        value={editValues.email}
                        onChange={(event) => handleEditChange('email', event.target.value)}
                        aria-label="И-мэйл"
                      />
                    ) : (
                      employee.email
                    )}
                  </td>
                  <td className="py-2 px-3">
                    {editingId === employee.id ? (
                      <select
                        className="w-full rounded border border-gray-300 px-2 py-1 text-sm"
                        value={editValues.isActive ? 'active' : 'inactive'}
                        onChange={(event) => handleEditChange('isActive', event.target.value === 'active')}
                        aria-label="Идэвх"
                      >
                        <option value="active">Идэвхтэй</option>
                        <option value="inactive">Идэвхгүй</option>
                      </select>
                    ) : (
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                          employee.isActive
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {employee.isActive ? 'Идэвхтэй' : 'Идэвхгүй'}
                      </span>
                    )}
                  </td>
                  <td className="py-2 px-3">
                    {new Date(employee.createdAt).toLocaleDateString('mn-MN')}
                  </td>
                  {userRole === 'HR' ? (
                    <td className="py-2 px-3">
                      {editingId === employee.id ? (
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => handleUpdateEmployee(employee.id)}
                            disabled={submitting}
                            className="px-3 py-1.5 rounded bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-60"
                          >
                            {submitting ? 'Хадгалж байна...' : 'Хадгалах'}
                          </button>
                          <button
                            type="button"
                            onClick={cancelEditing}
                            className="px-3 py-1.5 rounded border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50"
                          >
                            Болих
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => startEditing(employee)}
                          className="px-3 py-1.5 rounded bg-gray-100 text-sm font-medium text-gray-700 hover:bg-gray-200"
                        >
                          Засах
                        </button>
                      )}
                    </td>
                  ) : userRole !== 'CONSULTANT' && userRole !== 'ADMIN' ? (
                    <td className="py-2 px-3 text-gray-400">—</td>
                  ) : null}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
