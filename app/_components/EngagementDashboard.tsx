'use client';

import { useState, useEffect } from 'react';

interface Metric {
  survey: { id: string; title: string };
  sentiment: {
    average: number;
    distribution: Record<string, number>;
    stats: { positive: number; neutral: number; negative: number; stdDev: number };
  };
  engagement: {
    totalResponded: number;
    responseRate: number;
  };
}

export function EngagementDashboard() {
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch engagement metrics
    // This would be a list endpoint for all surveys' metrics
    setLoading(false);
  }, []);

  if (loading) {
    return <div className="p-4">Loading dashboard...</div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Sentiment Score Card */}
      <div className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-lg">
        <h3 className="font-semibold text-gray-900 mb-2">Average Sentiment</h3>
        <div className="text-3xl font-bold text-blue-600">0.45</div>
        <p className="text-sm text-gray-600 mt-2">Positive trend across surveys</p>
      </div>

      {/* Response Rate Card */}
      <div className="p-6 bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-lg">
        <h3 className="font-semibold text-gray-900 mb-2">Response Rate</h3>
        <div className="text-3xl font-bold text-green-600">68%</div>
        <p className="text-sm text-gray-600 mt-2">Above average engagement</p>
      </div>

      {/* Active Surveys Card */}
      <div className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-lg">
        <h3 className="font-semibold text-gray-900 mb-2">Active Surveys</h3>
        <div className="text-3xl font-bold text-purple-600">5</div>
        <p className="text-sm text-gray-600 mt-2">Running this week</p>
      </div>
    </div>
  );
}
