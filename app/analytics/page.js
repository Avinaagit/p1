'use client';

import { Navigation } from '../_components/Navigation';
import { useState, useEffect } from 'react';

export default function AnalyticsPage() {
  const [surveys, setSurveys] = useState([]);
  const [selectedSurvey, setSelectedSurvey] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchSurveys();
  }, []);

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

  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 md:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Analytics & Insights</h1>
            <p className="text-gray-600 mt-2">Track engagement metrics and sentiment analysis</p>
          </div>

          {/* Survey Selection */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Select Survey
            </label>
            <select
              value={selectedSurvey || ''}
              onChange={(e) => handleSurveySelect(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
          {loading && <div className="text-center text-gray-500">Loading analytics...</div>}

          {analytics && !loading && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Response Rate */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-sm font-medium text-gray-600">Response Rate</h3>
                <p className="text-3xl font-bold text-blue-600 mt-2">
                  {Math.round(analytics.engagement?.responseRate || 0)}%
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  {analytics.engagement?.totalResponded || 0} responses
                </p>
              </div>

              {/* Average Sentiment */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-sm font-medium text-gray-600">Avg. Sentiment</h3>
                <p className="text-3xl font-bold text-green-600 mt-2">
                  {(analytics.sentiment?.average || 0).toFixed(2)}
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  {analytics.sentiment?.stats?.positive || 0} positive responses
                </p>
              </div>

              {/* Sentiment Distribution */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-sm font-medium text-gray-600">Sentiment Distribution</h3>
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
          )}

          {!selectedSurvey && !loading && (
            <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
              Select a survey to view detailed analytics
            </div>
          )}
        </div>
      </div>
    </>
  );
}
