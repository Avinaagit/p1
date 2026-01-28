'use client';

import { useState, useEffect } from 'react';

interface SurveyInviteProps {
  surveyId: string;
  surveyTitle: string;
}

export default function SurveyInvite({ surveyId, surveyTitle }: SurveyInviteProps) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');
  
  const [targetDepartment, setTargetDepartment] = useState('ALL');
  const [targetRoles, setTargetRoles] = useState<string[]>(['ALL']);
  const [departments, setDepartments] = useState<string[]>([]);

  useEffect(() => {
    // Fetch available departments
    fetch('/api/v1/departments')
      .then(res => res.json())
      .then(data => {
        if (data.departments) {
          setDepartments(data.departments);
        }
      })
      .catch(err => console.error('Failed to load departments:', err));
  }, []);

  const handleSendInvitations = async () => {
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await fetch(`/api/v1/surveys/${surveyId}/invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          surveyId,
          targetDepartment,
          targetRoles,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'И-мэйл илгээхэд алдаа гарлаа');
      }

      setResult(data.results);
    } catch (err: any) {
      setError(err.message || 'Алдаа гарлаа');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          📧 Судалгааны урилга илгээх
        </h2>
        <p className="text-gray-600">
          Судалгаа: <span className="font-semibold">{surveyTitle}</span>
        </p>
      </div>

      <div className="space-y-4 mb-6">
        {/* Department Filter */}
        <div>
          <label className="block text-sm font-medium text-white mb-2">
            Хэлтэс сонгох
          </label>
          <select
            value={targetDepartment}
            onChange={(e) => setTargetDepartment(e.target.value)}
            className="w-full px-4 py-2 border border-white/30 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-200 focus:border-transparent"
          >
            <option value="ALL">Бүх хэлтэс</option>
            {departments.map(dept => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>
        </div>

        {/* Role Filter */}
        <div>
          <label className="block text-sm font-medium text-white mb-2">
            Албан тушаал сонгох
          </label>
          <div className="flex flex-wrap gap-2">
            {['ALL', 'EMPLOYEE', 'HR', 'CONSULTANT'].map(role => (
              <label key={role} className="inline-flex items-center">
                <input
                  type="checkbox"
                  checked={targetRoles.includes(role)}
                  onChange={(e) => {
                    if (role === 'ALL') {
                      setTargetRoles(['ALL']);
                    } else {
                      const newRoles = e.target.checked
                        ? [...targetRoles.filter(r => r !== 'ALL'), role]
                        : targetRoles.filter(r => r !== role);
                      setTargetRoles(newRoles.length === 0 ? ['ALL'] : newRoles);
                    }
                  }}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">
                  {role === 'ALL' ? 'Бүгд' : role === 'CONSULTANT' ? 'Consultant' : role}
                </span>
              </label>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
        <p className="text-sm text-yellow-800">
          ⚠️ <strong>Анхааруулга:</strong> И-мэйл илгээхээсээ өмнө SMTP тохиргоог .env файлд оруулсан эсэхээ шалгана уу.
        </p>
        <div className="mt-2 text-xs text-yellow-700 font-mono bg-yellow-100 p-2 rounded">
          SMTP_HOST=smtp.gmail.com<br/>
          SMTP_PORT=587<br/>
          SMTP_USER=your-email@gmail.com<br/>
          SMTP_PASS=your-app-password<br/>
          SMTP_FROM_NAME=Employee Pulse<br/>
          SMTP_FROM_EMAIL=noreply@yourcompany.com
        </div>
      </div>

      <button
        onClick={handleSendInvitations}
        disabled={loading}
        className={`w-full px-6 py-3 rounded-lg font-semibold transition ${
          loading
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : 'bg-blue-600 text-white hover:bg-blue-700'
        }`}
      >
        {loading ? '⏳ И-мэйл илгээж байна...' : '📨 Урилга илгээх'}
      </button>

      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800 font-semibold">❌ Алдаа:</p>
          <p className="text-red-700 text-sm mt-1">{error}</p>
        </div>
      )}

      {result && (
        <div className="mt-6 space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <p className="text-gray-600 text-sm">Нийт</p>
              <p className="text-2xl font-bold text-gray-900">{result.total}</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <p className="text-green-600 text-sm">Амжилттай</p>
              <p className="text-2xl font-bold text-green-700">{result.success}</p>
            </div>
            <div className="bg-red-50 p-4 rounded-lg border border-red-200">
              <p className="text-red-600 text-sm">Амжилтгүй</p>
              <p className="text-2xl font-bold text-red-700">{result.failed}</p>
            </div>
          </div>

          {result.errors && result.errors.length > 0 && (
            <div className="bg-red-50 p-4 rounded-lg border border-red-200">
              <p className="font-semibold text-red-900 mb-2">
                ❌ Алдаанууд ({result.errors.length}):
              </p>
              <div className="max-h-60 overflow-y-auto">
                <ul className="list-disc list-inside text-sm text-red-800 space-y-1">
                  {result.errors.map((error: string, idx: number) => (
                    <li key={idx}>{error}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {result.success > 0 && (
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <p className="text-green-800">
                ✅ <strong>{result.success}</strong> хүнд урилга амжилттай илгээгдлээ!
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
