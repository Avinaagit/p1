'use client';

import { useEffect, useRef, useState } from 'react';

export function SurveyImportExport() {
  const surveyImportRef = useRef<HTMLInputElement | null>(null);
  const [surveyImporting, setSurveyImporting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [userRole, setUserRole] = useState('EMPLOYEE');
  const [surveys, setSurveys] = useState<Array<{ id: string; title: string }>>([]);
  const [selectedSurveyId, setSelectedSurveyId] = useState('');

  useEffect(() => {
    const loadSurveys = async () => {
      try {
        const res = await fetch('/api/v1/surveys');
        const data = await res.json();
        if (res.ok) {
          setSurveys(data?.data || []);
        }
      } catch {
        setSurveys([]);
      }
    };

    const loadRole = async () => {
      try {
        const res = await fetch('/api/v1/auth/me');
        const data = await res.json();
        if (data?.data?.user?.role) {
          setUserRole(data.data.user.role);
        }
      } catch {
        setUserRole('EMPLOYEE');
      }
    };

    loadSurveys();
    loadRole();
  }, []);

  const handlePickSurveyImport = () => {
    surveyImportRef.current?.click();
  };

  const handleSurveyImportChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError('');
    setMessage('');

    if (!file.name.toLowerCase().endsWith('.xlsx')) {
      setError('XLSX файл сонгоно уу');
      event.target.value = '';
      return;
    }

    setSurveyImporting(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/v1/surveys/import/detail', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data?.message || 'Survey import хийхэд алдаа гарлаа');
        return;
      }

      setMessage('Survey import амжилттай боллоо');
      window.location.reload();
    } catch {
      setError('Survey import хийхэд алдаа гарлаа');
    } finally {
      setSurveyImporting(false);
      event.target.value = '';
    }
  };

  if (userRole === 'EMPLOYEE' || userRole === 'HR') {
    return null;
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex items-center gap-3 w-full justify-end">
        <select
          value={selectedSurveyId}
          onChange={(event) => setSelectedSurveyId(event.target.value)}
          className="rounded-lg border border-white/30 bg-white/10 text-white text-sm px-3 py-2 min-w-[220px]"
        >
          <option value="">Survey сонгох</option>
          {surveys.map((survey) => (
            <option key={survey.id} value={survey.id} className="text-gray-900">
              {survey.title}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => {
            if (!selectedSurveyId) {
              setError('Survey сонгоно уу');
              return;
            }
            window.location.href = `/api/v1/surveys/export/detail?surveyId=${selectedSurveyId}`;
          }}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium transition"
        >
          Survey export (XLSX)
        </button>
        <button
          type="button"
          onClick={handlePickSurveyImport}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-bold transition"
          disabled={surveyImporting}
        >
          {surveyImporting ? 'Import хийж байна...' : 'Survey import (XLSX)'}
        </button>
      </div>
      <input
        ref={surveyImportRef}
        type="file"
        accept=".xlsx"
        className="hidden"
        onChange={handleSurveyImportChange}
      />
      {error ? <div className="text-sm text-red-200">{error}</div> : null}
      {message ? <div className="text-sm text-green-200">{message}</div> : null}
      <div className="text-xs text-white/70">
        XLSX формат нь Survey export (XLSX)-ийн бүтэцтэй адил байна.
      </div>
    </div>
  );
}
