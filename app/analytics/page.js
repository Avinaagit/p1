'use client';

import { Navigation } from '../_components/Navigation';
import { SurveyResponsesAnalytics } from '../_components/SurveyResponsesAnalytics';
import { HRDashboard } from '../_components/HRDashboard';
import { useState, useEffect } from 'react';

export default function AnalyticsPage() {
  const [surveys, setSurveys] = useState([]);
  const [selectedSurvey, setSelectedSurvey] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [userRole, setUserRole] = useState('EMPLOYEE');

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
    } catch (err) {
      setUserRole('EMPLOYEE');
    }
  };

  const fetchSurveys = async () => {
    try {
      const res = await fetch('/api/v1/surveys');
      const data = await res.json();
      if (data.success) {
        setSurveys(data.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch surveys');
    }
  };

  const fetchAnalytics = async (surveyId) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/analytics/engagement/${surveyId}`);
      const data = await res.json();
      if (data.success) {
        setAnalytics(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch analytics');
    } finally {
      setLoading(false);
    }
  };

  const handleSurveySelect = (surveyId) => {
    setSelectedSurvey(surveyId);
    fetchAnalytics(surveyId);
  };

  const now = new Date();
  const isActiveSurvey = (survey) => {
    const start = new Date(survey.startDate);
    const end = new Date(survey.endDate);
    return survey.status === 'PUBLISHED' && start <= now && end >= now;
  };

  const closedSurveys = surveys.filter((survey) => !isActiveSurvey(survey));
  const showClosedCard = userRole === 'CONSULTANT' || userRole === 'ADMIN';

  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-[var(--background)]">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 md:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white">Analytics & Insights</h1>
            <p className="text-white mt-2">Track engagement metrics and sentiment analysis</p>
          </div>

          {showClosedCard && (
            <div className="bg-white rounded-lg shadow p-6 mb-6 text-gray-900">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">
                Бөглөсөн / Хаагдсан судалгаа
              </h3>
              {closedSurveys.length === 0 ? (
                <div className="p-4 text-gray-500 border border-dashed rounded-lg">
                  Хаагдсан судалгаа байхгүй байна.
                </div>
              ) : (
                <ul className="space-y-2 text-sm text-gray-800">
                  {closedSurveys.map((survey) => (
                    <li key={survey.id} className="border border-gray-200 rounded-lg px-3 py-2">
                      {survey.title}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* Survey Selection */}
          <div className="bg-white rounded-lg shadow p-6 mb-6 text-gray-900">
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Select Survey
            </label>
            <select
              value={selectedSurvey || ''}
              onChange={(e) => handleSurveySelect(e.target.value)}
              className="w-full px-3 py-2 border border-white/30 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-200"
            >
              <option value="">Choose a survey...</option>
              {surveys.map((survey) => (
                <option key={survey.id} value={survey.id}>
                  {survey.title}
                </option>
              ))}
            </select>
          </div>

          {/* Analytics Results */}
          {loading && <div className="text-center text-white/70">Loading analytics...</div>}

          {selectedSurvey && !loading && (
            <>
              {/* HR Dashboard Overview */}
              <HRDashboard surveyId={selectedSurvey} />

              {/* Survey Responses Analytics */}
              <div className="mt-8">
                <h2 className="text-2xl font-bold text-white mb-4">Хувь хүний дэлгэрэнгүй хариултууд</h2>
                <SurveyResponsesAnalytics surveyId={selectedSurvey} />
              </div>

              {/* Existing Analytics (if available) */}
              {analytics && (
                <div className="mt-6">
                  <h2 className="text-xl font-semibold text-white mb-4">Нэмэлт мэдээлэл</h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Response Rate */}
                    <div className="bg-white rounded-lg shadow p-6 text-gray-900">
                      <h3 className="text-sm font-medium text-gray-900">Response Rate</h3>
                      <p className="text-3xl font-bold text-blue-600 mt-2">
                        {Math.round(analytics.engagement?.responseRate || 0)}%
                      </p>
                      <p className="text-sm text-gray-700 mt-2">
                        {analytics.engagement?.totalResponded || 0} responses
                      </p>
                    </div>

                    {/* Average Sentiment */}
                    <div className="bg-white rounded-lg shadow p-6 text-gray-900">
                      <h3 className="text-sm font-medium text-gray-900">Avg. Sentiment</h3>
                      <p className="text-3xl font-bold text-green-600 mt-2">
                        {(analytics.sentiment?.average || 0).toFixed(2)}
                      </p>
                      <p className="text-sm text-gray-700 mt-2">
                        {analytics.sentiment?.stats?.positive || 0} positive responses
                      </p>
                    </div>

                    {/* Sentiment Distribution */}
                    <div className="bg-white rounded-lg shadow p-6 text-gray-900">
                      <h3 className="text-sm font-medium text-gray-900">Sentiment Distribution</h3>
                      <div className="mt-4 space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-green-600 font-medium">Positive</span>
                          <span className="text-gray-900 font-semibold">
                            {analytics.sentiment?.stats?.positive || 0}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-yellow-600 font-medium">Neutral</span>
                          <span className="text-gray-900 font-semibold">
                            {analytics.sentiment?.stats?.neutral || 0}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-red-600 font-medium">Negative</span>
                          <span className="text-gray-900 font-semibold">
                            {analytics.sentiment?.stats?.negative || 0}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {!selectedSurvey && !loading && (
            <div className="bg-white rounded-lg shadow p-6 text-center text-gray-700">
              Select a survey to view detailed analytics
            </div>
          )}
        </div>
      </div>
    </>
  );
}
