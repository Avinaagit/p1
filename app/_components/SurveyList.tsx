'use client';

import { useState, useEffect } from 'react';

interface Survey {
  id: string;
  title: string;
  description?: string;
  status: string;
  startDate: string;
  endDate: string;
  _count: { responses: number };
}

export function SurveyList() {
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchSurveys();
  }, []);

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

  if (loading) {
    return <div className="p-4">Loading surveys...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-600">Error: {error}</div>;
  }

  if (surveys.length === 0) {
    return <div className="p-4 text-gray-500">No surveys available</div>;
  }

  return (
    <div className="grid gap-4">
      {surveys.map((survey) => (
        <div key={survey.id} className="p-4 border border-gray-200 rounded-lg hover:shadow-lg transition">
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
            <button className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition">
              Take Survey
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
