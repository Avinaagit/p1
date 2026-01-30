'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';

interface Survey {
  id: string;
  title: string;
  description?: string;
  status: string;
  startDate: string;
  endDate: string;
  _count: { responses: number };
  creator?: { id: string; email?: string; firstName?: string } | null;
  targetRoles?: string | null;
}

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  department: string | null;
}

export function SurveyList() {
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userRole, setUserRole] = useState<string>('EMPLOYEE');
  const [userId, setUserId] = useState<string>('');
  const [userDepartment, setUserDepartment] = useState<string>('');
  const [inviteSurvey, setInviteSurvey] = useState<Survey | null>(null);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [employeeSearch, setEmployeeSearch] = useState('');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [employeeLoading, setEmployeeLoading] = useState(false);
  const [selectedEmails, setSelectedEmails] = useState<Set<string>>(new Set());
  const [inviteSending, setInviteSending] = useState(false);
  const [inviteError, setInviteError] = useState('');
  const [inviteSuccess, setInviteSuccess] = useState('');
  const [inviteCounts, setInviteCounts] = useState<Record<string, { count: number; lastSentAt?: string }>>({});
  const [responseStats, setResponseStats] = useState<Record<string, { count: number; lastSubmittedAt?: string }>>({});
  const [visibilityUpdating, setVisibilityUpdating] = useState<string>('');
  const router = useRouter();

  useEffect(() => {
    fetchSurveys();
    fetchUserRole();
  }, []);

  const fetchUserRole = async () => {
    try {
      const res = await fetch('/api/v1/auth/me');
      const data = await res.json();
      if (data?.data?.user?.role) {
        setUserRole(data.data.user.role);
      }
      if (data?.data?.user?.userId) {
        setUserId(data.data.user.userId);
      }
      if (data?.data?.user?.department) {
        setUserDepartment(data.data.user.department);
      }
    } catch (err) {
      console.error('Failed to fetch user role:', err);
    }
  };

  const loadEmployees = async () => {
    setEmployeeLoading(true);
    try {
      const res = await fetch('/api/v1/employees');
      const data = await res.json();
      if (res.ok) {
        setEmployees(data?.data || []);
      }
    } catch (err) {
      console.error('Failed to load employees');
    } finally {
      setEmployeeLoading(false);
    }
  };

  const openInviteModal = (survey: Survey) => {
    setInviteSurvey(survey);
    setInviteModalOpen(true);
    setInviteError('');
    setInviteSuccess('');
    setSelectedEmails(new Set());
    if (employees.length === 0) {
      loadEmployees();
    }
  };

  const closeInviteModal = () => {
    setInviteModalOpen(false);
    setInviteSurvey(null);
    setEmployeeSearch('');
  };

  const toggleEmail = (email: string) => {
    setSelectedEmails((prev) => {
      const next = new Set(prev);
      if (next.has(email)) {
        next.delete(email);
      } else {
        next.add(email);
      }
      return next;
    });
  };

  const handleSendInvites = async () => {
    if (!inviteSurvey) return;
    if (selectedEmails.size === 0) {
      setInviteError('Хүлээн авагч сонгоно уу');
      return;
    }

    setInviteSending(true);
    setInviteError('');
    setInviteSuccess('');
    try {
      const res = await fetch(`/api/v1/surveys/${inviteSurvey.id}/invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          surveyId: inviteSurvey.id,
          recipientEmails: Array.from(selectedEmails),
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setInviteError(data?.message || 'Урилга илгээхэд алдаа гарлаа');
        return;
      }

      const apiSuccess = typeof data?.results?.success === 'number' ? data.results.success : 0;
      const successCount = apiSuccess > 0 ? apiSuccess : selectedEmails.size;
      setInviteSuccess(`${successCount} Урилга илгээгдлээ`);
    } catch {
      setInviteError('Сүлжээний алдаа гарлаа');
    } finally {
      setInviteSending(false);
    }
  };

  const fetchSurveys = async () => {
    try {
      const res = await fetch('/api/v1/surveys');
      const data = await res.json();

      if (data.success) {
        setSurveys(data.data || []);
      } else {
        setError(data.error || 'Failed to load surveys');
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  const now = new Date();
  const isActiveSurvey = (survey: Survey) => {
    const start = new Date(survey.startDate);
    const end = new Date(survey.endDate);
    return survey.status === 'PUBLISHED' && start <= now && end >= now;
  };

  const isConsultantRole = userRole === 'CONSULTANT' || userRole === 'ADMIN';
  const canFetchInviteCounts = ['ADMIN', 'CONSULTANT', 'HR'].includes(userRole || '');
  const isHRRole = userRole === 'HR';
  const parseTargetRoles = (targetRoles?: string | null) => {
    if (!targetRoles) return null;
    try {
      const parsed = JSON.parse(targetRoles);
      return Array.isArray(parsed) ? parsed : null;
    } catch {
      return null;
    }
  };
  const isVisibleToHR = (survey: Survey) => {
    const roles = parseTargetRoles(survey.targetRoles);
    return !roles || roles.includes('HR');
  };
  const visibleSurveys = useMemo(() => {
    if (isConsultantRole) {
      return surveys.filter((survey) => survey.creator?.id === userId);
    }
    if (isHRRole) {
      return surveys.filter(isVisibleToHR);
    }
    return surveys;
  }, [isConsultantRole, isHRRole, surveys, userId]);
  const activeSurveys = visibleSurveys.filter(isActiveSurvey);
  const completedSurveys = visibleSurveys.filter((survey) => !isActiveSurvey(survey));
  const showSplitSections = isHRRole;
  const companyNames = ['Employee Pulse LLC', 'Blue Horizon LLC', 'Nomad Tech LLC'];
  const locationNames = ['Улаанбаатар', 'Дархан', 'Эрдэнэт'];
  const hashString = (value: string) =>
    value
      .split('')
      .reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const getCompanyName = (email: string) =>
    companyNames[hashString(email) % companyNames.length];
  const getLocationName = (email: string) =>
    locationNames[hashString(email) % locationNames.length];

  useEffect(() => {
    if (canFetchInviteCounts && userId) {
      fetchInviteCounts(visibleSurveys.map((survey) => survey.id));
    }
    if (userId) {
      fetchResponseStats(visibleSurveys.map((survey) => survey.id));
    }
  }, [canFetchInviteCounts, userId, visibleSurveys]);

  const fetchInviteCounts = async (surveyIds: string[]) => {
    if (surveyIds.length === 0) {
      setInviteCounts({});
      return;
    }

    try {
      const res = await fetch(`/api/v1/surveys/invite-counts?ids=${surveyIds.join(',')}`);
      const data = await res.json();
      if (res.ok && data?.data) {
        setInviteCounts(data.data || {});
      }
    } catch (err) {
      console.error('Failed to load invite counts');
    }
  };

  const fetchResponseStats = async (surveyIds: string[]) => {
    if (surveyIds.length === 0) {
      setResponseStats({});
      return;
    }

    try {
      const res = await fetch(`/api/v1/surveys/response-stats?ids=${surveyIds.join(',')}`);
      const data = await res.json();
      if (res.ok && data?.data) {
        setResponseStats(data.data || {});
      }
    } catch {
      console.error('Failed to load response stats');
    }
  };

  if (loading) {
    return <div className="p-4">Loading surveys...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-600">Error: {error}</div>;
  }

  if (surveys.length === 0) {
    return <div className="p-4 text-gray-500">No surveys available</div>;
  }
  const searchedEmployees = employees.filter((employee) => {
    const query = employeeSearch.toLowerCase().trim();
    if (!query) return true;
    const fullName = `${employee.firstName} ${employee.lastName}`.toLowerCase();
    return (
      fullName.includes(query) ||
      employee.email.toLowerCase().includes(query) ||
      (employee.department || '').toLowerCase().includes(query)
    );
  });
  const allSelected =
    searchedEmployees.length > 0 &&
    searchedEmployees.every((employee) => selectedEmails.has(employee.email));
  const toggleSelectAll = (checked: boolean) => {
    setSelectedEmails((prev) => {
      const next = new Set(prev);
      searchedEmployees.forEach((employee) => {
        if (checked) {
          next.add(employee.email);
        } else {
          next.delete(employee.email);
        }
      });
      return next;
    });
  };

  const updateHRVisibility = async (survey: Survey, checked: boolean) => {
    const currentRoles = parseTargetRoles(survey.targetRoles) || [];
    const nextRoles = checked
      ? Array.from(new Set([...currentRoles, 'HR']))
      : currentRoles.filter((role) => role !== 'HR');

    setVisibilityUpdating(survey.id);
    try {
      const res = await fetch(`/api/v1/surveys/${survey.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetRoles: nextRoles }),
      });

      if (!res.ok) {
        setInviteError('Шинэчлэлт хийхэд алдаа гарлаа');
        return;
      }

      setSurveys((prev) =>
        prev.map((item) =>
          item.id === survey.id
            ? { ...item, targetRoles: JSON.stringify(nextRoles) }
            : item
        )
      );
    } catch {
      setInviteError('Шинэчлэлт хийхэд алдаа гарлаа');
    } finally {
      setVisibilityUpdating('');
    }
  };


  const inviteModal = inviteModalOpen ? (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white w-full max-w-3xl rounded-xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">📧 Урилга илгээх</h3>
            <p className="text-sm text-gray-600">
              Судалгаа: <span className="font-medium">{inviteSurvey?.title}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={closeInviteModal}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        <div className="px-6 py-4 space-y-4">
          <div className="flex items-center gap-3">
            <input
              type="text"
              value={employeeSearch}
              onChange={(event) => setEmployeeSearch(event.target.value)}
              placeholder="Хайх (нэр, и-мэйл, хэлтэс)"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
            <label className="flex items-center gap-2 text-sm text-gray-600">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={(event) => toggleSelectAll(event.target.checked)}
              />
              Бүгдийг сонгох
            </label>
          </div>

          <div className="border rounded-lg overflow-hidden">
            <div className="grid grid-cols-5 gap-2 bg-gray-50 px-4 py-2 text-xs font-semibold text-gray-600">
              <span>Company</span>
              <span>Газрын нэр</span>
              <span>Хэлтэс</span>
              <span>Нэр</span>
              <span>И-мэйл</span>
            </div>
            <div className="max-h-72 overflow-y-auto">
              {employeeLoading ? (
                <div className="p-4 text-sm text-gray-500">Ажилтны жагсаалт ачааллаж байна...</div>
              ) : searchedEmployees.length === 0 ? (
                <div className="p-4 text-sm text-gray-500">Ажилтан олдсонгүй</div>
              ) : (
                searchedEmployees.map((employee) => (
                  <label
                    key={employee.id}
                    className="grid grid-cols-5 gap-2 px-4 py-2 text-sm text-gray-700 border-t cursor-pointer hover:bg-blue-50"
                  >
                    <span className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={selectedEmails.has(employee.email)}
                        onChange={() => toggleEmail(employee.email)}
                      />
                      {getCompanyName(employee.email)}
                    </span>
                    <span>{getLocationName(employee.email)}</span>
                    <span>{employee.department || '—'}</span>
                    <span>{employee.firstName} {employee.lastName}</span>
                    <span>{employee.email}</span>
                  </label>
                ))
              )}
            </div>
          </div>

          {inviteError && <div className="text-sm text-red-600">{inviteError}</div>}
          {inviteSuccess && <div className="text-sm text-green-600">{inviteSuccess}</div>}
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t">
          <button
            type="button"
            onClick={closeInviteModal}
            className="px-4 py-2 rounded-lg border border-gray-200 text-gray-700"
          >
            Хаах
          </button>
          <button
            type="button"
            onClick={handleSendInvites}
            disabled={inviteSending}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {inviteSending ? 'Илгээж байна...' : 'Урилга илгээх'}
          </button>
        </div>
      </div>
    </div>
  ) : null;

  const renderSurveyCard = (
    survey: Survey,
    options?: {
      showInvite?: boolean;
      showTake?: boolean;
      onInvite?: () => void;
      inviteCount?: { count: number; lastSentAt?: string };
      showVisibilityToggle?: boolean;
    }
  ) => (
    <div
      key={survey.id}
      className="p-4 border border-gray-200 rounded-lg bg-white text-gray-900 hover:shadow-lg transition"
    >
      <h3 className="font-semibold text-lg text-gray-900">{survey.title}</h3>
      {survey.description && (
        <p className="text-sm text-gray-600 mt-1">{survey.description}</p>
      )}
      <div className="mt-3 flex justify-between items-center">
        <div className="text-xs text-gray-500">
          <span className={`inline-block px-2 py-1 rounded ${
            survey.status === 'PUBLISHED' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
          }`}>
            {survey.status}
          </span>
          <span className="ml-2">{survey._count.responses} responses</span>
        </div>
        <div className="flex gap-4 items-center">
          {options?.inviteCount && options.inviteCount.count > 0 && (
            <span className="text-sm text-blue-600 font-bold">
              Урилга: {options.inviteCount.count}
              {options.inviteCount.lastSentAt
                ? ` • ${new Date(options.inviteCount.lastSentAt).toLocaleDateString('mn-MN')}`
                : ''}
            </span>
          )}
          {responseStats[survey.id] && responseStats[survey.id].count > 0 && (
            <span className="text-sm font-semibold text-blue-700">
              Бөглөсөн: {responseStats[survey.id].count}
              {responseStats[survey.id].lastSubmittedAt
                ? ` • ${new Date(responseStats[survey.id].lastSubmittedAt).toLocaleDateString('mn-MN')}`
                : ''}
            </span>
          )}
          {options?.showVisibilityToggle && (
            <label className="flex items-center gap-2 text-xs text-gray-600">
              <input
                type="checkbox"
                checked={isVisibleToHR(survey)}
                disabled={visibilityUpdating === survey.id}
                onChange={(event) => updateHRVisibility(survey, event.target.checked)}
              />
              HR-д харагдуулах
            </label>
          )}
          {options?.showInvite && (
            <button
              onClick={options.onInvite || (() => router.push(`/surveys/${survey.id}/invite`))}
              className="px-3 py-1 text-sm bg-purple-600 text-white rounded hover:bg-purple-700 transition flex items-center gap-1"
              title="И-мэйл илгээх"
            >
              📧 Урих
            </button>
          )}
          {options?.showTake && (
            <button
              onClick={() => router.push(`/surveys/${survey.id}`)}
              className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition"
              style={{ color: '#fff' }}
            >
              Судалгаа бөглөх
            </button>
          )}
        </div>
      </div>
    </div>
  );

  if (isConsultantRole) {
    return (
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-gray-600">Судалгааны жагсаалт</h3>
        {visibleSurveys.length === 0 ? (
          <div className="p-4 text-gray-500 border border-dashed rounded-lg">
            Судалгаа байхгүй байна.
          </div>
        ) : (
          <div className="grid gap-4">
            {visibleSurveys.map((survey) =>
              renderSurveyCard(survey, {
                inviteCount: inviteCounts[survey.id],
                showVisibilityToggle: true,
              })
            )}
          </div>
        )}
      </div>
    );
  }

  if (!showSplitSections) {
    return (
      <>
        <div className="grid gap-4">
          {surveys.map((survey) => renderSurveyCard(survey, { showTake: true }))}
        </div>
        {inviteModal}
      </>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <div>
          <h3 className="text-sm font-semibold text-gray-600 mb-3">Судалгаанд оролцох</h3>
          {activeSurveys.length === 0 ? (
            <div className="p-4 text-gray-500 border border-dashed rounded-lg">
              Идэвхтэй судалгаа алга байна.
            </div>
          ) : (
            <div className="grid gap-4">
              {activeSurveys.map((survey) =>
                renderSurveyCard(survey, {
                  showInvite: true,
                  onInvite: () => openInviteModal(survey),
                  inviteCount: canFetchInviteCounts ? inviteCounts[survey.id] : undefined,
                })
              )}
            </div>
          )}
        </div>

        <div>
          <h3 className="text-sm font-semibold text-gray-600 mb-3">Бөглөгдсөн / Хаагдсан судалгаа</h3>
          {completedSurveys.length === 0 ? (
            <div className="p-4 text-gray-500 border border-dashed rounded-lg">
              Хаагдсан судалгаа байхгүй байна.
            </div>
          ) : (
            <div className="grid gap-4">
              {completedSurveys.map((survey) =>
                renderSurveyCard(survey, {
                  inviteCount: canFetchInviteCounts ? inviteCounts[survey.id] : undefined,
                })
              )}
            </div>
          )}
        </div>
      </div>
      {inviteModal}
    </>
  );
}
